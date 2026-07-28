-- Tilføj tidsplan_faser som JSONB på projekter-tabellen
-- Kør i Supabase SQL Editor

alter table projekter add column if not exists tidsplan_faser jsonb default '[]'::jsonb;
