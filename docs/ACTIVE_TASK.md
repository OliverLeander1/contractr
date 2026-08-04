# Aktiv opgave

Dokumentationsopdatering: lås den nye produktretning (pre-contract-flow,
AI-principper, rådgiveradgang, UX/UI-krav) ind i docs/PROJECT_STATE.md,
docs/ACTIVE_TASK.md og docs/DECISIONS.md.

Dette er udelukkende en dokumentationsopgave. Ingen applikationskode,
routes, API'er, database eller migrationer er ændret som en del af
denne opgave.

# Baggrund

Efter et strategimøde er produktretningen udvidet med et pre-contract-flow
(projektgrundlag, flere separate tilbud pr. projektgrundlag,
tilbudssammenligning), principper for gennemskuelig og kildesporet
AI-anbefaling, en fremtidig AI-vidensarkitektur og kildehierarki,
rådgiveradgang, en mulig partnerintegration med Byggesagkyndig.nu, samt
permanente UX/UI-kvalitetskrav for alle kommende funktioner. Se
docs/DECISIONS.md for den fulde, kategoriserede liste (LOCKED / PLANNED /
PARKED / OPEN).

# Næste planlagte opgave

"Design og afgræns første implementerbare del af pre-contract-flowet:
projektgrundlag før invitationer og tilbud."

Der må ikke implementeres database, routes eller UI for tilbudsfasen,
før denne opgave er eksplicit godkendt. Den næste session skal først:

1. læse CLAUDE.md og importerede statusfiler
2. læse docs/DECISIONS.md's afsnit om pre-contract-flowet og AI
3. gengive sin forståelse af det afgrænsede scope
4. afvente udtrykkelig godkendelse, før nogen fil ændres

# Chat- og navigationsfasen (afsluttet)

Global app-shell, bygherrens globale Chat-side og ulæst badge er
implementeret, produktionsdeployet og browsertestet. Vandret
mobiloverflow (global navigation, projektfaner, dashboardkort) er
rettet og accepteret. Markering som læst findes fortsat kun som
serverendpoint (POST /api/chat/laest) — ikke integreret i UI. Se
docs/PROJECT_STATE.md, "Navigation og UI" og "Chatstatus", for detaljer
og commit-historik. Denne fase kræver ikke yderligere opfølgning før
pre-contract-arbejdet startes.
