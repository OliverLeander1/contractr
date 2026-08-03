-- supabase-migration-rls-midlertidig-sikkerhed.sql
--
-- FORMÅL: Midlertidig RLS-sikkerhedsrettelse — projektbaseret isolation
--
-- PROBLEM: Syv eksisterende entrepreneurpolicies bruger en fejlagtig
-- selv-sammenligning (k.projekt_id = k.projekt_id) og én projects-policy
-- bruger (k.projekt_id = k.id::text), begge altid sande. En INSERT-policy
-- på notifikationer tillader enhver authenticated bruger at indsætte
-- notifikationer til vilkårlige bruger_id-værdier. To INSERT-policies
-- mangler tilstrækkelig ejerskabsverificering.
--
-- MIDLERTIDIG BEGRÆNSNING: Denne migration bruger projekt_id til isolation.
-- Det betyder at to entrepreneurs under samme projekt kan se hinandens
-- betalinger, mangler og ekstraarbejde. Endelig kontrakt-niveau isolation
-- kræver kontrakt_id på disse tabeller og sker i en separat fase.
--
-- TYPENOTAT: kontrakter.projekt_id er TEXT i produktion.
-- betalinger.projekt_id, mangler.projekt_id, ekstraarbejde.projekt_id og
-- chat_samtaler.projekt_id er UUID. Sammenligninger caster UUID til TEXT:
--   k.projekt_id = <tabel>.projekt_id::text
--
-- SKEMAÆNDRINGER: Ingen. Kun policies ændres.
-- DATAÆNDRINGER: Ingen.
-- GRANTS: Uændrede.
--
-- Kør i Supabase Dashboard → SQL Editor → New query

BEGIN;

-- ============================================================
-- PREFLIGHT: Kontrollér præcist at alle 11 forventede policies
-- eksisterer med korrekt skema, tabel, navn og kommando — og
-- præcis én gang. Fejler og ruller tilbage ved ethvert afvigelse.
-- Kontrollerer også at det nye policynavn ikke allerede eksisterer.
-- ============================================================
DO $$
DECLARE
  fejl TEXT := '';
BEGIN
  -- Kontrol: præcis 1 forekomst pr. forventet policy (navn + tabel + skema + kommando)
  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'betalinger'     AND policyname = 'Haandvaerker markerer betaling'        AND cmd = 'UPDATE') != 1
    THEN fejl := fejl || E'\n  betalinger/UPDATE/"Haandvaerker markerer betaling" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'betalinger'     AND policyname = 'Haandvaerker ser betalinger'            AND cmd = 'SELECT') != 1
    THEN fejl := fejl || E'\n  betalinger/SELECT/"Haandvaerker ser betalinger" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mangler'        AND policyname = 'Haandvaerker opdaterer mangler'          AND cmd = 'UPDATE') != 1
    THEN fejl := fejl || E'\n  mangler/UPDATE/"Haandvaerker opdaterer mangler" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mangler'        AND policyname = 'Haandvaerker ser mangler'                AND cmd = 'SELECT') != 1
    THEN fejl := fejl || E'\n  mangler/SELECT/"Haandvaerker ser mangler" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ekstraarbejde'  AND policyname = 'Haandvaerker opdaterer ekstraarbejde'    AND cmd = 'UPDATE') != 1
    THEN fejl := fejl || E'\n  ekstraarbejde/UPDATE/"Haandvaerker opdaterer ekstraarbejde" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ekstraarbejde'  AND policyname = 'Haandvaerker opretter ekstraarbejde'     AND cmd = 'INSERT') != 1
    THEN fejl := fejl || E'\n  ekstraarbejde/INSERT/"Haandvaerker opretter ekstraarbejde" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ekstraarbejde'  AND policyname = 'Haandvaerker ser ekstraarbejde'          AND cmd = 'SELECT') != 1
    THEN fejl := fejl || E'\n  ekstraarbejde/SELECT/"Haandvaerker ser ekstraarbejde" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifikationer' AND policyname = 'Haandvaerker sender notifikation'        AND cmd = 'INSERT') != 1
    THEN fejl := fejl || E'\n  notifikationer/INSERT/"Haandvaerker sender notifikation" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projekter'      AND policyname = 'Haandvaerker ser projekt via kontrakt'   AND cmd = 'SELECT') != 1
    THEN fejl := fejl || E'\n  projekter/SELECT/"Haandvaerker ser projekt via kontrakt" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mangler'        AND policyname = 'Bygherre opretter mangler'               AND cmd = 'INSERT') != 1
    THEN fejl := fejl || E'\n  mangler/INSERT/"Bygherre opretter mangler" (forventet præcis 1 forekomst)'; END IF;

  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_samtaler'  AND policyname = 'Bygherre opretter samtaler'              AND cmd = 'INSERT') != 1
    THEN fejl := fejl || E'\n  chat_samtaler/INSERT/"Bygherre opretter samtaler" (forventet præcis 1 forekomst)'; END IF;

  -- Kontrol: det nye policynavn må ikke allerede eksistere
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifikationer'
      AND policyname = 'Bruger indsætter egne notifikationer'
  ) THEN fejl := fejl || E'\n  notifikationer/"Bruger indsætter egne notifikationer" eksisterer allerede — migrationen er muligvis kørt før'; END IF;

  IF fejl <> '' THEN
    RAISE EXCEPTION
      E'PREFLIGHT FEJLEDE — produktion afviger fra det forventede:%\n'
      'Kontrollér policynavne, kommandotyper og antal i Supabase. Ingen ændringer er foretaget.',
      fejl;
  END IF;
END;
$$;

-- ============================================================
-- DROP: Præcise navne fra produktionsaudit M8
-- Ingen DROP POLICY IF EXISTS — preflight garanterer eksistens
-- ============================================================
DROP POLICY "Haandvaerker markerer betaling"       ON public.betalinger;
DROP POLICY "Haandvaerker ser betalinger"           ON public.betalinger;
DROP POLICY "Haandvaerker opdaterer mangler"        ON public.mangler;
DROP POLICY "Haandvaerker ser mangler"              ON public.mangler;
DROP POLICY "Haandvaerker opdaterer ekstraarbejde"  ON public.ekstraarbejde;
DROP POLICY "Haandvaerker opretter ekstraarbejde"   ON public.ekstraarbejde;
DROP POLICY "Haandvaerker ser ekstraarbejde"        ON public.ekstraarbejde;
DROP POLICY "Haandvaerker sender notifikation"      ON public.notifikationer;
DROP POLICY "Haandvaerker ser projekt via kontrakt" ON public.projekter;
DROP POLICY "Bygherre opretter mangler"             ON public.mangler;
DROP POLICY "Bygherre opretter samtaler"            ON public.chat_samtaler;

-- ============================================================
-- BETALINGER
-- Midlertidig: projektbaseret isolation via kontrakter
-- ============================================================

-- Entrepreneur ser betalinger for projekter med matchende kontrakt
CREATE POLICY "Haandvaerker ser betalinger"
  ON public.betalinger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = betalinger.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

-- Entrepreneur kan markere betalinger for egne projekter
-- USING: må kun opdatere rækker der tilhører eget projekt
-- WITH CHECK: ny rækketilstand skal fortsat tilhøre eget projekt
CREATE POLICY "Haandvaerker markerer betaling"
  ON public.betalinger
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = betalinger.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = betalinger.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

-- ============================================================
-- MANGLER
-- Midlertidig: projektbaseret isolation via kontrakter
-- ============================================================

CREATE POLICY "Haandvaerker ser mangler"
  ON public.mangler
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = mangler.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

CREATE POLICY "Haandvaerker opdaterer mangler"
  ON public.mangler
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = mangler.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = mangler.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

-- Bygherre opretter mangler — nu med obligatorisk projekttilhørsverificering
-- Tidligere: kun auth.uid() = oprettet_af uden projektkontrol
CREATE POLICY "Bygherre opretter mangler"
  ON public.mangler
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = mangler.oprettet_af
    AND EXISTS (
      SELECT 1 FROM public.projekter p
      WHERE p.id = mangler.projekt_id
        AND p.bygherre_id = auth.uid()
    )
  );

-- ============================================================
-- EKSTRAARBEJDE
-- Midlertidig: projektbaseret isolation via kontrakter
-- ============================================================

CREATE POLICY "Haandvaerker ser ekstraarbejde"
  ON public.ekstraarbejde
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = ekstraarbejde.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

-- Entrepreneur opretter ekstraarbejde for eget projekt
-- auth.uid() = oprettet_af: brugeren opretter som sig selv
-- EXISTS: bekræfter at email matcher en kontrakt på projektet
CREATE POLICY "Haandvaerker opretter ekstraarbejde"
  ON public.ekstraarbejde
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = ekstraarbejde.oprettet_af
    AND EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = ekstraarbejde.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

CREATE POLICY "Haandvaerker opdaterer ekstraarbejde"
  ON public.ekstraarbejde
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = ekstraarbejde.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = ekstraarbejde.projekt_id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

-- ============================================================
-- PROJEKTER
-- Rettelse: k.projekt_id = k.id::text → k.projekt_id = projekter.id::text
-- ============================================================

CREATE POLICY "Haandvaerker ser projekt via kontrakt"
  ON public.projekter
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = projekter.id::text
        AND lower(k.haandvaerker_email) = lower(auth.email())
    )
  );

-- ============================================================
-- NOTIFIKATIONER
--
-- Analyse af alle INSERT-operationer til public.notifikationer:
--
--   1. src/app/api/ab-notifikationer/route.ts:51
--      createClient(url, SUPABASE_SERVICE_ROLE_KEY) → SERVICE ROLE
--      Ikke underlagt RLS. Upåvirket af denne ændring.
--
--   2. src/app/projekt/[id]/ekstraarbejde/page.tsx:120
--      createClient() fra @/lib/supabase → BROWSER CLIENT med anon-key
--      Kører med brugerens JWT. Er underlagt RLS.
--      Indsætter: { bruger_id: userId, projekt_id: id, ... }
--      userId er auth.uid() på det tidspunkt.
--
-- Konklusion: Den client-side INSERT indsætter altid bruger_id = auth.uid().
-- Ny policy: brugere må kun indsætte notifikationer med eget bruger_id.
-- ============================================================

CREATE POLICY "Bruger indsætter egne notifikationer"
  ON public.notifikationer
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bruger_id = auth.uid()
  );

-- ============================================================
-- CHAT_SAMTALER
--
-- MIDLERTIDIG POLICY — projektbaseret ejerskabskontrol.
--
-- Kontrollerer:
--   1. auth.uid() = bygherre_id: brugeren er den bygherre der opretter samtalen
--   2. projekt_id tilhører et projekt hvor projekter.bygherre_id = auth.uid():
--      forhindrer bygherre i at oprette samtaler på fremmede projekter
--
-- BEVIDST UDELADT i denne midlertidige version:
--   - Kontrol af modpart_email mod kontrakter
--   Den nuværende chatroute (src/app/api/chat/route.ts) sætter ikke
--   modpart_email ved INSERT, så en modpart-kontrol ville blokere
--   al samtale-oprettelse med den eksisterende kode.
--
-- ENDELIG MODEL (implementeres i chat-kodefasen):
--   - Én privat samtale per aftalegrundlag (kontrakt_id)
--   - Den aktuelle kontrakt_id bestemmer automatisk modparten
--   - Bygherren behøver ikke søge efter eller vælge entreprenør
--   - Chat åbnet fra et bestemt aftalegrundlag åbner eller opretter
--     automatisk samtalen med det aftalegrundlags entrepreneur
--   - Kontrol af modpart sker via kontrakt_id, ikke modpart_email
-- ============================================================

CREATE POLICY "Bygherre opretter samtaler"
  ON public.chat_samtaler
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = chat_samtaler.bygherre_id
    AND EXISTS (
      SELECT 1 FROM public.projekter p
      WHERE p.id = chat_samtaler.projekt_id
        AND p.bygherre_id = auth.uid()
    )
  );

COMMIT;
