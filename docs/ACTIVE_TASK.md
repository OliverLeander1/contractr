# Aktiv opgave

Manuel browsertest af den sikrede kontraktlisteroute
(GET/POST /api/projekter/[id]/kontrakter) og dens fire brugerflows.

Sikringen er implementeret og kodegennemgået (typecheck, lint og lokale
401-tests bestået), men IKKE endnu manuelt browsertestet med rigtige
bygherre-/entreprenørkonti. Denne opgave er ikke dokumenteret som
gennemført, før Oliver har udført og bekræftet testen.

Browsertesten skal omfatte:

- Aftale kan indlæse kontrakter
- ekstra kontrakt kan oprettes
- Chat kan indlæse kontraktsamtaler
- Ekstraarbejde viser fortsat "Ny aftaleseddel"
- godkendelse af aftaleseddel kan fortsat sende håndværkernotifikation
- AI-genereret projektforslag kan fortsætte gennem
  kontraktoprettelsestrinnet for en logget ind bygherre
- logout eller udløbet session giver forståelig fejl
- uautentificeret request får ingen kontraktdata eller token

# Næste opgave efter godkendt browsertest

Sikring af POST /api/projekter samt GET/POST /api/kontrakt og deres
resterende call sites.

**Claude må ikke fortsætte automatisk til denne opgave.** Skal først
igangsættes efter Oliver eksplicit har gennemført og godkendt
browsertesten af den sikrede kontraktlisteroute.

# Efter dén opgave (uændret rækkefølge)

Browsertest af projektgrundlags-API og bygherre-UI (tomtilstand,
oprettelse af flere projektgrundlag, redigering, statusskift, mobil,
navigation, ingen kontrakt oprettet som sideeffekt), herefter afgrænsning
af en sikker invitationsmodel til flere entreprenører pr. projektgrundlag.
Ingen af delene er igangsat.

# Chat-, navigations- og sikkerhedsfaser (afsluttet)

Global app-shell, bygherrens globale Chat-side, ulæst badge og den
mobile navigationsrettelse er implementeret, produktionsdeployet og
browsertestet. Den tidligere email-query-baserede sikkerhedsrisiko i
GET /api/haandvaerker/sager er lukket (commit d6c55ea), browsertestet
og accepteret. Se docs/PROJECT_STATE.md for detaljer og commit-historik.
Disse faser kræver ikke yderligere opfølgning.
