# Aktiv opgave

Browsertest af projektgrundlags-API og bygherre-UI.

Migrationen, API'et og UI'et er implementeret og kodegennemgået, men
IKKE endnu manuelt browsertestet. Denne opgave er ikke dokumenteret som
gennemført, før Oliver har udført og bekræftet testen.

Browsertesten skal omfatte:

- tomtilstand (projekt uden projektgrundlag)
- oprettelse af mindst to projektgrundlag under samme projekt
- redigering af et eksisterende projektgrundlag
- status ændret til "Klar til invitation"
- status ændret tilbage til "Under udarbejdelse"
- mobilbredde (ingen vandret overflow, alle handlinger tilgængelige)
- navigation (den nye "Projektgrundlag"-fane i ProjektNav, aktiv
  tilstand, øvrige faner og "Book rådgiver" fortsat virkende)
- bekræft at ingen kontrakt oprettes som sideeffekt af noget i dette
  flow

# Næste planlagte opgave (efter godkendt browsertest)

Afgræns sikker invitationsmodel til flere entreprenører pr.
projektgrundlag.

**Claude må ikke fortsætte automatisk til denne opgave.** Skal først
igangsættes efter Oliver eksplicit har gennemført og godkendt
browsertesten af projektgrundlags-API og bygherre-UI.

# Chat-, navigations- og sikkerhedsfaser (afsluttet)

Global app-shell, bygherrens globale Chat-side, ulæst badge og den
mobile navigationsrettelse er implementeret, produktionsdeployet og
browsertestet. Den tidligere email-query-baserede sikkerhedsrisiko i
GET /api/haandvaerker/sager er lukket (commit d6c55ea), browsertestet
og accepteret. Se docs/PROJECT_STATE.md for detaljer og commit-historik.
Disse faser kræver ikke yderligere opfølgning.
