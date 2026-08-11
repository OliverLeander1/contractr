# Projekt

- Nembyggestyring er en platform for private bygherrer og entreprenører.
- AB-Forbruger 2012 er det obligatoriske aftalemæssige fundament.
- Et komplet aftalegrundlag er først bindende, når begge parter har godkendt det.

# Låst arkitektur

- Ét projekt kan have 0, 1 eller flere uafhængige kontrakter.
- Hver kontrakt tilhører præcis ét projekt og én entreprenør.
- Samme entreprenør kan have flere kontrakter på samme projekt.
- Adgang må aldrig udledes af fag- eller entreprisetitel.
- Én privat chatsamtale pr. kontrakt.
- Legacy-samtaler med kontrakt_id = NULL må ikke gættes koblet til en kontrakt.

# Besigtigelsesflow (entreprenørinitieret, 1-3 tidsforslag pr. runde)

Endelig, faktisk model efter den kørte migration
supabase-migration-besigtigelse-multitider.sql (manuelt kørt og read-only
verificeret af Oliver i produktion).

- Besigtigelse initieres udelukkende af entreprenøren. POST
  /api/besigtigelse kræver rolle = "haandvaerker" for at oprette et
  førstegangsforslag, for at starte et nyt forslag efter en afvisning,
  og for at starte et nyt forløb efter en passeret godkendt besigtigelse.
  Bygherren får 403 ved forsøg på at oprette. Bygherren kan derimod
  acceptere ét af de foreslåede tidspunkter, foreslå 1-3 nye tidspunkter
  ("Ingen af tiderne passer"), eller afvise besigtigelsen helt via PATCH.
- Databasemodel (nu live): public.besigtigelse er én forhandlingsrunde
  (kontrakt_id, projekt_id, foreslaaet_af, status, varighed_minutter,
  valgt_tidspunkt_id, kommentarer, timestamps). En ny child-tabel
  public.besigtigelse_tidspunkter rummer 1-3 alternative dato/tid-rækker
  pr. runde (id, besigtigelse_id, dato, tidspunkt, sortering). En
  accepteret runde peger via valgt_tidspunkt_id på præcis ét af sine
  egne tilbudte alternativer — håndhævet i databasen med en composite
  foreign key (valgt_tidspunkt_id, id) → besigtigelse_tidspunkter(id,
  besigtigelse_id), så et valg fra en ANDEN runde er umuligt at gemme.
  besigtigelse.dato/besigtigelse.tidspunkt er nu legacy parent-felter:
  nye runder skriver aldrig til dem (de forbliver NULL på parent-niveau
  for alt oprettet efter migrationen) — al ny data ligger udelukkende i
  besigtigelse_tidspunkter.
- Atomar oprettelse via RPC: public.opret_besigtigelsesrunde(...) opretter
  parent-runden og dens 1-3 tidspunkter i én transaktion (INSERT parent
  → validér og INSERT hvert tidspunkt, alt inden for funktionskaldets
  egen implicitte transaktion). Kaldes fra /api/besigtigelse via
  createServiceClient().rpc(...), først EFTER at Bearer JWT,
  auth.getUser() og bestemRolle() har autoriseret handlingen — RPC'en er
  ikke selv den autoritative autorisation. RPC'en har kun EXECUTE for
  service_role (PUBLIC/anon/authenticated er eksplicit revoked), så den
  kan ikke kaldes uden om Next.js-routens autorisation.
- Modforslag (PATCH action="counter", "Ingen af tiderne passer") opretter
  altid en HELT NY runde via samme RPC. Den eksisterende (aktuelle) runde
  røres aldrig — hverken parent-rækken eller dens tidspunkter opdateres
  eller slettes. Kun accept (status → godkendt + valgt_tidspunkt_id) og
  reject (status → afvist) opdaterer den aktuelle rundes egen række.
- PATCH action="reject" ("Afvis besigtigelse") er en selvstændig,
  terminal handling, adskilt fra "Ingen af tiderne passer": kun modparten
  til det aktuelle forslag kan afvise, hvilket sætter status = "afvist"
  på kun den aktuelle runde (ingen ny runde). Semantisk forskel:
  "Afvis besigtigelse" = ønsker ikke besigtigelsen; "Ingen af tiderne
  passer" = ønsker fortsat besigtigelsen, men de foreslåede tider passer
  ikke og efterfølges altid af 1-3 nye tidsforslag.
- Tidspunkter er begrænset til 15-minutters intervaller (00/15/30/45) og
  varighed til 30/45/60/90/120 minutter (default 60) — håndhævet i tre
  lag: klient-select (ingen fri indtastning), Next.js-servervalidering
  (gode brugerfejl), og RPC'en/databasens CHECK-constraints (endelig
  kontrol, uafhængig af klienten).
- GET /api/besigtigelse er udvidet: hver runde (den aktuelle og alle i
  historikken) inkluderer nu sine tidspunkter, sorteret efter sortering.
  Ingen kunstige dato/tid-felter er tilføjet på parent-niveau for nye
  runder — parent.dato/tidspunkt forbliver null, den reelle data ligger
  i tidspunkter-arrayet.
- hentEffektivDatoTid() (src/lib/besigtigelse.ts) er den fælles,
  genbrugte funktion, der finder "den faktiske dato/tid" for en runde,
  uanset om den stammer fra det nye multi-tids-flow (via
  valgt_tidspunkt_id → et element i tidspunkter) eller er en legacy-
  række (via parent.dato/tidspunkt direkte). Bruges af BesigtigelseKort,
  aftale-siden og getBesigtigelseStatusUI (dashboard), så ingen af dem
  duplikerer denne logik. erBesigtigelsePasseret() er uændret
  (Europe/Copenhagen), men kaldes nu altid med det effektivt fundne
  dato/tidspunkt.
- Legacy-fallback er et reelt, verificeret krav, ikke en teoretisk
  edge case: to eksisterende produktionsrækker forud for migrationen
  blev kontrolleret. Én med dato+tidspunkt uden for kvartersreglen
  (2026-08-03 12:52) fik bevidst INGEN child-række og vises fortsat med
  sit oprindelige, upræcise klokkeslæt uændret (ingen afrunding). Én med
  et kvartersgyldigt tidspunkt (2026-08-05 16:30) blev backfillet til én
  child-række, og dens valgt_tidspunkt_id peger nu på den. Begge
  tilfælde læses korrekt af hentEffektivDatoTid() uden ændringskode i
  UI'et ud over selve helperen.
- BesigtigelseKort.tsx viser nu op til 3 alternative tidspunkter som
  radio-valg for modparten ("Godkend valgt tidspunkt"), en delt
  TidspunktFormular-underkomponent (genbrugt til både førstegangsforslag
  og modforslag) med kvarters-select og varighedsvælger, samt en
  selvstændig, visuelt tilbagetrukket "Afvis besigtigelse"-handling
  adskilt fra "Ingen af tiderne passer". "Tidligere forslag"-historikken
  viser nu alle 1-3 alternativer pr. tidligere runde, hvem der foreslog,
  hvornår, og et afledt resultat ("Besigtigelse aftalt" / "Afvist" /
  "Ingen af tiderne passede" — ren UI-aflæsning, ingen ny databasestatus).
- /api/bruger/besigtigelser (dashboard) og den selvstændige
  besigtigelse-forhåndsvisning på projekt/[id]/aftale/page.tsx er begge
  tilpasset minimalt: en aktiv, endnu ubesvaret multi-tids-runde viser
  nu et antal ("3 tider foreslået") i stedet for at fremstille "Mulighed
  1" som en aftalt dato. Ingen redesign af dashboardet.
- Besigtigelse skriver fortsat udelukkende til besigtigelse- og
  besigtigelse_tidspunkter-tabellerne. Aftaledokument, revision,
  godkendelsestimestamps, pris, betalingsplan og start-/slutdato er ikke
  påvirket.
- Ingen nye mails eller notifikationer er tilføjet.
- Migrationsfilen supabase-migration-besigtigelse-multitider.sql er
  kørt og read-only verificeret i produktion (RLS enabled på
  besigtigelse_tidspunkter, ingen policies, korrekte RPC-privileges,
  composite FK, øvrige constraints). Den skal committes sammen med
  denne feature-kode.
- Manuel browsertest af det fulde multi-tids-flow mangler fortsat (se
  docs/ACTIVE_TASK.md).

# Sikkerhed og drift (commit: se "fix: close debug leak and repair notification client")

- Det tidligere uautentificerede GET /api/debug, som eksponerede dele af
  ANTHROPIC_API_KEY (længde og de første tegn) samt relaterede
  miljøvariabelnavne, er lukket. Endpointet svarer nu 404 uden nogen
  følsom information. Ingen kendte kaldssteder fandtes i tracked kode.
- POST /api/ab-notifikationer opretter nu sin Supabase-klient med det
  fælles createServiceClient()-mønster fra src/lib/supabase-server.ts
  (samme SUPABASE_SECRET_KEY som resten af kodebasen), oprettet inde i
  request-handleren i stedet for på modulniveau. Der er ikke tilføjet
  noget nyt secret-navn. CRON_SECRET-beskyttelsen, AB-Forbruger-logikken
  (§12/§23/§38/§58), hvilke data der læses, og response-formen er
  uændrede.
- Build-fejlen "supabaseKey is required" ved /api/ab-notifikationer
  (opstået fordi routen tidligere brugte det ikke-eksisterende
  SUPABASE_SERVICE_ROLE_KEY) er bekræftet væk: npm run build
  gennemførte fuldt ("Compiled successfully", "Finished TypeScript")
  uden fejl for nogen route.
- Cronjobbet er ikke kørt live i forbindelse med denne opgave.

# Chatstatus

Fungerer nu:

- Bygherre kan åbne kontraktspecifik chat.
- Entreprenør kan åbne samme samtale med verificeret login.
- Begge parter kan sende og genindlæse beskeder.
- Bearer JWT og server-side kontraktautorisation bruges.
- Den gamle usikre chatroute er deaktiveret.
- Chat-navigation for bygherre forbliver aktiv på undersider.
- POST /api/chat/laest og GET /api/chat/oversigt er implementeret
  (commit 5481eb7).
- GET /api/chat/oversigt bruges nu af UI: den globale Chat-side (/chat)
  og app-shellens ulæst badge (commits 9ee6e46, 66b02a7, 6efebb3,
  d713b7d, de3b10e).
- POST /api/chat/laest bruges endnu ikke af nogen UI — markering som
  læst er fortsat kun implementeret server-side, ikke integreret i
  den konkrete kontraktchat.
- Manuelt produktionstestet med autentificerede bygherre- og
  entreprenørkonti. Verificeret:
  - GET /api/chat/oversigt returnerer HTTP 200 for begge roller.
  - Kun autoriserede kontraktsamtaler returneres.
  - Links er rollebestemte (bygherre- hhv. entreprenørrute).
  - ulaest_samlet svarer til summen af samtalernes ulaest_antal.
  - En besked fra bygherren tæller som ulæst for entreprenøren, og
    entreprenørens svar tæller som ulæst for bygherren.
  - Brugerens egne beskeder tæller ikke som ulæste.
  - Læsestatus er individuel pr. bruger.
  - POST /api/chat/laest returnerer HTTP 200 og opdaterer læsestatus;
    preview, seneste afsender og seneste besked bevares efter læsning.
  - En ældre læsemarkering kan ikke flytte markøren baglæns.
  - Observerede 422-svar under testen skyldtes manuelt forkert
    kopierede besked-id'er i testscriptet, ikke en endpointfejl.
  - Legacy- og negativ adgangstest (fx forkert entreprenørs konto,
    kontrakt uden adgang) er ikke fuldt udført endnu.
  - Realtime og UI bruger endnu ikke endpointene.

Ikke implementeret endnu:

- seneste besked-preview på dashboards
- seneste afsender og tidspunkt på dashboards
- markering som læst (UI)
- polling eller realtime
- email-, browser- eller pushnotifikationer

(global Chat, ulæst antal i UI og den globale navigationsramme er
implementeret — se "Navigation og UI" nedenfor.)

# Navigation og UI

- Global app-shell (AuthenticatedAppShell), bygherrens globale
  Chat-side (/chat), ulæst badge og den ombyggede, kompakte
  projektfanelinje (ProjektNav) er implementeret, produktionsdeployet
  og browsertestet.
- Vandret mobiloverflow — i den globale navigation, i projektfanerne
  og på dashboardets aftalegrundlagskort — er rettet, browsertestet og
  accepteret som afsluttet (commits d713b7d, de3b10e).
- Et større visuelt redesign og den endelige branding er parkeret —
  ikke igangsat (se "Parkeret").
- Løbende UX/UI-kvalitet (informationshierarki, mobiladfærd,
  tomtilstande, loading, fejl, feedback, bredde/overflow) er derimod
  IKKE parkeret — det er et permanent krav til browsertesten for alle
  nye opgaver fremover. Se docs/DECISIONS.md, "UX/UI-principper".

# Næste produktområde: pre-contract-flow

- Det næste større produktområde er pre-contract-flowet: projektgrundlag
  → invitationer → separate tilbud → tilbudssammenligning → valg →
  aftalegrundlag → aktiv byggesag. Den låste begrebsmodel står i
  docs/DECISIONS.md.
- AI-baseret tilbudssammenligning kan først implementeres, når en
  korrekt data- og kildearkitektur er på plads (struktureret
  tilbudsudtræk, kontrolleret vidensbase, kildehierarki for AI) — ikke
  før, og ikke som en stor systemprompt alene.
- Ingen database-, schema- eller anden implementeringsbeslutning for
  tilbudsfasen er truffet endnu. Der findes endnu ingen kode, routes
  eller UI for projektgrundlag, invitationer eller tilbud.
- Byggesagkyndig.nu er identificeret som en mulig fremtidig
  henvisnings- eller rådgiverpartner — ikke en bindende integration
  eller eksklusiv aftale.
- Prisstrategien (herunder en foreslået model på 3-4 % af
  entreprisesummen) er fortsat åben og skal testes, ikke besluttet.

# Projektgrundlag (pre-contract-flow, skema + API + UI)

- Migrationen supabase-migration-projektgrundlag.sql er kørt succesfuldt
  i Supabase ("Success. No rows returned"). public.projektgrundlag
  findes nu i produktion, med ON DELETE RESTRICT fra projekt_id mod
  projekter(id) (commit c84a81e).
- Opretter public.projektgrundlag: en selvstændig pre-contract-entitet,
  ikke koblet til kontrakter. Ét projekt kan have 0..mange
  projektgrundlag (ingen unik constraint på projekt_id).
- Sikkert bygherre-API implementeret:
  - GET/POST /api/projekter/[id]/projektgrundlag — liste og oprettelse.
  - PATCH /api/projektgrundlag/[grundlagId] — opdatering.
  - Bearer JWT + auth.getUser(), ejerskab verificeret via
    projekter.bygherre_id. GET har ingen sideeffekt. POST sætter altid
    status til "udkast" og ignorerer projekt_id/status fra klienten.
    PATCH ignorerer id/projekt_id/oprettet_at fra klienten og sætter
    opdateret_at server-side.
- Ny bygherre-side: /projekt/[id]/projektgrundlag.
- UI og API er implementeret og kodegennemgået, men IKKE endnu
  browsertestet manuelt af Oliver.
- Ingen kontrakter oprettes, læses eller ændres nogen steder i dette
  flow.
- Der findes fortsat ingen invitationer, tilbud, tilbudsversioner,
  sammenligning, valg af tilbud, rådgiveradgang eller AI-funktionalitet
  — kun projektgrundlags-laget er implementeret.
- "Projektgrundlag"-menupunktet er skjult fra ProjektNav (commit: se
  "fix: hide misplaced project brief navigation"), fordi den
  eksisterende placering — som en fane under en allerede oprettet
  sag/projekt — er produktmæssigt forkert. Projektgrundlaget skal i den
  kommende korrekte model opstå globalt, før et projekt findes:
  opgave/tilbudsforespørgsel → AI-genereret projektgrundlag → invitation
  til én eller flere entreprenører → tilbud → valg → projekt og
  aftalegrundlag. Samme kommende flow skal kunne sende grundlaget til
  enten én kendt entreprenør eller flere entreprenører.
  Siden (/projekt/[id]/projektgrundlag), API'et
  (GET/POST /api/projekter/[id]/projektgrundlag,
  PATCH /api/projektgrundlag/[grundlagId]) og tabellen
  (public.projektgrundlag) findes fortsat urørt og frosset — kun
  navigationsvejen er fjernet. Direkte URL-adgang til siden virker
  fortsat. Eksisterende projekt- og aftalefunktionalitet er ikke ændret.

# Produktion

Kørt i produktion:

- supabase-migration-chat-kontrakt-id.sql
- den midlertidige RLS-migration fra commit 99685fd
- supabase-migration-chat-laesestatus.sql

public.chat_laesestatus findes nu med:

- samtale_id UUID
- bruger_id UUID → auth.users(id)
- senest_laeste_besked_id UUID
- sidst_laest_at TIMESTAMPTZ
- opdateret_at TIMESTAMPTZ
- primary key på samtale_id + bruger_id
- RLS enabled
- ingen policies
- service_role har SELECT, INSERT og UPDATE
- klientroller har ingen direkte tabeladgang

Migrationen blev kørt med:

Success. No rows returned

Migrationens commit:

ef0d1d2

# Relevante chatcommits

- 62ecaab — chat_samtaler.kontrakt_id
- b9c7e3b — sikker kontraktspecifik bygherrechat
- d028c42 — korrekt project owner ved oprettelse
- 98aad4f — rettelse af faktiske beskedkolonner
- 235dbde — aktiv Chat-navigation på undersider
- c050b6f — entreprenørens kontraktspecifikke chat
- ef0d1d2 — individuel chat-læsestatusstruktur

# Sikkerhedsregler

- Verificér Bearer JWT med auth.getUser().
- Bygherreadgang udledes server-side via projektets ejer.
- Entreprenøradgang udledes via verificeret login-email mod kontraktens haandvaerker_email.
- Token og localStorage må ikke bruges som autorisation.
- Klienten må ikke bestemme rolle, email, bruger-id eller projekt-id.
- Service role må først bruges efter eksplicit autorisation.
- public.notifikationer er ikke autoritativ chat-læsestatus.
- Ingen DELETE, TRUNCATE, DROP eller nulstilling.
- GET /api/haandvaerker/sager kræver nu Bearer JWT + auth.getUser();
  entreprenørens email udledes udelukkende af den verificerede bruger,
  aldrig af et klientsendt ?email=-parameter. Rollen verificeres mod
  profiler.rolle = "haandvaerker" (commit d6c55ea). Browsertestet og
  accepteret — entreprenøren kan fortsat se egne sager, og den
  tidligere email-query-baserede adgang er lukket: et vilkårligt
  ?email=-parameter påvirker ikke længere resultatet.
- GET og POST /api/projekter/[id]/kontrakter kræver nu Bearer JWT +
  auth.getUser(); rollen verificeres mod profiler.rolle = "bygherre",
  og projektejerskab kontrolleres server-side via projekter.bygherre_id
  === den verificerede bruger, før noget læses eller oprettes. Tidligere
  var routen helt uden auth-tjek og eksponerede alle et projekts
  kontrakter, inkl. haandvaerker_token (invitationsnøglen bag
  /kontrakt/[token]), for enhver der kendte eller gættede et projekt-id.
  haandvaerker_token returneres fortsat i GET-responsen, men kun til den
  verificerede projektejer — feltet er dokumenteret genuint nødvendigt
  af ekstraarbejde-flowets håndværkernotifikation. Aftale-, ekstraarbejde-
  og chat-siderne samt det ældre AI-oprettelsesflow
  (opret/udbud-resultat) sender nu alle Bearer-token på deres kald til
  denne route. Response shape er uændret for den autoriserede ejer.
  (commit: se "fix: secure project contract listing"). Manuel browsertest
  af de fire brugerflows er gennemført og godkendt af Oliver.
- POST /api/projekter samt GET og POST /api/kontrakt kræver nu Bearer
  JWT + auth.getUser(); rollen verificeres mod profiler.rolle =
  "bygherre" (commit: se "fix: secure legacy project and contract
  writes"). Tidligere kunne begge routes kaldes helt uden login.
  - POST /api/projekter bruger nu altid den verificerede user.id som
    bygherre_id. body.bygherre_id læses ikke længere og kan ikke vælge
    projektets ejer.
  - GET /api/kontrakt?projekt_id=... henter nu projektet og verificerer
    projekter.bygherre_id === den verificerede bruger, før noget læses.
    En anden bruger eller en uautentificeret aktør kan ikke længere
    læse eller udløse routens sideeffekt (se nedenfor).
  - POST /api/kontrakt henter nu kontrakten, udleder dens faktiske
    projekt_id, henter projektet og verificerer ejerskab, før nogen af
    de eksisterende grene (feltopdatering, betalingsplan,
    haandvaerker_email, forudsætnings- og tidsplansgodkendelse) kan
    køre. body.bygherre_id bruges ikke længere som adgangsgrundlag
    eller læses overhovedet — et kendt kontrakt_id giver ikke længere
    skriveadgang uden verificeret ejerskab. Kun den verificerede
    projektejer kan ændre haandvaerker_email og dermed omdirigere en
    invitation.
  - Den eksisterende GET-sideeffekt (routen opretter automatisk en
    kontrakt, hvis projektet endnu ikke har en) er bevaret som kendt
    teknisk gæld — det er fortsat ikke den korrekte langsigtede
    arkitektur, men kan nu kun udløses af den verificerede projektejer.
  - Det gamle tre-kalds-oprettelsesflow i opret/udbud-resultat (opret
    projekt → opret kontrakt → udfyld kontrakt) sender nu Bearer-token
    på alle tre kald, men er fortsat ikke atomisk. Et fejlet kald efter
    et lykkedes kald kan stadig efterlade en delvist oprettet
    projekt-/kontraktrække. Ingen rollback, transaktion eller
    oprydningsroute er implementeret i denne opgave.
  - Aftale-siden sender nu Bearer-token på alle kald til GET og POST
    /api/kontrakt via en lokal hjælpefunktion (autentificeretFetch) i
    samme fil. Eksisterende enkelt-entreprenørflow (generér
    AI-projektforslag, gem som logget ind bygherre, invitér én kendt
    entreprenør, redigér pris/tidsplan/forudsætninger/øvrigt
    aftaleindhold) er bevaret uændret.
  - Den fremtidige model skal understøtte både én invitation til en
    kendt entreprenør og flere konkurrerende invitationer via den
    kommende tilbudsforespørgselsmodel — ingen af delene er
    implementeret i denne opgave.
  - Pre-contract-modellen (tilbudsforespørgsel, invitationer, tilbud,
    sammenligning) er fortsat ikke implementeret.
  - Manuel browsertest af de sikrede routes mangler fortsat.

# Aftaledokumentets struktur — V2-format (commit: se "fix: protect
document structure and dates")

- Nye AI-genererede aftaler gemmes nu i kontrakter.beskrivelse i et
  stabilt, versioneret internt format med markøren
  [[NEMBYG_DOKUMENT_V2]] som første linje, efterfulgt af entydige
  sektionsmarkører ([ARBEJDSOMFANG], [KRAV_OG_OENSKER],
  [PRAKTISKE_FORHOLD]). Parsing sker udelukkende ud fra disse præcise
  markørstrenge — ikke den tidligere upålidelige regex-heuristik, der
  gættede en opdeling ud fra AI'ens formatering. ([INTRO] var oprindeligt
  også en sektionsmarkør her; se "Fjernelse af Projektopsummering fra
  aftaledokumentet" nedenfor for den bindende ændring.)
- Eksisterende aftaler (uden V2-markøren) er urørte og forbliver
  legacy-format: uændret visning, uændret redigeringsadfærd, ingen
  automatisk konvertering, ingen skjult normalisering. Dette er en
  bevidst, permanent undtagelse — ikke en midlertidig tilstand, der
  forventes ryddet op senere.
- For V2-dokumenter er følgende nu systemstyret og ikke redigerbart
  inde i selve dokumentet: sektionsoverskrifter, projekttitel (vises fra
  kontrakter.titel), adresse (vises fra projekter.adresse, tilføjet
  additivt som projekt_adresse i GET /api/kontrakt-responsen),
  bygherre, dokumentdato (vises fra kontrakter.oprettet_at — ikke
  længere new Date()), samt start-, slut- og alle øvrige
  projektdatoer (vises fra de eksisterende tidsplansfelter). Den korte
  AI-genererede projektopsummering (INTRO, afledt af AI'ens
  resumé-felt) er ligeledes read-only.
- Kun tre narrative sektioner kan redigeres for V2-dokumenter, hver for
  sig: Arbejdsomfang, Krav og ønsker, Praktiske forhold. Projekttitel
  ændres fortsat kun i det eksisterende separate titelfelt; datoer
  ændres fortsat kun i Tidsplan.
- Klient- og servervalidering afviser konkrete kalenderdatoer
  (numerisk eller med dansk månedsnavn) i disse tre sektioner ved gem —
  serveren returnerer 400 "Datoer ændres i Tidsplan." før
  kontrakter.beskrivelse opdateres. Testeksempler som "AB-Forbruger
  2012", "BR18", "DS/EN 12464-1" og "Produktserie 2024" bekræfter kun,
  at årstal og standardnumre ikke fejlagtigt blokeres som datoer — ikke
  at noget af dette dermed er gældende for aftalen (kun konkrete datoer
  blokeres, ikke bare årstal). Legacy-dokumenter rammes ikke af denne
  kontrol.
- AI-prompten i /api/udbud er justeret til ikke længere at nævne
  adressen eller konkrete datoer i de frie tekstfelter, og en snæver,
  case-insensitiv normalisering retter nu deterministisk kendte
  stavevarianter ("entrepreneuren" → "entreprenøren", "entrepreneur" →
  "entreprenør") i AI-outputtet, uafhængigt af om prompten alene
  virker.
- Bindende produktregel om AB 18, BR18 og DS/DS-EN-standarder — tre
  begreber, der ikke må sammenblandes:
  - AB-Forbruger er fortsat Nembyggestyrings normale aftalegrundlag for
    private bygherrer. AB 18 er et separat kontraktuelt regelsæt for
    større/professionelle sager. AI-prompten forbyder nu eksplicit, at
    AB 18 nogensinde indsættes automatisk, foreslås som standard,
    erklæres som aftalegrundlag, eller blandes sammen med AB-Forbruger.
    AB 18 må kun komme i betragtning efter et senere, særskilt og
    eksplicit bevidst valg i en relevant sag — ikke implementeret
    endnu.
  - BR18 (Bygningsreglementet) er noget andet end AB 18 og behandles
    IKKE som et valgfrit kontraktvilkår. AI'en må og skal fortsat
    kunne omtale relevante BR18-krav og entreprenørens pligt til at
    overholde gældende lovgivning, men må ikke påstå at samtlige
    BR18-krav gælder for enhver opgave.
  - AI'en må og skal fortsat kunne omtale relevante DS- og
    DS/EN-standarder, men må ikke opfinde standardnumre, påstå at alle
    DS-standarder er obligatoriske, indsætte en irrelevant standard,
    eller foretage en skjult juridisk/teknisk vurdering uden
    kildegrundlag.
  - Ved juridisk eller teknisk usikkerhed (herunder hvilke BR18-krav
    eller standarder der reelt er relevante) skal AI'en markere
    forholdet som noget der bør afklares, frem for at opfinde et krav
    eller en gældende regel.
  - Testeksemplerne "AB-Forbruger 2012", "BR18", "DS/EN 12464-1" og
    "Produktserie 2024" i datovalideringen er alene regex-testtekst,
    der bekræfter at årstal og standardnumre ikke fejlblokeres som
    datoer — de erklærer ikke i sig selv noget som gældende.
- Ingen databaseændring eller migration er foretaget — alle
  autoritative felter (projekter.adresse, kontrakter.startdato,
  kontrakter.slutdato, kontrakter.oprettet_at, kontrakter.titel)
  fandtes allerede.
- Rettelse (commit: se "fix: share v2 document utilities safely"): de
  rene V2-funktioner (erV2Dokument, parseV2Sektioner, byggV2Dokument,
  indeholderKonkretDato) lå oprindeligt i DokumentRenderer.tsx ("use
  client"). POST /api/kontrakt importerede dem derfra, hvilket i
  produktion gav en serverfejl ("Attempted to call erV2Dokument() from
  the server"), da en server-route ikke må kalde funktioner importeret
  fra en client component — GET/POST /api/kontrakt kunne derfor ikke
  gemme eller validere V2-dokumenter. Funktionerne er flyttet til det
  neutrale, framework-uafhængige modul src/lib/dokumentV2.ts (ingen
  "use client", React, JSX eller server-only kode), som både
  DokumentRenderer, klientsiderne og /api/kontrakt nu importerer fra.
  V2-formatet, markørerne, datovalideringen og legacy-visningen er
  uændrede.
- Manuel browsertest mangler fortsat (se docs/ACTIVE_TASK.md).

## Fjernelse af Projektopsummering fra aftaledokumentet (commit: se "fix: remove duplicate project summary")

- Bindende produktregel: Aftalegrundlaget har én autoritativ beskrivelse af
  det aftalte arbejde: Arbejdsomfang. Projektopsummering/resumé er ikke en
  del af selve aftaledokumentet og må ikke kunne skabe en parallel
  beskrivelse.
- Dokumentets V2-struktur er nu: dokumenthoved (projekttitel, adresse,
  bygherre, dokumentdato) → 1. Arbejdsomfang → 2. Krav og ønsker →
  3. Praktiske forhold → øvrige eksisterende sektioner. Der er ikke længere
  et separat "Projektopsummering"-afsnit mellem dokumenthoved og
  Arbejdsomfang.
- [INTRO] er fjernet fra V2_SEKTIONSMARKØRER i src/lib/dokumentV2.ts.
  byggV2Dokument() gemmer ikke længere en [INTRO]-sektion for nye eller
  genindsendte dokumenter. parseV2Sektioner() ignorerer stiltiende en
  eventuel [INTRO]-blok i ældre gemte dokumenter (teksten tildeles ingen
  sektion og vises derfor ikke) — dette sker udelukkende ved parsing/visning
  og ved fremtidige, brugerinitierede gem-handlinger på det pågældende
  dokument, ikke som en automatisk baggrundsmigrering. Ingen eksisterende
  databaserække er masseændret eller migreret.
- AI-feltet `resumé` (fra POST /api/udbud) findes fortsat og bruges på
  opret/udbud-resultat-siden udelukkende som UX-tekst uden for selve
  dokumentvisningen (sidehovedets undertekst). Resuméet indgår ikke længere
  i det gemte V2-dokument og ikke i den kopierbare tekst ("Kopiér dokument
  og send manuelt"). Feltet kan senere genbruges som UX-metadata på fx
  dashboardkort, invitationsoverblik og tilbudssammenligning — det er ikke
  en del af aftalens autoritative arbejdsbeskrivelse.
- Legacy-dokumenter (uden [[NEMBYG_DOKUMENT_V2]]-markøren) er urørte og
  upåvirkede af denne opgave.
- Manuel browsertest mangler fortsat (se docs/ACTIVE_TASK.md).

# Parkeret

- nulstilling og sletning af testdata
- tidsplan og kalender
- endelig multi-kontraktmigration for betalinger, mangler og ekstraarbejde
- email-, push- og browsernotifikationer
- realtime-chat
- større visuelt redesign / endelig branding (gælder kun det
  overordnede grafiske redesign — løbende UX/UI-kvalitet i konkrete
  funktioner er ikke parkeret, se "Navigation og UI")
- faktisk RAG/retrieval-implementering for AI-vidensbasen (kun
  principperne er låst, se docs/DECISIONS.md)
- fuld partnerintegration med Byggesagkyndig.nu
- native app

# Beskyttede untracked filer

- .claude/settings.json
- .claude/skills/
- .mcp.json
- supabase-migration-chat.sql
- supabase-migration-kontrakter.sql
- supabase-migration-logbog.sql
- supabase-migration-rls-og-tabeller.sql
- supabase-migration-slet-konto.sql
- supabase-migration-nulstil-testdata.sql

Ingen af disse må stages, ændres, slettes eller køres.

# Kildehierarki

1. Verificeret produktion
2. Aktuel kode på main
3. Trackede, kørte migrationer
4. Dokumenterede beslutninger
5. Ældre lokale migrationsfiler
