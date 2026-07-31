# nembyggestyring.dk — Projektinstruktioner til Claude

## Hvad er nembyggestyring.dk?

nembyggestyring.dk / contractr er en dansk platform for private bygherrer,
der hjælper boligejere med at få styr på deres byggeprojekt, før og under
arbejdet.

Platformen hjælper brugeren med at forstå og samle de vigtigste dele af
aftalegrundlaget:

- hvad der skal udføres
- hvad prisen dækker
- hvordan og hvornår der skal betales
- hvilken tidsplan der gælder
- hvordan ekstraarbejde håndteres
- hvordan AB-Forbruger indgår i aftalegrundlaget
- hvornår der bør bookes en rådgiver

Formålet er at gøre private byggeprojekter mere trygge, tydelige og
samarbejdsorienterede — så både bygherre og håndværker ved, hvad der er
aftalt, før arbejdet går i gang, og så dyre overraskelser kan undgås.

**Brand i UI:** contractr er brandet i brugerrettet UI-copy.
nembyggestyring.dk er primært domæne og projektnavn, medmindre andet
aftales. Begge skrives altid med lowercase.
**Live URL:** https://contractr.dk (Vercel, auto-deploy fra `main`)

## Ejer og kontekst

- Oliver Møller Leander, ansat i Safe-Con (byggerådgivning, Odense)
- Safe-Con er første rådgivervirksomhed på platformen
- Jacob (chef, stifter af Ajour EG og Finari) bakker op om ideen

## Målgruppe

- **Bygherre** — privat boligejer, primær bruger og primær betalingsmålgruppe
- **Håndværker/entreprenør** — inviteret via email, gratis adgang,
  gennemgår og godkender aftalegrundlaget
- **Rådgiver (Safe-Con)** — intern bruger, modtager bookinger og ser
  projektdokumenter

---

## Tech-stack

- Next.js 15 App Router, TypeScript
- Tailwind CSS
- Supabase (auth + database med RLS)
- Anthropic API (dokumentgenerering og aftalescreening)
- Stripe (betalinger)
- PostHog (analytics)
- GitHub → Vercel (CI/CD)

**Deploy:** Push til `main` trigger automatisk deploy.
Kør altid `npx tsc --noEmit` inden commit.

---

## AB-Forbruger — præcise regler for platformen

AB-Forbruger er fast udgangspunkt i alle aftalegrundlag oprettet via
platformen. Brugeren kan ikke fravælge AB-Forbruger i standardflowet.

Platformen skal skelne tydeligt mellem tre tilstande:

1. **"AB-Forbruger indgår i aftalegrundlaget"**
   Aftalegrundlaget er genereret og indeholder AB-Forbruger — men
   håndværkeren har endnu ikke accepteret.

2. **"Afventer håndværkerens accept"**
   Aftalegrundlaget er sendt til håndværkeren. AB-Forbruger er ikke
   aftalt endnu.

3. **"AB-Forbruger er accepteret som en del af aftalegrundlaget"**
   Håndværkeren har accepteret aftalegrundlaget via platformen eller på
   anden dokumenterbar måde. AB-Forbruger fremgår nu som en del af det
   accepterede aftalegrundlag.

Platformen må **ikke** skrive at AB-Forbruger gælder over for
håndværkeren, før håndværkeren har accepteret aftalegrundlaget.

---

## Juridisk forsigtighed

Platformen må gerne forklare at alle aftalegrundlag tager udgangspunkt i
AB-Forbruger, og at brugeren ikke kan fravælge det i standardflowet.

**Platformen må ikke love:**
- at brugeren er juridisk sikret
- at der ikke kan opstå tvister eller problemer
- at platformen giver endelig juridisk rådgivning
- at en aftale kan accepteres uden risiko
- at AB-Forbruger gælder automatisk over for håndværkeren, før denne
  har accepteret

AB-Forbruger giver et stærkt aftalegrundlag, men fjerner ikke alle risici.
Der kan stadig opstå uklarheder om arbejdsomfang, pris, tidsplan,
ekstraarbejde, aflevering, mangler, forsinkelse og dokumentation.

**Platformen må sige:**
- "AB-Forbruger er fast udgangspunkt i alle aftalegrundlag oprettet
  via platformen."
- "Aftalegrundlaget sendes til håndværkeren, så begge parter kan
  godkende samme grundlag."
- "AB-Forbruger indgår i aftalegrundlaget."
- "Afventer håndværkerens accept."
- "AB-Forbruger er accepteret som en del af aftalegrundlaget."
- "Det giver klare rammer for pris, betaling, tidsplan, ekstraarbejde,
  aflevering og mangler."
- "Det hjælper med at undgå dyre misforståelser."
- "Dette bør afklares."
- "Dette kan have betydning for dine rettigheder."
- "Vi anbefaler, at du får dette vurderet af en rådgiver."

**Platformen må ikke sige:**
- "Du har juridisk ret til..."
- "Dette er ulovligt."
- "Du kan trygt acceptere."
- "Dette er en endelig juridisk vurdering."
- "Håndværkeren er juridisk bundet" (før accept foreligger)
- "Du er beskyttet" / "du er fuldt juridisk sikret"
- "Der kan ikke opstå problemer"
- "AB-Forbruger gælder automatisk"

---

## Dansk copy og tone

Målgruppen er private danske boligejere. De er ikke jurister, udviklere
eller professionelle bygherrer.

**Teksten skal være:** enkel, konkret, menneskelig, tillidsfuld, kort,
handlingsorienteret, skrevet i naturligt dansk.

**Gode eksempler:**
- "Få tjekket din byggeaftale, før du siger ja."
- "Upload dit tilbud og se, hvad der bør afklares."
- "Få overblik over pris, betaling, tidsplan og ekstraarbejde."
- "Så du ved, hvad du siger ja til."
- "Undgå dyre overraskelser."
- "Book en rådgiver, hvis du vil have en faglig gennemgang."

**Undgå:**
- "professionelt udbudsdokument"
- "juridisk rygrad"
- "AI-powered" / "digital kontraktintelligens"
- "vi sikrer dig juridisk"
- Em-dash (—) — brug komma eller linjeskift
- Lange forklaringer og tunge juridiske vendinger
- Typisk AI-sprog og corporate buzzwords

Platformen skal ikke lyde som en bank, advokatportal, offentlig myndighed
eller teknisk SaaS-platform. Den skal føles som en rolig og professionel
hjælper i et privat byggeprojekt.

---

## Kritiske brugerflows (beskyt altid disse)

1. Besøgende forstår værdien af platformen
2. Bruger kan oprette konto eller logge ind
3. Bruger kan oprette et projekt
4. Bruger kan oprette eller uploade et aftalegrundlag
5. Bruger kan se AB-Forbruger-status (indgår / afventer / accepteret)
6. Bruger kan se næste anbefalede skridt
7. Bruger kan booke eller anmode om en rådgiver
8. Betalingsflow virker, hvis det er aktiveret
9. Bruger kan vende tilbage og finde sit projekt

Når du ændrer i appen, skal du vurdere om et eller flere af disse flows
kan være påvirket.

---

## Designsystem

- Baggrund: `#ffffff`
- Primær: `#1e3a2a` (mørk grøn — knapper, links, aktive states)
- Accent: `#f0f7f3` (lys grøn — kort, hover-states)
- Mørk hero: `#111c17`
- Tekst: `#111827` / sekundær: `#6b7280`
- Runding: `rounded-xl` på knapper/inputs, `rounded-2xl` på kort
- Logo: "contractr" i `var(--font-logo)`, weight 300, lowercase

---

## Kodningsprincipper

- **Tænk før kodning** — spørg ved uklarhed, lav ingen stumme antagelser
- **Enkelhed først** — minimal kode, ingen overingeniering
- **Kirurgiske ændringer** — rør kun hvad der er nødvendigt
- **Verificér** — tjek at ændringer virker før du rapporterer dem som færdige
- **Mobilvisning** — tænk altid mobilvisning med, når UI ændres
- **Bevar designstil** — medmindre andet er eksplicit aftalt

---

## Vigtige principper

- Bevar altid eksisterende funktionalitet
- Forstå implementeringen inden du ændrer den
- Lav små, sikre og reversible ændringer
- Forklar vigtige beslutninger tydeligt
- Fix rodårsagen, ikke symptomet
- Spørg ved uklarhed
- Overskiv eller slet aldrig eksisterende filer uden at vise hvad der
  forsvinder og vente på godkendelse

---

## Opgaveklassifikation

### Lille ændring
Copy/tekst, mindre UI, knap-styling, lille bug, minor layout.

1. Inspicér kun de relevante filer
2. Forklar kort hvad du ændrer
3. Lav ændringen
4. Verificér at komponenten stadig virker
5. Opsummer hvad der ændrede sig

### Mellemstor ændring
Ny komponent, ny side-sektion, brugerflow-justering, Supabase-tilkobling,
formular, state-håndtering, analytics-events, fejlhåndtering.

1. Inspicér det relevante feature-område
2. Identificér berørte filer og afhængigheder
3. Lav en kort plan
4. Vent på godkendelse hvis ændringen berører flere filer eller brugerflows
5. Implementér trinvis
6. Test/verificér flowet
7. Opsummer ændringer og risici

### Større ændring
Database-skema, auth, Stripe/betaling, Supabase RLS, større refaktor,
ny kernefunktion, datamodel, AI-analyse, deploy-ændringer.

1. Lav en fokuseret arkitektur-audit
2. Skriv en plan inden kodning
3. List berørte tabeller, API-ruter, komponenter og integrationer
4. Identificér risici og rollback-strategi
5. Vent på eksplicit godkendelse
6. Implementér i milestones
7. Verificér grundigt inden afslutning

---

## Supabase-regler

Inden du ændrer Supabase-relateret kode, identificér: hvilke tabeller der
er involveret, om koden kører client-side eller server-side, eksisterende
RLS-politikker, typer og relationer.

- Brug `createServiceClient` (bypasser RLS) kun server-side til betroede
  operationer
- Brug `createClient` client-side til bruger-scopede operationer
- Skemaændringer kræver migrationer
- Svæk aldrig RLS uden eksplicit godkendelse
- Eksponer aldrig brugerdata på tværs af konti

## Stripe-regler

Behandl al betalingslogik som høj risiko. Ændr aldrig Stripe checkout,
webhooks, subscriptions, kundestyring eller betalingsstatus uden at
inspicere den nuværende implementering, forklare det nuværende flow,
lave en plan og vente på eksplicit godkendelse.

Stol aldrig på client-side betalingsstatus alene.

## PostHog-regler

Brug meningsfulde events: `project_created`, `offer_uploaded`,
`agreement_check_started`, `advisor_booking_started`, `payment_started`,
`payment_completed`.

Send aldrig følsomt indhold til analytics — ikke kontrakttekst,
dokumentindhold, private beskeder eller personoplysninger.

---

## Definition of done

**Ved kodeændringer:**
- `npx tsc --noEmit` kører uden fejl
- Ingen TypeScript-fejl er introduceret
- Eksisterende funktionalitet er bevaret
- Ingen secrets er eksponeret
- Ingen dead code eller ubrugte imports
- UI er visuelt konsistent og fungerer på mobil
- Dansk tekst er klar og naturlig
- Kritiske brugerflows virker stadig

**Ved ren copy/tekst uden kodepåvirkning:**
- Visuelt/manuelt tjek er tilstrækkeligt
- Verificér at teksten er korrekt på den relevante side

**For større ændringer, verificér også:**
- Supabase-forespørgsler er sikre og RLS er respekteret
- Stripe-logik er uændret
- PostHog-events er meningsfulde og sender ikke følsomt indhold
- Environment variables er dokumenterede
- Migrationer er inkluderede hvor nødvendigt
