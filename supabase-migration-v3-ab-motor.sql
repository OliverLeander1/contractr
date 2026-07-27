-- Migration v3: AB-notifikationsmotor + levering_dato
-- Kør i Supabase Dashboard → SQL Editor → New query

-- Tilføj levering_dato til projekter (registreres ved afleveringsforretning)
ALTER TABLE public.projekter
  ADD COLUMN IF NOT EXISTS levering_dato TIMESTAMPTZ;

-- Tilføj ab_paragraf til notifikationer (allerede i notifikationer? tilføj sikkerhedsvis)
ALTER TABLE public.notifikationer
  ADD COLUMN IF NOT EXISTS ab_paragraf TEXT;

-- Tilføj projekt_link til notifikationer (direkte URL til den relevante side)
ALTER TABLE public.notifikationer
  ADD COLUMN IF NOT EXISTS projekt_link TEXT;

-- Indeks for hurtig opslag af notifikationer per bruger/projekt/type
CREATE INDEX IF NOT EXISTS idx_notifikationer_bruger_projekt
  ON public.notifikationer (bruger_id, projekt_id, type, oprettet_at DESC);

-- AB-motorens notifikationer må ikke give fejl hvis notifikations-tabellen mangler kolonner
-- Bekræft at notifikationer-tabellen har de forventede kolonner:
-- id, bruger_id, projekt_id, type, titel, besked, ab_paragraf, laest, oprettet_at

-- RLS: Brugere ser kun egne notifikationer
DROP POLICY IF EXISTS "Brugere ser egne notifikationer" ON public.notifikationer;
CREATE POLICY "Brugere ser egne notifikationer"
  ON public.notifikationer FOR SELECT
  USING (auth.uid() = bruger_id);

DROP POLICY IF EXISTS "Brugere markerer egne notifikationer som læst" ON public.notifikationer;
CREATE POLICY "Brugere markerer egne notifikationer som læst"
  ON public.notifikationer FOR UPDATE
  USING (auth.uid() = bruger_id);

-- Service role (AB-motor) kan indsætte notifikationer for alle brugere
-- Dette kræver SUPABASE_SERVICE_ROLE_KEY i API'et (ikke anon key)

-- Bekræft at betalinger-tabellen har de rette kolonner:
-- id, projekt_id, beskrivelse, beloeb, status, markeret_af, godkendt_af, godkendt_at, sorteret_index
ALTER TABLE public.betalinger
  ADD COLUMN IF NOT EXISTS sorteret_index INT DEFAULT 0;
