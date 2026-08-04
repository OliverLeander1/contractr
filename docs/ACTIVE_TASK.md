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

Serverendpointfasen er:

- implementeret
- typechecket
- produktionstestet for kerneflowet (se docs/PROJECT_STATE.md for
  detaljer og hvad der endnu mangler af negativ-/legacy-test)

Ingen UI eller navigation bruger endnu disse endpoints.

# Næste mulige fase

Den eneste aktive næste fase:

Fælles global app-shell/navigation og bygherrens globale Chat-visning.

Denne fase skal indledes med produkt- og kodeanalyse før
implementering og må ikke startes automatisk i en ny session.

Fasen skal senere understøtte:

- global navigation, der altid er synlig
- samlet Chat på tværs af projekter og kontrakter
- samlet ulæst badge
- seneste afsender
- besked-preview
- tidspunkt
- preview bevares efter læsning

Den projektspecifikke navigation skal fortsat eksistere som et
separat niveau.

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
