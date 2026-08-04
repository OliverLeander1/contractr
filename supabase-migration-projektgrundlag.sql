-- =============================================================================
-- supabase-migration-projektgrundlag.sql
--
-- ADDITIV migration: opretter public.projektgrundlag
--
-- Formål: første tekniske del af pre-contract-flowet
--   Projekt → projektgrundlag → invitationer → separate tilbud →
--   sammenligning → valg → aftalegrundlag → aktiv byggesag
--
-- Et projekt kan have 0..mange projektgrundlag. Hvert projektgrundlag
-- repræsenterer én afgrænset opgave/entreprise (fx "Malerarbejde") og kan
-- senere sendes til flere konkurrerende entreprenører. Et projektgrundlag
-- er IKKE et tilbud, IKKE en kontrakt, og opretter aldrig automatisk en
-- kontrakt. Kun et senere valgt tilbud kan føres videre til et
-- aftalegrundlag.
--
-- Bevidst UDELADT i denne migration:
--   - relation til kontrakter
--   - relation til tilbud (findes ikke endnu)
--   - relation til entreprenører/invitationer
--   - unik constraint på projekt_id (flere projektgrundlag pr. projekt)
--   - bygherre_id-kolonne — ejerskab verificeres senere via det
--     tilknyttede projekt (projekter.bygherre_id) som source of truth
--
-- Tabellen eksponeres IKKE direkte til browserklienten. Kun service_role
-- har adgang. Sikre API-endpoints (Bearer JWT, auth.getUser, verificeret
-- projektejerskab) implementeres i en senere, separat opgave. Det
-- kommende API må IKKE genskabe kontrakt-mønsteret, hvor et GET-kald kan
-- oprette en række (jf. GET /api/kontrakt?projekt_id=) — for
-- projektgrundlag gælder: GET læser, POST opretter, PATCH opdaterer. Et
-- projektgrundlag må aldrig oprettes blot ved, at en side besøges.
--
-- FOREIGN KEY / ON DELETE — dokumenteret afvejning:
--   Der findes intet eksisterende database-FK fra andre projekt-børnetabeller
--   til public.projekter i dette repo. Den faktiske eksisterende konvention
--   (src/app/api/projekt/[id]/slet/route.ts) sletter i stedet eksplicit i
--   applikationskoden: ekstraarbejde, mangler, chat_beskeder og kontrakter
--   slettes hver for sig, FØR selve projekter-rækken slettes — uden nogen
--   databaseCASCADE.
--
--   projekt_id er her krævet NOT NULL (jf. opgavens datamodel), hvilket
--   udelukker ON DELETE SET NULL. Tilbage står reelt CASCADE eller
--   RESTRICT/NO ACTION (Postgres-standard):
--     - RESTRICT/NO ACTION ville få den eksisterende, urørte
--       sletteroute til at fejle med en foreign key-fejl, så snart et
--       projekt har mindst ét projektgrundlag — en reel regression af en
--       allerede fungerende funktion, som denne opgave ikke må ændre.
--     - CASCADE bryder ikke den eksisterende sletteroute (ingen fejl) og
--       er semantisk korrekt: et projektgrundlag kan strukturelt ikke
--       give mening uden sit projekt.
--   Valget er derfor ON DELETE CASCADE. Dette er IKKE en genbrugt,
--   tidligere anvendt konvention for projekter-børnetabeller specifikt —
--   det er den første database-FK af sin art til public.projekter i dette
--   repo, og valget er truffet for at undgå at indføre en ny, skjult fejl
--   i en eksisterende, urørt route. Bør revurderes eksplicit, hvis
--   sletteroutens logik senere opdateres til at eksplicit håndtere
--   projektgrundlag.
--
-- Kør ikke denne fil uden særskilt godkendelse. Filen er kun oprettet som
-- en tracked fil til senere manuel gennemgang og kørsel i Supabase
-- Dashboard → SQL Editor.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PREFLIGHT
-- =============================================================================

DO $$
BEGIN

  -- PF-1: projektgrundlag må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
  ) THEN
    RAISE EXCEPTION '[PF-1] Tabel public.projektgrundlag eksisterer allerede. Afbryder.';
  END IF;

  -- PF-2: public.projekter eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'projekter'
  ) THEN
    RAISE EXCEPTION '[PF-2] Tabel public.projekter eksisterer ikke. Afbryder.';
  END IF;

  -- PF-3: public.projekter.id er af typen UUID
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'public' AND c.relname = 'projekter'
      AND a.attname = 'id' AND t.typname = 'uuid' AND a.attnum > 0
  ) THEN
    RAISE EXCEPTION '[PF-3] public.projekter.id eksisterer ikke eller er ikke UUID. Afbryder.';
  END IF;

  -- PF-4: public.projekter.id er primary key eller unique (kræves for FK-mål)
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
    WHERE n.nspname = 'public' AND t.relname = 'projekter'
      AND a.attname = 'id' AND con.contype IN ('p', 'u')
  ) THEN
    RAISE EXCEPTION '[PF-4] public.projekter.id er hverken primary key eller unique. Afbryder.';
  END IF;

  -- PF-5a: constraintnavn projektgrundlag_pkey må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'projektgrundlag_pkey'
  ) THEN
    RAISE EXCEPTION '[PF-5a] Constraint projektgrundlag_pkey eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5b: constraintnavn projektgrundlag_projekt_id_fkey må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'projektgrundlag_projekt_id_fkey'
  ) THEN
    RAISE EXCEPTION '[PF-5b] Constraint projektgrundlag_projekt_id_fkey eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5c: constraintnavn projektgrundlag_status_check må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'projektgrundlag_status_check'
  ) THEN
    RAISE EXCEPTION '[PF-5c] Constraint projektgrundlag_status_check eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5d: indexnavn idx_projektgrundlag_projekt_id må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'idx_projektgrundlag_projekt_id' AND relkind = 'i'
  ) THEN
    RAISE EXCEPTION '[PF-5d] Index idx_projektgrundlag_projekt_id eksisterer allerede. Afbryder.';
  END IF;

  -- PF-6a: rolle anon eksisterer
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    RAISE EXCEPTION '[PF-6a] Rolle anon eksisterer ikke. Afbryder.';
  END IF;

  -- PF-6b: rolle authenticated eksisterer
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION '[PF-6b] Rolle authenticated eksisterer ikke. Afbryder.';
  END IF;

  -- PF-6c: rolle service_role eksisterer
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION '[PF-6c] Rolle service_role eksisterer ikke. Afbryder.';
  END IF;

END $$;

-- =============================================================================
-- SKEMAÆNDRING
-- =============================================================================

CREATE TABLE public.projektgrundlag (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id             UUID        NOT NULL,

  titel                  TEXT        NOT NULL,
  fag                    TEXT,

  arbejdsomfang          TEXT        NOT NULL DEFAULT '',
  eksisterende_forhold   TEXT        NOT NULL DEFAULT '',
  materialer_kvalitet    TEXT        NOT NULL DEFAULT '',
  tidsramme              TEXT        NOT NULL DEFAULT '',
  adgangsforhold         TEXT        NOT NULL DEFAULT '',
  dokumentationskrav     TEXT        NOT NULL DEFAULT '',
  oevrige_forhold        TEXT        NOT NULL DEFAULT '',

  status                 TEXT        NOT NULL DEFAULT 'udkast',

  oprettet_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opdateret_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projektgrundlag_projekt_id_fkey
    FOREIGN KEY (projekt_id)
    REFERENCES public.projekter(id)
    ON DELETE CASCADE,

  CONSTRAINT projektgrundlag_status_check
    CHECK (status IN ('udkast', 'klar_til_invitation'))
);

CREATE INDEX idx_projektgrundlag_projekt_id
  ON public.projektgrundlag (projekt_id);

ALTER TABLE public.projektgrundlag ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.projektgrundlag
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.projektgrundlag
  TO service_role;

-- =============================================================================
-- POSTFLIGHT
-- =============================================================================

DO $$
DECLARE
  v_count         integer;
  v_typname       text;
  v_notnull       boolean;
  v_hasdef        boolean;
  v_defval        text;
  v_bool          boolean;
  v_confdeltype   char;
  v_child_schema  text;
  v_child_table   text;
  v_child_col     text;
  v_parent_schema text;
  v_parent_table  text;
  v_parent_col    text;
  v_srole_acl     text;
  v_checkdef      text;
BEGIN

  -- PO-1: tabellen eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
  ) THEN
    RAISE EXCEPTION '[PO-1] Tabel public.projektgrundlag eksisterer ikke efter CREATE. Ruller tilbage.';
  END IF;

  -- PO-2: id — uuid, NOT NULL, default gen_random_uuid()
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
    AND a.attname = 'id' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-2a] Kolonne id mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'uuid' THEN
    RAISE EXCEPTION '[PO-2a] id er %, forventet uuid. Ruller tilbage.', v_typname;
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-2a] id er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- PO-3: projekt_id — uuid NOT NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
    AND a.attname = 'projekt_id' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-3] Kolonne projekt_id mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'uuid' THEN
    RAISE EXCEPTION '[PO-3] projekt_id er %, forventet uuid. Ruller tilbage.', v_typname;
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-3] projekt_id er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- PO-4: titel — text NOT NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
    AND a.attname = 'titel' AND a.attnum > 0;

  IF v_typname IS NULL OR v_typname != 'text' THEN
    RAISE EXCEPTION '[PO-4] titel mangler eller er ikke text. Ruller tilbage.';
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-4] titel er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- PO-5: fag — text, nullable (ingen enum/CHECK)
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
    AND a.attname = 'fag' AND a.attnum > 0;

  IF v_typname IS NULL OR v_typname != 'text' THEN
    RAISE EXCEPTION '[PO-5] fag mangler eller er ikke text. Ruller tilbage.';
  END IF;
  IF v_notnull THEN
    RAISE EXCEPTION '[PO-5] fag er NOT NULL, forventet nullable. Ruller tilbage.';
  END IF;

  -- PO-6: de syv frie tekstfelter — text NOT NULL DEFAULT ''
  FOR v_typname IN
    SELECT unnest(ARRAY['arbejdsomfang', 'eksisterende_forhold', 'materialer_kvalitet',
                         'tidsramme', 'adgangsforhold', 'dokumentationskrav', 'oevrige_forhold'])
  LOOP
    DECLARE
      v_felt_typ    text;
      v_felt_notnull boolean;
      v_felt_def    text;
    BEGIN
      SELECT t.typname, a.attnotnull, pg_catalog.pg_get_expr(ad.adbin, ad.adrelid)
      INTO v_felt_typ, v_felt_notnull, v_felt_def
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
      LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
      WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
        AND a.attname = v_typname AND a.attnum > 0;

      IF v_felt_typ IS NULL OR v_felt_typ != 'text' THEN
        RAISE EXCEPTION '[PO-6] Feltet % mangler eller er ikke text. Ruller tilbage.', v_typname;
      END IF;
      IF NOT v_felt_notnull THEN
        RAISE EXCEPTION '[PO-6] Feltet % er nullable, forventet NOT NULL. Ruller tilbage.', v_typname;
      END IF;
      IF v_felt_def IS NULL OR v_felt_def NOT IN ('''''::text', '''''') THEN
        RAISE EXCEPTION '[PO-6] Feltet % har uventet default: %. Forventet tom streng. Ruller tilbage.', v_typname, v_felt_def;
      END IF;
    END;
  END LOOP;

  -- PO-7: status — text NOT NULL DEFAULT 'udkast'
  SELECT t.typname, a.attnotnull, pg_catalog.pg_get_expr(ad.adbin, ad.adrelid)
  INTO v_typname, v_notnull, v_defval
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
    AND a.attname = 'status' AND a.attnum > 0;

  IF v_typname IS NULL OR v_typname != 'text' THEN
    RAISE EXCEPTION '[PO-7] status mangler eller er ikke text. Ruller tilbage.';
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-7] status er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;
  IF v_defval IS NULL OR v_defval NOT LIKE '%udkast%' THEN
    RAISE EXCEPTION '[PO-7] status har uventet default: %. Forventet ''udkast''. Ruller tilbage.', v_defval;
  END IF;

  -- PO-8: CHECK-constraint på status tillader kun de to definerede værdier
  SELECT pg_catalog.pg_get_constraintdef(oid)
  INTO v_checkdef
  FROM pg_catalog.pg_constraint
  WHERE conname = 'projektgrundlag_status_check';

  IF v_checkdef IS NULL THEN
    RAISE EXCEPTION '[PO-8] Constraint projektgrundlag_status_check ikke fundet. Ruller tilbage.';
  END IF;
  IF v_checkdef NOT LIKE '%udkast%' OR v_checkdef NOT LIKE '%klar_til_invitation%' THEN
    RAISE EXCEPTION '[PO-8] projektgrundlag_status_check matcher ikke forventede værdier: %. Ruller tilbage.', v_checkdef;
  END IF;

  -- PO-9: oprettet_at / opdateret_at — timestamptz NOT NULL DEFAULT NOW()
  FOR v_typname IN SELECT unnest(ARRAY['oprettet_at', 'opdateret_at'])
  LOOP
    DECLARE
      v_ts_typ     text;
      v_ts_notnull boolean;
      v_ts_def     text;
    BEGIN
      SELECT t.typname, a.attnotnull, pg_catalog.pg_get_expr(ad.adbin, ad.adrelid)
      INTO v_ts_typ, v_ts_notnull, v_ts_def
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
      LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
      WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
        AND a.attname = v_typname AND a.attnum > 0;

      IF v_ts_typ IS NULL OR v_ts_typ != 'timestamptz' THEN
        RAISE EXCEPTION '[PO-9] Feltet % mangler eller er ikke timestamptz. Ruller tilbage.', v_typname;
      END IF;
      IF NOT v_ts_notnull THEN
        RAISE EXCEPTION '[PO-9] Feltet % er nullable, forventet NOT NULL. Ruller tilbage.', v_typname;
      END IF;
      IF v_ts_def IS NULL OR lower(v_ts_def) NOT IN ('now()', 'current_timestamp') THEN
        RAISE EXCEPTION '[PO-9] Feltet % har uventet default: %. Ruller tilbage.', v_typname, v_ts_def;
      END IF;
    END;
  END LOOP;

  -- PO-10: primary key dækker præcis id
  SELECT COUNT(*)
  INTO v_count
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
  WHERE n.nspname = 'public' AND t.relname = 'projektgrundlag'
    AND con.contype = 'p' AND a.attname = 'id';

  IF v_count != 1 THEN
    RAISE EXCEPTION '[PO-10] Primary key dækker ikke præcis (id). Ruller tilbage.';
  END IF;

  -- PO-11: FK projekt_id → public.projekter(id) ON DELETE CASCADE
  SELECT
    cn.nspname, ct.relname, ca.attname,
    fn.nspname, ft.relname, fa.attname,
    con.confdeltype
  INTO
    v_child_schema, v_child_table, v_child_col,
    v_parent_schema, v_parent_table, v_parent_col,
    v_confdeltype
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class ct ON ct.oid = con.conrelid
  JOIN pg_catalog.pg_namespace cn ON cn.oid = ct.relnamespace
  JOIN pg_catalog.pg_attribute ca ON ca.attrelid = con.conrelid
    AND ca.attnum = con.conkey[1]
  JOIN pg_catalog.pg_class ft ON ft.oid = con.confrelid
  JOIN pg_catalog.pg_namespace fn ON fn.oid = ft.relnamespace
  JOIN pg_catalog.pg_attribute fa ON fa.attrelid = con.confrelid
    AND fa.attnum = con.confkey[1]
  WHERE con.conname = 'projektgrundlag_projekt_id_fkey';

  IF v_confdeltype IS NULL THEN
    RAISE EXCEPTION '[PO-11] FK projektgrundlag_projekt_id_fkey ikke fundet. Ruller tilbage.';
  END IF;
  IF v_child_schema != 'public' OR v_child_table != 'projektgrundlag' OR v_child_col != 'projekt_id' THEN
    RAISE EXCEPTION '[PO-11] FK child-endpoint er %.%.%, forventet public.projektgrundlag.projekt_id. Ruller tilbage.',
      v_child_schema, v_child_table, v_child_col;
  END IF;
  IF v_parent_schema != 'public' OR v_parent_table != 'projekter' OR v_parent_col != 'id' THEN
    RAISE EXCEPTION '[PO-11] FK parent-endpoint er %.%.%, forventet public.projekter.id. Ruller tilbage.',
      v_parent_schema, v_parent_table, v_parent_col;
  END IF;
  IF v_confdeltype != 'c' THEN
    RAISE EXCEPTION '[PO-11] FK projekt_id har ON DELETE "%" — forventet CASCADE ("c"). Ruller tilbage.', v_confdeltype;
  END IF;

  -- PO-12: ingen unique constraint på projekt_id (flere projektgrundlag pr. projekt skal kunne eksistere)
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'projektgrundlag'
      AND con.contype = 'u'
      AND con.conkey = ARRAY[
        (SELECT attnum FROM pg_catalog.pg_attribute
         WHERE attrelid = con.conrelid AND attname = 'projekt_id')
      ]
  ) THEN
    RAISE EXCEPTION '[PO-12] Der findes en uventet unique constraint på projekt_id. Ruller tilbage.';
  END IF;

  -- PO-13: RLS er aktiveret
  SELECT c.relrowsecurity
  INTO v_bool
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag';

  IF NOT v_bool THEN
    RAISE EXCEPTION '[PO-13] RLS er ikke aktiveret på projektgrundlag. Ruller tilbage.';
  END IF;

  -- PO-14: ingen RLS-policies på tabellen
  SELECT COUNT(*)
  INTO v_count
  FROM pg_catalog.pg_policy pol
  JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag';

  IF v_count > 0 THEN
    RAISE EXCEPTION '[PO-14] Fandt % RLS-policy(s) på projektgrundlag, forventet 0. Ruller tilbage.', v_count;
  END IF;

  -- PO-15: præcis ét index på projekt_id (ud over primary key)
  SELECT COUNT(*)
  INTO v_count
  FROM pg_catalog.pg_index ix
  JOIN pg_catalog.pg_class t ON t.oid = ix.indrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE n.nspname = 'public' AND t.relname = 'projektgrundlag'
    AND a.attname = 'projekt_id' AND NOT ix.indisprimary;

  IF v_count != 1 THEN
    RAISE EXCEPTION '[PO-15] Fandt % ekstra index(er) på projekt_id, forventet præcis 1. Ruller tilbage.', v_count;
  END IF;

  -- PO-16: tabellen indeholder 0 rækker
  EXECUTE 'SELECT COUNT(*) FROM public.projektgrundlag' INTO v_count;
  IF v_count != 0 THEN
    RAISE EXCEPTION '[PO-16] Tabellen indeholder % rækker, forventet 0. Ruller tilbage.', v_count;
  END IF;

  -- PO-17: tabelrettigheder
  --   service_role: SELECT (r), INSERT (a), UPDATE (w) — ikke DELETE (d)
  --   anon, authenticated, PUBLIC: ingen direkte rettigheder

  SELECT ace::text
  INTO v_srole_acl
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
  unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
  WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
    AND ace::text LIKE 'service_role=%'
  LIMIT 1;

  IF v_srole_acl IS NULL THEN
    RAISE EXCEPTION '[PO-17a] service_role har ingen eksplicit ACL-entry på projektgrundlag. Ruller tilbage.';
  END IF;
  IF v_srole_acl !~ 'service_role=[^/]*r' THEN
    RAISE EXCEPTION '[PO-17a] service_role mangler SELECT (r). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;
  IF v_srole_acl !~ 'service_role=[^/]*a' THEN
    RAISE EXCEPTION '[PO-17b] service_role mangler INSERT (a). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;
  IF v_srole_acl !~ 'service_role=[^/]*w' THEN
    RAISE EXCEPTION '[PO-17c] service_role mangler UPDATE (w). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;
  IF v_srole_acl ~ 'service_role=[^/]*d' THEN
    RAISE EXCEPTION '[PO-17d] service_role har uventet DELETE (d). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
    unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
    WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
      AND ace::text LIKE 'anon=%'
      AND ace::text NOT LIKE 'anon=/%'
  ) THEN
    RAISE EXCEPTION '[PO-17e] anon har uventede direkte tabelrettigheder. Ruller tilbage.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
    unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
    WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
      AND ace::text LIKE 'authenticated=%'
      AND ace::text NOT LIKE 'authenticated=/%'
  ) THEN
    RAISE EXCEPTION '[PO-17f] authenticated har uventede direkte tabelrettigheder. Ruller tilbage.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
    unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
    WHERE n.nspname = 'public' AND c.relname = 'projektgrundlag'
      AND ace::text LIKE '=%'
      AND ace::text NOT LIKE '=/%'
  ) THEN
    RAISE EXCEPTION '[PO-17g] PUBLIC har uventede direkte tabelrettigheder. Ruller tilbage.';
  END IF;

END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK-VEJLEDNING
-- Disse linjer er inaktive SQL-kommentarer.
-- Rollback sletter permanent al akkumuleret projektgrundlagsdata og kan
-- ikke fortrydes. Må KUN køres efter eksplicit godkendelse fra projektejer.
-- =============================================================================
--
-- DROP TABLE public.projektgrundlag;
