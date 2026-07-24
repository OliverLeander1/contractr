# Nembyggestyring — Programmørspecifikation
## Alt der skal kodes inden lancering

**Projekt:** nembyggestyring.dk  
**Tech stack (eksisterende):** Next.js 15 App Router, TypeScript, Tailwind CSS, Vercel  
**Dato:** Juli 2026  
**Kontakt:** Oliver Møller Leander

---

## Overblik

Frontend er 100% færdig og deployet på Vercel. Al data gemmes i dag i brugerens browser (localStorage). Inden lancering skal I bygge:

1. Database og login
2. Betaling (Stripe)
3. Notifikationsmotor (AB-Forbruger-regler)
4. Arbejdsområder med fotodokumentation (ny feature)
5. Mobiloptimering på alle sider

Der er ingen TypeScript-fejl. Alle sider er bygget og linket korrekt. I skal primært koble frontend til rigtig backend.

---

## DEL 1 — Database og login

### Anbefalet stack
**Supabase** (supabase.com) — giver jer PostgreSQL, login, filstorage og realtime-chat i én platform. Ca. 25 USD/md.

### Login-metoder der skal understøttes
- E-mail + password
- Magic link (brugeren får en login-link på mail — ingen kode at huske)

### Brugerroller
- `bygherre` — ejer projektet, opretter sager
- `haandvaerker` — inviteres til projektet, uploader billeder og opdaterer tidsplan
- `raadgiver` — kan tilgå projektet ved booking (Phase 3)

### Database-tabeller

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  navn TEXT,
  rolle TEXT CHECK (rolle IN ('bygherre', 'haandvaerker', 'raadgiver')),
  telefon TEXT,
  firma TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projekter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bygherre_id UUID REFERENCES users(id),
  projekttype TEXT NOT NULL,
  adresse TEXT NOT NULL,
  status TEXT DEFAULT 'aktiv',
  pakke TEXT CHECK (pakke IN ('lille', 'renovering', 'totalrenovering')),
  pakke_betalt_at TIMESTAMPTZ,
  ab_forbruger BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE screeninger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  samlet_risiko TEXT CHECK (samlet_risiko IN ('lav', 'middel', 'høj')),
  resumé TEXT,
  punkter JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARBEJDSOMRÅDER — central tabel til fotodokumentation
-- Oprettet af håndværkeren, bruges af begge parter
CREATE TABLE arbejdsomraader (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  navn TEXT NOT NULL,           -- fx "Badeværelse", "Gipsarbejde", "Malerarbejde"
  beskrivelse TEXT,
  oprettet_af UUID REFERENCES users(id),
  status TEXT DEFAULT 'aktiv',  -- 'aktiv', 'afsluttet'
  rækkefølge INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLEDER — tilknyttet et arbejdsområde
-- Bruges til: løbende dokumentation, tilsyn og mangelregistrering
CREATE TABLE billeder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arbejdsomraade_id UUID REFERENCES arbejdsomraader(id),
  projekt_id UUID REFERENCES projekter(id),
  storage_path TEXT NOT NULL,   -- sti til fil i Supabase Storage
  url TEXT NOT NULL,            -- offentlig URL
  kommentar TEXT,
  type TEXT DEFAULT 'dokumentation', -- 'dokumentation', 'tilsyn', 'mangel'
  uploadet_af UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MANGLER — kan knyttes til et arbejdsområde
CREATE TABLE mangler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  arbejdsomraade_id UUID REFERENCES arbejdsomraader(id), -- kan være NULL
  beskrivelse TEXT NOT NULL,
  alvorlighed TEXT CHECK (alvorlighed IN ('lav', 'middel', 'høj')),
  status TEXT DEFAULT 'åben',   -- 'åben', 'under-udbedring', 'lukket'
  registreret_af UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tidsplan_faser (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  arbejdsomraade_id UUID REFERENCES arbejdsomraader(id), -- kan knyttes til et område
  label TEXT NOT NULL,
  ansvarlig TEXT,
  start_dato DATE,
  slut_dato DATE,
  note TEXT,
  status TEXT DEFAULT 'kommende',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE betalinger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  beskrivelse TEXT,
  beloeb INTEGER,               -- i øre (499 kr = 49900)
  forfald_dato DATE,
  betalt_dato DATE,
  status TEXT DEFAULT 'afventer',
  godkendt_af UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ekstraarbejde (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  arbejdsomraade_id UUID REFERENCES arbejdsomraader(id),
  beskrivelse TEXT NOT NULL,
  beloeb INTEGER,
  tidspaavirkning INTEGER,      -- dage
  oprettet_af UUID REFERENCES users(id),
  godkendt_af UUID REFERENCES users(id),
  godkendt_at TIMESTAMPTZ,
  status TEXT DEFAULT 'afventer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE beskeder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  afsender_id UUID REFERENCES users(id),
  tekst TEXT,
  billede_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projekt_haandvaerkere (
  projekt_id UUID REFERENCES projekter(id),
  haandvaerker_id UUID REFERENCES users(id),
  fag TEXT,                     -- 'vvs', 'toemrer', 'maler', etc.
  status TEXT DEFAULT 'inviteret',
  PRIMARY KEY (projekt_id, haandvaerker_id)
);

CREATE TABLE notifikationer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projekter(id),
  bruger_id UUID REFERENCES users(id),
  type TEXT,                    -- se liste under "Notifikationsmotor"
  tekst TEXT,
  laest BOOLEAN DEFAULT FALSE,
  sendt_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE betalings_transaktioner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruger_id UUID REFERENCES users(id),
  projekt_id UUID REFERENCES projekter(id),
  stripe_session_id TEXT,
  beloeb INTEGER,
  pakke TEXT,
  status TEXT DEFAULT 'afventer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row-level security (GDPR)
Supabase har RLS built-in. Sæt op så:
- Bygherre ser kun egne projekter
- Håndværker ser kun projekter de er tilknyttet
- Ingen bruger kan se andre brugeres data

---

## DEL 2 — API-endepunkter

Alle eksisterende endepunkter er i `/src/app/api/`. Disse eksisterer allerede:
- `POST /api/screen` — AI-screening med Claude (VIRKER)
- `POST /api/udbud` — Generer udbudsdokument (VIRKER)

### Skal bygges

```
# Auth
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# Projekter
POST   /api/projekter
GET    /api/projekter
GET    /api/projekter/[id]
PATCH  /api/projekter/[id]

# Arbejdsområder (NY FEATURE)
GET    /api/projekter/[id]/omraader
POST   /api/projekter/[id]/omraader
PATCH  /api/projekter/[id]/omraader/[oid]
DELETE /api/projekter/[id]/omraader/[oid]

# Billeder per arbejdsområde (NY FEATURE)
GET    /api/projekter/[id]/omraader/[oid]/billeder
POST   /api/projekter/[id]/omraader/[oid]/billeder   -- multipart/form-data
DELETE /api/projekter/[id]/omraader/[oid]/billeder/[bid]

# Mangler
GET    /api/projekter/[id]/mangler
POST   /api/projekter/[id]/mangler
PATCH  /api/projekter/[id]/mangler/[mid]

# Tidsplan
GET    /api/projekter/[id]/faser
POST   /api/projekter/[id]/faser
PATCH  /api/projekter/[id]/faser/[fid]
DELETE /api/projekter/[id]/faser/[fid]

# Betalinger
GET    /api/projekter/[id]/betalinger
POST   /api/projekter/[id]/betalinger
PATCH  /api/projekter/[id]/betalinger/[bid]

# Ekstraarbejde
GET    /api/projekter/[id]/ekstraarbejde
POST   /api/projekter/[id]/ekstraarbejde
PATCH  /api/projekter/[id]/ekstraarbejde/[eid]

# Chat
GET    /api/projekter/[id]/beskeder
POST   /api/projekter/[id]/beskeder         -- tekst + valgfrit billede

# Dokumenter (generelt)
GET    /api/projekter/[id]/dokumenter
POST   /api/projekter/[id]/dokumenter

# Stripe
POST   /api/pakke/checkout                  -- opret checkout session
POST   /api/pakke/webhook                   -- Stripe webhook

# Notifikationer
GET    /api/notifikationer
PATCH  /api/notifikationer/[id]/laest

# Cron (beskyttes med CRON_SECRET header)
POST   /api/cron/notifikationer             -- kører dagligt kl. 08:00
```

---

## DEL 3 — Ny feature: Arbejdsområder med fotodokumentation

Dette er en kernefunktion der skal bygges fra bunden. Den løser et reelt problem: bygherre og håndværker skal løbende dokumentere arbejdet under de enkelte arbejdsopgaver.

### Konceptet

Håndværkeren opretter arbejdsområder under et projekt. Det kan være rum (Badeværelse, Soveværelse) eller opgavetyper (Gipsarbejde, Malerarbejde, VVS-installation). Under hvert område kan begge parter uploade billeder.

**Tre formål for billeder:**
1. **Løbende dokumentation** (håndværkeren): "Her er isolering bag gipsvæggen", "Rørføring inden dækning" — bevis for udførelse
2. **Tilsyn** (bygherre): "Jeg var på besøg i dag og noterede følgende" — uafhængig kontrol
3. **Mangel** (begge): Billede knyttes automatisk til en mangel-registrering

### Sider der skal bygges (frontend)

#### `/projekt/[id]/omraader` — Arbejdsområder (bygherre-visning)
```
Oversigt over alle arbejdsområder
For hvert område: navn, antal billeder, seneste aktivitet
Knap: "Se billeder" → åbner billedgalleri for det område
Knap: "Registrer mangel" → åbner mangel-formular med område forudfyldt
Filter: "Vis kun mine" / "Vis alle"
```

#### `/haandvaerker/projekt/[id]/omraader` — Arbejdsområder (håndværker-visning)
```
Samme som ovenfor + knap "Opret nyt arbejdsområde"
Under hvert område: knap "Upload billeder" → kamera/filvælger
Upload-knap: på mobil åbner kameraet direkte (accept="image/*,capture=camera")
Kommentarfelt til hvert billede (fx "Isolering bag vest-væg, 12 cm mineral")
```

#### Billedgalleri per område (modal eller underside)
```
Grid af thumbnails
Klik → fuld visning med kommentar, dato og hvem der uploadede
"Download alle" som ZIP (nice-to-have)
"Markér som mangel" → konverterer billedet til mangel-registrering
```

### Frontend-kode (ny komponent der skal skrives)

```tsx
// Eksempel-komponent til upload på mobil
// Vigtigt: capture="camera" åbner kameraet direkte på iOS og Android

<input
  type="file"
  accept="image/*"
  capture="camera"  // ← denne attribut er afgørende på mobil
  multiple
  onChange={handleUpload}
/>
```

### Integration med eksisterende features

- **Mangler (`/projekt/[id]/mangler`)**: Tilføj dropdown "Tilknyt til arbejdsområde" i formular
- **Tidsplan (`/projekt/[id]/tidsplan`)**: Vis antal billeder per fase hvis fase har et tilknyttet arbejdsområde
- **Tilsyn**: Er ikke en separat side — det er et "billede-type"-filter (type = 'tilsyn') under arbejdsområder

### Filstorage

Brug **Supabase Storage**. Opret en bucket `projektbilleder` med følgende struktur:
```
projektbilleder/
  {projekt_id}/
    {arbejdsomraade_id}/
      {timestamp}_{filnavn}.jpg
```

Maks. filstørrelse: 20 MB per billede. Komprimer automatisk til 2000px bredde inden upload (brug `browser-image-compression` pakken — 4 KB, ingen dependencies).

---

## DEL 4 — Betaling med Stripe

### Setup
```bash
npm install stripe @stripe/stripe-js
```

### Miljøvariabler
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Priser der skal oprettes i Stripe Dashboard
| Pakke | Pris | Stripe Price ID |
|---|---|---|
| Lille opgave | 499 DKK | gem som `STRIPE_PRICE_LILLE` |
| Renovering | 999 DKK | gem som `STRIPE_PRICE_RENOVERING` |
| Totalrenovering | 1999 DKK | gem som `STRIPE_PRICE_TOTAL` |

### Checkout-flow
1. Bruger vælger pakke på `/pakke` og klikker "Betal"
2. Frontend: `POST /api/pakke/checkout` med `{ pakke: 'renovering', projekt_id: '...' }`
3. Backend opretter Stripe Checkout Session med `success_url` og `cancel_url`
4. Brugeren sendes til Stripe's side (hosted checkout)
5. Stripe sender webhook til `/api/pakke/webhook` med event `checkout.session.completed`
6. Backend: sæt `projekter.pakke = 'renovering'` og `pakke_betalt_at = NOW()`
7. Bruger landes på `/projekt/[id]?betalt=1` med bekræftelsesbesked

### Webhook-handler (pseudokode)
```typescript
// /src/app/api/pakke/webhook/route.ts
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { projekt_id, pakke } = session.metadata;
    
    await db.projekter.update({
      where: { id: projekt_id },
      data: { pakke, pakke_betalt_at: new Date() }
    });
    
    // Send velkomstmail
    await sendEmail(session.customer_email, 'betaling-bekræftet', { pakke });
  }
  
  return Response.json({ received: true });
}
```

---

## DEL 5 — AB-Forbruger notifikationsmotor

Kør som Vercel Cron Job dagligt kl. 08:00.

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/notifikationer",
    "schedule": "0 8 * * *"
  }]
}
```

### Regler der skal implementeres

| Trigger | AB-Forbruger § | Notifikation |
|---|---|---|
| Ingen tidsplan aftalt, projekt > 14 dage gammelt | § 12 | "Bed håndværkeren om en skriftlig tidsplan med start- og slutdato." |
| Betaling forfalder om 5 dage | § 25 | "En betaling forfalder snart. Betal kun mod dokumenteret fremdrift." |
| Fase nærmer sig slutdato (7 dage) | § 38 | "Husk at kræve afleveringsforretning inden du overtager arbejdet." |
| Ekstraarbejde registreret uden godkendelse | § 23 | "Ekstraarbejde bør godkendes skriftligt inden opstart." |
| 11 måneder efter projektstart | § 58 | "Fristen for 1-årseftersyn nærmer sig. Kontakt håndværkeren nu." |

### Email-service
Brug **Resend** (resend.com). Gratis op til 3.000 mails/måned.
```bash
npm install resend
```
```env
RESEND_API_KEY=re_...
```

---

## DEL 6 — Mobiloptimering

**Krav: Platformen skal fungere 100% på telefon — for både bygherre og håndværker.**

### Tjekliste per side

#### Chat (`/projekt/[id]/chat`)
- [ ] Inputfelt ikke dækket af tastatur på iOS (brug `window.scrollIntoView`)
- [ ] Billede-upload: `<input type="file" accept="image/*" capture="camera">` — åbner kamera direkte
- [ ] "Send"-knap er mindst 44x44px (Apple HIG minimum tap-target)
- [ ] Auto-scroll til seneste besked ved ny besked

#### Arbejdsområder / fotodokumentation (NY)
- [ ] Upload-knap åbner kamera direkte på mobil (`capture="camera"`)
- [ ] Thumbnails: 2-kolonners grid på mobil, 3-4 på desktop
- [ ] Fuld skærm-visning ved klik på billede (modal)
- [ ] Stryg for at skifte billede i fuld visning

#### Mangler (`/projekt/[id]/mangler`)
- [ ] Kamera-knap til billedupload af manglen
- [ ] Arbejdsområde-dropdown i formularen
- [ ] Mangel-liste er scrollbar og brugbar på smal skærm

#### Tidsplan (`/projekt/[id]/tidsplan`)
- [ ] Datofelter: brug `<input type="date">` (native datepicker på mobil)
- [ ] Fase-kort er læsbare på 375px bredde (iPhone SE)

#### Håndværker projekt (`/haandvaerker/projekt/[id]`)
- [ ] Tab-navigation er touchvenlig (tilstrækkelig tap-target)
- [ ] Upload-billede knap synlig og nem at ramme med tommelfingeren

#### Generelt (alle sider)
- [ ] Ingen tekst under 14px
- [ ] Alle knapper minimum 44x44px
- [ ] Touch-targets har mindst 8px mellemrum
- [ ] Ingen hover-only interaktioner (hover virker ikke på touch)
- [ ] Scroll virker korrekt — ingen fastlåste sektioner
- [ ] Test på: iPhone SE (375px), iPhone 14 (390px), Samsung Galaxy (360px)

### Vigtigste mobilfejl der ofte opstår i Next.js
- iOS Safari: `position: fixed` med `bottom: 0` kan dækkes af browser-toolbar. Fix: brug `env(safe-area-inset-bottom)` i padding.
- Kamera-upload: kræver HTTPS. Vercel giver HTTPS automatisk. Virker ikke på localhost uden cert.
- iOS tastatur: skubber viewport op og kan skjule inputfelt. Test specifikt i Safari på iPhone.

---

## DEL 7 — Miljøvariabler (komplet liste)

Opret disse i Vercel Dashboard under Settings → Environment Variables:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI screening (eksisterer allerede)
ANTHROPIC_API_KEY=sk-ant-...

# Betaling
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_LILLE=price_...
STRIPE_PRICE_RENOVERING=price_...
STRIPE_PRICE_TOTAL=price_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@nembyggestyring.dk

# Cron-beskyttelse
CRON_SECRET=generer-et-langt-random-string-her

# App
NEXT_PUBLIC_APP_URL=https://nembyggestyring.dk
```

---

## DEL 8 — Pakker og adgangskontrol

AB-Forbruger er standard i alle pakker. Adgangskontrol baseres på hvilken pakke projektet har.

| Feature | Lille (499 kr.) | Renovering (999 kr.) | Totalrenovering (1.999 kr.) |
|---|---|---|---|
| Rapport med alle fund | ✅ | ✅ | ✅ |
| Kopiérbar besked til håndværker | ✅ | ✅ | ✅ |
| Projektrum, tidsplan og chat | ✅ | ✅ | ✅ |
| Dokumentupload | ✅ | ✅ | ✅ |
| Arbejdsområder + billeder | ✅ | ✅ | ✅ |
| Ekstraarbejde-sedler | ❌ | ✅ | ✅ |
| Betalingsplan koblet til fremdrift | ❌ | ✅ | ✅ |
| Afleveringsflow | ❌ | ✅ | ✅ |
| Mangel-registrering | ❌ | ✅ | ✅ |
| AB-Forbruger notifikationer (email) | ❌ | ✅ | ✅ |
| 1-årseftersyn reminder | ❌ | ✅ | ✅ |
| Online møde med byggesagkyndig (30 min.) | ❌ | ❌ | ✅ |
| Prioriteret support | ❌ | ❌ | ✅ |

Frontend skal tjekke `projekt.pakke` og vise en "Opgradér din pakke"-besked ved features brugeren ikke har adgang til.

---

## DEL 9 — GDPR

### Krav
- Bruger skal kunne slette sin konto og alle tilknyttede data
- Anonymisér ved sletning: sæt email til `slettet-[uuid]@slettet.dk`, fjern navn og telefon
- Bevar anonymiseret projektdata til intern statistik (lovligt)
- Cookie-banner eksisterer allerede på frontenden

### Databehandleraftaler der skal underskrives
1. Anthropic (anthropic.com/legal) — AI-behandling af tilbud
2. Supabase (supabase.com/privacy) — databasehosting
3. Stripe (stripe.com/privacy) — betalingsbehandling
4. Resend — e-mailudsendelse

### Zero Data Retention (ZDR)
Anthropic gemmer ikke API-kald til træning per default for API-kunder. Dokumentér dette i jeres privatlivspolitik.

---

## DEL 10 — Accepttest inden lancering

Før I erklærer platformen klar skal disse flows testes end-to-end:

### Flow 1: Bygherre uploader tilbud og køber pakke
1. Gå til nembyggestyring.dk på mobil
2. Klik "Tjek tilbud gratis"
3. Upload et PDF-tilbud
4. Gennemfør screening
5. Modtag rapport
6. Klik "Opret projektrum"
7. Vælg "Renovering" pakke
8. Gennemfør Stripe-betaling (test-kort: 4242 4242 4242 4242)
9. Verificér at projektrum er aktiveret
10. Verificér at bekræftelsesmail er modtaget

### Flow 2: Håndværker modtager invitation og uploader billeder
1. Bygherre inviterer håndværker via email
2. Håndværker klikker invitationslink på mobil
3. Håndværker opretter konto
4. Håndværker opretter arbejdsområde "Badeværelse"
5. Håndværker uploader billede fra kameraet (test på rigtig telefon)
6. Bygherre ser billedet i sit projektrum

### Flow 3: Mangel registreres og behandles
1. Bygherre registrerer mangel under "Badeværelse"
2. Tager billede med telefon
3. Håndværker modtager notifikation
4. Håndværker ændrer status til "Under udbedring"
5. Bygherre lukker manglen

### Flow 4: AB-Forbruger notifikation
1. Opret projekt med slutdato om 7 dage
2. Kør cron-job manuelt: `POST /api/cron/notifikationer` med `CRON_SECRET` header
3. Verificér at notifikation oprettes i databasen
4. Verificér at email er modtaget

---

## DEL 11 — Ting der kan vente til Phase 3

Disse skal IKKE blokere lanceringen:

- Rådgiver-portal med kalender og sagsoversigt
- Direktebooking af rådgiver (knapper eksisterer, backend mangler)
- Anonym prisdata-API til markedsrapporter
- Push-notifikationer (PWA)
- Integration med Byg og Miljø (BBR)
- Multi-entreprise koordination (byggeleder-rolle)
- Kaskade-tidsplan (automatisk forskydning ved forsinkelse)

---

## Kontakt og adgang

| Ressource | Detalje |
|---|---|
| GitHub repo | github.com/OliverLeander1/contractr |
| Live site | nembyggestyring.dk |
| Vercel projekt | contractr-kgao |
| Deploy | Auto fra GitHub main branch |
| Tech kontakt | Oliver Møller Leander |

Alle spørgsmål til kodebasen: læs `HANDOFF_PHASE2.md` i samme mappe for fuld teknisk dokumentation.

---

*Sidst opdateret: Juli 2026*
