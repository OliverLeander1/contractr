-- supabase-migration-ekstraarbejde-kontrakt-id.sql
--
-- FORMÅL: Knyt hver aftaleseddel (ekstraarbejde) entydigt til den konkrete
-- kontrakt, den vedrører, og fjern klientens direkte skriveadgang til
-- tabellen. Alle writes skal fremover gå gennem autoritative server-routes
-- (se Aftalesedler sikkerhed v1).
--
-- HVAD ÆNDRES:
--   public.ekstraarbejde får én ny kolonne: kontrakt_id UUID NOT NULL
--   En navngivet foreign key peger på public.kontrakter(id)
--   Et almindeligt (ikke-unikt) index understøtter opslag på kontrakt_id
--     — flere aftalesedler kan høre til samme kontrakt, så uniqueness er
--     ikke relevant her (i modsætning til fx chat_samtaler.kontrakt_id)
--   Eksisterende RLS-policies for ekstraarbejde fjernes og erstattes:
--     - SELECT bevares (bygherre via profiler.rolle = 'bygherre' OG
--       projektejerskab, entreprenør via profiler.rolle = 'haandvaerker' OG
--       kontrakt_id + verificeret login-email) — profiler.rolle er den
--       autoritative rollekilde og kræves eksplicit i begge branches,
--       email-/ejerskabsmatch alene er ikke tilstrækkeligt
--     - INSERT/UPDATE/DELETE fjernes helt for almindelige brugerroller —
--       disse skal fremover kun ske via service-rollen fra autoritative
--       server-routes
--   status-CHECK-constrainten opdateres til den neutrale statusmodel:
--     sendt, haandvaerker_udfyldt  →  afventer_entreprenoer, afventer_bygherre
--     (godkendt, afvist er uændrede). De gamle retningsspecifikke navne
--     ("sendt", "haandvaerker_udfyldt") beskrev hvem der oprindeligt
--     oprettede sedlen, ikke hvem der aktuelt skal handle — det holdt ikke,
--     da produktmodellen blev udvidet til at lade begge parter initiere.
--   Prismodellen rettes til AB-Forbrugers faktiske to prisformer (fast pris
--   og medgået tid). "overslag" som selvstændig pris_type udfases — et
--   prisoverslag er ikke en prisform, men et valgfrit, særskilt beløb, der
--   kan følge med en medgået-tid-aftale. haandvaerker_pris_type-CHECK'en
--   ændres til kun at tillade 'fast'/'medgaaet_tid'. Fire nye nullable
--   felter tilføjes: haandvaerker_timepris, haandvaerker_prisoverslag,
--   materiale_afregning (begrænset til tre gyldige værdier) og
--   materiale_tillaeg_procent (kun obligatorisk, når materiale_afregning
--   kræver et tillæg).
--   Ny privat Storage-bucket "aftalesedler" oprettes (public=false,
--   file_size_limit=20MB, allowed_mime_types kun 'image/jpeg' — det
--   eneste format den eksisterende BilledAnnotering nogensinde
--   producerer). Ingen policies tilføjes på storage.objects for denne
--   bucket — al adgang sker via serverudstedte signed upload-/read-URLs,
--   aldrig direkte klientadgang. Den eksisterende "billeder"-bucket
--   røres ikke, for ikke at påvirke Mangler-flowet.
--   Ny tabel ekstraarbejde_billeder knytter uploadede billeder til en
--   aftaleseddel med uploader, tidspunkt og valgfri lokationstekst.
--   REVOKE INSERT/UPDATE/DELETE fra anon/authenticated tilføjes som
--   ekstra forsvar på både ekstraarbejde og ekstraarbejde_billeder,
--   uafhængigt af RLS-policy-navne, da de faktiske live policy-navne
--   ikke er fuldt verificerede.
--   Ny funktion public.opret_ekstraarbejde_med_billeder(...) indsætter
--   en aftaleseddel og dens billedmetadata atomisk i én transaktion —
--   fejler et billede, rulles hele kaldet (inkl. selve aftaleseddel-
--   rækken) tilbage. SECURITY INVOKER, og EXECUTE er eksplicit frataget
--   PUBLIC/anon/authenticated og kun givet til service_role, så
--   funktionen ikke kan kaldes direkte fra browseren uden om
--   Next.js-routens Bearer JWT-autorisation.
--
-- HVORFOR NOT NULL KAN SÆTTES DIREKTE:
--   Read-only produktionstjek (samme session) viste 0 eksisterende rækker
--   i public.ekstraarbejde. Der er derfor intet at backfille, og kolonnen
--   kan tilføjes som NOT NULL uden DEFAULT. Preflight-blokken nedenfor
--   verificerer dette rækkeantal på ny umiddelbart inden ændringen —
--   hvis antallet af rækker har ændret sig siden analysen, stopper
--   migrationen med en tydelig fejl i stedet for at fejle råt på
--   NOT NULL-constraintet.
--
-- HVAD ÆNDRES IKKE:
--   Selve dokumentstrukturen, revisionshistorik eller audit-log —
--   det er bevidst uden for denne opgaves scope.
--   Kolonnerne oprettet_af, oprettet_af_navn, haandvaerker_*, status m.fl.
--   ændres ikke i denne migration — kun tilgangen til at skrive dem.
--
-- KØRSEL:
--   Kør manuelt i Supabase Dashboard → SQL Editor → New query
--   Filen er IKKE kørt og IKKE testet mod produktion endnu
--
-- Kør ikke denne fil uden særskilt godkendelse.

BEGIN;

-- ============================================================
-- PREFLIGHT
-- ============================================================
DO $$
DECLARE
  v_antal_sedler BIGINT;
  v_andre_status_constraints TEXT;
  v_ukendte_policies TEXT;
BEGIN

  -- 1. Kontrollér at public.ekstraarbejde eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: Tabellen public.ekstraarbejde eksisterer ikke.';
  END IF;

  -- 2. Kontrollér at public.kontrakter eksisterer med id som primary key (UUID)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.columns c
      ON c.table_schema = tc.table_schema AND c.table_name = tc.table_name AND c.column_name = kcu.column_name
    WHERE tc.table_schema = 'public' AND tc.table_name = 'kontrakter'
      AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = 'id' AND c.data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: public.kontrakter.id er ikke fundet som UUID primary key.';
  END IF;

  -- 3. Kontrollér at kontrakt_id IKKE allerede eksisterer på ekstraarbejde
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde' AND column_name = 'kontrakt_id'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: public.ekstraarbejde.kontrakt_id eksisterer allerede. Migrationen er sandsynligvis allerede kørt.';
  END IF;

  -- 4. Kontrollér at constraint- og indexnavne ikke allerede er i brug
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde' AND constraint_name = 'fk_ekstraarbejde_kontrakt_id'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: Constraint "fk_ekstraarbejde_kontrakt_id" eksisterer allerede.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND indexname = 'idx_ekstraarbejde_kontrakt_id'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: Index "idx_ekstraarbejde_kontrakt_id" eksisterer allerede.';
  END IF;

  -- 4b. Kontrollér at INGEN policy på public.ekstraarbejde er ukendt for os.
  --     Enhver live policy skal enten være en af de seks faktiske,
  --     live-eksporterede legacy-policies (som DROP POLICY IF EXISTS
  --     nedenfor fjerner eksplicit), eller selve den nye policy
  --     "Laes egne aftalesedler" (kun relevant ved en genkørsel efter et
  --     delvist forsøg). Denne kontrol findes, fordi et tidligere
  --     migrationsforsøg overså "Bygherre ser ekstraarbejde" i DROP-listen,
  --     hvilket lod den overleve som en ekstra, uventet SELECT-policy og
  --     fejlede i POSTFLIGHT ("2 SELECT-policies fundet — forventet 1").
  --     Vi vil hellere stoppe her end stiltiende overse en anden ukendt
  --     live policy, vi ikke har set i en eksport.
  SELECT string_agg(policyname, ', ')
  INTO v_ukendte_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'ekstraarbejde'
    AND policyname NOT IN (
      'Bygherre opretter ekstraarbejde',
      'Haandvaerker opretter ekstraarbejde',
      'Bygherre ser ekstraarbejde',
      'Haandvaerker ser ekstraarbejde',
      'Bygherre godkender ekstraarbejde',
      'Haandvaerker opdaterer ekstraarbejde',
      'Laes egne aftalesedler'
    );

  IF v_ukendte_policies IS NOT NULL THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Fandt ukendt(e) policy(er) på public.ekstraarbejde, som migrationen ikke har taget højde for: %. '
      'Stop og undersøg manuelt, i stedet for at lade en ukendt policy overleve migrationen.',
      v_ukendte_policies;
  END IF;

  -- 5. Kontrollér at der reelt er 0 rækker — forudsætningen for NOT NULL uden DEFAULT.
  --    Hvis dette ikke længere er sandt, skal migrationen revurderes (fx med
  --    en backfill-strategi), ikke bare køres blindt.
  SELECT COUNT(*) INTO v_antal_sedler FROM public.ekstraarbejde;
  IF v_antal_sedler != 0 THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: public.ekstraarbejde har % rækker, ikke 0. '
      'Denne migration er kun sikker uden backfill-strategi, når tabellen er tom. '
      'Stop og revurdér, i stedet for at tilføje kontrakt_id som NOT NULL.',
      v_antal_sedler;
  END IF;

  -- 6. Kontrollér at det nye constraintnavn ikke allerede er i brug
  --    (selve det gamle navn "ekstraarbejde_status_check" genbruges bevidst
  --    nedenfor — det droppes og genskabes med nyt indhold, ikke omdøbes)
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc
      ON tc.constraint_name = cc.constraint_name AND tc.table_schema = cc.constraint_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'ekstraarbejde'
      AND cc.constraint_name = 'ekstraarbejde_status_check'
      AND cc.check_clause LIKE '%afventer_entreprenoer%'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: ekstraarbejde_status_check ser allerede ud til at bruge den nye statusmodel. Migrationen er sandsynligvis allerede kørt.';
  END IF;

  -- 6b. Kontrollér at der IKKE findes nogen ANDEN CHECK-constraint på
  --     status-kolonnen ud over det kendte, navngivne "ekstraarbejde_status_check".
  --     SKEMAÆNDRING 5 dropper kun dette ene navn — uden dette tjek ville en
  --     eventuel andet-navngivet, glemt CHECK på samme kolonne overleve
  --     migrationen uændret, og de to CHECK-constraints ville herefter blive
  --     ANDet sammen af Postgres. Da de to statuslister kun deler 'godkendt'
  --     og 'afvist', ville det i praksis gøre 'afventer_entreprenoer' og
  --     'afventer_bygherre' umulige at skrive — en stille, ødelæggende
  --     tilstand. Stop migrationen frem for at risikere det.
  SELECT string_agg(con.conname, ', ')
  INTO v_andre_status_constraints
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
  WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
    AND att.attname = 'status' AND con.contype = 'c'
    AND con.conname != 'ekstraarbejde_status_check';

  IF v_andre_status_constraints IS NOT NULL THEN
    RAISE EXCEPTION
      'PREFLIGHT FEJL: Fandt uventet(e) CHECK-constraint(s) på ekstraarbejde.status ud over ekstraarbejde_status_check: %. '
      'Migrationen ville efterlade to modstridende status-constraints. Stop og undersøg manuelt, i stedet for at køre videre.',
      v_andre_status_constraints;
  END IF;

  -- 7. Kontrollér at de nye prisfelter ikke allerede eksisterer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde'
      AND column_name IN ('haandvaerker_timepris', 'haandvaerker_prisoverslag', 'materiale_afregning', 'materiale_tillaeg_procent')
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: Et eller flere af de nye prisfelter eksisterer allerede på public.ekstraarbejde.';
  END IF;

  -- 8. Kontrollér at haandvaerker_pris_type-constrainten (kolonnen, IKKE det
  --    separate legacy-felt "pris_type") ikke allerede er opdateret til den
  --    nye model. Slås op strengt kolonnebaseret via pg_constraint/
  --    pg_attribute på "haandvaerker_pris_type" specifikt (ikke et gættet
  --    constraintnavn, og IKKE et navnebaseret opslag), da dens oprindelige
  --    inline CHECK fik et automatisk genereret navn i v2-migrationen.
  --    Dette tjek ser bevidst kun på haandvaerker_pris_type-kolonnen og
  --    stopper IKKE migrationen, blot fordi det adskilte, legitime
  --    legacy-felt "pris_type" og dets egen constraint
  --    "ekstraarbejde_pris_type_check" findes (det er forventet og skal
  --    forblive urørt — se SKEMAÆNDRING 6).
  IF EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND att.attname = 'haandvaerker_pris_type' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%medgaaet_tid%'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: haandvaerker_pris_type ser allerede ud til at bruge den nye prismodel.';
  END IF;

  -- 8b. Kontrollér at det nye constraintnavn "ekstraarbejde_haandvaerker_pris_type_check"
  --     ikke allerede findes på en ANDEN kolonne end haandvaerker_pris_type
  --     (ville betyde en uventet navnekollision — den dynamiske DROP
  --     ovenfor tømmer kun kolonnens EGEN constraint, ikke en tilfældig
  --     navnesammenfaldende constraint på et andet felt).
  IF EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND con.conname = 'ekstraarbejde_haandvaerker_pris_type_check'
      AND NOT EXISTS (
        SELECT 1 FROM pg_attribute att
        WHERE att.attrelid = rel.oid AND att.attnum = ANY (con.conkey) AND att.attname = 'haandvaerker_pris_type'
      )
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: Constraintnavnet "ekstraarbejde_haandvaerker_pris_type_check" er allerede i brug på en anden kolonne end haandvaerker_pris_type.';
  END IF;

  -- 9. Kontrollér at ekstraarbejde_billeder ikke allerede eksisterer
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde_billeder'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: public.ekstraarbejde_billeder eksisterer allerede.';
  END IF;

  -- 10. Kontrollér at storage-bucket "aftalesedler" ikke allerede eksisterer
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'aftalesedler') THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: storage-bucket "aftalesedler" eksisterer allerede.';
  END IF;

  -- 11. Kontrollér at public.profiler eksisterer med id som primary key
  --     (uploaded_by skal have samme FK-model som ekstraarbejde.oprettet_af)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'profiler'
      AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: public.profiler.id er ikke fundet som primary key.';
  END IF;

  -- 12. Kontrollér at RPC-funktionen ikke allerede eksisterer
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'opret_ekstraarbejde_med_billeder'
  ) THEN
    RAISE EXCEPTION 'PREFLIGHT FEJL: Funktionen public.opret_ekstraarbejde_med_billeder eksisterer allerede.';
  END IF;

  RAISE NOTICE 'PREFLIGHT OK: public.ekstraarbejde har 0 rækker. Fortsætter.';

END;
$$;


-- ============================================================
-- SKEMAÆNDRING 1
-- Tilføj kontrakt_id UUID NOT NULL til public.ekstraarbejde
-- NOT NULL er sikkert her, fordi preflight lige har bekræftet 0 rækker.
-- ============================================================
ALTER TABLE public.ekstraarbejde
  ADD COLUMN kontrakt_id UUID NOT NULL;


-- ============================================================
-- SKEMAÆNDRING 2
-- Navngivet foreign key fra ekstraarbejde.kontrakt_id → kontrakter.id
--
-- ON DELETE RESTRICT er valgt fordi:
--   - En aftaleseddel er en del af kontraktens forhandlings-/ændringshistorik
--     og bør ikke kunne miste sin reference stiltiende
--   - Den eksisterende projekt-sletningsrute (/api/projekt/[id]/slet)
--     sletter allerede alle ekstraarbejde-rækker for projektet FØR den
--     sletter kontrakter — RESTRICT ændrer derfor ikke dette flow
-- ============================================================
ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT fk_ekstraarbejde_kontrakt_id
  FOREIGN KEY (kontrakt_id)
  REFERENCES public.kontrakter(id)
  ON DELETE RESTRICT;


-- ============================================================
-- SKEMAÆNDRING 3
-- Almindeligt (ikke-unikt) index til opslag på kontrakt_id.
-- Ikke unikt, fordi flere aftalesedler legitimt hører til samme kontrakt.
-- ============================================================
CREATE INDEX idx_ekstraarbejde_kontrakt_id
  ON public.ekstraarbejde(kontrakt_id);


-- ============================================================
-- SKEMAÆNDRING 4 — RLS
--
-- Fjerner al direkte klient-skriveadgang til ekstraarbejde. Herefter må
-- kun service-rollen (brugt fra autoritative server-routes) indsætte,
-- opdatere eller slette rækker. Almindelige roller (anon/authenticated)
-- kan fortsat LÆSE de sedler, de er part i — kontrolleret nu via
-- kontrakt_id i stedet for email-match.
--
-- Alle SEKS faktiske, live-eksporterede legacy-policy-navne fjernes
-- eksplicit (IF EXISTS, altså idempotent uanset om de allerede er væk):
-- 2x INSERT, 2x SELECT, 2x UPDATE, ingen DELETE fandtes live. Et tidligere
-- migrationsforsøg manglede "Bygherre ser ekstraarbejde" i denne liste,
-- hvilket lod den overleve og gav "2 SELECT-policies fundet — forventet 1"
-- i POSTFLIGHT ved den anden manuelle kørsel (bekræftet fuldt rollbacket).
-- Listen er nu krydstjekket 1:1 mod den faktiske live-eksport.
-- ============================================================
ALTER TABLE public.ekstraarbejde ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bygherre opretter ekstraarbejde"      ON public.ekstraarbejde;
DROP POLICY IF EXISTS "Haandvaerker opretter ekstraarbejde"  ON public.ekstraarbejde;
DROP POLICY IF EXISTS "Bygherre ser ekstraarbejde"           ON public.ekstraarbejde;
DROP POLICY IF EXISTS "Haandvaerker ser ekstraarbejde"       ON public.ekstraarbejde;
DROP POLICY IF EXISTS "Bygherre godkender ekstraarbejde"     ON public.ekstraarbejde;
DROP POLICY IF EXISTS "Haandvaerker opdaterer ekstraarbejde" ON public.ekstraarbejde;

-- Rollen alene fra email-match er IKKE tilstrækkelig — profiler.rolle er
-- den autoritative rollekilde i hele kodebasen (samme faktiske værdier
-- 'bygherre'/'haandvaerker' som bruges i middleware.ts, kontraktRolle.ts,
-- chat/oversigt m.fl. — ikke gættede). Hver branch kræver derfor BÅDE den
-- korrekte profilrolle OG det eksisterende ejerskabs-/email-kriterie.
CREATE POLICY "Laes egne aftalesedler"
  ON public.ekstraarbejde FOR SELECT
  USING (
    (
      EXISTS (SELECT 1 FROM public.profiler pr WHERE pr.id = auth.uid() AND pr.rolle = 'bygherre')
      AND EXISTS (
        SELECT 1 FROM public.projekter p
        WHERE p.id = ekstraarbejde.projekt_id AND p.bygherre_id = auth.uid()
      )
    )
    OR
    (
      EXISTS (SELECT 1 FROM public.profiler pr WHERE pr.id = auth.uid() AND pr.rolle = 'haandvaerker')
      AND EXISTS (
        SELECT 1 FROM public.kontrakter k
        WHERE k.id = ekstraarbejde.kontrakt_id
          AND k.haandvaerker_email IS NOT NULL
          AND lower(k.haandvaerker_email) = lower(auth.email())
      )
    )
  );

-- Bevidst INGEN INSERT/UPDATE/DELETE-policy for anon/authenticated.
-- Uden en permissive policy nægter RLS som standard alle sådanne writes.
-- Service-rollen (server-routes) omgår RLS og er upåvirket.


-- ============================================================
-- SKEMAÆNDRING 5 — neutral statusmodel
--
-- Erstatter de retningsspecifikke statusnavne "sendt" og
-- "haandvaerker_udfyldt" med neutrale navne, der beskriver hvem der
-- aktuelt skal handle, ikke hvem der oprindeligt oprettede sedlen:
--
--   sendt                 → afventer_entreprenoer
--   haandvaerker_udfyldt  → afventer_bygherre
--   godkendt              → godkendt (uændret)
--   afvist                → afvist (uændret)
--
-- Ingen backfill nødvendig — 0 rækker findes (verificeret i PREFLIGHT).
-- Constraintet droppes og genskabes med samme navn men nyt indhold.
-- ============================================================
ALTER TABLE public.ekstraarbejde
  DROP CONSTRAINT IF EXISTS ekstraarbejde_status_check;

ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_status_check
  CHECK (status IN ('afventer_entreprenoer', 'afventer_bygherre', 'godkendt', 'afvist'));


-- ============================================================
-- SKEMAÆNDRING 6 — korrekt prismodel (fast pris / medgået tid)
--
-- AB-Forbruger 2012 kender kun to reelle prisformer i denne sammenhæng —
-- fast pris og medgået tid. "overslag" var fejlagtigt modelleret som en
-- selvstændig pris_type; det er reelt et valgfrit, særskilt beløb, der
-- kan følge en medgået-tid-aftale (relevant for AB-Forbruger § 24's
-- 15 %-regel, som IKKE implementeres her). haandvaerker_pris beholder sin
-- betydning uændret: den konkrete, samlede FASTE pris. Den må forblive
-- NULL ved medgået tid — der tvinges ikke et opdigtet slutbeløb frem.
--
-- VIGTIGT — to adskilte kolonner, to adskilte constraints:
-- Det LEGACY-felt "pris_type" (fra den oprindelige supabase_migration.sql)
-- har sin EGEN, uændrede constraint "ekstraarbejde_pris_type_check"
-- (CHECK pris_type IN ('fast','overslag')) — det navn er allerede i brug
-- i produktion og røres IKKE her. Det er "haandvaerker_pris_type" (fra
-- v2-migrationen), der får en ny prismodel i denne opgave, og den
-- kolonnes egen, oprindelige inline CHECK (formodet auto-navngivet af
-- Postgres til "ekstraarbejde_haandvaerker_pris_type_check", men findes
-- og droppes her dynamisk via pg_constraint/pg_attribute — IKKE et
-- gættet navn) er en helt anden constraint end pris_type's.
--
-- Et tidligere forsøg brugte fejlagtigt navnet
-- "ekstraarbejde_pris_type_check" til den NYE haandvaerker_pris_type-
-- constraint, hvilket kolliderede med legacy-constrainten på pris_type
-- (ERROR 42710) og udløste et bekræftet, fuldt rollbacket forsøg. Den
-- nye constraint hedder derfor nu "ekstraarbejde_haandvaerker_pris_type_check"
-- — et navn, der (hvis det er identisk med kolonnens oprindelige
-- auto-genererede navn) allerede er tømt af den dynamiske DROP-løkke
-- ovenfor, inden denne ADD CONSTRAINT køres, og derfor ikke kolliderer.
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND att.attname = 'haandvaerker_pris_type' AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.ekstraarbejde DROP CONSTRAINT %I', r.conname);
  END LOOP;
END;
$$;

ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_haandvaerker_pris_type_check
  CHECK (haandvaerker_pris_type IS NULL OR haandvaerker_pris_type IN ('fast', 'medgaaet_tid'));

ALTER TABLE public.ekstraarbejde
  ADD COLUMN haandvaerker_timepris DECIMAL(10,2),
  ADD COLUMN haandvaerker_prisoverslag DECIMAL(10,2),
  ADD COLUMN materiale_afregning TEXT,
  ADD COLUMN materiale_tillaeg_procent DECIMAL(5,2);

ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_haandvaerker_timepris_check
  CHECK (haandvaerker_timepris IS NULL OR haandvaerker_timepris >= 0);

ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_haandvaerker_prisoverslag_check
  CHECK (haandvaerker_prisoverslag IS NULL OR haandvaerker_prisoverslag >= 0);

ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_materiale_afregning_check
  CHECK (materiale_afregning IS NULL OR materiale_afregning IN ('inkluderet', 'dokumenteret_pris', 'dokumenteret_pris_med_tillaeg'));

-- Intet arbitrært produktmæssigt loft på tillægsprocenten — kun ikke-negativ.
ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_materiale_tillaeg_procent_check
  CHECK (materiale_tillaeg_procent IS NULL OR materiale_tillaeg_procent >= 0);

-- Tillæg er kun obligatorisk, når materialeafregningen faktisk kræver det.
ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_materiale_tillaeg_paakraevet_check
  CHECK (materiale_afregning IS DISTINCT FROM 'dokumenteret_pris_med_tillaeg' OR materiale_tillaeg_procent IS NOT NULL);


-- ============================================================
-- SKEMAÆNDRING 7 — ekstraarbejde_billeder
--
-- Knytter uploadede billeder til en aftaleseddel. storage_path er den
-- permanente reference i den private "aftalesedler"-bucket (aldrig en
-- URL — signerede URLs udstedes on-demand og gemmes aldrig). UNIQUE på
-- storage_path understøtter immutabilitet: samme sti kan aldrig
-- genbruges til et andet billede. uploaded_by peger på samme
-- profil-model som ekstraarbejde.oprettet_af. ON DELETE CASCADE fra
-- ekstraarbejde_id er valgt, fordi der ikke findes nogen normal
-- brugerflow, der sletter en enkelt ekstraarbejde-række uden at slette
-- hele projektet — billedmetadata bør ikke efterlades løsrevet, hvis
-- den sag, de dokumenterer, forsvinder.
-- ============================================================
CREATE TABLE public.ekstraarbejde_billeder (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ekstraarbejde_id UUID NOT NULL REFERENCES public.ekstraarbejde(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  uploaded_by UUID NOT NULL REFERENCES public.profiler(id),
  billedtekst TEXT,
  mime_type TEXT,
  filstoerrelse_bytes BIGINT,
  oprettet_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ekstraarbejde_billeder_ekstraarbejde_id
  ON public.ekstraarbejde_billeder(ekstraarbejde_id);

ALTER TABLE public.ekstraarbejde_billeder ENABLE ROW LEVEL SECURITY;

-- Samme adgangsprincip som ekstraarbejde selv: bygherre via
-- projektejerskab, entreprenør via verificeret login-email mod
-- kontraktens haandvaerker_email. Bevidst INGEN INSERT/UPDATE/DELETE-
-- policy — alle writes sker via service-rollen fra autoritative
-- server-routes.
-- Samme rollekrav som ekstraarbejde selv — se begrundelse ovenfor.
CREATE POLICY "Laes billeder for egne aftalesedler"
  ON public.ekstraarbejde_billeder FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ekstraarbejde e
      JOIN public.kontrakter k ON k.id = e.kontrakt_id
      WHERE e.id = ekstraarbejde_billeder.ekstraarbejde_id
        AND (
          (
            EXISTS (SELECT 1 FROM public.profiler pr WHERE pr.id = auth.uid() AND pr.rolle = 'bygherre')
            AND EXISTS (SELECT 1 FROM public.projekter p WHERE p.id = e.projekt_id AND p.bygherre_id = auth.uid())
          )
          OR
          (
            EXISTS (SELECT 1 FROM public.profiler pr WHERE pr.id = auth.uid() AND pr.rolle = 'haandvaerker')
            AND (k.haandvaerker_email IS NOT NULL AND lower(k.haandvaerker_email) = lower(auth.email()))
          )
        )
    )
  );


-- ============================================================
-- SKEMAÆNDRING 8 — database privileges som ekstra forsvar
--
-- Vi har ikke fuldt verificeret alle faktiske live RLS policy-navne på
-- ekstraarbejde (kun lokale filer, som ikke er autoritative — se
-- analysen i denne opgaves rapport). Sikkerhedsgarantien skal derfor
-- IKKE hvile alene på DROP POLICY IF EXISTS <kendte navne> ovenfor.
-- REVOKE fjerner selve skriverettigheden på rolleniveau, uafhængigt af
-- hvilke policies der måtte eksistere eller mangle. Service-rollen
-- (brugt af alle autoritative server-routes) er upåvirket af REVOKE på
-- anon/authenticated.
-- ============================================================
REVOKE INSERT, UPDATE, DELETE ON public.ekstraarbejde FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.ekstraarbejde_billeder FROM anon, authenticated;


-- ============================================================
-- SKEMAÆNDRING 9 — privat Storage-bucket "aftalesedler"
--
-- Isoleret fra den eksisterende "billeder"-bucket (bruges af Mangler),
-- så denne ændring ikke kan påvirke det eksisterende flow.
-- file_size_limit sat til 20 MB — langt over hvad den eksisterende
-- BilledAnnotering nogensinde producerer (canvas skaleret til maks
-- 800px bredde, JPEG-kvalitet 0,85), men uden at pålægge en kunstig
-- lavere teknisk grænse. allowed_mime_types begrænset til 'image/jpeg',
-- det eneste format annoteringsværktøjet outputter — Storage afviser
-- derved upload af andre filtyper på infrastrukturniveau, uafhængigt af
-- applikationskodens egen validering.
--
-- Bevidst INGEN policies på storage.objects for denne bucket. Al
-- adgang (upload og læsning) sker via serverudstedte, kortlivede
-- signed URLs fra service-rollen — hverken anon eller authenticated
-- har nogen direkte adgang til bucket'en.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('aftalesedler', 'aftalesedler', false, 20971520, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SKEMAÆNDRING 10 — atomisk oprettelse af aftaleseddel + billedmetadata
--
-- Samme mønster som det eksisterende public.opret_besigtigelsesrunde:
-- én PL/pgSQL-funktion, der indsætter forælder- og børnerækker i én
-- transaktion. Fejler indsættelsen af et billede (fx en constraint-
-- overtrædelse), ruller Postgres automatisk hele funktionens effekt
-- tilbage, inklusive den allerede indsatte ekstraarbejde-række — der
-- kan aldrig opstå en halv-oprettet aftaleseddel.
--
-- SECURITY INVOKER (ikke DEFINER): funktionen kaldes udelukkende af
-- service-rollen, som allerede omgår RLS. INVOKER undgår den unødvendige
-- privilegie-eskalering en DEFINER-funktion ville indebære, uden at
-- miste noget her.
--
-- Funktionen validerer kun det, der IKKE allerede håndhæves af tabellens
-- egne CHECK-constraints (status-værdi, ikke-tom beskrivelse, gyldigt
-- billeder-JSON) — den er bevidst tynd, fordi den reelle autorisation og
-- feltvalidering allerede er foretaget i Next.js-routen FØR kaldet, og
-- fordi CHECK-constraints ovenfor allerede er den anden forsvarslinje
-- for selve prismodellen.
--
-- oprettet_at på ekstraarbejde_billeder sættes IKKE som parameter — den
-- har DEFAULT now() på tabellen og er dermed altid database-genereret.
-- uploaded_by sættes til p_oprettet_af (samme verificerede bruger, der
-- opretter selve aftalesedlen) — aldrig fra billeddataene selv.
-- ============================================================
CREATE OR REPLACE FUNCTION public.opret_ekstraarbejde_med_billeder(
  p_projekt_id UUID,
  p_kontrakt_id UUID,
  p_oprettet_af UUID,
  p_oprettet_af_navn TEXT,
  p_beskrivelse TEXT,
  p_status TEXT,
  p_haandvaerker_pris_type TEXT DEFAULT NULL,
  p_haandvaerker_pris NUMERIC DEFAULT NULL,
  p_haandvaerker_timepris NUMERIC DEFAULT NULL,
  p_materiale_afregning TEXT DEFAULT NULL,
  p_materiale_tillaeg_procent NUMERIC DEFAULT NULL,
  p_haandvaerker_prisoverslag NUMERIC DEFAULT NULL,
  p_haandvaerker_tidsdage INTEGER DEFAULT NULL,
  p_haandvaerker_besked TEXT DEFAULT NULL,
  p_haandvaerker_navn TEXT DEFAULT NULL,
  p_haandvaerker_udfyldt_at TIMESTAMPTZ DEFAULT NULL,
  p_billeder JSONB DEFAULT NULL
)
RETURNS public.ekstraarbejde
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_row public.ekstraarbejde;
  v_item JSONB;
BEGIN
  -- Defense-in-depth — reel autorisation og feltvalidering er allerede
  -- foretaget i Next.js-routen (verificerKontraktRolle + verificerBilleder)
  -- før dette RPC-kald.
  IF p_beskrivelse IS NULL OR btrim(p_beskrivelse) = '' THEN
    RAISE EXCEPTION 'beskrivelse er påkrævet';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('afventer_entreprenoer', 'afventer_bygherre') THEN
    RAISE EXCEPTION 'Ugyldig status: %', p_status;
  END IF;

  IF p_billeder IS NOT NULL AND jsonb_typeof(p_billeder) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'billeder skal være et JSON-array';
  END IF;

  INSERT INTO public.ekstraarbejde (
    projekt_id, kontrakt_id, oprettet_af, oprettet_af_navn, beskrivelse, status,
    pris_type, pris,
    haandvaerker_pris_type, haandvaerker_pris, haandvaerker_timepris,
    materiale_afregning, materiale_tillaeg_procent, haandvaerker_prisoverslag,
    haandvaerker_tidsdage, haandvaerker_besked, haandvaerker_navn, haandvaerker_udfyldt_at
  ) VALUES (
    p_projekt_id, p_kontrakt_id, p_oprettet_af, p_oprettet_af_navn, p_beskrivelse, p_status,
    'fast', 0,
    p_haandvaerker_pris_type, p_haandvaerker_pris, p_haandvaerker_timepris,
    p_materiale_afregning, p_materiale_tillaeg_procent, p_haandvaerker_prisoverslag,
    p_haandvaerker_tidsdage, p_haandvaerker_besked, p_haandvaerker_navn, p_haandvaerker_udfyldt_at
  )
  RETURNING * INTO v_row;

  IF p_billeder IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_billeder) LOOP
      IF NOT (v_item ? 'storage_path') OR jsonb_typeof(v_item -> 'storage_path') IS DISTINCT FROM 'string' THEN
        RAISE EXCEPTION 'Hvert billede skal have en storage_path';
      END IF;

      INSERT INTO public.ekstraarbejde_billeder (
        ekstraarbejde_id, storage_path, uploaded_by, billedtekst, mime_type, filstoerrelse_bytes
      ) VALUES (
        v_row.id,
        v_item ->> 'storage_path',
        p_oprettet_af,
        v_item ->> 'billedtekst',
        v_item ->> 'mime_type',
        NULLIF(v_item ->> 'filstoerrelse_bytes', '')::BIGINT
      );
    END LOOP;
  END IF;

  RETURN v_row;
END;
$$;

-- Mindst privilegeret model — CREATE FUNCTION giver som Postgres-standard
-- EXECUTE til PUBLIC. Uden det eksplicitte REVOKE nedenfor ville enhver
-- med den offentlige anon-nøgle kunne kalde funktionen direkte via
-- PostgREST, uden om Next.js-routens Bearer JWT + verificerKontraktRolle.
REVOKE ALL ON FUNCTION public.opret_ekstraarbejde_med_billeder(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TIMESTAMPTZ, JSONB
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.opret_ekstraarbejde_med_billeder(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TIMESTAMPTZ, JSONB
) FROM anon;

REVOKE ALL ON FUNCTION public.opret_ekstraarbejde_med_billeder(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TIMESTAMPTZ, JSONB
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.opret_ekstraarbejde_med_billeder(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TIMESTAMPTZ, JSONB
) TO service_role;


-- ============================================================
-- POSTFLIGHT
-- ============================================================
DO $$
DECLARE
  v_col_nullable    TEXT;
  v_col_data_type   TEXT;
  v_fk_delete_rule  TEXT;
  v_antal_efter     BIGINT;
  v_write_policies  INT;
  v_select_policies INT;
BEGIN

  -- 1. Kolonne findes, er UUID og NOT NULL
  SELECT data_type, is_nullable INTO v_col_data_type, v_col_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'ekstraarbejde' AND column_name = 'kontrakt_id';

  IF v_col_data_type IS NULL THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: kontrakt_id blev ikke oprettet.';
  END IF;
  IF v_col_data_type != 'uuid' THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: kontrakt_id har typen "%", forventet uuid.', v_col_data_type;
  END IF;
  IF v_col_nullable != 'NO' THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: kontrakt_id er nullable — forventet NOT NULL.';
  END IF;

  -- 2. Foreign key findes, peger på kontrakter, med RESTRICT
  SELECT rc.delete_rule INTO v_fk_delete_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc
    ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
  WHERE rc.constraint_name = 'fk_ekstraarbejde_kontrakt_id'
    AND tc.table_schema = 'public' AND tc.table_name = 'ekstraarbejde';

  IF v_fk_delete_rule IS NULL THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Foreign key "fk_ekstraarbejde_kontrakt_id" ikke fundet.';
  END IF;
  IF v_fk_delete_rule != 'RESTRICT' THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: fk_ekstraarbejde_kontrakt_id har delete-regel "%", forventet RESTRICT.', v_fk_delete_rule;
  END IF;

  -- 3. Index findes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND indexname = 'idx_ekstraarbejde_kontrakt_id'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Index "idx_ekstraarbejde_kontrakt_id" ikke fundet.';
  END IF;

  -- 4. Rækkeantal fortsat 0 — ingen data må være tilføjet af migrationen selv
  SELECT COUNT(*) INTO v_antal_efter FROM public.ekstraarbejde;
  IF v_antal_efter != 0 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: public.ekstraarbejde har % rækker efter migrationen, forventet 0.', v_antal_efter;
  END IF;

  -- 5. Ingen INSERT/UPDATE/DELETE-policies må findes for almindelige roller
  SELECT COUNT(*) INTO v_write_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND cmd IN ('INSERT', 'UPDATE', 'DELETE');

  IF v_write_policies != 0 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: % INSERT/UPDATE/DELETE-policies fundet på ekstraarbejde — forventet 0.', v_write_policies;
  END IF;

  -- 6. Præcis én SELECT-policy må findes
  SELECT COUNT(*) INTO v_select_policies
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND cmd = 'SELECT';

  IF v_select_policies != 1 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: % SELECT-policies fundet på ekstraarbejde — forventet 1.', v_select_policies;
  END IF;

  -- 6b. SELECT-policyen skal reelt kræve profiler.rolle for begge parter —
  --     ikke kun email-/ejerskabsmatch. Tekstuel kontrol af policy-
  --     definitionen (qual) er den mest robuste kontrol muligt uden at
  --     eksekvere test-queries mod rigtige brugerdata i en migration, der
  --     ikke må køre nogen SQL mod produktionsindhold.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND cmd = 'SELECT'
      AND qual LIKE '%profiler%'
      AND qual LIKE '%''bygherre''%'
      AND qual LIKE '%''haandvaerker''%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: SELECT-policyen på ekstraarbejde kræver ikke tydeligvis profiler.rolle for begge parter.';
  END IF;

  -- 6c. Den ene SELECT-policy skal specifikt være den nye, navngivne
  --     "Laes egne aftalesedler" — ikke en tilfældig anden policy, der
  --     tilfældigvis også opfylder 6b's tekstlige kriterier.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND cmd = 'SELECT'
      AND policyname = 'Laes egne aftalesedler'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Den eneste SELECT-policy på ekstraarbejde hedder ikke "Laes egne aftalesedler".';
  END IF;

  -- 6d. Policyen skal konkret indeholde både kontrakt/email-match for
  --     håndværkeren og projektejerskab for bygherren — ikke kun rolle-
  --     litteralerne alene.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde' AND cmd = 'SELECT'
      AND qual LIKE '%haandvaerker_email%'
      AND qual LIKE '%bygherre_id%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: SELECT-policyen mangler enten kontrakt/email-match for håndværkeren eller projektejerskab for bygherren.';
  END IF;

  -- 6e. Ingen af de seks faktiske, live-eksporterede legacy-policy-navne
  --     må findes på ekstraarbejde efter migrationen — eksplicit
  --     navnebaseret kontrol, uafhængig af ovenstående tælle-/indholds-
  --     tjek, som direkte adresserer den fejl, det andet migrationsforsøg
  --     ramte (en glemt legacy-policy overlevede stille).
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde'
      AND policyname IN (
        'Bygherre opretter ekstraarbejde',
        'Haandvaerker opretter ekstraarbejde',
        'Bygherre ser ekstraarbejde',
        'Haandvaerker ser ekstraarbejde',
        'Bygherre godkender ekstraarbejde',
        'Haandvaerker opdaterer ekstraarbejde'
      )
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Mindst én af de seks kendte legacy-policies findes fortsat på ekstraarbejde.';
  END IF;

  -- 7. status-constraint tillader den nye model og ikke de gamle navne
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc
      ON tc.constraint_name = cc.constraint_name AND tc.table_schema = cc.constraint_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'ekstraarbejde'
      AND cc.constraint_name = 'ekstraarbejde_status_check'
      AND cc.check_clause LIKE '%afventer_entreprenoer%'
      AND cc.check_clause LIKE '%afventer_bygherre%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: ekstraarbejde_status_check indeholder ikke de nye statusværdier.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc
      ON tc.constraint_name = cc.constraint_name AND tc.table_schema = cc.constraint_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'ekstraarbejde'
      AND cc.constraint_name = 'ekstraarbejde_status_check'
      AND (cc.check_clause LIKE '%''sendt''%' OR cc.check_clause LIKE '%haandvaerker_udfyldt%')
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: ekstraarbejde_status_check tillader fortsat de gamle statusnavne.';
  END IF;

  -- 7b. Præcis én CHECK-constraint må findes på status-kolonnen efter
  --     migrationen — bekræfter at PREFLIGHT 6b's antagelse fortsat holdt.
  IF (
    SELECT COUNT(*)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND att.attname = 'status' AND con.contype = 'c'
  ) != 1 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Der findes ikke præcis 1 CHECK-constraint på ekstraarbejde.status efter migrationen.';
  END IF;

  -- 8. NY MODEL: haandvaerker_pris_type tillader kun den nye model
  --    (fast / medgaaet_tid / NULL) — opslag er kolonnebaseret, ikke kun
  --    på det (nu korrekte, entydige) constraintnavn alene.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND att.attname = 'haandvaerker_pris_type' AND con.contype = 'c'
      AND con.conname = 'ekstraarbejde_haandvaerker_pris_type_check'
      AND pg_get_constraintdef(con.oid) LIKE '%medgaaet_tid%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: ekstraarbejde_haandvaerker_pris_type_check indeholder ikke den nye prismodel.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND att.attname = 'haandvaerker_pris_type' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%overslag%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: haandvaerker_pris_type tillader fortsat den gamle "overslag"-værdi.';
  END IF;

  -- 8b. LEGACY: det adskilte "pris_type"-felt og dets constraint
  --     "ekstraarbejde_pris_type_check" skal forblive fuldstændig uændret
  --     af denne migration — stadig præcis 'fast'/'overslag', stadig
  --     samme navn. Forveksles ikke med haandvaerker_pris_type ovenfor.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
    WHERE nsp.nspname = 'public' AND rel.relname = 'ekstraarbejde'
      AND att.attname = 'pris_type' AND con.contype = 'c'
      AND con.conname = 'ekstraarbejde_pris_type_check'
      AND pg_get_constraintdef(con.oid) LIKE '%fast%'
      AND pg_get_constraintdef(con.oid) LIKE '%overslag%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Den legacy "ekstraarbejde_pris_type_check" på pris_type er ændret eller forsvundet — den skulle forblive urørt.';
  END IF;

  -- 9. De fire nye prisfelter findes med korrekt type
  IF (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde'
      AND column_name IN ('haandvaerker_timepris', 'haandvaerker_prisoverslag', 'materiale_afregning', 'materiale_tillaeg_procent')
  ) != 4 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Ikke alle fire nye prisfelter blev oprettet.';
  END IF;

  -- 10. ekstraarbejde_billeder findes, med RLS aktiveret og præcis én SELECT-policy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ekstraarbejde_billeder'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: public.ekstraarbejde_billeder blev ikke oprettet.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ekstraarbejde_billeder'
  ) OR NOT (
    SELECT relrowsecurity FROM pg_class WHERE oid = 'public.ekstraarbejde_billeder'::regclass
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: RLS er ikke aktiveret på ekstraarbejde_billeder.';
  END IF;

  IF (
    SELECT COUNT(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde_billeder' AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  ) != 0 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: ekstraarbejde_billeder har uventede INSERT/UPDATE/DELETE-policies.';
  END IF;

  IF (
    SELECT COUNT(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde_billeder' AND cmd = 'SELECT'
  ) != 1 THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: ekstraarbejde_billeder skal have præcis 1 SELECT-policy.';
  END IF;

  -- 10b. Samme rollekrav-kontrol som for ekstraarbejde ovenfor.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ekstraarbejde_billeder' AND cmd = 'SELECT'
      AND qual LIKE '%profiler%'
      AND qual LIKE '%''bygherre''%'
      AND qual LIKE '%''haandvaerker''%'
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: SELECT-policyen på ekstraarbejde_billeder kræver ikke tydeligvis profiler.rolle for begge parter.';
  END IF;

  -- 11. storage-bucket "aftalesedler" findes, er privat, og har de rette grænser
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'aftalesedler' AND public = false AND file_size_limit = 20971520
      AND allowed_mime_types = ARRAY['image/jpeg']
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: storage-bucket "aftalesedler" mangler eller har forkert konfiguration.';
  END IF;

  -- 12. den eksisterende "billeder"-bucket er urørt
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'billeder' AND public = false) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Den eksisterende "billeder"-bucket ser ud til at være ændret. Stop og verificér manuelt.';
  END IF;

  -- 13. Ingen policies på storage.objects må målrette "aftalesedler"-bucket'en
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual LIKE '%aftalesedler%' OR with_check LIKE '%aftalesedler%')
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: Der findes uventede storage.objects-policies for "aftalesedler".';
  END IF;

  -- 14. INSERT/UPDATE/DELETE er reelt frataget anon/authenticated
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name IN ('ekstraarbejde', 'ekstraarbejde_billeder')
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: anon/authenticated har fortsat INSERT/UPDATE/DELETE-rettigheder på ekstraarbejde eller ekstraarbejde_billeder.';
  END IF;

  -- 15. RPC-funktionen findes, med SECURITY INVOKER
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'opret_ekstraarbejde_med_billeder'
      AND p.prosecdef = false
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: public.opret_ekstraarbejde_med_billeder blev ikke oprettet med SECURITY INVOKER.';
  END IF;

  -- 16. EXECUTE må IKKE være tilgængeligt for PUBLIC, anon eller authenticated
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'opret_ekstraarbejde_med_billeder'
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
        OR has_function_privilege('public', p.oid, 'EXECUTE')
      )
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: anon/authenticated/public har fortsat EXECUTE på opret_ekstraarbejde_med_billeder.';
  END IF;

  -- 17. EXECUTE skal være givet til service_role
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'opret_ekstraarbejde_med_billeder'
      AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'POSTFLIGHT FEJL: service_role har ikke EXECUTE på opret_ekstraarbejde_med_billeder.';
  END IF;

  RAISE NOTICE 'POSTFLIGHT OK: kontrakt_id, foreign key, index, RLS-policies, statusmodel, prismodel, ekstraarbejde_billeder, storage-bucket, RPC-privileges og privileges verificeret.';

END;
$$;


COMMIT;


-- ============================================================
-- ROLLBACK-VEJLEDNING (inaktiv — kun til manuel reference)
--
-- Rollback må KUN udføres med særskilt godkendelse.
--
-- Rækkefølge:
--
--   1. Genskab de gamle policies (se supabase-migration-rls-og-tabeller.sql
--      og supabase-migration-ekstraarbejde-v2.sql for den tidligere ordlyd),
--      eller accepter midlertidigt ingen klient-skriveadgang.
--
--   2. Drop den nye SELECT-policy:
--      DROP POLICY IF EXISTS "Laes egne aftalesedler" ON public.ekstraarbejde;
--
--   3. Drop index:
--      DROP INDEX IF EXISTS public.idx_ekstraarbejde_kontrakt_id;
--
--   4. Drop foreign key:
--      ALTER TABLE public.ekstraarbejde DROP CONSTRAINT IF EXISTS fk_ekstraarbejde_kontrakt_id;
--
--   5. Drop kolonnen:
--      ALTER TABLE public.ekstraarbejde DROP COLUMN IF EXISTS kontrakt_id;
--
--   6. Genskab den gamle status-constraint (kun sikkert hvis ingen rækker
--      har fået de nye statusværdier endnu):
--      ALTER TABLE public.ekstraarbejde DROP CONSTRAINT IF EXISTS ekstraarbejde_status_check;
--      ALTER TABLE public.ekstraarbejde ADD CONSTRAINT ekstraarbejde_status_check
--        CHECK (status IN ('sendt', 'haandvaerker_udfyldt', 'godkendt', 'afvist'));
--
--   7. Drop de nye prisfelter og constraints, og genskab den gamle
--      pris_type-CHECK (kun sikkert hvis ingen rækker bruger 'medgaaet_tid'):
--      ALTER TABLE public.ekstraarbejde
--        DROP CONSTRAINT IF EXISTS ekstraarbejde_materiale_tillaeg_paakraevet_check,
--        DROP CONSTRAINT IF EXISTS ekstraarbejde_materiale_tillaeg_procent_check,
--        DROP CONSTRAINT IF EXISTS ekstraarbejde_materiale_afregning_check,
--        DROP CONSTRAINT IF EXISTS ekstraarbejde_haandvaerker_prisoverslag_check,
--        DROP CONSTRAINT IF EXISTS ekstraarbejde_haandvaerker_timepris_check,
--        DROP CONSTRAINT IF EXISTS ekstraarbejde_haandvaerker_pris_type_check,
--        DROP COLUMN IF EXISTS materiale_tillaeg_procent,
--        DROP COLUMN IF EXISTS materiale_afregning,
--        DROP COLUMN IF EXISTS haandvaerker_prisoverslag,
--        DROP COLUMN IF EXISTS haandvaerker_timepris;
--      ALTER TABLE public.ekstraarbejde ADD CONSTRAINT ekstraarbejde_haandvaerker_pris_type_check
--        CHECK (haandvaerker_pris_type IN ('fast', 'overslag'));
--
-- Trin 5 er destruktivt og irreversibelt, hvis der i mellemtiden er
-- oprettet aftalesedler, der afhænger af kontrakt_id. Trin 6 og 7 vil
-- fejle, hvis der allerede findes rækker med de nye status- eller
-- prisværdier.
--
--   8. Genopret INSERT/UPDATE/DELETE til anon/authenticated (kun hvis
--      det oprindelige, faktiske privilegie-niveau kræver det — ikke
--      antaget her):
--      GRANT INSERT, UPDATE, DELETE ON public.ekstraarbejde TO authenticated;
--
--   9. Drop ekstraarbejde_billeder (destruktivt — sletter al
--      billedmetadata, men rører ikke selve Storage-objekterne):
--      DROP TABLE IF EXISTS public.ekstraarbejde_billeder;
--
--   10. Fjern storage-bucket "aftalesedler" (kun hvis den er tom —
--       sletter IKKE eventuelle uploadede filer automatisk):
--       DELETE FROM storage.buckets WHERE id = 'aftalesedler';
--
-- Trin 9 og 10 er destruktive og irreversible, hvis der i mellemtiden
-- er uploadet billeder, der afhænger af dem.
--
--   11. Drop RPC-funktionen (skal ske før trin 9, hvis begge udføres,
--       da funktionen selv ikke afhænger af tabellen på en måde der
--       kræver særlig rækkefølge, men ryddes op samlet):
--       DROP FUNCTION IF EXISTS public.opret_ekstraarbejde_med_billeder(
--         UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TIMESTAMPTZ, JSONB
--       );
-- ============================================================
