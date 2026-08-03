-- supabase-migration-chat-kontrakt-id.sql
--
-- FORMÅL: Additiv fase 1 — knyt præcis én chatsamtale til et aftalegrundlag.
--
-- HVAD ÆNDRES:
--   public.chat_samtaler får én ny nullable kolonne: kontrakt_id UUID
--   En navngivet foreign key peger på public.kontrakter(id)
--   Et partial unique index sikrer højst én samtale pr. kontrakt
--
-- HVAD ÆNDRES IKKE:
--   Eksisterende rækker i chat_samtaler berøres ikke
--   projekt_id bevares midlertidigt (se kommentar nedenfor)
--   chat_beskeder berøres ikke
--   RLS-policies berøres ikke
--   Grants berøres ikke
--   Applikationskode berøres ikke
--
-- KØRSEL:
--   Kør manuelt i Supabase Dashboard → SQL Editor → New query
--   Filen er IKKE kørt og IKKE testet mod produktion endnu
--
-- Kør ikke denne fil uden særskilt godkendelse.

BEGIN;

-- ============================================================
-- PREFLIGHT
-- Alle kontroller kører inde i én DO-blok.
-- Enhver fejl rejser en exception og ruller transaktionen tilbage.
-- ============================================================
DO $$
DECLARE
  v_antal_samtaler BIGINT;
BEGIN

  -- 1. Kontrollér at public.chat_samtaler eksisterer
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'chat_samtaler'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Tabellen public.chat_samtaler eksisterer ikke. '
      'Kontrollér at chat-migrationen er kørt.';
  END IF;

  -- 2. Kontrollér at public.kontrakter eksisterer
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name   = 'kontrakter'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Tabellen public.kontrakter eksisterer ikke. '
      'Kontrollér at kontrakt-migrationen er kørt.';
  END IF;

  -- 3. Kontrollér at public.kontrakter.id eksisterer og er af typen UUID
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'kontrakter'
      AND column_name  = 'id'
      AND data_type    = 'uuid'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: public.kontrakter.id eksisterer ikke eller er ikke af typen UUID. '
      'Foreign key-reference kan ikke oprettes.';
  END IF;

  -- 3b. Kontrollér at public.kontrakter.id er primary key
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    WHERE tc.table_schema   = 'public'
      AND tc.table_name     = 'kontrakter'
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name   = 'id'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: public.kontrakter.id er ikke primary key. '
      'Foreign key-reference kræver en entydig nøgle.';
  END IF;

  -- 4. Kontrollér at public.chat_samtaler.kontrakt_id IKKE allerede eksisterer
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'chat_samtaler'
      AND column_name  = 'kontrakt_id'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Kolonnen public.chat_samtaler.kontrakt_id eksisterer allerede. '
      'Migrationen er sandsynligvis allerede kørt. Stop og verificér manuelt.';
  END IF;

  -- 5a. Kontrollér at foreign key-constraintnavnet ikke allerede er i brug
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema    = 'public'
      AND table_name      = 'chat_samtaler'
      AND constraint_name = 'fk_chat_samtaler_kontrakt_id'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Foreign key-constraint "fk_chat_samtaler_kontrakt_id" '
      'eksisterer allerede på public.chat_samtaler. '
      'Migrationen er sandsynligvis allerede kørt.';
  END IF;

  -- 5b. Kontrollér at indexnavnet ikke allerede er i brug
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'chat_samtaler'
      AND indexname  = 'idx_chat_samtaler_kontrakt_id_unik'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Index "idx_chat_samtaler_kontrakt_id_unik" '
      'eksisterer allerede på public.chat_samtaler. '
      'Migrationen er sandsynligvis allerede kørt.';
  END IF;

  -- 6. Kontrollér at der ikke allerede findes andre foreign keys
  --    eller indekser der refererer til en kontrakt_id-kolonne (der ikke eksisterer endnu —
  --    dette fanger et evt. halvkørt opsætning via pg_constraint)
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname  = 'public'
      AND t.relname  = 'chat_samtaler'
      AND a.attname  = 'kontrakt_id'
      AND c.contype  = 'f'
  ) THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Der eksisterer allerede en foreign key på en kolonne '
      'ved navn kontrakt_id i public.chat_samtaler. '
      'Stop og verificér manuelt.';
  END IF;

  -- 7. Optæl og log antallet af eksisterende rækker
  SELECT COUNT(*) INTO v_antal_samtaler FROM public.chat_samtaler;
  RAISE NOTICE
    'PREFLIGHT OK: public.chat_samtaler har % rækker inden skemaændringen.',
    v_antal_samtaler;

  -- Gem rækkeantal i session-konfiguration til brug i postflight
  PERFORM set_config('app.pre_samtaler_antal', v_antal_samtaler::text, true);

END;
$$;


-- ============================================================
-- SKEMAÆNDRING 1
-- Tilføj nullable kontrakt_id UUID til public.chat_samtaler
--
-- Kolonnen er nullable fordi:
--   - Alle eksisterende chats har ingen kontrakt-tilknytning og bevares
--     som legacy-data med kontrakt_id = NULL
--   - Backfilling er bevidst udeladt: vi kan ikke gætte hvilken kontrakt
--     en eksisterende samtale hører til, særligt i multi-kontrakt-projekter
--   - Legacy-samtaler (NULL) håndteres i en separat fase og vises som
--     read-only i en "Tidligere projektsamtaler"-sektion
--   - projekt_id bevares midlertidigt på chat_samtaler for bagudkompatibilitet
--     med eksisterende RLS-policies og den gamle API-route; det udfases
--     i en separat oprydningsfase
-- ============================================================
ALTER TABLE public.chat_samtaler
  ADD COLUMN kontrakt_id UUID NULL;


-- ============================================================
-- SKEMAÆNDRING 2
-- Navngivet foreign key fra chat_samtaler.kontrakt_id → kontrakter.id
--
-- ON DELETE SET NULL er valgt fordi:
--   - Samtale- og beskedhistorik må ikke automatisk slettes hvis en kontrakt slettes
--   - Eksisterende sletteflows (api/projekt/[id]/slet) sletter kontrakter direkte
--     og ville fejle med ON DELETE RESTRICT
--   - ON DELETE CASCADE ville slette beskedhistorik uigenkaldeligt
--   - SET NULL gør samtalen til en legacy-samtale (kontrakt_id = NULL)
--     som bevares som auditspor men ikke indgår i det kontraktspecifikke chatflow
-- ============================================================
ALTER TABLE public.chat_samtaler
  ADD CONSTRAINT fk_chat_samtaler_kontrakt_id
  FOREIGN KEY (kontrakt_id)
  REFERENCES public.kontrakter(id)
  ON DELETE SET NULL;


-- ============================================================
-- SKEMAÆNDRING 3
-- Partial unique index på kontrakt_id WHERE kontrakt_id IS NOT NULL
--
-- Beskytter mod race conditions ved lazy open/create:
--   - To samtidige requests der begge ser 0 samtaler for en kontrakt
--     vil begge forsøge INSERT
--   - Kun det første INSERT lykkes; det andet fejler med unique_violation
--   - Serveren fanger unique_violation og henter den allerede oprettede samtale
--   - Resultatet er at begge requests returnerer samme samtale_id
--
-- Et ordinært ikke-unikt indeks ville ikke give denne garanti —
-- databasen ville stille acceptere to rækker med samme kontrakt_id.
--
-- Partial (WHERE kontrakt_id IS NOT NULL) er korrekt fordi:
--   - Der må gerne eksistere mange legacy-rækker med kontrakt_id = NULL
--   - Uniqueness gælder kun for kontrakt-tilknyttede samtaler
--
-- Et separat ordinært indeks på kontrakt_id oprettes IKKE —
-- det partial unique index tjener allerede som opslagindeks for
-- ikke-NULL kontrakt_id og et ekstra indeks ville være redundant.
--
-- Adgangskontrol og RLS er bevidst IKKE ændret i denne migration.
-- Kontraktspecifik RLS implementeres i en separat sikkerhedsfase.
-- ============================================================
CREATE UNIQUE INDEX idx_chat_samtaler_kontrakt_id_unik
  ON public.chat_samtaler(kontrakt_id)
  WHERE kontrakt_id IS NOT NULL;


-- ============================================================
-- POSTFLIGHT
-- Alle kontroller kører inde i én DO-blok.
-- Enhver fejl ruller hele transaktionen tilbage.
-- ============================================================
DO $$
DECLARE
  v_antal_efter    BIGINT;
  v_antal_foer     BIGINT;
  v_null_count     BIGINT;
  v_col_nullable   TEXT;
  v_col_data_type  TEXT;
  v_fk_delete_rule TEXT;
  v_index_is_unique BOOLEAN;
  v_index_predicate TEXT;
  v_ekstra_index_antal INT;
BEGIN

  -- 1. Kontrollér at public.chat_samtaler.kontrakt_id eksisterer
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'chat_samtaler'
      AND column_name  = 'kontrakt_id'
  ) THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Kolonnen public.chat_samtaler.kontrakt_id eksisterer ikke. '
      'Skemaændringen ser ud til at have fejlet.';
  END IF;

  -- 2. Kontrollér at kolonnen har typen UUID
  SELECT data_type INTO v_col_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'chat_samtaler'
    AND column_name  = 'kontrakt_id';

  IF v_col_data_type != 'uuid' THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: public.chat_samtaler.kontrakt_id har typen "%" — forventet "uuid".',
      v_col_data_type;
  END IF;

  -- 3. Kontrollér at kolonnen er nullable (IS_NULLABLE = 'YES')
  SELECT is_nullable INTO v_col_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'chat_samtaler'
    AND column_name  = 'kontrakt_id';

  IF v_col_nullable != 'YES' THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: public.chat_samtaler.kontrakt_id er NOT NULL — '
      'kolonnen skal være nullable for at bevare eksisterende rækker.';
  END IF;

  -- 4. Kontrollér foreign key: navn, retning og ON DELETE SET NULL
  SELECT rc.delete_rule INTO v_fk_delete_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc
    ON tc.constraint_name = rc.constraint_name
   AND tc.table_schema    = rc.constraint_schema
  WHERE rc.constraint_name = 'fk_chat_samtaler_kontrakt_id'
    AND tc.table_schema    = 'public'
    AND tc.table_name      = 'chat_samtaler';

  IF v_fk_delete_rule IS NULL THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Foreign key "fk_chat_samtaler_kontrakt_id" '
      'blev ikke fundet på public.chat_samtaler.';
  END IF;

  IF v_fk_delete_rule != 'SET NULL' THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Foreign key "fk_chat_samtaler_kontrakt_id" '
      'har delete-regel "%" — forventet "SET NULL".',
      v_fk_delete_rule;
  END IF;

  -- 4b. Kontrollér at FK refererer til kontrakter.id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.referential_constraints rc
    JOIN information_schema.table_constraints tc_ref
      ON tc_ref.constraint_name = rc.unique_constraint_name
     AND tc_ref.table_schema    = rc.unique_constraint_schema
    WHERE rc.constraint_name    = 'fk_chat_samtaler_kontrakt_id'
      AND tc_ref.table_name     = 'kontrakter'
  ) THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Foreign key "fk_chat_samtaler_kontrakt_id" '
      'refererer ikke til public.kontrakter. Kontrollér manuelt.';
  END IF;

  -- 5a. Kontrollér at partial unique index eksisterer og er UNIQUE
  SELECT ix.indisunique INTO v_index_is_unique
  FROM pg_indexes pi
  JOIN pg_class c    ON c.relname   = pi.indexname
  JOIN pg_index ix   ON ix.indexrelid = c.oid
  WHERE pi.schemaname = 'public'
    AND pi.tablename  = 'chat_samtaler'
    AND pi.indexname  = 'idx_chat_samtaler_kontrakt_id_unik';

  IF v_index_is_unique IS NULL THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Index "idx_chat_samtaler_kontrakt_id_unik" '
      'blev ikke fundet på public.chat_samtaler.';
  END IF;

  IF NOT v_index_is_unique THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Index "idx_chat_samtaler_kontrakt_id_unik" '
      'er ikke UNIQUE.';
  END IF;

  -- 5b. Kontrollér at indexet har predicate (er partial)
  SELECT pg_get_expr(ix.indpred, ix.indrelid) INTO v_index_predicate
  FROM pg_indexes pi
  JOIN pg_class c    ON c.relname     = pi.indexname
  JOIN pg_index ix   ON ix.indexrelid = c.oid
  WHERE pi.schemaname = 'public'
    AND pi.tablename  = 'chat_samtaler'
    AND pi.indexname  = 'idx_chat_samtaler_kontrakt_id_unik';

  IF v_index_predicate IS NULL THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Index "idx_chat_samtaler_kontrakt_id_unik" '
      'er ikke et partial index (ingen WHERE-betingelse fundet). '
      'Et fuldt unique index ville blokere legacy-rækker med kontrakt_id = NULL.';
  END IF;

  IF lower(v_index_predicate) NOT LIKE '%kontrakt_id is not null%' THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Index "idx_chat_samtaler_kontrakt_id_unik" '
      'har predicate "%" — forventet "(kontrakt_id IS NOT NULL)".',
      v_index_predicate;
  END IF;

  -- 6. Kontrollér at der ikke er oprettet et overflødigt ordinært kontrakt_id-index
  --    Tæl alle indekser på chat_samtaler der indeholder kontrakt_id i definitionsdelen
  --    og IKKE er det partial unique index vi selv har oprettet
  SELECT COUNT(*) INTO v_ekstra_index_antal
  FROM pg_indexes pi
  JOIN pg_class c    ON c.relname   = pi.indexname
  JOIN pg_index ix   ON ix.indexrelid = c.oid
  JOIN pg_attribute a ON a.attrelid  = c.oid
  WHERE pi.schemaname = 'public'
    AND pi.tablename  = 'chat_samtaler'
    AND pi.indexname != 'idx_chat_samtaler_kontrakt_id_unik'
    AND pi.indexname NOT LIKE 'chat_samtaler_pkey%'
    AND EXISTS (
      SELECT 1
      FROM pg_attribute aa
      JOIN pg_class cc ON cc.oid = aa.attrelid
      JOIN pg_index ii ON ii.indexrelid = cc.oid
      WHERE cc.relname  = pi.indexname
        AND aa.attname  = 'kontrakt_id'
    );

  IF v_ekstra_index_antal > 0 THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Der eksisterer % overflødige indeks/indekser på '
      'chat_samtaler.kontrakt_id ud over det forventede partial unique index. '
      'Kontrollér manuelt.',
      v_ekstra_index_antal;
  END IF;

  -- 7. Kontrollér at antallet af rækker er uændret
  v_antal_foer := current_setting('app.pre_samtaler_antal')::BIGINT;
  SELECT COUNT(*) INTO v_antal_efter FROM public.chat_samtaler;

  IF v_antal_efter != v_antal_foer THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: Antallet af rækker i public.chat_samtaler har ændret sig. '
      'Før: % — Efter: %. Ingen data måtte berøres.',
      v_antal_foer,
      v_antal_efter;
  END IF;

  -- 8. Kontrollér at alle eksisterende rækker har kontrakt_id = NULL
  SELECT COUNT(*) INTO v_null_count
  FROM public.chat_samtaler
  WHERE kontrakt_id IS NOT NULL;

  IF v_null_count > 0 THEN
    RAISE EXCEPTION
      'POSTFLIGHT FEJL: % rækker i public.chat_samtaler har kontrakt_id != NULL. '
      'Ingen backfilling må have fundet sted.',
      v_null_count;
  END IF;

  RAISE NOTICE
    'POSTFLIGHT OK: % rækker i public.chat_samtaler — alle har kontrakt_id = NULL. '
    'Kolonne, foreign key og partial unique index er verificerede.',
    v_antal_efter;

END;
$$;


COMMIT;


-- ============================================================
-- ROLLBACK-VEJLEDNING (inaktiv — kun til manuel reference)
--
-- Rollback må KUN udføres med særskilt godkendelse.
-- Rollback sletter alle eventuelle kontrakt-koblinger der er oprettet
-- efter denne migration og kan ikke gendannes.
--
-- Rækkefølge:
--
--   1. Drop partial unique index:
--      DROP INDEX IF EXISTS public.idx_chat_samtaler_kontrakt_id_unik;
--
--   2. Drop foreign key-constraint:
--      ALTER TABLE public.chat_samtaler
--        DROP CONSTRAINT IF EXISTS fk_chat_samtaler_kontrakt_id;
--
--   3. Drop kolonnen:
--      ALTER TABLE public.chat_samtaler
--        DROP COLUMN IF EXISTS kontrakt_id;
--
-- Advarsel: Trin 3 er destruktivt og irreversibelt.
-- Kør aldrig disse kommandoer uden backup og særskilt godkendelse.
-- ============================================================
