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
  (commit: se "fix: secure project contract listing"). De øvrige usikre
  legacy-routes — POST /api/projekter samt GET/POST /api/kontrakt — er
  IKKE sikret endnu og er planlagt som en separat, efterfølgende opgave.
  Browsertest af den sikrede kontraktlisteroute mangler fortsat.

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
