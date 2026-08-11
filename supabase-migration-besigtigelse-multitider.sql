-- ============================================================================
-- Migration: besigtigelse med 1-3 alternative tidspunkter pr. forhandlingsrunde
-- ============================================================================
--
-- FORMÅL (kort opsummeret):
-- Udvider det eksisterende entreprenørinitierede besigtigelsesflow, så én
-- besigtigelsesanmodning ("runde") kan indeholde 1-3 alternative dato/tid-
-- forslag i stedet for kun ét. besigtigelse forbliver "runden" (uændret
-- rolle); en ny child-tabel besigtigelse_tidspunkter rummer alternativerne.
-- Oprettelse af en runde + dens alternativer sker atomart via en ny
-- Postgres-funktion (RPC), kaldt fra backend efter eksisterende JWT/rolle-
-- autorisation i /api/besigtigelse.
--
-- Denne migration er en IKKE-DESTRUKTIV OVERGANGSMIGRATION, ikke "100%
-- additiv" i streng forstand: den fjerner NOT NULL-restriktionen på
-- besigtigelse.dato (se afsnit 3b), hvilket er en reel ændring af en
-- eksisterende constraint, om end ikke-destruktiv (ingen data tabes eller
-- ændres, kun restriktionen lempes).
--
-- Legacy-håndtering — præcis beslutningstræ for hver eksisterende række:
--   1. dato + tidspunkt findes, OG tidspunkt ligger præcis på et kvarter
--      (minut 0/15/30/45) med 0 sekunder (samme regel som ny kode kræver)
--        → backfilles til besigtigelse_tidspunkter som "Mulighed 1"
--        → hvis status = 'godkendt': valgt_tidspunkt_id sættes til denne
--          backfillede række
--   2. tidspunkt IS NULL
--        → INGEN child-række. Forbliver ren legacy-fallback via parentens
--          egne dato/tidspunkt-kolonner (tidspunkt vises da slet ikke).
--   3. tidspunkt findes, men opfylder IKKE kvarters+0-sekunder-reglen (fx
--      14:34, 09:07, eller 14:15:37 med sekunder)
--        → INGEN child-række. Forbliver ren legacy-fallback via parentens
--          egne dato/tidspunkt-kolonner, MED deres oprindelige, upræcise
--          værdi vist uændret — ingen afrunding, ingen normalisering,
--          ingen opdigtet erstatning.
--   I alle tre tilfælde: eksisterende dato/tidspunkt-værdier på parent-
--   rækken ændres ALDRIG af denne migration. besigtigelse.dato og
--   besigtigelse.tidspunkt bevares uændret som midlertidige legacy-felter
--   indtil en senere, separat oprydningsmigration (efter ny kode er live
--   og verificeret) fjerner dem.
--
-- Nye multi-tids-runder (oprettet efter denne migration, via RPC'en i
-- afsnit 6) skriver ALDRIG dato/tidspunkt på parent-rækken — kun på
-- besigtigelse_tidspunkter, som er eneste source of truth for dem. Der
-- kopieres bevidst ikke et "Mulighed 1" ind i parent.dato, da det ville
-- skabe to sources of truth for samme fakta.
--
-- Legacy-varighed: besigtigelse.varighed_minutter forbliver NULL for alle
-- rækker, der eksisterede før denne migration — intet varighedsbegreb
-- fandtes dengang, og der opdigtes ingen erstatningsværdi. Nye runder får
-- altid en reel værdi via RPC'en (se afsnit 6), aldrig via en kolonne-
-- DEFAULT.
--
-- ATOMARITET: Hele migrationen er pakket i én eksplicit transaktion
-- (BEGIN ... COMMIT nederst i filen). Enten gennemføres hele migrationen,
-- eller ingen af den — ingen halv tilstand er mulig (fx tabel oprettet men
-- RPC mangler, eller kolonner tilføjet men backfill fejlet). Alle
-- statements i denne fil er almindelig transaktionel DDL/DML i PostgreSQL
-- (CREATE TABLE, ALTER TABLE, CREATE FUNCTION, GRANT/REVOKE, INSERT,
-- UPDATE, DO-blokke) — ingen af dem kræver at køre uden for en
-- transaktionsblok (fx bruges CREATE INDEX CONCURRENTLY, ALTER TYPE ... ADD
-- VALUE eller andre kendte transaktions-uforenelige statements ikke
-- nogen steder i denne fil).
--
-- Migrationen er derudover fortsat skrevet til at være sikker ved en
-- senere, BEVIDST genkørsel (idempotens er stadig nyttig ud over selve
-- transaktionsgarantien, som kun beskytter mod en fejlet, delvis kørsel —
-- ikke mod at nogen bevidst kører hele filen igen på et senere tidspunkt):
--   - CREATE TABLE / ADD COLUMN bruger IF NOT EXISTS (understøttet direkte)
--   - ADD CONSTRAINT understøtter IKKE IF NOT EXISTS i PostgreSQL — hvert
--     constraint tilføjes derfor via en DO-blok, der selv tjekker
--     pg_constraint, før den forsøger at tilføje det
--   - ALTER COLUMN ... DROP NOT NULL er i sig selv sikkert ved genkørsel
--     (fejler ikke, hvis kolonnen allerede er nullable)
--   - CREATE OR REPLACE FUNCTION er naturligt idempotent
--   - REVOKE/GRANT er naturligt idempotent (at fjerne/give en allerede
--     fjernet/givet rettighed er en no-op, ikke en fejl)
--   - ENABLE ROW LEVEL SECURITY er sikkert ved genkørsel
--   - Legacy-backfill-INSERT bruger ON CONFLICT ... DO NOTHING mod den
--     relevante unique-constraint, så en gentaget kørsel hverken duplikerer
--     child-rækker eller fejler
--   - Backfill-UPDATE af valgt_tidspunkt_id rører kun rækker, hvor feltet
--     stadig er NULL — en allerede sat værdi overskrives aldrig
--
-- Denne fil må læses og gennemgås, men må IKKE køres mod Supabase i denne
-- opgave. Ingen SQL heri er udført.
--
-- Kildehierarki-note: denne fil er tracked (ikke en af de beskyttede
-- untracked supabase-migration-*.sql-filer) og kan derfor committes normalt,
-- når Oliver har godkendt og selv kørt den.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. NY CHILD-TABEL: besigtigelse_tidspunkter
--    Ét alternativ (dato + tidspunkt) pr. række. 1-3 rækker pr. runde.
-- ----------------------------------------------------------------------------

create table if not exists public.besigtigelse_tidspunkter (
  id uuid primary key default gen_random_uuid(),
  besigtigelse_id uuid not null references public.besigtigelse(id) on delete cascade,
  dato date not null,
  tidspunkt time not null,
  sortering smallint not null default 1,
  oprettet_at timestamptz default now()
);


-- ----------------------------------------------------------------------------
-- 2. CONSTRAINTS på besigtigelse_tidspunkter
--    Dublet- og sorteringsbeskyttelse samt streng tidsregel som database-
--    defense-in-depth, oven i RPC'ens egen validering — ikke en erstatning
--    for den.
--
--    PostgreSQL understøtter ikke "ADD CONSTRAINT IF NOT EXISTS". Hvert
--    constraint tilføjes derfor i en DO-blok, der selv slår op i
--    pg_constraint, så filen er sikker at køre flere gange.
-- ----------------------------------------------------------------------------

-- Sortering skal være 1, 2 eller 3 (svarer til "Mulighed 1/2/3").
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_tidspunkter_sortering_check'
      and conrelid = 'public.besigtigelse_tidspunkter'::regclass
  ) then
    alter table public.besigtigelse_tidspunkter
      add constraint besigtigelse_tidspunkter_sortering_check
      check (sortering between 1 and 3);
  end if;
end $$;

-- Streng tidsregel: tidspunktet skal ligge PRÆCIS på et kvarter — minut
-- 0/15/30/45 OG 0 sekunder (dvs. reelt kun HH:00:00 / HH:15:00 / HH:30:00 /
-- HH:45:00). extract(second from tidspunkt) fanger både hele sekunder
-- (fx 14:15:37 → 37, fejler) og fraktionelle sekunder (fx 14:15:00.5 → 0.5,
-- fejler), da tidspunkt-kolonnen er "time" uden præcisionsbegrænsning.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_tidspunkter_kvarter_check'
      and conrelid = 'public.besigtigelse_tidspunkter'::regclass
  ) then
    alter table public.besigtigelse_tidspunkter
      add constraint besigtigelse_tidspunkter_kvarter_check
      check (
        extract(minute from tidspunkt)::int in (0, 15, 30, 45)
        and extract(second from tidspunkt) = 0
      );
  end if;
end $$;

-- Samme runde kan ikke have to rækker med samme sortering (fx to "Mulighed 1").
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_tidspunkter_sortering_uniq'
      and conrelid = 'public.besigtigelse_tidspunkter'::regclass
  ) then
    alter table public.besigtigelse_tidspunkter
      add constraint besigtigelse_tidspunkter_sortering_uniq
      unique (besigtigelse_id, sortering);
  end if;
end $$;

-- Samme runde kan ikke foreslå samme dato+tidspunkt to gange.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_tidspunkter_dato_tid_uniq'
      and conrelid = 'public.besigtigelse_tidspunkter'::regclass
  ) then
    alter table public.besigtigelse_tidspunkter
      add constraint besigtigelse_tidspunkter_dato_tid_uniq
      unique (besigtigelse_id, dato, tidspunkt);
  end if;
end $$;

-- Understøttende unique-constraint, udelukkende nødvendig for at kunne være
-- mål for composite foreign key'en fra besigtigelse i afsnit 4 nedenfor.
-- id alene er allerede unikt (PK) — dette gør blot parret (id, besigtigelse_id)
-- til et gyldigt FK-mål.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_tidspunkter_id_besigtigelse_id_uniq'
      and conrelid = 'public.besigtigelse_tidspunkter'::regclass
  ) then
    alter table public.besigtigelse_tidspunkter
      add constraint besigtigelse_tidspunkter_id_besigtigelse_id_uniq
      unique (id, besigtigelse_id);
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 3. ÆNDRINGER PÅ EKSISTERENDE besigtigelse-TABEL
-- ----------------------------------------------------------------------------

-- 3a. Nye kolonner. varighed_minutter er NULLABLE og får bevidst INGEN
-- kolonne-DEFAULT — en DEFAULT ville få Postgres til implicit at give alle
-- eksisterende (legacy) rækker en opdigtet varighed på 60 minutter, som de
-- aldrig reelt havde. Nye rækker får altid en reel værdi, fordi RPC'en
-- (afsnit 6) selv håndhæver en default på 60 — aldrig via en kolonne-DEFAULT.
alter table public.besigtigelse
  add column if not exists varighed_minutter integer,
  add column if not exists valgt_tidspunkt_id uuid;

-- CHECK tillader eksplicit NULL (legacy, intet varighedsbegreb dengang)
-- eller én af de fem tilladte værdier for nye runder.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_varighed_check'
      and conrelid = 'public.besigtigelse'::regclass
  ) then
    alter table public.besigtigelse
      add constraint besigtigelse_varighed_check
      check (varighed_minutter is null or varighed_minutter in (30, 45, 60, 90, 120));
  end if;
end $$;

-- 3b. besigtigelse.dato er i den oprindelige migration NOT NULL
-- (bekræftet i supabase-migration-besigtigelse.sql: "dato date not null").
-- besigtigelse_tidspunkter er source of truth for dato/tidspunkt på NYE
-- multi-tids-runder — RPC'en (afsnit 6) skriver derfor bevidst hverken dato
-- eller tidspunkt på parent-rækken for nye runder. Uden denne ændring ville
-- ethvert RPC-kald fejle på en NOT NULL-constraint-violation på dato.
--
-- Dette er en overgangsændring af en eksisterende constraint, IKKE et DROP
-- af kolonnen: eksisterende legacy-værdier i dato/tidspunkt røres ikke af
-- denne linje, og begge kolonner forbliver i tabellen, indtil en senere,
-- separat oprydningsmigration (efter ny kode er live og verificeret)
-- fjerner dem helt. besigtigelse.tidspunkt er allerede nullable i den
-- oprindelige migration og kræver ingen ændring her.
--
-- DROP NOT NULL fejler ikke og ændrer intet, hvis kolonnen allerede er
-- nullable — sikkert ved genkørsel uden yderligere guard.
alter table public.besigtigelse
  alter column dato drop not null;


-- ----------------------------------------------------------------------------
-- 4. COMPOSITE FOREIGN KEY — "valgt tidspunkt tilhører samme runde"
--    Håndhæves i databasen uden trigger, ved at genbruge besigtigelse.id
--    som del af en composite FK mod besigtigelse_tidspunkter(id, besigtigelse_id).
--    NULL i valgt_tidspunkt_id (normaltilstanden, før nogen har accepteret)
--    gør at constrainten slet ikke håndhæves (standard SQL MATCH SIMPLE) —
--    den blokerer kun et FORKERT (ikke-NULL) valg fra en anden runde.
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'besigtigelse_valgt_tidspunkt_samme_runde_fk'
      and conrelid = 'public.besigtigelse'::regclass
  ) then
    alter table public.besigtigelse
      add constraint besigtigelse_valgt_tidspunkt_samme_runde_fk
      foreign key (valgt_tidspunkt_id, id)
      references public.besigtigelse_tidspunkter (id, besigtigelse_id);
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 5. RLS på ny tabel — samme mønster som den allerede produktionsverificerede
--    besigtigelse: enabled, ingen policies, default-deny for anon/authenticated.
--    Rører IKKE besigtigelses egen, allerede verificerede RLS-tilstand.
--    Sikkert ved genkørsel — ingen fejl hvis RLS allerede er enabled.
-- ----------------------------------------------------------------------------

alter table public.besigtigelse_tidspunkter enable row level security;
-- Ingen policies tilføjes bevidst. Al adgang sker udelukkende via
-- service_role (RLS-bypass) efter autorisation i Next.js-routen, eller via
-- RPC'en nedenfor (som selv kun kan kaldes af service_role, se afsnit 7).


-- ----------------------------------------------------------------------------
-- 6. RPC: atomar oprettelse af én runde + dens 1-3 alternative tidspunkter
--
--    Robust JSONB-validering, i denne rækkefølge, FØR noget som helst
--    indsættes:
--      a) p_tidspunkter er ikke NULL og er faktisk et JSON-array
--      b) arrayet har mellem 1 og 3 elementer
--      c) hvert element er et JSON-objekt med ikke-NULL streng-felterne
--         "dato" og "tidspunkt"
--      d) dato matcher strengt YYYY-MM-DD (regex, eksplicitte [0-9]-klasser)
--         FØR cast til date — selve cast'et til ::date er stadig den
--         endelige kalenderkontrol, så fx 2026-02-31 afvises af Postgres,
--         ikke kun af regex'en
--      e) tidspunkt matcher strengt HH:MM med minut 00/15/30/45. Cast af en
--         "HH:MM"-streng til ::time sætter altid sekunder til 00 — nye
--         rækker opfylder derfor automatisk den strengere DB-CHECK i
--         afsnit 2 (minut + 0 sekunder), uden at RPC'en selv behøver
--         validere sekunder eksplicit.
--
--    Al validering sker i en ren valideringsløkke, FØR parent-rækken
--    overhovedet indsættes. Der er derfor ingen kodevej, hvor en
--    besigtigelse-runde kan blive oprettet med 0 gyldige child-rækker —
--    hverken ved konstruktion (valideret før parent-insert) eller ved fejl
--    undervejs (enhver RAISE EXCEPTION ruller hele funktionskaldet tilbage,
--    da det er én implicit transaktion).
--
--    Varighed: p_varighed_minutter har en reel PostgreSQL-parameter-DEFAULT
--    (60), som dækker tilfældet, hvor Next.js-serveren udelader parameteren.
--    coalesce(p_varighed_minutter, 60) i funktionskroppen dækker derudover
--    det tilfælde, hvor parameteren sendes eksplicit som NULL (en
--    parameter-DEFAULT alene dækker kun det udeladte tilfælde, ikke et
--    eksplicit sendt NULL) — en ny runde ender derfor aldrig med
--    NULL-varighed, uanset hvordan kalderen opfører sig. Legacy-rækker
--    (oprettet før denne migration) kan fortsat have varighed_minutter = NULL.
--
--    Parent-INSERT skriver bevidst hverken dato eller tidspunkt — se
--    begrundelsen i afsnit 3b. besigtigelse_tidspunkter er source of truth
--    for alle nye runders dato/tid.
--
--    Alle tabelreferencer er schema-kvalificerede (public.besigtigelse,
--    public.besigtigelse_tidspunkter).
-- ----------------------------------------------------------------------------

create or replace function public.opret_besigtigelsesrunde(
  p_kontrakt_id uuid,
  p_projekt_id uuid,
  p_foreslaaet_af text,
  p_varighed_minutter integer default 60,
  p_kommentar_bygherre text default null,
  p_kommentar_haandvaerker text default null,
  p_tidspunkter jsonb default null
)
returns public.besigtigelse
language plpgsql
security invoker
as $$
declare
  v_runde public.besigtigelse;
  v_item jsonb;
  v_antal int;
  v_sortering smallint;
  v_dato_tekst text;
  v_tid_tekst text;
begin
  -- Rolle-sanitet (defense-in-depth — den reelle autorisation er allerede
  -- foretaget af den kaldende Next.js-route før dette RPC-kald).
  -- Eksplicit NULL-tjek: "NULL NOT IN (...)" evaluerer til NULL (ikke TRUE)
  -- i SQL, så "if p_foreslaaet_af not in (...)" alene ville lade NULL glide
  -- videre til NOT NULL-constrainten på besigtigelse.foreslaaet_af i stedet
  -- for at blive stoppet her med vores egen fejlbesked (sikkert nok via
  -- rollback, men uklart for kalderen). "is null or ... not in (...)" gør
  -- afvisningen eksplicit og giver en klar fejlbesked før noget indsættes.
  if p_foreslaaet_af is null or p_foreslaaet_af not in ('bygherre', 'haandvaerker') then
    raise exception 'Ugyldig foreslaaet_af: %', p_foreslaaet_af;
  end if;

  -- Normalisér varighed til 60, uanset om parameteren blev udeladt (dækket
  -- af den deklarerede DEFAULT 60 i funktionssignaturen) eller eksplicit
  -- sendt som NULL (dækket af coalesce her).
  p_varighed_minutter := coalesce(p_varighed_minutter, 60);
  if p_varighed_minutter not in (30, 45, 60, 90, 120) then
    raise exception 'Ugyldig varighed: %', p_varighed_minutter;
  end if;

  -- p_tidspunkter skal være et ikke-NULL JSON-array med 1-3 elementer.
  if p_tidspunkter is null or jsonb_typeof(p_tidspunkter) is distinct from 'array' then
    raise exception 'p_tidspunkter skal være et JSON-array';
  end if;

  v_antal := jsonb_array_length(p_tidspunkter);
  if v_antal < 1 or v_antal > 3 then
    raise exception 'Der skal foreslås mellem 1 og 3 tidspunkter (modtog %)', v_antal;
  end if;

  -- Valider HVERT element fuldt ud, FØR noget indsættes i det hele taget.
  -- Ren valideringsløkke, ingen sideeffekter.
  for v_item in select * from jsonb_array_elements(p_tidspunkter) loop
    if jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'Hvert tidspunktselement skal være et JSON-objekt';
    end if;

    if not (v_item ? 'dato') or jsonb_typeof(v_item -> 'dato') is distinct from 'string' then
      raise exception 'Mangler eller ugyldig "dato" i tidspunktselement';
    end if;
    if not (v_item ? 'tidspunkt') or jsonb_typeof(v_item -> 'tidspunkt') is distinct from 'string' then
      raise exception 'Mangler eller ugyldig "tidspunkt" i tidspunktselement';
    end if;

    v_dato_tekst := v_item ->> 'dato';
    v_tid_tekst := v_item ->> 'tidspunkt';

    if v_dato_tekst is null or v_tid_tekst is null then
      raise exception 'dato/tidspunkt må ikke være null';
    end if;

    -- Strikt formatkontrol FØR cast. Kun YYYY-MM-DD accepteres — ikke
    -- 20/08/2026, 20-08-2026 eller 08/20/2026. Eksplicitte [0-9]-klasser
    -- i stedet for \d-shorthand for entydighed.
    if v_dato_tekst !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'Ugyldigt datoformat (skal være YYYY-MM-DD): %', v_dato_tekst;
    end if;

    -- Kun HH:MM med minut 00/15/30/45. Ingen sekunder i input — cast til
    -- ::time nedenfor sætter dem altid til 00, hvilket opfylder den
    -- strengere DB-CHECK i afsnit 2.
    if v_tid_tekst !~ '^([0-1][0-9]|2[0-3]):(00|15|30|45)$' then
      raise exception 'Tidspunkt skal være på hele, kvarte, halve eller tre-kvarte timer (HH:MM): %', v_tid_tekst;
    end if;

    -- Selve cast'et er den endelige kalenderkontrol — fx 2026-02-31 fejler
    -- her, selvom regex-formatet ovenfor er opfyldt.
    perform v_dato_tekst::date;
  end loop;

  -- Al validering er nu bestået for samtlige 1-3 elementer.
  -- Opret rundens parent-række. dato/tidspunkt er bevidst udeladt her —
  -- se afsnit 3b: besigtigelse_tidspunkter er source of truth for nye runder.
  insert into public.besigtigelse (
    kontrakt_id, projekt_id, foreslaaet_af, varighed_minutter,
    kommentar_bygherre, kommentar_haandvaerker, status
  ) values (
    p_kontrakt_id, p_projekt_id, p_foreslaaet_af, p_varighed_minutter,
    p_kommentar_bygherre, p_kommentar_haandvaerker, 'foreslaaet'
  )
  returning * into v_runde;

  -- Opret de 1-3 alternative tidspunkter, sekventielt sorteret 1,2,3.
  v_sortering := 0;
  for v_item in select * from jsonb_array_elements(p_tidspunkter) loop
    v_sortering := v_sortering + 1;
    insert into public.besigtigelse_tidspunkter (besigtigelse_id, dato, tidspunkt, sortering)
    values (
      v_runde.id,
      (v_item ->> 'dato')::date,
      (v_item ->> 'tidspunkt')::time,
      v_sortering
    );
  end loop;

  return v_runde;
end;
$$;


-- ----------------------------------------------------------------------------
-- 7. RPC-PRIVILEGES — mindst privilegeret model
--    CREATE FUNCTION giver som Postgres-standard EXECUTE til PUBLIC. Denne
--    sektion er derfor obligatorisk, ikke valgfri: uden det eksplicitte
--    REVOKE nedenfor ville enhver med den offentlige anon-nøgle kunne kalde
--    funktionen direkte via PostgREST, uden om Next.js-routens Bearer JWT +
--    bestemRolle()-autorisation.
--
--    Fuld funktionssignatur bruges i REVOKE/GRANT, så privileges gælder
--    præcis denne funktion/signatur. REVOKE/GRANT er naturligt idempotent —
--    sikkert ved genkørsel.
-- ----------------------------------------------------------------------------

revoke all on function public.opret_besigtigelsesrunde(
  uuid, uuid, text, integer, text, text, jsonb
) from public;

revoke all on function public.opret_besigtigelsesrunde(
  uuid, uuid, text, integer, text, text, jsonb
) from anon;

revoke all on function public.opret_besigtigelsesrunde(
  uuid, uuid, text, integer, text, text, jsonb
) from authenticated;

grant execute on function public.opret_besigtigelsesrunde(
  uuid, uuid, text, integer, text, text, jsonb
) to service_role;


-- ----------------------------------------------------------------------------
-- 8. SIKKER, IDEMPOTENT LEGACY-BACKFILL
--    Kun rækker der opfylder PRÆCIS SAMME regel som den nye DB-CHECK i
--    afsnit 2 (minut 0/15/30/45 OG 0 sekunder) backfilles. Ingen COALESCE,
--    intet opdigtet klokkeslæt, ingen afrunding, ingen normalisering af
--    ikke-kvarterstider (fx 14:34 eller 09:07 forbliver urørt som ren
--    legacy-fallback), ingen opdigtet varighed.
--
--    ON CONFLICT ... DO NOTHING mod den unikke (besigtigelse_id, sortering)-
--    constraint fra afsnit 2 gør INSERT'et sikkert ved genkørsel: en allerede
--    backfillet runde (som allerede har en sortering=1-række) springes
--    stiltiende over i stedet for at fejle eller duplikere.
-- ----------------------------------------------------------------------------

insert into public.besigtigelse_tidspunkter (besigtigelse_id, dato, tidspunkt, sortering)
select id, dato, tidspunkt, 1
from public.besigtigelse
where tidspunkt is not null
  and extract(minute from tidspunkt)::int in (0, 15, 30, 45)
  and extract(second from tidspunkt) = 0
on conflict on constraint besigtigelse_tidspunkter_sortering_uniq do nothing;

-- Rækker der IKKE opfylder betingelsen ovenfor — enten fordi tidspunkt er
-- NULL, eller fordi det ikke ligger præcis på et kvarter med 0 sekunder —
-- får bevidst INGEN child-række. De forbliver udelukkende læsbare via de
-- gamle, bevarede kolonner (besigtigelse.dato / besigtigelse.tidspunkt),
-- med deres oprindelige værdi vist uændret, som fallback i applikationen.


-- ----------------------------------------------------------------------------
-- 9. BACKFILL AF valgt_tidspunkt_id FOR ALLEREDE GODKENDTE LEGACY-RÆKKER
--    Kun for rækker, der faktisk fik en child-række i afsnit 8 ovenfor
--    (dvs. tidspunkt var kendt OG opfyldte kvarters+0-sekunder-reglen).
--    Rækker uden en sådan child-række beholder bevidst
--    valgt_tidspunkt_id = NULL og falder tilbage til de gamle kolonner.
--
--    EKSPLICIT LEGACY-ONLY: denne UPDATE matcher kun en ægte legacy-række,
--    hvor child-rækken dokumenterbart ER backfill af parentens egen,
--    faktiske gamle dato/tid — ikke blot "en sortering=1-child findes".
--    Kravene b.dato is not null / b.tidspunkt is not null / t.dato = b.dato /
--    t.tidspunkt = b.tidspunkt sikrer dette eksplicit, oven i den blotte
--    eksistens af en sortering=1-række.
--
--    Dette er en bevidst beskyttelse mod en fremtidig, ny multi-tids-runde:
--    RPC'en i afsnit 6 sætter ALDRIG b.dato/b.tidspunkt på en ny runde (de
--    forbliver NULL — se afsnit 3b), så betingelsen "b.dato is not null and
--    b.tidspunkt is not null" kan pr. konstruktion aldrig være opfyldt for
--    en ny multi-tids-runde. En ny rundes "Mulighed 1" kan derfor ALDRIG
--    blive automatisk valgt af denne (eller en senere genkørt) legacy-
--    backfill — kun en ægte, allerede eksisterende legacy-godkendelse kan
--    matches.
--
--    Idempotent af sig selv: "and b.valgt_tidspunkt_id is null" betyder, at
--    kun rækker uden allerede sat værdi rammes — en genkørsel overskriver
--    aldrig en eksisterende værdi, og finder desuden stadig den korrekte
--    child-række uanset om den blev sat i denne eller en tidligere kørsel.
-- ----------------------------------------------------------------------------

update public.besigtigelse b
set valgt_tidspunkt_id = t.id
from public.besigtigelse_tidspunkter t
where b.dato is not null
  and b.tidspunkt is not null
  and t.besigtigelse_id = b.id
  and t.sortering = 1
  and t.dato = b.dato
  and t.tidspunkt = b.tidspunkt
  and b.status = 'godkendt'
  and b.valgt_tidspunkt_id is null;


-- ----------------------------------------------------------------------------
-- 10. INGEN DROP
--     besigtigelse.dato og besigtigelse.tidspunkt fjernes bevidst IKKE i
--     denne migration (dato er blot gjort nullable i afsnit 3b, ikke
--     fjernet). De fjernes først i en senere, separat migration, efter at
--     ny kode er deployet og verificeret, og legacy-data er kontrolleret.
--     Se verifikations-SQL'en i opgavesvaret for det read-only tjek, Oliver
--     skal køre efter denne migration.
-- ----------------------------------------------------------------------------

commit;
