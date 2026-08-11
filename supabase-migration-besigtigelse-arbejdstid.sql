-- ============================================================================
-- Migration: besigtigelsestider begrænset til 07:00–18:00
-- ============================================================================
--
-- FORMÅL:
-- Indfører en reel produktregel: en besigtigelses starttidspunkt skal ligge
-- mellem 07:00 og 18:00 (begge inklusive), stadig i 15-minutters intervaller.
-- "Uden for arbejdstid" udgår som valgmulighed. Dette var tidligere kun en
-- UX-sortering i klienten (07:00–18:00 vist først) — nu håndhæves det som en
-- reel grænse i alle tre lag: RPC, database-CHECK og (i samme kodeopgave,
-- separat fra denne fil) Next.js-serveren og UI'et.
--
-- FORUDSÆTNING, VERIFICERET FØR DENNE MIGRATION BLEV SKREVET:
-- Oliver har manuelt kørt følgende read-only kontrol i produktion:
--
--   select id, besigtigelse_id, dato, tidspunkt
--   from public.besigtigelse_tidspunkter
--   where tidspunkt < time '07:00:00' or tidspunkt > time '18:00:00'
--   order by dato, tidspunkt;
--
-- Resultat: "Success. No rows returned." — ingen eksisterende child-tidspunkt-
-- rækker ligger uden for 07:00–18:00. Den nye, strengere CHECK-constraint i
-- afsnit 1 nedenfor kan derfor valideres mod al eksisterende data uden at
-- nogen række skal rettes eller fjernes først.
--
-- Denne migration ÆNDRER INGEN EKSISTERENDE DATA. Den tilføjer/erstatter
-- udelukkende en constraint og genopretter RPC-funktionen med en udvidet
-- (ikke på anden vis ændret) tidsvalidering.
--
-- ATOMARITET: hele migrationen er pakket i én eksplicit transaktion
-- (BEGIN ... COMMIT nederst). Alle statements er almindelig transaktionel
-- DDL i PostgreSQL (ALTER TABLE, CREATE OR REPLACE FUNCTION, REVOKE/GRANT,
-- DO-blokke) — ingen af dem kræver at køre uden for en transaktionsblok.
--
-- IDEMPOTENS ved en senere, bevidst genkørsel:
--   - "alter table ... drop constraint if exists" fejler ikke, hvis
--     constrainten allerede er fjernet
--   - Den efterfølgende ADD CONSTRAINT bruger samme DO-blok-mønster som de
--     øvrige besigtigelsesmigrationer (tjekker pg_constraint før forsøg),
--     så et genkørt DROP+ADD-par altid ender i samme, entydige sluttilstand
--     uden dubletnavne eller fejl
--   - CREATE OR REPLACE FUNCTION er naturligt idempotent
--   - REVOKE/GRANT er naturligt idempotent
--
-- Denne fil må læses og gennemgås, men må IKKE køres mod Supabase i denne
-- opgave. Ingen SQL heri er udført. Oliver kører migrationen manuelt efter
-- review, som med de foregående besigtigelsesmigrationer.
--
-- Kildehierarki-note: denne fil er tracked (ikke en af de beskyttede
-- untracked supabase-migration-*.sql-filer) og kan derfor committes normalt,
-- når Oliver har godkendt og selv kørt den.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. DATABASE-CHECK: udvid besigtigelse_tidspunkter_kvarter_check til også
--    at kræve 07:00–18:00, oven på den eksisterende kvarters-/sekundregel.
--
--    Constrainten hedder fortsat besigtigelse_tidspunkter_kvarter_check —
--    samme regel (gyldigt tidspunktformat), nu blot udvidet, ikke en ny,
--    parallel constraint. PostgreSQL tillader ikke at redigere en
--    eksisterende CHECK-constraint in-place, så den droppes og genskabes
--    under samme navn med den udvidede betingelse.
--
--    Simpel direkte sammenligning på TIME-kolonnen (tidspunkt >= / <=)
--    fremfor regex, som ønsket — kolonnen er allerede type "time", så
--    dette er den mest læsbare og korrekte måde at udtrykke et interval på.
-- ----------------------------------------------------------------------------

alter table public.besigtigelse_tidspunkter
  drop constraint if exists besigtigelse_tidspunkter_kvarter_check;

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
        and tidspunkt >= time '07:00:00'
        and tidspunkt <= time '18:00:00'
      );
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 2. RPC: opret_besigtigelsesrunde — samme signatur, samme returtype, samme
--    SECURITY INVOKER, samme atomare parent/child-oprettelse og samme øvrige
--    validering/business logic. Eneste ændring: efter den eksisterende,
--    uændrede strenge HH:MM/kvartersvalidering (regex) tilføjes en eksplicit
--    range-check, der afviser tidspunkter uden for 07:00–18:00 med en klar
--    fejlbesked — en simpel sammenligning efter cast til ::time, fremfor en
--    mere kompliceret regex.
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
    -- strengere DB-CHECK i afsnit 1.
    if v_tid_tekst !~ '^([0-1][0-9]|2[0-3]):(00|15|30|45)$' then
      raise exception 'Tidspunkt skal være på hele, kvarte, halve eller tre-kvarte timer (HH:MM): %', v_tid_tekst;
    end if;

    -- NY arbejdstidsregel: kun tidspunkter mellem 07:00 og 18:00 (begge
    -- inklusive) er gyldige. Simpel range-check efter cast til ::time,
    -- fremfor en mere kompliceret regex — v_tid_tekst er på dette punkt
    -- allerede verificeret til gyldigt HH:MM-format, så cast'et er sikkert.
    if v_tid_tekst::time < time '07:00:00' or v_tid_tekst::time > time '18:00:00' then
      raise exception 'Tidspunkt skal ligge mellem 07:00 og 18:00: %', v_tid_tekst;
    end if;

    -- Selve cast'et er den endelige kalenderkontrol — fx 2026-02-31 fejler
    -- her, selvom regex-formatet ovenfor er opfyldt.
    perform v_dato_tekst::date;
  end loop;

  -- Al validering er nu bestået for samtlige 1-3 elementer.
  -- Opret rundens parent-række. dato/tidspunkt er bevidst udeladt her —
  -- besigtigelse_tidspunkter er source of truth for nye runder.
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
-- 3. RPC-PRIVILEGES — reetableret/verificeret efter CREATE OR REPLACE.
--    Postgres bevarer normalt eksisterende privileges på tværs af en
--    CREATE OR REPLACE FUNCTION med uændret signatur, men denne sektion
--    gentages bevidst som en eksplicit, uafhængig kontrol — ikke en
--    antagelse. Samme mønster og samme fulde signatur som hidtil.
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

commit;
