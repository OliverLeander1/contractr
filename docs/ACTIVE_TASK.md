# Aktiv opgave

Manuel browsertest af de resterende sikrede projekt- og kontraktroutes
(POST /api/projekter, GET/POST /api/kontrakt).

Sikringen er implementeret og kodegennemgået (typecheck og lint
bestået), men IKKE endnu manuelt browsertestet med en rigtig
bygherrekonto. Live 401-tests mod endepunkterne er bevidst ikke
udført i denne opgave, fordi GET /api/kontrakt har en kendt
oprettelses-sideeffekt, og localhost kan være forbundet til
produktionsdatabasen — auth-rækkefølgen er i stedet verificeret ved
kodegennemgang. Denne opgave er ikke dokumenteret som gennemført, før
Oliver har udført og bekræftet testen.

Browsertesten skal omfatte:

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
browsertesten af de sikrede projekt- og kontraktroutes.

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
