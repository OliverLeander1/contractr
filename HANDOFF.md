# nembyggestyring — Teknisk handoff

Sidst opdateret: Juli 2026

Dette dokument er skrevet til den udvikler der overtager projektet. Det beskriver arkitekturen ærligt, inklusiv teknisk gæld og kendte problemer.

---

## Produktet

**nembyggestyring.dk** — digital byggestyring for private bygherrer i Danmark.

Bygherre opretter projekt, inviterer håndværker, begge godkender aftalegrundlag digitalt og projektet styres derfra med aftalesedler, betalingsplan, mangelregistrering og besigtigelse.

**Virksomhed:** Ejes af Oliver Møller Leander  
**Status:** MVP i produktion — ikke klar til betalende kunder endnu (se kritiske problemer nedenfor)

---

## Stack

| Lag | Teknologi |
|-----|-----------|
| Framework | Next.js 15 (App Router), React 19 |
| Sprog | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Database + Auth | Supabase (PostgreSQL + RLS + Realtime) |
| AI | Anthropic Claude API (`claude-sonnet-4-5`) |
| Email | Resend |
| Betaling | Stripe (aktuelt i test-mode) |
| Analytics | PostHog |
| Deploy | Vercel — projekt: `contractr-kgao` |
| Repo | `github.com/OliverLeander1/contractr` |

---

## Miljøvariabler

Alle skal sættes i `.env.local` lokalt og i Vercel Environment Variables i produktion.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=               # service_role JWT — ALDRIG til klienten
NEXT_PUBLIC_URL=                   # https://nembyggestyring.dk
ANTHROPIC_API_KEY=                 # ⚠ ER TOM — AI virker ikke
STRIPE_SECRET_KEY=                 # ⚠ ER I TEST-MODE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=             # ⚠ ER TOM — webhooks valideres ikke
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=           # ⚠ MANGLER — analytics er deaktiveret
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

---

## Kritiske problemer inden go-live

Disse skal løses **inden første betalende kunde**:

### 1. Stripe er i test-mode og webhook-hemmelighed mangler
`STRIPE_SECRET_KEY` starter med `sk_test_`. Ingen rigtige betalinger er mulige.
`STRIPE_WEBHOOK_SECRET` er tom — Stripe webhooks valideres ikke. En angriber kan fake en betalingsbekræftelse og få gratis adgang.

**Fix:** Opret live Stripe-nøgler. Tilføj webhook i Stripe Dashboard til `/api/webhook`. Sæt `STRIPE_WEBHOOK_SECRET`.

### 2. Anthropic API-nøgle mangler
`ANTHROPIC_API_KEY` er tom — AI-screening (`/api/screen`) og udbudsgenerering (`/api/udbud`) fejler i produktion.

**Fix:** Opret nøgle på console.anthropic.com og sæt som miljøvariabel.

### 3. `.env.local` kan være committed til git
Tjek med `git log --all -- .env.local`. Hvis den er der, skal historikken renses og alle nøgler roteres.

### 4. Vercel timeout på AI-endpoints
`/api/screen` har `maxDuration = 60` sekunder. Det kræver Vercel Pro. På gratis-plan timeout efter 10 sekunder.

---

## Arkitektur — sådan er det opbygget

### Supabase-klientmønster (vigtigt at forstå)

Der er to Supabase-klienter med vidt forskellig adgang:

**`createClient()`** — `src/lib/supabase.ts`
```typescript
// Bruger ANON-nøglen. Underlagt Row Level Security (RLS).
// Brug i alle client components og page-filer.
import { createClient } from "@/lib/supabase";
```

**`createServiceClient()`** — `src/lib/supabase-server.ts`
```typescript
// Bruger SERVICE_ROLE-nøglen. Omgår al RLS.
// Brug KUN i API routes (/app/api/...).
// ALDRIG i client components — nøglen ville lække til browseren.
import { createServiceClient } from "@/lib/supabase-server";
```

**Tommelfingerregel:** Hvis en query fejler med "permission denied" eller returnerer tomt pga. RLS, skal den flyttes til en API route med `createServiceClient()`.

### Auth-beskyttelse

Der er ingen Next.js middleware. Auth-beskyttelse sker på to måder:

1. **Client-side:** `<LoginGate>` komponenten eller manuelle `supabase.auth.getUser()` tjek i `useEffect`
2. **API routes:** Tjek `Authorization` header eller brug service client (som stoler på at frontend sender korrekt data)

Dette betyder at servere-renderede sider ikke er beskyttede mod direkte URL-adgang — kun klient-siden tjekker. For en offentlig MVP er det acceptabelt. For en skalerbar løsning bør der tilføjes `middleware.ts`.

### Token-baseret håndværkeradgang

Håndværkere modtager et link: `/kontrakt/[token]/aftale`

`token` er et UUID gemt i `kontrakter.haandvaerker_token`. Ingen login kræves — linket **er** adgangen. API routes der betjener disse sider bruger service client og validerer token manuelt.

---

## Databaseoversigt

Kør migrationer i denne rækkefølge ved ny opsætning (filer i roden af projektet):

1. `supabase-migration-kontrakter.sql`
2. `supabase-migration-chat.sql`
3. `supabase-migration-rls-og-tabeller.sql`
4. `supabase-migration-besigtigelse.sql`

Derudover er der tabeller oprettet direkte i Supabase-dashboardet (ikke migreret til filer): `ekstraarbejde`, `betalinger`, `notifikationer`, `mangler`, `bookinger`, `raadgivere`.

**Anbefaling:** Saml alle DDL-statements i én migrations-mappe (f.eks. `supabase/migrations/`) og brug Supabase CLI til fremtidige ændringer.

### Tabeller

| Tabel | Formål |
|-------|--------|
| `profiler` | Udvider `auth.users`. Navn, email, telefon, adresse, rolle (bygherre/haandvaerker/raadgiver). Oprettes automatisk via trigger ved signup. |
| `projekter` | Kerneobjektet. Status: dialog/ingen-tilbud/tilbud/accepteret/igang/problem/afsluttet. |
| `kontrakter` | Ét udkast per projekt. Status: udkast/inviteret/forhandling/bygherre\_godkendt/haandvaerker\_godkendt/begge\_godkendt. Har `haandvaerker_token` (offentligt link). |
| `kontraktaendringer` | Log over forhandlingsforslag. |
| `ekstraarbejde` | Aftalesedler. Status: sendt/haandvaerker\_udfyldt/godkendt/afvist. |
| `betalinger` | Betalingsmilepæle koblet til projekt. |
| `mangler` | Mangelliste med billeder og status. |
| `besigtigelse` | Besigtigelsesdatoer med kommentarer fra begge parter. |
| `chat_beskeder` | Chatbeskeder med Supabase Realtime. |
| `chat_samtaler` | Én samtale per modpart per projekt. |
| `notifikationer` | AB-motor-notifikationer til bygherre. |
| `dokumenter` | Uploadede filer linket til Supabase Storage bucket `dokumenter`. |
| `screeninger` | AI-screeningsresultat per dokument. |
| `risiko_punkter` | Individuelle punkter fra en screening. |
| `raadgivere` | Rådgiverprofiler. |
| `bookinger` | Bookinger af rådgivere. |

**Storage buckets:** `dokumenter` (privat), `billeder` (privat).

---

## Teknisk gæld — kendte problemer

### localStorage-afhængighed (høj prioritet)

Dele af platformen gemmer bruger- og projektdata i `localStorage` fremfor i databasen. Data forsvinder ved ryd cache og kan ikke tilgås fra andre enheder.

Nøgler der bruges:

| Nøgle | Bruges i |
|-------|----------|
| `contractr_user` | login, LoginGate, Chat, opret/rapport |
| `contractr_projekt` | projekt/\[id\] (legacy fallback), kontrakt, aflevering |
| `contractr_haandvaerker` | haandvaerker/accepter, profil, kontrakt |
| `contractr_tidsplan_${id}` | projekt/\[id\]/tidsplan |

Præfikset `contractr_` er et levn fra det gamle produktnavn. Data i localStorage på brugernes browsere bruger disse nøgler — omdøb dem ikke uden en migrationsstrategi.

**Langsigtet fix:** Flyt al state til Supabase og fjern localStorage-afhængighederne én side ad gangen.

### Hardkodede værdier

- `src/config/site.ts` har `https://www.Nembyggestyring.dk` (stort N — forkert)
- `projekt/[id]/inviter/page.tsx` har fallback til `"https://contractr.dk"` (gammelt domæne)
- `src/app/page.tsx.bak` — en backup-fil committed til git (bør slettes)
- `src/app/raadgiver/page.tsx` — hardkodet Google Meet-link, ingen reel booking-integration

### Debug-endpoint

`/api/debug` er tilgængeligt i produktion. Bør fjernes.

### Ingen fejlovervågning

Der er ingen Sentry eller tilsvarende. Fejl i produktion er usynlige. `console.error` efterladt i:
- `src/app/projekt/[id]/chat/page.tsx`
- `src/app/projekt/[id]/ekstraarbejde/page.tsx`
- `src/app/api/email/route.ts`

**Fix:** Tilføj Sentry (`@sentry/nextjs`) og erstat `console.error` med `Sentry.captureException`.

### Ingen tests

Der er ingen unit-tests, integrationstests eller end-to-end-tests. Kritiske flows som kontrakt-godkendelse og betaling er ikke dækket.

---

## Sidestruktur

### Offentlige sider
- `/` — Forside
- `/pakke` — Pakkeoversigt
- `/abforbruger`, `/guide`, `/det-gode-byggeprojekt` — Indhold
- `/haandvaerkere`, `/entreprenoer` — Info til fagfolk
- `/privatliv`, `/vilkaar` — Juridiske sider

### Auth
- `/login` — Login og opret konto (Supabase auth)
- `/auth/callback` — Supabase OAuth callback

### Bygherre-flow
- `/opret` → `/opret/beskriv` → AI genererer udbudsdokument → `/opret/udbud-resultat`
- `/opret/upload` → `/opret/screening` → `/opret/rapport` — AI-screening af tilbud/kontrakt
- `/dashboard` — Projektoverblik
- `/projekt/[id]` — Projektrum med status, chat, besigtigelse
- `/projekt/[id]/aftale` — Send kontrakt til håndværker
- `/projekt/[id]/ekstraarbejde` — Ekstraarbejde-sedler
- `/projekt/[id]/mangler` — Mangelliste
- `/projekt/[id]/betalinger` — Betalingsplan
- `/projekt/[id]/aflevering` — Afleveringsforretning

### Håndværker-flow (kræver invitation)
- `/kontrakt/[token]/aftale` — Godkend kontrakt via token-link (ingen login kræves)
- `/haandvaerker/sager` — Sagsliste (kræver login)
- `/haandvaerker/projekt/[id]` — Projektrum: aftalegrundlag, besigtigelse, tidsplan, aftalesedler, mangler

### API routes
- `POST /api/udbud` — Generer udbudsdokument via Claude
- `POST /api/screen` — AI-screen tilbud/kontrakt mod AB-Forbruger
- `GET/POST/PATCH /api/besigtigelse` — Besigtigelsesstyring
- `GET /api/kontrakt/[token]` — Hent kontrakt via token
- `POST /api/kontrakt/[token]/godkend` — Håndværker godkender
- `GET /api/projekter/[id]/kontrakter` — Hent kontrakter for projekt
- `GET /api/haandvaerker/sager` — Hent sager for håndværker
- `GET /api/haandvaerker/projekt/[id]` — Hent projektdata til håndværker
- `POST /api/ekstraarbejde/[id]/svar` — Håndværker svarer på aftaleseddel
- `POST /api/email` — Send email via Resend
- `POST /api/checkout` — Opret Stripe checkout
- `POST /api/webhook` — Stripe webhook (betaling gennemført)
- `DELETE /api/bruger/slet` — GDPR: slet bruger og data
- `GET /api/debug` — **Fjern dette inden go-live**

---

## Deploy-procedure

Push til `main` deployer automatisk til nembyggestyring.dk via Vercel.

```bash
cd C:\Users\OliverMøllerLeander\Documents\byggetryg
npx tsc --noEmit          # Tjek for TypeScript-fejl
git add src/              # Stage kun src/ for at undgå .env-filer
git commit -m "..."
git push origin main
```

Vercel-projekt: `contractr-kgao`  
GitHub-repo: `OliverLeander1/contractr`

---

## Hvad der prioriteres som næste skridt

1. Sæt `ANTHROPIC_API_KEY` — AI er kerneprodukt
2. Skift Stripe til live-mode og sæt `STRIPE_WEBHOOK_SECRET`
3. Tjek om `.env.local` er i git-historikken og roter nøgler hvis ja
4. Fjern `/api/debug` og `page.tsx.bak`
5. Tilføj Sentry til fejlovervågning
6. Saml SQL-migrationer i `supabase/migrations/` med Supabase CLI
7. Flyt tidsplan fra localStorage til Supabase
8. Tilføj `middleware.ts` til server-side auth-beskyttelse
