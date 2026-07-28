-- Tilføj markedsplads-kolonner til profiler-tabellen
alter table profiler
  add column if not exists fag        text,
  add column if not exists postnummer text,
  add column if not exists by         text,
  add column if not exists tilgaengelig boolean default true;
