-- Tilføj adresse-kolonne til profiler-tabellen
ALTER TABLE profiler ADD COLUMN IF NOT EXISTS adresse text;
