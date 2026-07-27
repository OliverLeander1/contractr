-- Migration: Ekstraarbejde digital underskrift flow
-- Kør i Supabase Dashboard → SQL Editor → New query

-- Tilføj felter til ekstraarbejde-tabellen
ALTER TABLE public.ekstraarbejde
  ADD COLUMN IF NOT EXISTS oprettet_af_navn       TEXT,
  ADD COLUMN IF NOT EXISTS haandvaerker_pris       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS haandvaerker_pris_type  TEXT CHECK (haandvaerker_pris_type IN ('fast', 'overslag')),
  ADD COLUMN IF NOT EXISTS haandvaerker_tidsdage   INT,
  ADD COLUMN IF NOT EXISTS haandvaerker_besked     TEXT,
  ADD COLUMN IF NOT EXISTS haandvaerker_navn       TEXT,
  ADD COLUMN IF NOT EXISTS haandvaerker_udfyldt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bygherre_godkendt_navn  TEXT,
  ADD COLUMN IF NOT EXISTS bygherre_godkendt_at    TIMESTAMPTZ;

-- Opdater status-check til at inkludere det nye flow
ALTER TABLE public.ekstraarbejde
  DROP CONSTRAINT IF EXISTS ekstraarbejde_status_check;

ALTER TABLE public.ekstraarbejde
  ADD CONSTRAINT ekstraarbejde_status_check
  CHECK (status IN ('sendt', 'haandvaerker_udfyldt', 'godkendt', 'afvist'));

-- Opdater eksisterende rækker med gammel status
UPDATE public.ekstraarbejde SET status = 'sendt'    WHERE status = 'afventer';
UPDATE public.ekstraarbejde SET status = 'godkendt' WHERE status = 'godkendt';
UPDATE public.ekstraarbejde SET status = 'afvist'   WHERE status = 'afvist';

-- Håndværker kan opdatere (udfylde pris/tid)
DROP POLICY IF EXISTS "Haandvaerker opdaterer ekstraarbejde" ON public.ekstraarbejde;
CREATE POLICY "Haandvaerker opdaterer ekstraarbejde"
  ON public.ekstraarbejde FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.kontrakter k
      WHERE k.projekt_id = projekt_id::text
        AND lower(auth.email()) = lower(k.haandvaerker_email)
    )
  );

-- Notifikationer: håndværker kan indsætte notifikationer til bygherre
DROP POLICY IF EXISTS "Haandvaerker sender notifikation" ON public.notifikationer;
CREATE POLICY "Haandvaerker sender notifikation"
  ON public.notifikationer FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Profiler: alle kan se profiler (til at hente navn)
DROP POLICY IF EXISTS "Alle kan se profiler" ON public.profiler;
CREATE POLICY "Alle kan se profiler"
  ON public.profiler FOR SELECT
  USING (auth.role() = 'authenticated');
