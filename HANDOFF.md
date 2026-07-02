# Contractr — Handoff til udviklere

## Hvad er dette?

Contractr er en digital tryghedsplatform for private bygherrer i Danmark. Platformen hjælper bygherren med at sende projekter i udbud, modtage og vurdere tilbud, acceptere kontrakt og styre hele byggeprojektet — med AB-Forbruger 2012 som motor.

Bygget med: **Next.js 15 (App Router), TypeScript, Tailwind CSS, Anthropic Claude API**
Deploy: **Vercel** (repo: OliverLeander1/contractr, produktion via contractr-kgao projektet)
Domain: **contractr.dk**

---

## Hvad er bygget (fungerende)

### Udbudsflow (komplet end-to-end)
- `/opret` — Bygherre opretter projekt: type, adresse (DAWA autocomplete), navn, kontakt
- `/opret/beskriv` — Beskriver projekt med billeder af eksisterende forhold
- `/api/udbud` — Claude API genererer professionelt udbudsdokument + struktureret tilbudsliste
- `/opret/udbud-resultat` — Redigerbart dokument, "Del via link"-knap
- `/udbud/se` — Offentlig side (ingen login krævet). Smart detection: contractor udfylder priser (ekskl. moms), bygherre ser diff + priser inkl. moms + AB-tjekliste + accept-knap

### Screening/rapport flow (komplet)
- `/opret/upload` — Upload tilbud/kontrakt
- `/opret/screening` — AI screener mod AB-Forbruger
- `/opret/rapport` — Risikooverblik med anbefalinger
- `/api/screen` — Claude API endpoint for screening

### Projektrum (UI komplet, data fra localStorage)
- `/projekt/[id]` — Dashboard med real projekttitel/total fra localStorage. Tom state hvis intet projekt.
- `/projekt/[id]/kontrakt` — Viser accepteret kontrakt med rigtig tilbudsliste og betalingsplan
- `/projekt/[id]/betalinger` — Betalingsmilepæle koblet til projekttotal, godkend-knap gemmer i localStorage
- `/projekt/[id]/mangler` — Fuldt funktionel: opret mangel med billede + alvorlighed, skift status. Gemmes i localStorage.
- `/projekt/[id]/ekstraarbejde` — Digital aftaleseddel med godkend/afvis flow. Gemmes i localStorage.
- `/projekt/[id]/tidsplan` — Fasebaseret tidsplan (UI, ikke koblet til rigtige datoer)
- `/projekt/[id]/dokumenter` — Dokumentarkiv (demo UI)
- `/projekt/[id]/aflevering` — Afleveringsforretning guide (demo UI)
- `/projekt/[id]/inviter` — Inviter håndværker (demo UI)

### Øvrige sider
- `/tilkoeb` — Rådgiver-ydelser og priser (statisk indhold)
- `/raadgiver` — Rådgiverportal (demo UI)
- `/abforbruger` — AB-Forbruger guide (statisk)
- `/haandvaerker/*` — Håndværker-portal (demo UI, ikke koblet til data)
- `/konto`, `/notifikationer`, `/guide`, `/kontakt` — Demo UI

---

## Hvad mangler (prioriteret)

### 1. Database + auth (KRITISK — blokkerer alt andet)
**Ingen data gemmes server-side.** Alt projektdata lever i localStorage (per browser, ikke på tværs af enheder).

Anbefalet stack:
- **Supabase** (PostgreSQL + auth + storage i ét)
- eller **Clerk** (auth) + **PlanetScale/Neon** (database)

Datamodel er dokumenteret i `CLAUDE.md` (rod-mappen).

Hvad der skal migreres fra localStorage til database:
- `contractr_projekt` → projects tabel
- `contractr_mangler` → defects tabel
- `contractr_betalinger_godkendt` → payment_milestones tabel
- `contractr_ekstraarbejde` → change_orders tabel

### 2. Email-notifikationer
Ingen mails sendes. Anbefalet: **Resend** (dansk-venlig, Next.js integration).

Skal sendes ved:
- Bygherre deler udbudslink med contractor
- Contractor sender tilbud retur
- Bygherre accepterer tilbud
- Betaling godkendes
- Ny mangel registreres

### 3. Håndværker-portal med rigtige data
`/haandvaerker/*` er komplet demo. Skal kobles til samme database som bygherre.

### 4. Filupload til server
Billeder base64-encodes i URL-hash (fungerer men ikke skalerbart). Skal til **Supabase Storage** eller **Vercel Blob**.

### 5. PDF-generering
Kontrakt-siden har "Print/PDF"-knap der bruger browser print. Rigtig løsning: **Puppeteer** eller **@react-pdf/renderer**.

### 6. Betalingsplan med rigtige datoer
Betalingsmilepæle har ingen datoer tilknyttet. Skal kobles til tidsplan og vise forfaldsdatoer.

### 7. AB-notifikationer som aktiv motor
Notifikationssiden (`/notifikationer`) er demo. Skal sende reelle påmindelser baseret på projektets tidsplan og AB-Forbruger paragraffer.

### 8. GDPR
- Cookiebanner er bygget men consent gemmes ikke server-side
- Databehandleraftale skal udarbejdes
- Ret til sletning skal implementeres

---

## Sikkerhed — nuværende tilstand

- Adgangskode til platform: `contractr2025` cookie (middleware.ts). **Skal erstattes med rigtig auth.**
- `/api/udbud` er rate-limiteret til 10 kald/IP/time (in-memory, nulstilles ved serverstart)
- `/api/screen` har ingen rate limiting endnu — **tilføj samme pattern**
- Anthropic API-nøgle ligger i Vercel environment variables (ANTHROPIC_API_KEY). **Roter den eksponerede nøgle fra Git-historik.**
- `/udbud/se` og `/` er offentlige (ingen cookie krævet)

---

## Miljø og deploy

```
ANTHROPIC_API_KEY=sk-ant-...  (Vercel env var)
```

Build: `npm run build`
Dev: `npm run dev`

Vercel projekter:
- contractr-kgao → **produktion** (contractr.dk)
- contractr, contractr-ckqv → staging/preview

---

## Kodestruktur

```
src/
  app/
    api/
      udbud/route.ts    — AI udbudsdokument generering (rate limited)
      screen/route.ts   — AI screening af tilbud
    opret/              — Bygherre opret-flow
    projekt/[id]/       — Projektrum (alle undersider)
    udbud/se/           — Offentlig tilbudsvisning (contractor + bygherre)
    haandvaerker/       — Håndværker-portal (demo)
  components/
    ProjektNav.tsx      — Navigation i projektrum
    ABTip.tsx           — AB-Forbruger info-bokse
    FlowLayout.tsx      — Step-by-step flow wrapper
    Chat.tsx            — Projektkhat (demo)
  middleware.ts         — Cookie-gate, undtager /udbud/* og /api/*
```

---

## Vigtigste næste skridt for professionel udvikler

1. Opsæt Supabase projekt og implementer auth (Clerk eller Supabase Auth)
2. Migrer localStorage-data til database med rigtige user_id relationer
3. Tilføj rate limiting på `/api/screen`
4. Implementer email-notifikationer via Resend
5. Skift billedupload til Supabase Storage
6. Gennemfør GDPR-compliance check
7. Sikkerhedsaudit / pentest inden offentlig launch
8. Roter den eksponerede Anthropic API-nøgle

---

*Senest opdateret: Juli 2025. Bygget med Claude Code (Anthropic).*
