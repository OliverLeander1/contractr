# Aktiv opgave

Oprettelse og gennemgang af projektgrundlagsmigration
(supabase-migration-projektgrundlag.sql).

Dette er udelukkende et skema-forslag. Ingen API, routes eller UI er
implementeret som en del af denne opgave. Migrationen er IKKE kørt.

# Næste manuelle trin

Kør migrationen i Supabase efter brugerens (Olivers) godkendelse —
Dashboard → SQL Editor. Claude må ikke køre den.

# Næste kodeopgave efter bekræftet migration

Implementér sikkert API og første professionelle bygherre-UI til
oprettelse og redigering af projektgrundlag.

Skal som minimum omfatte:

- Bearer JWT + auth.getUser() på alle endpoints
- verificeret projektejerskab (projekter.bygherre_id) som eneste
  adgangskilde
- GET læser, POST opretter, PATCH opdaterer — GET må aldrig oprette en
  række (modsat det eksisterende mønster i GET /api/kontrakt)
- UX/UI-principperne i docs/DECISIONS.md

**Claude må ikke fortsætte automatisk til denne opgave.** Skal først
igangsættes efter Oliver eksplicit har kørt og bekræftet migrationen i
produktion.

# Chat-, navigations- og sikkerhedsfaser (afsluttet)

Global app-shell, bygherrens globale Chat-side, ulæst badge og den
mobile navigationsrettelse er implementeret, produktionsdeployet og
browsertestet. Den tidligere email-query-baserede sikkerhedsrisiko i
GET /api/haandvaerker/sager er lukket (commit d6c55ea), browsertestet
og accepteret. Se docs/PROJECT_STATE.md for detaljer og commit-historik.
Disse faser kræver ikke yderligere opfølgning før pre-contract-arbejdet
fortsætter.
