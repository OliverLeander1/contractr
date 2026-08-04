-- =============================================================================
-- supabase-migration-chat-laesestatus.sql
--
-- ADDITIV migration: opretter public.chat_laesestatus
--
-- Læsestatus er individuel pr. bruger pr. samtale. Tabellen registrerer
-- hvornår en bruger sidst har set en konkret samtale, og hvilken besked
-- der var den seneste de faktisk fik vist på skærmen.
--
-- auth.users er den autoritative brugerrelation — ikke public.profiler.
-- auth.getUser().user.id er den verificerede identitet. Profiler bruges
-- til visningsnavne, men aldrig som identitetskilde i adgangskontrol.
--
-- Begge markører bevares:
--   senest_laeste_besked_id  — præcis rækkefølgemarkør til ulæst-beregning
--   sidst_laest_at           — bruges til UI-visning og som fallback ved
--                              ON DELETE SET NULL på beskedmarkøren
--
-- sidst_laest_at sættes ALTID af den sikre serverroute til beskedens
-- faktiske chat_beskeder.sendt_at — aldrig blindt til NOW().
-- Serveren skal desuden forhindre, at læsemarkøren flyttes baglæns.
--
-- Brugerens egne beskeder tæller ikke som ulæste.
-- Ulæst-query skal bruge IS DISTINCT FROM — ikke != — for korrekt
-- håndtering af legacy-beskeder med NULL afsender_id.
--
-- Samtaler med kontrakt_id = NULL er legacy og medtages ikke i oversigter.
-- public.notifikationer er ikke autoritativ læsestatus for chat.
--
-- API (mark-as-read endpoint, oversigt) og UI (badges, previews)
-- implementeres i særskilte efterfølgende faser.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PREFLIGHT
-- =============================================================================

DO $$
BEGIN

  -- PF-1: chat_laesestatus må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
  ) THEN
    RAISE EXCEPTION '[PF-1] Tabel public.chat_laesestatus eksisterer allerede. Afbryder.';
  END IF;

  -- PF-2a: public.chat_samtaler eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'chat_samtaler'
  ) THEN
    RAISE EXCEPTION '[PF-2a] Tabel public.chat_samtaler eksisterer ikke. Afbryder.';
  END IF;

  -- PF-2b: public.chat_beskeder eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'chat_beskeder'
  ) THEN
    RAISE EXCEPTION '[PF-2b] Tabel public.chat_beskeder eksisterer ikke. Afbryder.';
  END IF;

  -- PF-2c: auth.users eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    RAISE EXCEPTION '[PF-2c] Tabel auth.users eksisterer ikke. Afbryder.';
  END IF;

  -- PF-3a: public.chat_samtaler.id er af typen UUID
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'public' AND c.relname = 'chat_samtaler'
      AND a.attname = 'id' AND t.typname = 'uuid' AND a.attnum > 0
  ) THEN
    RAISE EXCEPTION '[PF-3a] public.chat_samtaler.id eksisterer ikke eller er ikke UUID. Afbryder.';
  END IF;

  -- PF-3b: public.chat_beskeder.id er af typen UUID
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'public' AND c.relname = 'chat_beskeder'
      AND a.attname = 'id' AND t.typname = 'uuid' AND a.attnum > 0
  ) THEN
    RAISE EXCEPTION '[PF-3b] public.chat_beskeder.id eksisterer ikke eller er ikke UUID. Afbryder.';
  END IF;

  -- PF-3c: auth.users.id er af typen UUID
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND a.attname = 'id' AND t.typname = 'uuid' AND a.attnum > 0
  ) THEN
    RAISE EXCEPTION '[PF-3c] auth.users.id eksisterer ikke eller er ikke UUID. Afbryder.';
  END IF;

  -- PF-4a: chat_samtaler.id er primary key eller unique
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
    WHERE n.nspname = 'public' AND t.relname = 'chat_samtaler'
      AND a.attname = 'id' AND con.contype IN ('p', 'u')
  ) THEN
    RAISE EXCEPTION '[PF-4a] public.chat_samtaler.id er hverken primary key eller unique. Afbryder.';
  END IF;

  -- PF-4b: chat_beskeder.id er primary key eller unique
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
    WHERE n.nspname = 'public' AND t.relname = 'chat_beskeder'
      AND a.attname = 'id' AND con.contype IN ('p', 'u')
  ) THEN
    RAISE EXCEPTION '[PF-4b] public.chat_beskeder.id er hverken primary key eller unique. Afbryder.';
  END IF;

  -- PF-5a: PK-navn chat_laesestatus_pkey må ikke eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'chat_laesestatus_pkey'
  ) THEN
    RAISE EXCEPTION '[PF-5a] Constraint chat_laesestatus_pkey eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5b: FK-navn chat_laesestatus_samtale_id_fkey må ikke eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'chat_laesestatus_samtale_id_fkey'
  ) THEN
    RAISE EXCEPTION '[PF-5b] Constraint chat_laesestatus_samtale_id_fkey eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5c: FK-navn chat_laesestatus_bruger_id_fkey må ikke eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'chat_laesestatus_bruger_id_fkey'
  ) THEN
    RAISE EXCEPTION '[PF-5c] Constraint chat_laesestatus_bruger_id_fkey eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5d: FK-navn chat_laesestatus_senest_laeste_besked_id_fkey må ikke eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'chat_laesestatus_senest_laeste_besked_id_fkey'
  ) THEN
    RAISE EXCEPTION '[PF-5d] Constraint chat_laesestatus_senest_laeste_besked_id_fkey eksisterer allerede. Afbryder.';
  END IF;

  -- PF-5e: Index-navn idx_chat_laesestatus_bruger_id må ikke eksistere
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'idx_chat_laesestatus_bruger_id' AND relkind = 'i'
  ) THEN
    RAISE EXCEPTION '[PF-5e] Index idx_chat_laesestatus_bruger_id eksisterer allerede. Afbryder.';
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

CREATE TABLE public.chat_laesestatus (
  samtale_id              UUID        NOT NULL,
  bruger_id               UUID        NOT NULL,
  senest_laeste_besked_id UUID,
  sidst_laest_at          TIMESTAMPTZ NOT NULL,
  opdateret_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chat_laesestatus_pkey
    PRIMARY KEY (samtale_id, bruger_id),

  CONSTRAINT chat_laesestatus_samtale_id_fkey
    FOREIGN KEY (samtale_id)
    REFERENCES public.chat_samtaler(id)
    ON DELETE CASCADE,

  CONSTRAINT chat_laesestatus_bruger_id_fkey
    FOREIGN KEY (bruger_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  CONSTRAINT chat_laesestatus_senest_laeste_besked_id_fkey
    FOREIGN KEY (senest_laeste_besked_id)
    REFERENCES public.chat_beskeder(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_chat_laesestatus_bruger_id
  ON public.chat_laesestatus (bruger_id);

ALTER TABLE public.chat_laesestatus ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
  ON TABLE public.chat_laesestatus
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.chat_laesestatus
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
BEGIN

  -- PO-1: tabellen eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
  ) THEN
    RAISE EXCEPTION '[PO-1] Tabel public.chat_laesestatus eksisterer ikke efter CREATE. Ruller tilbage.';
  END IF;

  -- PO-2 + PO-3: fem kolonner med korrekte typer og nullability

  -- samtale_id: uuid NOT NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'samtale_id' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-2a] Kolonne samtale_id mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'uuid' THEN
    RAISE EXCEPTION '[PO-2a] samtale_id er %, forventet uuid. Ruller tilbage.', v_typname;
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-3a] samtale_id er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- bruger_id: uuid NOT NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'bruger_id' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-2b] Kolonne bruger_id mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'uuid' THEN
    RAISE EXCEPTION '[PO-2b] bruger_id er %, forventet uuid. Ruller tilbage.', v_typname;
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-3b] bruger_id er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- senest_laeste_besked_id: uuid NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'senest_laeste_besked_id' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-2c] Kolonne senest_laeste_besked_id mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'uuid' THEN
    RAISE EXCEPTION '[PO-2c] senest_laeste_besked_id er %, forventet uuid. Ruller tilbage.', v_typname;
  END IF;
  IF v_notnull THEN
    RAISE EXCEPTION '[PO-3c] senest_laeste_besked_id er NOT NULL, forventet nullable. Ruller tilbage.';
  END IF;

  -- sidst_laest_at: timestamptz NOT NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'sidst_laest_at' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-2d] Kolonne sidst_laest_at mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'timestamptz' THEN
    RAISE EXCEPTION '[PO-2d] sidst_laest_at er %, forventet timestamptz. Ruller tilbage.', v_typname;
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-3d] sidst_laest_at er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- opdateret_at: timestamptz NOT NULL
  SELECT t.typname, a.attnotnull
  INTO v_typname, v_notnull
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'opdateret_at' AND a.attnum > 0;

  IF v_typname IS NULL THEN
    RAISE EXCEPTION '[PO-2e] Kolonne opdateret_at mangler. Ruller tilbage.';
  END IF;
  IF v_typname != 'timestamptz' THEN
    RAISE EXCEPTION '[PO-2e] opdateret_at er %, forventet timestamptz. Ruller tilbage.', v_typname;
  END IF;
  IF NOT v_notnull THEN
    RAISE EXCEPTION '[PO-3e] opdateret_at er nullable, forventet NOT NULL. Ruller tilbage.';
  END IF;

  -- PO-4: sidst_laest_at har ingen default
  SELECT (ad.adbin IS NOT NULL)
  INTO v_hasdef
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'sidst_laest_at' AND a.attnum > 0;

  IF v_hasdef IS TRUE THEN
    RAISE EXCEPTION '[PO-4] sidst_laest_at har en default-værdi, forventet ingen. Ruller tilbage.';
  END IF;

  -- PO-5: opdateret_at har DEFAULT NOW()
  SELECT pg_catalog.pg_get_expr(ad.adbin, ad.adrelid)
  INTO v_defval
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND a.attname = 'opdateret_at' AND a.attnum > 0;

  IF v_defval IS NULL THEN
    RAISE EXCEPTION '[PO-5] opdateret_at mangler DEFAULT NOW(). Ruller tilbage.';
  END IF;
  IF lower(v_defval) NOT IN ('now()', 'current_timestamp') THEN
    RAISE EXCEPTION '[PO-5] opdateret_at har uventet default: %. Forventet now() eller current_timestamp. Ruller tilbage.', v_defval;
  END IF;

  -- PO-6: primary key dækker præcis kolonnerne samtale_id og bruger_id (2 stk.)
  SELECT COUNT(*)
  INTO v_count
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class t ON t.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
  WHERE n.nspname = 'public' AND t.relname = 'chat_laesestatus'
    AND con.contype = 'p' AND a.attname IN ('samtale_id', 'bruger_id');

  IF v_count != 2 THEN
    RAISE EXCEPTION '[PO-6] Primary key dækker ikke præcis (samtale_id, bruger_id). Fandt % relevante kolonner. Ruller tilbage.', v_count;
  END IF;

  -- PO-7a: FK samtale_id → public.chat_samtaler(id) ON DELETE CASCADE
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
  WHERE con.conname = 'chat_laesestatus_samtale_id_fkey';

  IF v_confdeltype IS NULL THEN
    RAISE EXCEPTION '[PO-7a] FK chat_laesestatus_samtale_id_fkey ikke fundet. Ruller tilbage.';
  END IF;
  IF v_child_schema != 'public' OR v_child_table != 'chat_laesestatus' OR v_child_col != 'samtale_id' THEN
    RAISE EXCEPTION '[PO-7a] FK child-endpoint er %.%.%, forventet public.chat_laesestatus.samtale_id. Ruller tilbage.',
      v_child_schema, v_child_table, v_child_col;
  END IF;
  IF v_parent_schema != 'public' OR v_parent_table != 'chat_samtaler' OR v_parent_col != 'id' THEN
    RAISE EXCEPTION '[PO-7a] FK parent-endpoint er %.%.%, forventet public.chat_samtaler.id. Ruller tilbage.',
      v_parent_schema, v_parent_table, v_parent_col;
  END IF;
  IF v_confdeltype != 'c' THEN
    RAISE EXCEPTION '[PO-7a] FK samtale_id har ON DELETE "%" — forventet CASCADE ("c"). Ruller tilbage.', v_confdeltype;
  END IF;

  -- PO-7b: FK bruger_id → auth.users(id) ON DELETE CASCADE
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
  WHERE con.conname = 'chat_laesestatus_bruger_id_fkey';

  IF v_confdeltype IS NULL THEN
    RAISE EXCEPTION '[PO-7b] FK chat_laesestatus_bruger_id_fkey ikke fundet. Ruller tilbage.';
  END IF;
  IF v_child_schema != 'public' OR v_child_table != 'chat_laesestatus' OR v_child_col != 'bruger_id' THEN
    RAISE EXCEPTION '[PO-7b] FK child-endpoint er %.%.%, forventet public.chat_laesestatus.bruger_id. Ruller tilbage.',
      v_child_schema, v_child_table, v_child_col;
  END IF;
  IF v_parent_schema != 'auth' OR v_parent_table != 'users' OR v_parent_col != 'id' THEN
    RAISE EXCEPTION '[PO-7b] FK parent-endpoint er %.%.%, forventet auth.users.id. Ruller tilbage.',
      v_parent_schema, v_parent_table, v_parent_col;
  END IF;
  IF v_confdeltype != 'c' THEN
    RAISE EXCEPTION '[PO-7b] FK bruger_id har ON DELETE "%" — forventet CASCADE ("c"). Ruller tilbage.', v_confdeltype;
  END IF;

  -- PO-7c: FK senest_laeste_besked_id → public.chat_beskeder(id) ON DELETE SET NULL
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
  WHERE con.conname = 'chat_laesestatus_senest_laeste_besked_id_fkey';

  IF v_confdeltype IS NULL THEN
    RAISE EXCEPTION '[PO-7c] FK chat_laesestatus_senest_laeste_besked_id_fkey ikke fundet. Ruller tilbage.';
  END IF;
  IF v_child_schema != 'public' OR v_child_table != 'chat_laesestatus' OR v_child_col != 'senest_laeste_besked_id' THEN
    RAISE EXCEPTION '[PO-7c] FK child-endpoint er %.%.%, forventet public.chat_laesestatus.senest_laeste_besked_id. Ruller tilbage.',
      v_child_schema, v_child_table, v_child_col;
  END IF;
  IF v_parent_schema != 'public' OR v_parent_table != 'chat_beskeder' OR v_parent_col != 'id' THEN
    RAISE EXCEPTION '[PO-7c] FK parent-endpoint er %.%.%, forventet public.chat_beskeder.id. Ruller tilbage.',
      v_parent_schema, v_parent_table, v_parent_col;
  END IF;
  IF v_confdeltype != 'n' THEN
    RAISE EXCEPTION '[PO-7c] FK senest_laeste_besked_id har ON DELETE "%" — forventet SET NULL ("n"). Ruller tilbage.', v_confdeltype;
  END IF;

  -- PO-8: RLS er aktiveret
  SELECT c.relrowsecurity
  INTO v_bool
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus';

  IF NOT v_bool THEN
    RAISE EXCEPTION '[PO-8] RLS er ikke aktiveret på chat_laesestatus. Ruller tilbage.';
  END IF;

  -- PO-9: ingen RLS-policies på tabellen
  SELECT COUNT(*)
  INTO v_count
  FROM pg_catalog.pg_policy pol
  JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus';

  IF v_count > 0 THEN
    RAISE EXCEPTION '[PO-9] Fandt % RLS-policy(s) på chat_laesestatus, forventet 0. Ruller tilbage.', v_count;
  END IF;

  -- PO-10: præcis ét ekstra index på bruger_id (ud over primary key)
  SELECT COUNT(*)
  INTO v_count
  FROM pg_catalog.pg_index ix
  JOIN pg_catalog.pg_class t ON t.oid = ix.indrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE n.nspname = 'public' AND t.relname = 'chat_laesestatus'
    AND a.attname = 'bruger_id' AND NOT ix.indisprimary;

  IF v_count != 1 THEN
    RAISE EXCEPTION '[PO-10] Fandt % ekstra index(er) på bruger_id, forventet præcis 1. Ruller tilbage.', v_count;
  END IF;

  -- PO-11: tabellen indeholder 0 rækker
  EXECUTE 'SELECT COUNT(*) FROM public.chat_laesestatus' INTO v_count;
  IF v_count != 0 THEN
    RAISE EXCEPTION '[PO-11] Tabellen indeholder % rækker, forventet 0. Ruller tilbage.', v_count;
  END IF;

  -- PO-12: tabelrettigheder
  --   service_role: SELECT (r), INSERT (a), UPDATE (w) — ikke DELETE (d)
  --   anon, authenticated, PUBLIC: ingen direkte rettigheder
  --   ACL-format pr. entry: grantee=privs/grantor  (PUBLIC = tom grantee: "=privs/grantor")

  SELECT ace::text
  INTO v_srole_acl
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
  unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
  WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
    AND ace::text LIKE 'service_role=%'
  LIMIT 1;

  IF v_srole_acl IS NULL THEN
    RAISE EXCEPTION '[PO-12a] service_role har ingen eksplicit ACL-entry på chat_laesestatus. Ruller tilbage.';
  END IF;
  IF v_srole_acl !~ 'service_role=[^/]*r' THEN
    RAISE EXCEPTION '[PO-12a] service_role mangler SELECT (r). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;
  IF v_srole_acl !~ 'service_role=[^/]*a' THEN
    RAISE EXCEPTION '[PO-12b] service_role mangler INSERT (a). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;
  IF v_srole_acl !~ 'service_role=[^/]*w' THEN
    RAISE EXCEPTION '[PO-12c] service_role mangler UPDATE (w). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;
  IF v_srole_acl ~ 'service_role=[^/]*d' THEN
    RAISE EXCEPTION '[PO-12d] service_role har uventet DELETE (d). ACL: %. Ruller tilbage.', v_srole_acl;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
    unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
    WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
      AND ace::text LIKE 'anon=%'
      AND ace::text NOT LIKE 'anon=/%'
  ) THEN
    RAISE EXCEPTION '[PO-12e] anon har uventede direkte tabelrettigheder. Ruller tilbage.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
    unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
    WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
      AND ace::text LIKE 'authenticated=%'
      AND ace::text NOT LIKE 'authenticated=/%'
  ) THEN
    RAISE EXCEPTION '[PO-12f] authenticated har uventede direkte tabelrettigheder. Ruller tilbage.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace,
    unnest(COALESCE(c.relacl, '{}'::aclitem[])) AS ace
    WHERE n.nspname = 'public' AND c.relname = 'chat_laesestatus'
      AND ace::text LIKE '=%'
      AND ace::text NOT LIKE '=/%'
  ) THEN
    RAISE EXCEPTION '[PO-12g] PUBLIC har uventede direkte tabelrettigheder. Ruller tilbage.';
  END IF;

END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK-VEJLEDNING
-- Disse linjer er inaktive SQL-kommentarer.
-- Rollback sletter AL akkumuleret læsestatus permanent og kan ikke fortrydes.
-- Må KUN køres efter eksplicit godkendelse fra projektejer.
-- =============================================================================
--
-- DROP TABLE public.chat_laesestatus;
