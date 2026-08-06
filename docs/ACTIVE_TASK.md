# Aktiv opgave

Manuel browsertest af det nye V2-dokumentformat (sektionsoverskrifter,
INTRO, adresse, dokumentdato og datovalidering), samt af de tidligere
sikrede projekt- og kontraktroutes (POST /api/projekter, GET/POST
/api/kontrakt), som stadig afventer bekræftelse.

Begge dele er implementeret og kodegennemgået (typecheck og lint
bestået, lokal read-only regex-test af datovalideringen bekræftet, samt
en klientside-røgtest af V2-visning og -redigering udført lokalt uden
login). Ingen af delene er dokumenteret som gennemført, før Oliver har
udført og bekræftet testen.

Browsertesten skal omfatte (V2-dokumentformat):

- opret nyt AI-genereret testprojekt
- bekræft V2-visning (faste sektionsoverskrifter, ingen synlige
  markører)
- bekræft at INTRO (projektopsummering) og overskrifter ikke kan
  redigeres
- bekræft at Arbejdsomfang kan redigeres
- bekræft at Krav og ønsker og Praktiske forhold kan redigeres separat
- forsøg at gemme "arbejdet afsluttes 4. september 2026" i en af de tre
  narrative sektioner og forvent afvisning med "Datoer ændres i
  Tidsplan."
- gem hver af de neutrale testeksempler "AB-Forbruger 2012", "BR18",
  "DS/EN 12464-1" og "Produktserie 2024" enkeltvis i en narrativ
  sektion og forvent succes for hver (testen bekræfter kun, at
  årstal/standardnumre ikke fejlagtigt blokeres som datoer — ikke at
  nogen af delene dermed er gældende for aftalen)
- ændr slutdato i Tidsplan og bekræft at dokumentvisningen følger med
  automatisk
- kontrollér at adresse (fra projekter.adresse) og dokumentdato (fra
  kontrakter.oprettet_at) vises korrekt i dokumentheaderen
- åbn en eksisterende legacy-aftale (oprettet før denne opgave) og
  bekræft uændret visning og redigeringsadfærd

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

Afgrænset produktrettelse af besigtigelsesflowet, så entreprenøren
anmoder om besigtigelse, og bygherren godkender, afviser eller
foreslår et andet tidspunkt.

**Claude må ikke fortsætte automatisk til denne opgave.** Skal først
igangsættes efter Oliver eksplicit har gennemført og godkendt
browsertesten ovenfor.

# Efter dén opgave (uændret rækkefølge)

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
