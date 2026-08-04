# Aktiv opgave

Global Chat, samtaleoversigt og individuel læsestatus.

# Nuværende problem

Chatten virker teknisk, men brugerne skal selv opsøge den.

Bygherre og entreprenør kan endnu ikke se:

- at en samtale har aktivitet
- hvem der skrev sidst
- preview af seneste besked
- tidspunkt
- ulæst antal
- samlet Chat på tværs af sager

Efter læsning skal preview, afsender og tidspunkt fortsat vises. Kun ulæst-markeringen forsvinder.

# Produktionsstatus

public.chat_laesestatus er oprettet og klar.

POST /api/chat/laest og GET /api/chat/oversigt er implementeret og
verificeret med tsc/eslint. Ingen UI eller navigation bruger endnu
disse endpoints.

# Næste mulige fase

Ingen implementering endnu. Kommende fase (ikke godkendt til
implementering i en ny session uden eksplicit godkendelse):

- fælles global app-shell/navigation
- global Chat-side og besked-preview for bygherre

Der må ikke implementeres automatisk i en ny session.

Den nye session skal først:

1. læse CLAUDE.md og importerede statusfiler
2. kontrollere den aktuelle kode
3. gengive sin forståelse
4. afvente udtrykkelig godkendelse

# Bindende læsemodel

- GET beskeder markerer ikke automatisk som læst.
- Klienten markerer først efter, at beskeder er gengivet.
- Klienten sender kontrakt_id og senest viste besked-id.
- Serveren verificerer JWT, kontrakt, samtale og besked.
- sidst_laest_at sættes til beskedens faktiske sendt_at.
- Læsemarkøren må aldrig flyttes baglæns.
- Egne beskeder tæller ikke som ulæste.
- Brug IS DISTINCT FROM ved afsender-sammenligning.
- Identiske sendt_at-værdier kræver deterministisk tie-breaker.
- Legacy-samtaler med kontrakt_id = NULL udelukkes.

# Efter serverfasen

Senere særskilte faser:

- fælles global app-shell
- global Chat for bygherre
- bygherredashboard med preview og badge
- global Chat for entreprenør
- entreprenørdashboard med preview og badge
- polling
- senere notifikationscenter, email eller push
