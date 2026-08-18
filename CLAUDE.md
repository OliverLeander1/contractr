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
**Live URL:** https://nembyggestyring.dk (Vercel, auto-deploy fra `main`)

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

## Arbejdsproces og rapportering (permanent)

Faste arbejdsregler — skal ikke gentages i fremtidige prompts.

- Én aktiv opgave ad gangen. Se docs/ACTIVE_TASK.md for den aktuelle.
- Commit/push kun efter bekræftet browsertest — eller når Oliver
  eksplicit godkender commit/push uden browsertest i den konkrete opgave.
- SQL/migrationer køres aldrig automatisk. Skriv migrationsfilen, vent
  på at Oliver selv kører den i Supabase, og få bekræftelse før
  tilhørende applikationskode implementeres.
- Ingen `git stash`, `reset`, `checkout` (destruktivt) eller `clean`
  uden eksplicit godkendelse i den konkrete opgave.
- Stage aldrig med `git add .` eller `git add -A` — kun eksplicitte
  filstier navngivet af Oliver eller tydeligt afgrænset af opgaven.
- Beskyttede untracked filer (liste i docs/PROJECT_STATE.md, "Beskyttede
  untracked filer") må aldrig stages, ændres, slettes eller køres.
- Genbrug eksisterende arkitektur, komponenter, helpers og mønstre før
  noget nyt oprettes (se "Genbrug før ny kode" nedenfor).
- Undgå unødig teknisk gæld (se "Kodekvalitet og teknisk gæld" nedenfor).
- UX/UI er lige så vigtigt som funktionalitet og sikkerhed — ikke noget
  der eftermonteres. De permanente UX/UI-principper (inkl. mobilkrav)
  står i docs/DECISIONS.md, "UX/UI-principper", og gælder for alle nye
  funktioner uden at skulle gentages her.
- `npx tsc --noEmit`, relevant ESLint, `npm run build` og
  `git diff --check` skal være grønne før enhver commit.
- Rapporter er som udgangspunkt korte. En lang, struktureret rapport
  (jf. Analyseprotokollen nedenfor) er kun nødvendig ved reel
  sikkerheds-, database- eller arkitektur-usikkerhed.
- Gentag ikke indhold, der allerede står i CLAUDE.md eller docs/-filerne
  — henvis til det i stedet.

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

## Analyseprotokol

Ved analyseopgaver skal du prioritere dokumentation, præcision og sikkerhed over hurtige konklusioner.

### 1. Start med eksisterende kode

Før du foreslår en løsning, skal du:

- inspicere alle relevante filer
- finde samtlige reads og writes for de berørte felter
- finde relevante API-routes, serverfunktioner og UI-komponenter
- kontrollere eksisterende validering, auth, låsning og nulstilling
- undersøge, om samme logik findes flere steder

Henvis til konkrete filstier, funktioner og kodeområder.

Du må ikke konkludere alene ud fra:

- et feltnavn
- en UI-tekst
- en skjult knap
- et TypeScript-interface
- en lokal SQL-fil
- en enkelt route

Spor den faktiske adfærd gennem hele dataflowet.

### 2. Adskil fakta og antagelser

Klassificér væsentlige udsagn som:

- DOKUMENTERET: Kan direkte bevises ud fra den inspicerede kode eller det materiale, du faktisk har adgang til.
- SANDSYNLIGT: Understøttes af fundene, men kan ikke bevises fuldt ud.
- UKENDT: Kræver databaseaudit, runtime-test, produktionsadgang eller anden ekstern kontrol.
- PRODUKTBESLUTNING: Kan ikke afgøres teknisk og kræver Olivers stillingtagen.

Du må ikke fremstille en sandsynlig eller ukendt konklusion som et dokumenteret faktum.

Eksempler:

- At en SQL-fil findes lokalt, beviser ikke, at den er kørt i produktion.
- At en tabel bruges i kode, beviser ikke, hvilken migration der oprettede den.
- At en knap er skjult i UI, beviser ikke, at API'et er server-side låst.
- At et felt hedder "godkendt", beviser ikke dets produktmæssige betydning.
- At TypeScript forventer en bestemt datatype, beviser ikke, at alle eksisterende databaserækker følger typen.
- At en route bruger et token, beviser ikke, at brugeren er autentificeret eller autoriseret til handlingen.

### 3. Kontrollér hele dataflowet

For hvert centralt felt eller datastruktur skal du undersøge:

- tabel og datatype
- nullability og defaults
- hvem der kan skrive feltet
- alle routes og serverfunktioner der skriver feltet
- alle sider og komponenter der læser feltet
- hvilke payloads der kan indeholde feltet
- eksisterende validering
- server-side autorisation
- hvornår feltet låses
- hvornår feltet nulstilles
- om klienten kan skrive serverstyrede værdier
- om der findes parallelle sources of truth
- om null, false, tom string og tomt array fortolkes forskelligt
- om eksisterende data kan have ældre formater
- om ændring af feltet påvirker andre felter, statustilstande eller godkendelser

Undersøg også, om samme felt kan skrives gennem flere forskellige routes. Hvis det kan, skal validering, autorisation og låsning sammenlignes på tværs af alle write-paths.

### 4. Adskil nuværende og ønsket adfærd

Rapportér separat:

A. Hvad systemet dokumenteret gør i dag

B. Hvad produktreglerne kræver

C. Hvor de to afviger

D. Den mindste mulige rettelse

Bland ikke ønsket produktlogik ind i beskrivelsen af den nuværende kode.

Beskriv ikke en foreslået fremtidig model, som om den allerede eksisterer.

### 5. Modsigelseskontrol

Før du afslutter en rapport, skal du kontrollere:

- om forskellige sider bruger forskellige betingelser for samme tilstand
- om status og timestamps kan modsige hinanden
- om frontend og API fortolker samme felt forskelligt
- om flere routes har forskellige allowlists, valideringer eller låse
- om en foreslået rettelse påvirker andre statusser eller flows
- om rapportens egne afsnit modsiger hinanden
- om en konklusion kræver information, du ikke har adgang til
- om et server-side problem fejlagtigt beskrives som et rent UI-problem
- om noget beskrives som låst, selv om låsen kun findes i UI
- om en GET-route har writes eller andre sideeffekter
- om en foreslået rettelse kan ramme udkast, inviterede eller allerede godkendte sager forskelligt

Beskriv fundne modsigelser eksplicit.

Hvis du retter en tidligere konklusion, skal du tydeligt oplyse:

- hvad den tidligere konklusion var
- hvorfor den var for bred eller forkert
- hvad der nu er dokumenteret

### 6. Sikkerhed og autorisation

Et token, ID, e-mailfelt, URL-parameter eller request-body-felt må ikke automatisk antages at bevise brugerens identitet eller rolle.

Ved auth-analyse skal du altid skelne mellem:

- identifikation af en sag
- autentifikation af en bruger
- autorisation til en handling
- brugerens rolle i den konkrete sag

Kontrollér server-side:

- hvordan session eller JWT verificeres
- hvordan brugeren knyttes til sagen
- hvordan rollen udledes
- om ejerskab verificeres
- om en bruger kan vælge sin egen rolle i request-body
- om en part kan handle på den anden parts vegne
- om en part kan godkende sit eget forslag
- om service role-klienten omgår RLS
- om klientbaseret adgangskontrol også håndhæves i API'et

En bruger, som ikke dokumenteret matcher en tilladt rolle, skal behandles som uautoriseret. Serveren må ikke gætte rollen.

### 7. Forslag til rettelser

For hver foreslået rettelse skal du beskrive:

- det dokumenterede problem
- problemets konsekvens
- om risikoen er aktiv gennem det eksisterende UI eller kun gennem direkte API-kald
- berørte filer
- berørte reads og writes
- risiko for eksisterende data
- behov for databaseændring
- behov for samtidig klient- og API-deployment
- testplan
- rollback-mulighed
- om ændringen er selvstændigt deploybar
- om den kan ændre eksisterende brugeradfærd

Foreslå ikke større refaktorering, hvis en mindre rettelse kan løse problemet.

Vælg som udgangspunkt:

Den mindste rettelse, der lukker den største dokumenterede risiko uden at ændre database eller eksisterende data.

Du må ikke anbefale at:

- slette felter
- omdøbe databasekolonner
- køre migrationer
- normalisere produktionsdata
- ændre RLS
- omskrive hele flows

uden først at dokumentere behovet og vente på særskilt godkendelse.

### 8. Analyse før implementering

Ved nye features, authændringer, backendændringer eller dataflowændringer:

- foretag først kun analyse
- ændr ingen filer
- vent på eksplicit godkendelse
- implementér derefter én lille fase ad gangen
- stop, hvis flere filer eller større ændringer bliver nødvendige end godkendt
- stop, hvis analysen viser behov for database-, schema-, auth- eller RLS-ændringer, som ikke allerede er særskilt godkendt

Ved små UI-rettelser skal du fortsat bekræfte:

- TypeScript ren
- ændrede filer
- ingen database/schema
- ingen auth
- ingen API-routes
- ingen Supabase writes
- ingen Stripe/PostHog
- ingen commit/push uden godkendelse

### 9. Outputformat

Større analyser skal som minimum indeholde:

1. Dokumenterede fund
2. Sandsynlige, men ikke beviste forhold
3. Ukendte forhold
4. Produktbeslutninger
5. Nuværende dataflow
6. Modstridende eller parallel logik
7. Risikoklassifikation
8. Mindste sikre næste skridt
9. Berørte filer og write-paths
10. Risiko for eksisterende data
11. Test- og rollbackplan
12. Punkter der kræver godkendelse

Risikoklassifikation:

- GRØN: Dokumenteret konsistent og forsvarligt
- GUL: Uklart, teknisk gæld eller bør forbedres
- RØD: Reel risiko for forkert autorisation, dataintegritet, forkert godkendelsesstatus eller tab af funktionalitet

Skeln tydeligt mellem:

- dokumenteret fejl
- mulig risiko
- navngivningsproblem
- produktbeslutning
- kosmetisk oprydning

### 10. Ingen overdrivelse

Brug præcise formuleringer.

Skriv eksempelvis:

- "Repoet viser, at tabellen bruges"
- ikke "Migrationen er kørt i produktion"

- "JSONB-feltet kan få en forkert datastruktur"
- ikke "Databasen bliver korrupt"

- "UI'et skjuler redigering"
- ikke "Feltet er låst", medmindre API'et også håndhæver det

- "Koden gør det teknisk muligt gennem et direkte API-kald"
- ikke "Alle brugere kan uden videre gøre det", hvis det kræver kendskab til token, route og payload

- "Det kan ikke fastslås ud fra repoet"
- ikke et gæt forklædt som en konklusion

- "Denne SQL-fil kan være kørt"
- ikke "Denne SQL-fil er kørt", medmindre det er verificeret

---

## Kodekvalitet og teknisk gæld

### Sammenhængende features

- En feature må gerne ændre flere direkte relaterede filer.
- Undgå kunstigt små ændringer, der efterlader funktionen halvfærdig.
- Én commit skal stadig have ét klart formål.
- Uvedkommende oprydning må ikke blandes ind i en featurecommit.

### Genbrug før ny kode

- Søg efter eksisterende komponenter, typer, helpers og statusmodeller før ny kode oprettes.
- Undgå parallelle systemer for samme produktfunktion.
- Udvid eksisterende løsninger, når det er forsvarligt.

### Undgå duplikeret domænelogik

Følgende må ikke kopieres ukontrolleret mellem sider:

- statusberegninger
- rolletjek
- godkendelsesregler
- handlingsprioritet
- dato- og tidsformatering
- mapping fra databaseværdier til UI-tekster

Hvis samme domænelogik findes tre eller flere steder, skal Claude:

- foreslå eller anvende en fælles helper/type/model
- eller dokumentere, hvorfor samling ikke er hensigtsmæssig endnu

Sikkerheds- og rollelogik skal vurderes allerede ved to gentagelser.

### Serveren er source of truth

- Roller, medlemskab, statusovergange og bindende produktregler skal håndhæves server-side.
- Klientlogik må ikke være eneste beskyttelse.
- URL-parametre, request-body og props er ikke verificeret identitet.
- UI må ikke vise handlinger, som serveren afviser.

### TypeScript

Undgå:

- `any`
- brede string-typer for kendte statusværdier
- unødvendige type assertions
- ukontrollerede non-null assertions
- flere forskellige interfaces for samme datamodel

Undtagelser skal være lokale og begrundede.

### Fejlhåndtering

Undgå:

- tomme catch-blokke
- ikke-OK responses behandlet som succes
- tekniske fejl behandlet som tomme data
- loading-state der ikke nulstilles
- fejl der skjuler en afventende brugerhandling uden information
- generiske fejltekster, når serveren returnerer en brugbar fejl

### Død og misvisende kode

Efter en feature skal Claude kontrollere for:

- ubrugte imports
- ubrugte props
- døde state-variabler
- gamle formularer
- knapper der ikke længere virker
- links til handlinger, serveren afviser
- kommentarer der ikke længere passer
- gammel kode fra udfasede flows

Lokal død kode må fjernes som en del af featuren. Bred oprydning skal være en separat commit.

### Store filer

Claude skal rapportere ved:

- page- eller komponentfiler over cirka 500 linjer
- funktioner eller renderblokke over cirka 80 linjer
- mange indlejrede betingelser eller IIFE'er
- komponenter der både henter data, håndterer produktlogik og renderer omfattende UI

Dette udløser ikke automatisk refaktorering. Der skal være en konkret vedligeholdelsesgevinst.

### Legacy-kode

Når legacy-fallbacks bruges, skal rapporten angive:

- hvorfor de stadig er nødvendige
- hvilken løsning der er fremtidig source of truth
- hvad der skal være opfyldt, før fallbacken kan fjernes
- hvilke filer der senere skal ryddes op

Legacy-kode må ikke blive permanent ved et uheld.

### Database og migrationsdisciplin

- Lokale SQL-filer må ikke antages at være kørt.
- Kode og faktisk database skal behandles som forskellige evidenskilder.
- Ingen database-, schema-, migrations-, RLS- eller destruktive ændringer uden særskilt godkendelse.

### Test og ærlig rapportering

Efter featureændringer skal der som minimum køres:

- `npx tsc --noEmit`
- `git diff --check`
- ESLint uden `--fix` på ændrede filer
- `git status --short`
- `git diff --stat`
- read-only gennemgang af diffet

Rapporten skal skelne mellem:

- mekaniske checks
- logisk kodeinspektion
- integrationstests
- manuel browsertest

Kodeinspektion må ikke omtales som en gennemført integrationstest.

### Kvalitetsregnskab efter hver feature

Rapportér:

- ændrede filer
- ny duplikation
- nye legacy-afhængigheder
- døde eller ubrugte props
- markant vækst eller kompleksitet i filer
- nye og pre-eksisterende lintproblemer
- tests der er kørt
- flows der mangler manuel test
- ny teknisk gæld

Hvis ingen ny teknisk gæld er introduceret, skal det siges eksplicit.

### Stopbetingelser

Stop fortsat ved:

- database/schemaændringer
- migrationer eller SQL
- RLS
- ændring af grundlæggende auth- eller rollemodel
- destruktiv databehandling
- uklar source of truth
- væsentlige uafklarede produktbeslutninger
- ændring af kendte untracked filer

Stop ikke for normale, direkte relaterede ændringer i:

- interfaces
- props
- read-routes
- lokale helpers
- eksisterende komponenter
- lokal UI-logik

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

@docs/PROJECT_STATE.md
@docs/ACTIVE_TASK.md
