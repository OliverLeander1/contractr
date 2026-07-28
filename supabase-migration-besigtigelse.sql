create table if not exists besigtigelse (
  id uuid primary key default gen_random_uuid(),
  kontrakt_id uuid not null references kontrakter(id) on delete cascade,
  projekt_id uuid not null,
  dato date not null,
  tidspunkt time,
  kommentar_bygherre text,
  kommentar_haandvaerker text,
  status text not null default 'foreslaaet', -- foreslaaet | godkendt | afvist | ny_dato
  foreslaaet_af text not null default 'bygherre', -- bygherre | haandvaerker
  oprettet_at timestamptz default now(),
  opdateret_at timestamptz default now()
);
