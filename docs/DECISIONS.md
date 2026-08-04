# Låste produktbeslutninger

- Flere uafhængige kontrakter kan ligge under samme projekt.
- Hver kontrakt har sin egen aftale, økonomi, chat og senere egne ændringer.
- Én privat chatsamtale pr. kontrakt.
- Samme entreprenør med to kontrakter har to separate chats.
- Entreprenøren identificeres via verificeret login-email.
- Global Chat skal altid være tilgængelig.
- Global navigation og projektnavigation er to forskellige niveauer.
- Global navigation må ikke bygges som tilfældige inline headers.
- Den skal implementeres som en fælles, vedvarende app-shell eller layoutstruktur.
- Projektfunktioner vises kun i konkret projektkontekst.
- Samtaleoversigter viser altid seneste afsender, preview og tidspunkt.
- Efter læsning forsvinder kun ulæst-markeringen.
- Læsestatus er individuel pr. bruger og samtale.
- public.notifikationer er ikke chat-læsestatus.
- Legacy-chat kobles aldrig automatisk til kontrakter.
- Ingen destruktiv SQL eller testdatanulstilling.
- Navigationen er en kernefunktion og må ikke nedprioriteres.
- Realtime er ikke nødvendigt i første version.
- Email, push og browsernotifikationer er en senere fase.

# Ny produktretning — pre-contract-flow, AI og UX/UI

Besluttet efter strategimøde. Udvider ovenstående låste beslutninger —
ophæver eller ændrer ingen af dem.

## LOCKED

- Begrebsmodellen for pre-contract-flowet: Projektgrundlag →
  invitationer → separate tilbud → tilbudssammenligning → valg →
  aftalegrundlag → aktiv byggesag.
  - Projektgrundlag: bygherrens fælles beskrivelse/materiale, sendt til
    flere entreprenører.
  - Tilbud: den enkelte entreprenørs separate svar på projektgrundlaget.
  - Tilbudssammenligning: en gennemskuelig analyse af forskellene.
  - Aftalegrundlag: det valgte tilbud, efter uklarheder, pris, tid,
    omfang, forudsætninger, betalingsplan, dokumenter og vilkår er
    samlet og godkendt.
  - Aktiv byggesag: sagen efter godkendelse af det samlede
    aftalegrundlag.
  - Et tilbud er ikke en kontrakt og ikke et godkendt aftalegrundlag.
- Bygherren finder selv sine entreprenører og etablerer selv den
  indledende kontakt, og inviterer dem derefter ind i platformen.
  Nembyggestyring er i første version ikke en leadportal og ikke
  3byggetilbud.dk.
- Flere private tilbud på samme projektgrundlag: ét projektgrundlag kan
  senere sendes til to eller flere entreprenører inden for samme fag.
  Entreprenører kan ikke se hinandens tilbud. Kun det valgte tilbud
  føres videre til aftalegrundlag — øvrige tilbud bevares som historik
  og bliver aldrig aktive kontrakter. Tilbudsfasen er et nyt
  pre-contract-lag og må ikke modelleres som flere falske/tomme
  kontrakter. Den eksisterende beslutning om, at ét projekt kan have
  flere uafhængige kontrakter, gælder fortsat — men først efter
  tilbudsfasen, for det/de valgte tilbud.
- Gennemskuelig AI-anbefaling: AI'en må analysere og anbefale tilbud
  (bl.a. på pris, omfang, tid, materialer, forudsætninger, forbehold,
  undtagelser, betalingsplan, fuldstændighed, tekniske og
  kontraktuelle risici, manglende oplysninger, uoverensstemmelser med
  projektgrundlaget) — men må aldrig træffe det bindende valg for
  brugeren, love fejlfrihed, garantere byggesagens resultat, bruge en
  skjult/uforklaret totalscore eller opfinde tekniske/juridiske krav.
  Anbefalingen skal være forklarbar, og hver væsentlig konklusion skal
  senere kunne spores til projektgrundlaget, det konkrete tilbud, et
  specifikt dokument/afsnit, en godkendt faglig kontrolregel eller en
  juridisk/kontraktuel regel. Brugeren beholder altid den endelige
  beslutning.
- Kildehierarki for AI (tilbudssammenligning) — et lavere niveau må
  aldrig tilsidesætte et højere:
  1. Godkendt projekt- og aftalegrundlag
  2. Projektspecifikke tegninger og beskrivelser
  3. Gældende og accepterede kontraktvilkår
  4. Producentanvisninger for det konkrete produkt
  5. Rådgivergodkendt faglig vidensbase
  6. Generelle checklister og erfaringsregler
  7. Modellens generelle viden
  Ved utilstrækkeligt fagligt eller juridisk belæg skal AI'en markere
  usikkerheden, formulere et afklaringsspørgsmål eller anbefale
  relevant rådgiverhjælp — aldrig præsentere en antagelse som et
  sikkert krav.
- AB-Forbruger forbliver det obligatoriske kontraktuelle fundament i
  aftalegrundlaget. Det skal fortsat fremgå tydeligt at: AB-Forbruger
  bliver en del af aftalen gennem parternes udtrykkelige accept;
  platformen stiller rammerne for en bedre og mere dokumenteret
  byggesag, men garanterer ikke en problemfri byggesag; AI-genereret
  indhold er et udkast og et beslutningsværktøj; parterne er selv
  ansvarlige for korrektheden af de oplysninger de indtaster og
  godkender; individuel teknisk eller juridisk rådgivning kan være
  nødvendig. Juridiske formuleringer, AI-ansvar, brugervilkår og
  acceptflow skal senere gennemgås af advokat.
- Rådgiveradgang skal, når den bygges, som minimum være: knyttet til en
  identificeret og autentificeret bruger, afgrænset til det konkrete
  projekt, rollebaseret, tidsbegrænset eller tilbagekaldelig, logget,
  og som udgangspunkt læseadgang medmindre andet gives eksplicit. Der
  må aldrig anvendes et permanent offentligt link med adgang til hele
  projektets data.
- UX/UI-principperne nedenfor er permanente kvalitetskrav for alle
  kommende funktioner — ikke en enkeltstående opgave.
- Et projekt kan have 0..mange projektgrundlag.
- Et projektgrundlag tilhører præcis ét projekt.
- Et projektgrundlag repræsenterer én afgrænset opgave eller entreprise,
  fx malerarbejde.
- Det samme projektgrundlag kan senere sendes til flere entreprenører.
- Projektgrundlag er en selvstændig pre-contract-entitet.
- Projektgrundlag må ikke gemmes i kontrakter.
- Projektgrundlag må ikke automatisk oprette en kontrakt.
- Kun et valgt tilbud kan senere føres videre mod aftalegrundlag.
- GET må ikke oprette projektgrundlagsdata.
- Ejerskab følger projektets bygherre som source of truth.
- Direkte browseradgang til public.projektgrundlag er ikke tilladt i
  første version.

## PLANNED

- Sikkert projektgrundlags-API (Bearer JWT, auth.getUser, verificeret
  projektejerskab; GET læser, POST opretter, PATCH opdaterer — GET må
  aldrig oprette data).
- Bygherres projektgrundlagsside (oprettelse og redigering).
- Pre-contract-flowet (projektgrundlag, invitationer, tilbud,
  tilbudsversioner, sammenligning, valg).
- Struktureret udtræk af tilbud til brug for sammenligning.
- Kontrolleret, versionsstyret AI-vidensbase og retrieval-arkitektur:
  kombinerer fast produktinstruks, strukturerede projektdata,
  struktureret tilbudsudtræk, den faglige vidensbase,
  projektspecifikke dokumenter, kildehenvisninger, validerede
  outputformater og tydelig usikkerhedshåndtering. Vidensbasen kan
  senere indeholde rådgivergodkendte tekniske beskrivelser, fag-/
  bygningsdelsopdelte checklister, juridisk/kontraktuel viden,
  AB-Forbruger-relaterede regler, producentanvisninger,
  projektspecifikke beskrivelser/tegninger og Nembyggestyrings egne
  kontrolregler. Materialet må ikke blot samles i én mappe og sendes
  samlet til modellen — systemet skal hente relevante kilder til den
  konkrete opgave (kontrolleret retrieval/RAG).
- Rådgiveradgang til konkrete projekter, med adgang til relevante dele
  af projektgrundlag, tilbud, aftalegrundlag, dokumenter, fotos,
  aftalesedler, mangler, økonomi og kommunikation — det præcise
  adgangsniveau designes senere.

## PARKED

- Endeligt grafisk redesign og endelig branding.
- Faktisk RAG/retrieval-implementering (kun principperne ovenfor er
  låst, ikke implementeringen).
- Fuld partnerintegration med Byggesagkyndig.nu — identificeret som en
  mulig fremtidig henvisnings- eller rådgiverpartner, men ikke en
  bindende integration eller eksklusiv aftale. Ingen ekstern partner må
  hardcodes i produktet uden en særskilt beslutning. Første mulige fase
  kan være tydelig henvisning, booking/kontakt eller viderestilling; en
  senere fase kan være rådgiverprofiler, projektadgang eller
  integreret rådgivning.
- Native app.

## OPEN

- Prissætning. En idé om betaling på 3-4 % af entreprisesummen er
  fremsat, men er ikke en låst beslutning. Prisstrategien skal fortsat
  testes og kan bestå af faste pakker, kompleksitetsniveauer, betaling
  ved oprettelse/aktivering, begrænset gratis adgang, særskilte
  rådgiverydelser og evt. en procentmodel ved ydelser med aktiv
  rådgivning. Fortsat åbent: hvor betalingspunktet placeres, hvad der
  er gratis/betalt, hvordan man undgår at brugeren kun genererer
  dokumentet og forlader platformen, og hvilket ansvar brugerne
  forventer ved forskellige prismodeller.
- Konkret datamodel for tilbudsfasen — ingen database- eller
  implementeringsbeslutning er truffet endnu.
- Konkret AI-leverandør/model til tilbudssammenligning.
- Strategisk samarbejde med Jacob: netværk, mulige
  rådgiverpartnerskaber, GDPR/teknisk sparring, advokatkontakt og
  fremtidig kommerciel udvikling er positivt tilbudt, men ejerandel,
  roller, investering, eksklusivitet og konkrete forpligtelser er ikke
  besluttet. Intet heraf skal omsættes til produktkode.

# UX/UI-principper (permanente kvalitetskrav)

Gælder for alle kommende funktioner — ikke kun navigationsopgaver.

- UX/UI er en del af implementeringen, ikke noget der eftermonteres:
  informationshierarki, brugerflows, navigation, responsive layouts,
  statusvisning, handlinger, formularer, loading states, empty states,
  fejltilstande, succesfeedback og adgang til hjælp skal designes
  korrekt fra start. Det overordnede grafiske redesign og den endelige
  branding kan komme senere.
- Visuel retning: professionel, troværdig, rolig, moderne,
  sammenhængende, nem at forstå for private bygherrer, kompakt uden at
  være trang. Sider må ikke automatisk bygges som "stor overskrift +
  stort tomrum + mange ens hvide kort". Brug i stedet, hvor det passer:
  diskrete tonede baggrundsflader, tydelig gruppering, varierede
  komponenttyper, kompakte lister, handlings- og statusområder,
  procesvisning, visuelle prioriteringer, konsistente afstande og
  klare primære/sekundære handlinger.
- Ikke unødig pynt: "levende og flydende" betyder at brugeren tydeligt
  kan forstå hvor vedkommende er, hvad der er sket, hvad der afventes,
  hvad næste handling er, og om en handling lykkedes — ikke mange
  animationer. Animationer og transitions skal være rolige,
  funktionelle og korte.
- Mobilkrav: alle nye brugerflader skal fungere på mobil, holde sig
  inden for viewporten, undgå vandret sidescroll, bevare læsbare touch
  targets, vise primære handlinger tydeligt, og aldrig lade vigtige
  kontroller blive skjult af navigation eller browserens safe areas.
  Vandret scroll bruges kun som en eksplicit og velbegrundet
  komponentadfærd.
- Genanvendelighed og konsistens: nye funktioner skal genbruge
  eksisterende mønstre — farver, radiusser, skygger, spacingværdier,
  statusmærker, knapvarianter, kortdesigns — frem for at opfinde nye
  vilkårligt. En reelt ny komponenttype skal designes som et
  genanvendeligt mønster. Claude skal implementere en konkret
  beskrevet designretning og ikke selv foretage et bredt visuelt
  redesign uden eksplicit scope.
- Ingen skjult designgæld: en funktion er ikke færdig alene fordi data
  kan gemmes, API'et virker, og knappen kan klikkes. Den relevante
  browsertest skal også kontrollere forståelighed, visuelt hierarki,
  mobiladfærd, tomtilstand, loading, fejl, feedback, navigation samt
  bredde og overflow.
