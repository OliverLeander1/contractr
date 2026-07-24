# Nembyggestyring — Handoff til Phase 2

**Dato:** Juli 2026  
**Frontend:** Next.js 15 App Router (TypeScript) — live på nembyggestyring.dk via Vercel  
**Mål:** Erstat localStorage med rigtig database, tilføj betaling og notifikationer, åbn platformen kommercielt

---

## Status: Hvad er bygget

Al frontend er færdig og fungerer end-to-end med localStorage som midlertidig datapersistens.

### Brugerflows der virker (frontend)

| Flow | URL | Status |
|---|---|---|
| Gratis screening | `/opret/upload` → `/opret/screening` → `/opret/rapport` | ✅ Komplet |
| Opret projekt | `/opret` → `/opret/tips` eller `/opret/beskriv` | ✅ Komplet |
| Bygherre projektrum | `/projekt/[id]` | ✅ Komplet |
| Tidsplan | `/projekt/[id]/tidsplan` | ✅ Komplet |
| Betalingsplan | `/projekt/[id]/betalinger` | ✅ Komplet |
| Mangel-registrering | `/projekt/[id]/mangler` | ✅ Komplet |
| Afleveringsflow | `/projekt/[id]/aflevering` | ✅ Komplet |
| Kontrakt-visning | `/projekt/[id]/kontrakt` | ✅ Komplet |
| Chat (bygherre) | `/projekt/[id]/chat` | ✅ Komplet |
| Håndværker login | `/haandvaerker/opret-konto` | ✅ Komplet |
| Håndværker sager | `/haandvaerker/sager` | ✅ Komplet |
| Håndværker projekt | `/haandvaerker/projekt/[id]` | ✅ Komplet |
| Håndværker nyt tilbud | `/haandvaerker/nyt-tilbud` | ✅ Komplet |
| Pakkevalg (3 tiers) | `/pakke` | ✅ Komplet (ingen betaling endnu) |
| Rådgiverbooking | `/tilkoeb` | ✅ Komplet (ingen booking-backend) |
| AB-Forbruger oversigt | `/abforbruger` | ✅ Komplet |
| Notifikationer | `/notifikationer` | ✅ Frontend klar |

---

## Hvad programmørerne skal bygge

### 1. Database og autentifikation

**Stack-anbefaling:** Supabase (PostgreSQL + Auth + Realtime + Storage)

Supabase giver jer: auth out of the box, row-level security (GDPR-venlig), realtime til chat, filstorage til dokumenter og en Postgres-database — alt i én platform til ca. 25 USD/måned.

**Alternativ:** PlanetScale (MySQL) + NextAuth.js + AWS S3

#### Tabeller der skal oprettes

```sql
-- Brugere
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  navn TEXT,
  rolle TEXT CHECK (rolle IN ('bygherre', 'haandvaerker', 'raadgiver')),
  telefon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projekter
CREATE TABLE projekter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bygherre_id UUID REFERENCES users(id),
  projekttype TEXT NOT NULL,
  adresse TEXT NOT NULL,
  status TEXT DEFAULT 'aktiv',
  budget INTEGER,
  pakke TEXT CHECK (pakke IN ('lille', 'renovering', 'totalrenovering')),
  pakke_betalt_at TIMESTAMPTZ,
  ab_forbruger BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tilbud og screening
CREATE TABLE screeninger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  samlet_risiko TEXT CHECK (samlet_risiko IN ('lav', 'middel', 'høj')),
  resumé TEXT,
  punkter JSONB,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dokumenter
CREATE TABLE dokumenter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  navn TEXT NOT NULL,
  type TEXT, -- 'tilbud', 'kontrakt', 'ekstraarbejde', 'faktura', 'billede', 'rapport'
  storage_path TEXT, -- Supabase Storage path
  uploadet_af UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tidsplan
CREATE TABLE tidsplan_faser (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  label TEXT NOT NULL,
  ansvarlig TEXT,
  start_dato DATE,
  slut_dato DATE,
  note TEXT,
  status TEXT DEFAULT 'kommende', -- 'kommende', 'igang', 'afsluttet'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Betalinger
CREATE TABLE betalinger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  beskrivelse TEXT,
  beloeb INTEGER, -- i øre
  forfald_dato DATE,
  betalt_dato DATE,
  status TEXT DEFAULT 'afventer', -- 'afventer', 'godkendt', 'betalt'
  godkendt_af UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ekstraarbejde
CREATE TABLE ekstraarbejde (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  beskrivelse TEXT NOT NULL,
  beloeb INTEGER, -- i øre
  tidspaavirkning INTEGER, -- dage
  oprettet_af UUID REFERENCES users(id),
  godkendt_af UUID REFERENCES users(id),
  godkendt_at TIMESTAMPTZ,
  status TEXT DEFAULT 'afventer', -- 'afventer', 'godkendt', 'afvist'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mangler
CREATE TABLE mangler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  beskrivelse TEXT NOT NULL,
  alvorlighed TEXT CHECK (alvorlighed IN ('lav', 'middel', 'høj')),
  status TEXT DEFAULT 'åben', -- 'åben', 'under-udbedring', 'lukket'
  billeder TEXT[], -- array af storage paths
  registreret_af UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat-beskeder
CREATE TABLE beskeder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  afsender_id UUID REFERENCES users(id),
  tekst TEXT,
  billede_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Håndværkere på projekt
CREATE TABLE projekt_haandvaerkere (
  projekt_id UUID REFERENCES projekter(id),
  haandvaerker_id UUID REFERENCES users(id),
  rolle TEXT, -- 'toemrer', 'vvs', 'maler', etc.
  status TEXT DEFAULT 'inviteret', -- 'inviteret', 'aktiv', 'afsluttet'
  PRIMARY KEY (projekt_id, haandvaerker_id)
);

-- Betalings-transaktioner (Stripe)
CREATE TABLE betalings_transaktioner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruger_id UUID REFERENCES users(id),
  projekt_id UUID REFERENCES projekter(id),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  beloeb INTEGER, -- i øre
  pakke TEXT,
  status TEXT DEFAULT 'afventer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AB-Forbruger notifikationer
CREATE TABLE notifikationer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  bruger_id UUID REFERENCES users(id),
  type TEXT, -- 'ab_tidsplan', 'ab_ekstraarbejde', 'ab_betaling', 'ab_aflevering', 'ab_eftersyn'
  tekst TEXT,
  laest BOOLEAN DEFAULT FALSE,
  send_dato TIMESTAMPTZ,
  sendt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. API-endepunkter der skal bygges

Alle endepunkter er i `/src/app/api/`. De der allerede eksisterer:

- `POST /api/screen` — Claude AI screening (EKSISTERER, bruger Anthropic API)
- `POST /api/udbud` — Generer udbudsdokument (EKSISTERER, rate-limited)

**Skal bygges:**

```
POST   /api/auth/login          — email/password eller magic link
POST   /api/auth/logout
GET    /api/auth/me             — hent brugerdata

POST   /api/projekter           — opret projekt
GET    /api/projekter           — hent alle brugerens projekter
GET    /api/projekter/[id]      — hent enkelt projekt
PATCH  /api/projekter/[id]      — opdater projekt

POST   /api/projekter/[id]/faser       — tilføj tidsplan-fase
PATCH  /api/projekter/[id]/faser/[fid] — opdater fase
DELETE /api/projekter/[id]/faser/[fid] — slet fase

POST   /api/projekter/[id]/betalinger        — opret betaling
PATCH  /api/projekter/[id]/betalinger/[bid]  — godkend/marker betalt

POST   /api/projekter/[id]/ekstraarbejde           — opret
PATCH  /api/projekter/[id]/ekstraarbejde/[eid]     — godkend/afvis

POST   /api/projekter/[id]/mangler          — registrer mangel
PATCH  /api/projekter/[id]/mangler/[mid]    — opdater status

GET    /api/projekter/[id]/beskeder  — hent chatbeskeder
POST   /api/projekter/[id]/beskeder  — send besked

POST   /api/projekter/[id]/dokumenter  — upload dokument (multipart)
GET    /api/projekter/[id]/dokumenter  — hent dokumentliste

POST   /api/pakke/checkout             — opret Stripe checkout session
POST   /api/pakke/webhook              — Stripe webhook (aktiver pakke ved betaling)

POST   /api/haandvaerker/invite        — send invitation til håndværker
POST   /api/haandvaerker/tilbud        — håndværker sender tilbud

GET    /api/notifikationer             — hent brugerens notifikationer
PATCH  /api/notifikationer/[id]/laest  — marker som læst
```

---

### 3. Betaling med Stripe

**Setup:**
1. Opret Stripe-konto på stripe.com
2. Installer: `npm install stripe @stripe/stripe-js`
3. Env-variabler: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Priser der skal oprettes i Stripe:**
- Lille opgave: 499 DKK engangs → gem `price_xxx` i env
- Renovering: 999 DKK engangs → gem `price_xxx` i env
- Totalrenovering: 1999 DKK engangs → gem `price_xxx` i env

**Flow:**
1. Bruger vælger pakke på `/pakke`
2. Frontend kalder `POST /api/pakke/checkout` med pakke-id og projekt-id
3. Backend opretter Stripe Checkout Session og returnerer session URL
4. Bruger sendes til Stripe's checkout-side
5. Stripe sender webhook til `/api/pakke/webhook` ved vellykket betaling
6. Webhook aktiverer pakken på projektet i databasen
7. Bruger sendes til `/projekt/[id]` med fuld adgang

---

### 4. AB-Forbruger notifikationsmotor

Dette er platformens vigtigste differentiering. Motoren kører dagligt og sammenligner projektets tidsplan med AB-Forbruger's paragraffer.

**Setup:**
- Vercel Cron Jobs (gratis op til 12 kørsler pr. dag)
- Alternativ: GitHub Actions scheduled workflow

**Cron-job: `/api/cron/notifikationer`** — kører kl. 08:00 hver dag

```typescript
// Pseudokode for notifikationsmotoren

async function kørNotifikationer() {
  const dagsDato = new Date();
  
  // Find alle aktive projekter med AB-Forbruger aktiveret
  const projekter = await db.projekter.findMany({ 
    where: { ab_forbruger: true, status: 'aktiv' }
  });

  for (const projekt of projekter) {
    const faser = await db.tidsplan_faser.findMany({ where: { projekt_id: projekt.id }});
    const betalinger = await db.betalinger.findMany({ where: { projekt_id: projekt.id }});

    // § 12 — Tidsplan: hvis ingen faser er aftalt og projekt er over 14 dage gammelt
    if (faser.length === 0 && dagsforskellen(projekt.created_at, dagsDato) > 14) {
      await opretNotifikation(projekt, 'ab_tidsplan', 
        'Du har endnu ikke aftalt en tidsplan med håndværkeren. Det anbefales jf. AB-Forbruger § 12.');
    }

    // § 25 — Betaling: hvis en betaling forfalder inden for 5 dage
    for (const betaling of betalinger) {
      const dagehTilForfald = dagsforskellen(dagsDato, betaling.forfald_dato);
      if (dagehTilForfald === 5 && betaling.status === 'afventer') {
        await opretNotifikation(projekt, 'ab_betaling',
          `En betaling på ${formatKr(betaling.beloeb)} forfalder om 5 dage. Sørg for at arbejdet er dokumenteret inden betaling.`);
      }
    }

    // § 38 — Aflevering: hvis en fase slutter inden for 7 dage
    for (const fase of faser) {
      const dageHenFase = dagsforskellen(dagsDato, fase.slut_dato);
      if (dageHenFase === 7 && fase.status !== 'afsluttet') {
        await opretNotifikation(projekt, 'ab_aflevering',
          `"${fase.label}" nærmer sig sin afslutningsdato. Husk at kræve en formel afleveringsforretning jf. AB-Forbruger § 38.`);
      }
    }

    // § 58 — 1-årseftersyn: 30 dage inden 1 år efter projektstart
    const månederSidenStart = månedDiff(projekt.created_at, dagsDato);
    if (månederSidenStart === 11) {
      await opretNotifikation(projekt, 'ab_eftersyn',
        'Om ca. 1 måned udløber fristen for at kræve 1-årseftersyn. Kontakt håndværkeren for at aftale et tidspunkt jf. AB-Forbruger § 58.');
    }
  }
}
```

**Email-notifikationer:**
- Brug Resend (resend.com) — 3.000 gratis emails/måned, nem Next.js integration
- Alternativ: SendGrid eller Postmark
- Env: `RESEND_API_KEY`

```typescript
// Eksempel på email ved notifikation
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'nembyggestyring <noreply@nembyggestyring.dk>',
  to: bruger.email,
  subject: 'Påmindelse fra dit projekt',
  html: `<p>${notifikation.tekst}</p><a href="https://nembyggestyring.dk/projekt/${projekt.id}">Gå til projektet</a>`
});
```

---

### 5. GDPR og datasikkerhed

**Zero Data Retention (ZDR):**
- Anthropic API bruges til screening. ZDR er aktiveret per default for API-kunder.
- Tilføj til `.env.local`: Dokumentér at `ANTHROPIC_API_KEY` er en ZDR-nøgle.
- Brugere kan informeres om at "Tilbud analyseres af AI og gemmes ikke af AI-udbyderen."

**Databehandleraftale:**
- Underskriv DPA med Anthropic (tilgængelig på anthropic.com/legal)
- Underskriv DPA med Supabase (tilgængelig i Supabase-dashboard)
- Underskriv DPA med Stripe (de er GDPR-compliant)

**Row-Level Security (Supabase):**
```sql
-- Brugere kan kun se egne projekter
CREATE POLICY "Brugere ser egne projekter" ON projekter
  FOR ALL USING (auth.uid() = bygherre_id);

-- Håndværkere ser projekter de er tilknyttet
CREATE POLICY "Håndværkere ser tildelte projekter" ON projekter
  FOR SELECT USING (
    auth.uid() IN (
      SELECT haandvaerker_id FROM projekt_haandvaerkere WHERE projekt_id = id
    )
  );
```

**Ret til sletning:**
Implementer `DELETE /api/auth/slet-konto` der anonymiserer brugerdata (sæt email til `slettet-[uuid]@slettet.dk`, fjern navn og telefon, bevar projektdata i anonymiseret form til statistik).

---

### 6. Miljøvariabler der skal opsættes

```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI (eksisterende)
ANTHROPIC_API_KEY=sk-ant-...

# Betaling
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://nembyggestyring.dk
CRON_SECRET=random-secret-til-at-beskytte-cron-endpoint
```

---

### 7. LocalStorage-nøgler der skal migreres

Al data i dag gemmes i browseren. Disse nøgler skal mappes til database-tabeller:

| localStorage-nøgle | Database-tabel |
|---|---|
| `contractr_user` | `users` |
| `contractr_projekt` | `projekter` |
| `contractr_haandvaerker_sager` | `projekter` + `projekt_haandvaerkere` |
| `contractr_tidsplan_${id}` | `tidsplan_faser` |
| `contractr_chat_${id}` | `beskeder` |
| `contractr_betalinger_godkendt` | `betalinger` |
| `contractr_ekstraarbejde` | `ekstraarbejde` |
| `contractr_mangler` | `mangler` |
| `contractr_haandvaerker_navn` | `users.navn` |
| `screening_resultat` (sessionStorage) | `screeninger` |

---

### 8. Pakliste til Phase 2-lancering

**Must have:**
- [ ] Supabase projekt oprettet og tabeller migreret
- [ ] Autentifikation (email + magic link)
- [ ] Stripe integration og webhook
- [ ] Pakke-betaling aktiverer projekt-adgang
- [ ] Grundlæggende email-notifikationer (velkomst, betaling bekræftet)
- [ ] AB-Forbruger cron-job med email-notifikationer
- [ ] GDPR: cookie-banner (eksisterer), samtykkebox, ret til sletning
- [ ] DPA med Anthropic, Supabase og Stripe

**Nice to have ved lancering:**
- [ ] Realtime chat (Supabase Realtime)
- [ ] Billedupload til Supabase Storage (til mangler og dokumenter)
- [ ] Push-notifikationer (PWA)
- [ ] Rådgiver-booking med kalender-integration

**Kan vente:**
- [ ] Analytics dashboard til Oliver
- [ ] Rådgiver-portal med sagsstyring
- [ ] Anonymiseret prisdata-API

---

### 9. Prisestimater (månedlig drift ved 100 brugere)

| Service | Pris/md |
|---|---|
| Vercel Pro | 20 USD |
| Supabase Pro | 25 USD |
| Anthropic API | ~50 USD (afhænger af brug) |
| Resend | 0 USD (3.000 emails gratis) |
| Stripe | 1,5% + 1,80 DKK per transaktion |
| Domæne (nembyggestyring.dk) | ~100 DKK/år |
| **Total** | **~700 DKK/md** |

---

### 10. Teknisk opsummering til programmørerne

```
Frontend: Next.js 15, TypeScript, Tailwind CSS
Deployed: Vercel (auto-deploy fra GitHub main branch)
Repo: github.com/OliverLeander1/contractr
AI: Anthropic Claude API (claude-sonnet-4-6) — screening og udbudsdokumenter
Auth: INGEN (skal bygges — anbefaler Supabase Auth)
Database: INGEN (al data i localStorage — skal migreres)
Betaling: INGEN (Stripe-formular er stub — skal aktiveres)
Email: INGEN (skal bygges — anbefaler Resend)

Kodebasen er produktionsklar på frontend-siden.
Ingen TypeScript-fejl. Alle sider er bygget og linket korrekt.
AB-Forbruger er standard i alle flows — ingen brugervalg kræves.
```

---

*Sidst opdateret: Juli 2026*
