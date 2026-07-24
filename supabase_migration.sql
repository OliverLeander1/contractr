-- Contractr — Database Migration v1
-- Kør dette i Supabase Dashboard → SQL Editor → New Query

-- ================================================
-- 1. BRUGERE (udvider Supabase Auth)
-- ================================================
create table if not exists public.profiler (
  id uuid references auth.users(id) on delete cascade primary key,
  navn text,
  email text,
  telefon text,
  rolle text default 'bygherre' check (rolle in ('bygherre', 'haandvaerker', 'raadgiver')),
  oprettet_at timestamptz default now()
);

alter table public.profiler enable row level security;

create policy "Bruger ser sin egen profil"
  on public.profiler for select
  using (auth.uid() = id);

create policy "Bruger opdaterer sin egen profil"
  on public.profiler for update
  using (auth.uid() = id);

create policy "Bruger opretter sin profil"
  on public.profiler for insert
  with check (auth.uid() = id);

-- Auto-opret profil ved signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiler (id, email, navn)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'navn', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================
-- 2. PROJEKTER
-- ================================================
create table if not exists public.projekter (
  id uuid default gen_random_uuid() primary key,
  bygherre_id uuid references public.profiler(id) on delete cascade,
  projekttype text not null,
  adresse text,
  status text default 'tilbud' check (status in ('dialog', 'ingen-tilbud', 'tilbud', 'accepteret', 'igang', 'problem', 'afsluttet')),
  pakke text check (pakke in ('lille', 'renovering', 'totalrenovering')),
  pakke_betalt boolean default false,
  ab_forbruger boolean default true,
  navn text,
  kontakt text,
  oprettet_at timestamptz default now(),
  opdateret_at timestamptz default now()
);

alter table public.projekter enable row level security;

create policy "Bygherre ser egne projekter"
  on public.projekter for select
  using (auth.uid() = bygherre_id);

create policy "Bygherre opretter projekt"
  on public.projekter for insert
  with check (auth.uid() = bygherre_id);

create policy "Bygherre opdaterer projekt"
  on public.projekter for update
  using (auth.uid() = bygherre_id);

-- ================================================
-- 3. DOKUMENTER
-- ================================================
create table if not exists public.dokumenter (
  id uuid default gen_random_uuid() primary key,
  projekt_id uuid references public.projekter(id) on delete cascade,
  uploader_id uuid references public.profiler(id),
  filnavn text not null,
  filtype text,
  filsti text,
  tekst_indhold text,
  oprettet_at timestamptz default now()
);

alter table public.dokumenter enable row level security;

create policy "Projektmedlemmer ser dokumenter"
  on public.dokumenter for select
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

create policy "Projektmedlemmer uploader dokumenter"
  on public.dokumenter for insert
  with check (auth.uid() = uploader_id);

-- ================================================
-- 4. SCREENINGER
-- ================================================
create table if not exists public.screeninger (
  id uuid default gen_random_uuid() primary key,
  projekt_id uuid references public.projekter(id) on delete cascade,
  dokument_id uuid references public.dokumenter(id),
  samlet_risiko text check (samlet_risiko in ('lav', 'middel', 'høj')),
  status text default 'afventer' check (status in ('afventer', 'færdig', 'fejl')),
  model_version text default 'v1',
  oprettet_at timestamptz default now()
);

alter table public.screeninger enable row level security;

create policy "Bygherre ser egne screeninger"
  on public.screeninger for select
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

-- ================================================
-- 5. RISIKOPUNKTER
-- ================================================
create table if not exists public.risiko_punkter (
  id uuid default gen_random_uuid() primary key,
  screening_id uuid references public.screeninger(id) on delete cascade,
  kategori text not null,
  status text check (status in ('ok', 'advarsel', 'kritisk', 'mangler')),
  forklaring text,
  anbefaling text,
  alvorlighed text check (alvorlighed in ('lav', 'middel', 'høj')),
  ab_paragraf text,
  sorteret_index int default 0
);

alter table public.risiko_punkter enable row level security;

create policy "Bygherre ser risikopunkter via screening"
  on public.risiko_punkter for select
  using (
    exists (
      select 1 from public.screeninger s
      join public.projekter p on p.id = s.projekt_id
      where s.id = screening_id and p.bygherre_id = auth.uid()
    )
  );

-- ================================================
-- 6. CHAT-BESKEDER
-- ================================================
create table if not exists public.chat_beskeder (
  id uuid default gen_random_uuid() primary key,
  projekt_id uuid references public.projekter(id) on delete cascade,
  afsender_id uuid references public.profiler(id),
  indhold text not null,
  vedhæftning_url text,
  sendt_at timestamptz default now()
);

alter table public.chat_beskeder enable row level security;

create policy "Projektmedlemmer ser chat"
  on public.chat_beskeder for select
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

create policy "Projektmedlemmer sender beskeder"
  on public.chat_beskeder for insert
  with check (auth.uid() = afsender_id);

-- Realtid på chat
alter publication supabase_realtime add table public.chat_beskeder;

-- ================================================
-- 7. MANGLER
-- ================================================
create table if not exists public.mangler (
  id uuid default gen_random_uuid() primary key,
  projekt_id uuid references public.projekter(id) on delete cascade,
  oprettet_af uuid references public.profiler(id),
  beskrivelse text not null,
  alvorlighed text check (alvorlighed in ('lav', 'middel', 'høj', 'kritisk')),
  status text default 'åben' check (status in ('åben', 'under-behandling', 'løst', 'tvist')),
  billede_urls text[],
  deadline date,
  oprettet_at timestamptz default now(),
  opdateret_at timestamptz default now()
);

alter table public.mangler enable row level security;

create policy "Bygherre ser egne mangler"
  on public.mangler for select
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

create policy "Bygherre opretter mangler"
  on public.mangler for insert
  with check (auth.uid() = oprettet_af);

create policy "Bygherre opdaterer mangler"
  on public.mangler for update
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

-- ================================================
-- 8. EKSTRAARBEJDE-SEDLER
-- ================================================
create table if not exists public.ekstraarbejde (
  id uuid default gen_random_uuid() primary key,
  projekt_id uuid references public.projekter(id) on delete cascade,
  oprettet_af uuid references public.profiler(id),
  beskrivelse text not null,
  pris_type text check (pris_type in ('fast', 'overslag')),
  pris decimal(10,2),
  tidspåvirkning_dage int default 0,
  godkendt_af uuid references public.profiler(id),
  godkendt_at timestamptz,
  status text default 'afventer' check (status in ('afventer', 'godkendt', 'afvist')),
  oprettet_at timestamptz default now()
);

alter table public.ekstraarbejde enable row level security;

create policy "Bygherre ser ekstraarbejde"
  on public.ekstraarbejde for select
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

-- ================================================
-- 9. BETALINGSMILEPÆLE
-- ================================================
create table if not exists public.betalinger (
  id uuid default gen_random_uuid() primary key,
  projekt_id uuid references public.projekter(id) on delete cascade,
  beskrivelse text not null,
  beloeb decimal(10,2) not null,
  forfaldsdato date,
  status text default 'afventer' check (status in ('afventer', 'markeret-faerdig', 'godkendt', 'betalt')),
  markeret_af uuid references public.profiler(id),
  godkendt_af uuid references public.profiler(id),
  godkendt_at timestamptz,
  sorteret_index int default 0,
  oprettet_at timestamptz default now()
);

alter table public.betalinger enable row level security;

create policy "Bygherre ser betalinger"
  on public.betalinger for select
  using (
    exists (
      select 1 from public.projekter
      where id = projekt_id and bygherre_id = auth.uid()
    )
  );

-- ================================================
-- 10. RÅDGIVERE
-- ================================================
create table if not exists public.raadgivere (
  id uuid default gen_random_uuid() primary key,
  profil_id uuid references public.profiler(id),
  virksomhed text,
  beskrivelse text,
  geografi text[],
  fagomraader text[],
  ydelser jsonb,
  kalender_url text,
  aktiv boolean default true,
  oprettet_at timestamptz default now()
);

alter table public.raadgivere enable row level security;

create policy "Alle kan se aktive rådgivere"
  on public.raadgivere for select
  using (aktiv = true);

-- ================================================
-- 11. BOOKINGER
-- ================================================
create table if not exists public.bookinger (
  id uuid default gen_random_uuid() primary key,
  bygherre_id uuid references public.profiler(id),
  raadgiver_id uuid references public.raadgivere(id),
  projekt_id uuid references public.projekter(id),
  ydelse text,
  tidspunkt timestamptz,
  status text default 'afventer' check (status in ('afventer', 'bekraeftet', 'gennemfoert', 'aflyst')),
  noter text,
  oprettet_at timestamptz default now()
);

alter table public.bookinger enable row level security;

create policy "Bygherre ser egne bookinger"
  on public.bookinger for select
  using (auth.uid() = bygherre_id);

create policy "Bygherre opretter booking"
  on public.bookinger for insert
  with check (auth.uid() = bygherre_id);

-- ================================================
-- 12. AB-FORBRUGER NOTIFIKATIONER
-- ================================================
create table if not exists public.notifikationer (
  id uuid default gen_random_uuid() primary key,
  bruger_id uuid references public.profiler(id) on delete cascade,
  projekt_id uuid references public.projekter(id) on delete cascade,
  type text not null,
  titel text not null,
  besked text,
  ab_paragraf text,
  laest boolean default false,
  sendt_email boolean default false,
  oprettet_at timestamptz default now()
);

alter table public.notifikationer enable row level security;

create policy "Bruger ser egne notifikationer"
  on public.notifikationer for select
  using (auth.uid() = bruger_id);

create policy "Bruger markerer som læst"
  on public.notifikationer for update
  using (auth.uid() = bruger_id);

-- Realtid på notifikationer
alter publication supabase_realtime add table public.notifikationer;

-- ================================================
-- STORAGE BUCKETS
-- ================================================
insert into storage.buckets (id, name, public)
values ('dokumenter', 'dokumenter', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('billeder', 'billeder', false)
on conflict (id) do nothing;

create policy "Autentificerede brugere uploader dokumenter"
  on storage.objects for insert
  with check (bucket_id = 'dokumenter' and auth.role() = 'authenticated');

create policy "Brugere ser egne dokumenter"
  on storage.objects for select
  using (bucket_id = 'dokumenter' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Autentificerede brugere uploader billeder"
  on storage.objects for insert
  with check (bucket_id = 'billeder' and auth.role() = 'authenticated');

create policy "Brugere ser egne billeder"
  on storage.objects for select
  using (bucket_id = 'billeder' and auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================
-- FÆRDIG
-- ================================================
-- Tabeller oprettet:
--   profiler, projekter, dokumenter, screeninger,
--   risiko_punkter, chat_beskeder, mangler,
--   ekstraarbejde, betalinger, raadgivere,
--   bookinger, notifikationer
-- Storage buckets: dokumenter, billeder
-- RLS aktiveret på alle tabeller
