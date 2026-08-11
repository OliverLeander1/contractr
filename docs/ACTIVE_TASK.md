# Aktiv opgave — besigtigelse: entreprenørinitieret flow med 1-3 tidsforslag (kodeændring afsluttet, browsertest mangler)

Besigtigelse er udvidet fra ét dato/tidspunkt pr. forslag til 1-3
alternative tidsforslag pr. forhandlingsrunde, oven på den nu manuelt
kørte og read-only verificerede migration
supabase-migration-besigtigelse-multitider.sql.

Endelig model:

- Entreprenøren starter altid første runde. Kun rolle = "haandvaerker"
  må oprette et førstegangsforslag, genåbne efter en afvisning, eller
  starte et nyt forløb efter en passeret godkendt besigtigelse.
- En runde indeholder 1-3 alternative dato/tid-forslag (kvartersvalgt,
  00/15/30/45), én forslagsstiller, én varighed (30/45/60/90/120 min.,
  default 60) og en valgfri kommentar.
- Bygherren kan: vælge ét af de foreslåede tidspunkter og godkende,
  vælge "Ingen af tiderne passer" og foreslå 1-3 nye tider, eller vælge
  "Afvis besigtigelse" som en mindre fremtrædende, separat terminal
  handling. Samme tre muligheder gælder entreprenøren, når bygherren har
  foreslået nye tider.
- Databasemodel: public.besigtigelse (runde) + ny child-tabel
  public.besigtigelse_tidspunkter (1-3 alternativer pr. runde), atomart
  oprettet via RPC'en public.opret_besigtigelsesrunde. Godkendelse
  peger via valgt_tidspunkt_id på ét af rundens egne alternativer,
  håndhævet med en composite foreign key. Modforslag opretter altid en
  helt ny runde via samme RPC — den gamle runde røres aldrig.
- Legacy-fallback er bevaret og verificeret mod to reelle
  produktionsrækker: én uden for kvartersreglen (12:52) vises fortsat
  med sit oprindelige, upræcise klokkeslæt; én med et kvartersgyldigt
  tidspunkt blev korrekt backfillet.
- Autorisation forbliver udelukkende i Next.js (Bearer JWT →
  auth.getUser() → bestemRolle()) — RPC'en har kun EXECUTE for
  service_role og er ikke selv autoritativ.

Se docs/PROJECT_STATE.md, "Besigtigelsesflow (entreprenørinitieret,
1-3 tidsforslag pr. runde)" for fuld detaljering. Typecheck, lint,
git diff --check og npm run build er alle bekræftet grønne. Migrationen
er allerede kørt i produktion (ikke en del af denne kodeopgave) —
migrationsfilen skal committes sammen med denne feature-kode. Ingen ny
database-, schema- eller RLS-ændring i denne opgave. Ingen commit/push.
Manuel browsertest mangler fortsat — se testplanen i seneste opgavesvar
til Oliver.

# Tidligere aktiv opgave

Manuel browsertest af fjernelsen af Projektopsummering fra selve
aftaledokumentet, af det nye V2-dokumentformat i øvrigt
(sektionsoverskrifter, adresse, dokumentdato og datovalidering), samt af
de tidligere sikrede projekt- og kontraktroutes (POST /api/projekter,
GET/POST /api/kontrakt), som stadig afventer bekræftelse.

Alle dele er implementeret og kodegennemgået (typecheck og lint bestået
for de ændrede linjer — to allerede eksisterende, urelaterede
lint-fejl/advarsler i uændrede linjer i udbud-resultat/page.tsx og
aftale/page.tsx er upåvirkede af denne opgave). Ingen af delene er
dokumenteret som gennemført, før Oliver har udført og bekræftet testen.

Browsertesten skal omfatte (fjernelse af Projektopsummering):

- opret nyt AI-genereret aftalegrundlag og bekræft, at der ikke vises
  et separat "Projektopsummering"-afsnit i selve dokumentet
- bekræft at dokumentet går direkte fra dokumenthovedet
  (projekttitel/adresse/bygherre/dokumentdato) til "1. Arbejdsomfang"
- bekræft at Arbejdsomfang kan redigeres og gemmes
- bekræft at Krav og ønsker og Praktiske forhold fortsat kan redigeres
  separat
- forsøg at gemme "arbejdet afsluttes 4. september 2026" i en af de tre
  narrative sektioner og forvent fortsat afvisning med "Datoer ændres i
  Tidsplan."
- åbn et eksisterende V2-testdokument, der blev oprettet før denne
  opgave og derfor stadig indeholder en gemt [INTRO]-blok i databasen,
  og bekræft at Projektopsummering ikke længere vises for det —
  bekræft samtidig at ingen rå V2-markører (fx "[ARBEJDSOMFANG]") er
  synlige i visningen
- gem en ny sektion (fx Arbejdsomfang) på det samme eksisterende
  testdokument og bekræft, at dokumentet fortsat gemmes og vises
  korrekt bagefter
- bekræft at nummereringen er korrekt (Arbejdsomfang = 1, Krav og
  ønsker = 2, Praktiske forhold = 3, efterfølgende sektioner fortsætter
  logisk uden hul)
- kontrollér på opret/udbud-resultat-siden, at AI-resuméet fortsat vises
  som sidetekst uden for selve dokumentet, men ikke længere som en
  "Projektopsummering (redigeres ikke her)"-boks i redigeringsvisningen,
  og at "Kopiér dokument"-teksten starter med Arbejdsomfang, ikke
  resuméet
- kontrollér at adresse (fra projekter.adresse) og dokumentdato (fra
  kontrakter.oprettet_at) fortsat vises korrekt i dokumentheaderen
- åbn en eksisterende legacy-aftale (uden V2-markøren, oprettet før
  denne opgave) og bekræft uændret visning og redigeringsadfærd

Browsertesten skal fortsat omfatte (tidligere, endnu ubekræftede
routes):

- logget ind bygherre kan generere et AI-projektforslag
- projektet kan oprettes
- kontrakten kan oprettes
- projektforslaget kan gemmes på kontrakten
- invitation til én kendt testentreprenør kan gennemføres med testmail
- eksisterende Aftale-side kan indlæses
- titel og beskrivelse kan gemmes
- pris kan gemmes
- håndværker-email kan gemmes
- relevante forudsætnings- og tidsplanshandlinger fungerer
- logout eller udløbet session giver forståelig fejl
- AI-resultatet bevares ved manglende session
- uautentificerede requests kan ikke læse, oprette eller ændre data

# Næste opgave efter godkendt browsertest

Afgrænsning af en global, projektuafhængig oplevelse for
projektgrundlag (opgave/tilbudsforespørgsel → AI-genereret
projektgrundlag → invitation til én eller flere entreprenører → tilbud
→ valg → projekt og aftalegrundlag), samt en sikker invitationsmodel til
flere entreprenører. Ingen af delene er igangsat.

# Legacy-sikkerhedsfaser (afsluttet)

GET/POST /api/projekter/[id]/kontrakter er sikret med Bearer JWT,
rolle- og ejerskabsverificering (commit 467c6e2). Manuel browsertest af
de fire brugerflows (Aftale, Ekstraarbejde, Chat, AI-oprettelsesflow) er
gennemført og bekræftet af Oliver — de eksisterende flows fungerer
fortsat. Det fejlplacerede Projektgrundlag-menupunkt er skjult fra
ProjektNav (commit 749e5a3), manuelt kontrolleret og godkendt af
Oliver. Disse faser kræver ikke yderligere opfølgning.

# Chat-, navigations- og sikkerhedsfaser (afsluttet)

Global app-shell, bygherrens globale Chat-side, ulæst badge og den
mobile navigationsrettelse er implementeret, produktionsdeployet og
browsertestet. Den tidligere email-query-baserede sikkerhedsrisiko i
GET /api/haandvaerker/sager er lukket (commit d6c55ea), browsertestet
og accepteret. Se docs/PROJECT_STATE.md for detaljer og commit-historik.
Disse faser kræver ikke yderligere opfølgning.

# Debug-lækfjernelse og AB-notifikations-klient (kodeændring afsluttet, valgfri manuel kontrol)

GET /api/debug er lukket (svarer nu 404), og POST /api/ab-notifikationer
bruger nu det fælles createServiceClient()-mønster (se
docs/PROJECT_STATE.md). Typecheck, lint, git diff --check og npm run
build er alle bekræftet grønne, og "supabaseKey is required" er
bekræftet væk fra build-outputtet. Ingen produktadfærd, database eller
schema er ændret, og cronjobbet er ikke kørt live.

Valgfri manuel kontrol i produktion efter deploy (ikke blokerende for
andet arbejde):

- GET /api/debug svarer 404
- POST /api/ab-notifikationer med korrekt Authorization: Bearer
  <CRON_SECRET> svarer fortsat 200 (bekræfter at den rettede
  Supabase-klient rent faktisk virker med produktionens
  miljøvariabler, ikke kun i build)
