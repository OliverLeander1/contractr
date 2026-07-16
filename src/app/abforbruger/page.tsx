import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AB-Forbruger 2012: Dine rettigheder som bygherre",
  description: "Få overblik over AB-Forbruger 2012 - standardbetingelserne der beskytter dig som privat bygherre. Forstå dine rettigheder om betaling, mangler, reklamation og aflevering.",
  keywords: ["AB-Forbruger", "AB-Forbruger 2012", "bygherre rettigheder", "byggeri rettigheder", "reklamationsret byggeri"],
  openGraph: {
    title: "AB-Forbruger 2012: Dine rettigheder som bygherre",
    description: "Forstå AB-Forbruger 2012 og dine rettigheder om betaling, mangler og aflevering.",
    url: "https://www.Nembyggestyring.dk/abforbruger",
  },
  alternates: { canonical: "https://www.Nembyggestyring.dk/abforbruger" },
};

const sektioner = [
  {
    emne: "Betaling",
    ikon: "M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm0 5h20",
    farve: "bg-blue-50 border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    paragraffer: [
      {
        nr: "§ 25",
        titel: "Hvornår skal du betale?",
        tekst: "Betaling skal som udgangspunkt ske, når arbejdet er afleveret. En faktura forfalder, når du modtager den, og betaling er rettidig, når den sker senest 15 arbejdsdage efter forfaldsdagen. Er du uenig i en faktura, kan du holde hele eller dele af betalingen tilbage - men du skal betale den del, der er enighed om.",
      },
      {
        nr: "§ 25, stk. 4",
        titel: "Rente ved forsinket betaling",
        tekst: "Betaler du ikke til tiden, kan håndværkeren kræve renter fra forfaldsdagen efter rentelovens rentesats.",
      },
      {
        nr: "§ 26",
        titel: "Løbende betalinger (rater)",
        tekst: "Det kan aftales, at betaling sker løbende for udført arbejde og anvendte materialer. Betaling skal ske, når håndværkeren fremsender en faktura i overensstemmelse med aftalen. Reglerne i § 25 om forfaldsdag, rettidig betaling og tilbageholdelsesret gælder tilsvarende.",
      },
      {
        nr: "§ 27",
        titel: "Håndværker kan standse arbejdet ved manglende betaling",
        tekst: "Betaler du ikke forfaldne beløb til tiden, kan håndværkeren standse arbejdet efter et skriftligt varsel på 5 arbejdsdage. Håndværkeren skal genoptage arbejdet snarest muligt, efter din betaling er registreret.",
      },
    ],
  },
  {
    emne: "Forsinkelse",
    ikon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    farve: "bg-amber-50 border-amber-100",
    badge: "bg-amber-100 text-amber-700",
    paragraffer: [
      {
        nr: "§ 28",
        titel: "Hvornår er der forsinkelse fra håndværkerens side?",
        tekst: "Der foreligger forsinkelse fra håndværkerens side, hvis arbejdet ikke er udført inden den aftalte tid - medmindre håndværkeren har ret til tidsfristforlængelse (se § 29).",
      },
      {
        nr: "§ 29",
        titel: "Hvornår har håndværkeren ret til at blive forsinket?",
        tekst: "Håndværkeren har ret til forlængelse af tidsfrister ved: (1) ændringer du selv kræver, (2) dine egne forhold eller en anden håndværkers forsinkelse, (3) force majeure - krig, usædvanlig naturbegivenhed, brand, strejke, lockout eller hærværk, (4) usædvanligt vejrlig for årstiden og egnen, eller (5) offentlige påbud eller forbud uden for håndværkerens kontrol.",
      },
      {
        nr: "§ 30 & § 31",
        titel: "Dagbod og erstatning ved ansvarspådragende forsinkelse",
        tekst: "Forsinkelse som ikke giver ret til tidsfristforlængelse, er ansvarspådragende for håndværkeren. Er dagbod aftalt, kan du kræve dagbod - og ikke yderligere erstatning. Er dagbod ikke aftalt, er du berettiget til erstatning efter dansk rets almindelige regler. Krav om dagbod skal fremsættes inden rimelig tid efter, at du kan konstatere forsinkelsen.",
      },
      {
        nr: "§ 36",
        titel: "Begge parter skal søge at undgå forsinkelser",
        tekst: "Parterne skal søge at undgå eller begrænse forsinkelser ved tiltag, som med rimelighed kan kræves. Anser en part sig berettiget til fristforlængelse, skal vedkommende snarest muligt underrette den anden part og på forlangende godtgøre, at forsinkelsen skyldes det påberåbte forhold.",
      },
    ],
  },
  {
    emne: "Mangler",
    ikon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    farve: "bg-red-50 border-red-100",
    badge: "bg-red-100 text-red-700",
    paragraffer: [
      {
        nr: "§ 40",
        titel: "Hvad er en mangel?",
        tekst: "Er arbejdet ikke udført som aftalt, fagmæssigt korrekt eller i overensstemmelse med dine anvisninger, foreligger der en mangel. Det samme gælder, hvis håndværkeren ikke har leveret anden aftalt ydelse - f.eks. materialer - i forbindelse med arbejdet.",
      },
      {
        nr: "§ 42",
        titel: "Reklamér inden rimelig tid",
        tekst: "Du kan kun påberåbe dig mangler, som håndværkeren har fået meddelelse om inden rimelig tid efter, at manglerne er eller burde have været opdaget af dig. Reklamationsfristen gælder ikke, hvis håndværkeren har gjort sig skyldig i groft uforsvarlige forhold.",
      },
      {
        nr: "§ 43",
        titel: "Håndværkeren har pligt og ret til at udbedre",
        tekst: "Håndværkeren har pligt og ret til inden rimelig tid at afhjælpe mangler, der påvises ved afleveringen eller senere. Afhjælpes mangler ikke inden rimelig tid, kan du lade manglerne afhjælpe af en anden for håndværkerens regning - eller kræve et afslag i prisen. Du kan også lade mangler udbedre for håndværkerens regning, hvis afhjælpning er uopsættelig og håndværkeren ikke er i stand til at foretage den umiddelbart.",
      },
      {
        nr: "§ 44",
        titel: "Afhjælpningspligt kan bortfalde ved umulighed",
        tekst: "Håndværkerens afhjælpningspligt bortfalder, hvis afhjælpning er umulig eller forbundet med uforholdsmæssigt store udgifter. Ved bedømmelsen heraf skal der tages hensyn til din interesse i, at aftalen opfyldes. Du bevarer dog i alle tilfælde retten til afslag i entreprisesummen.",
      },
      {
        nr: "§ 45",
        titel: "Beregning af afslag i prisen",
        tekst: "Afslag beregnes som det beløb, det ville have kostet at afhjælpe manglerne. Er afhjælpning umulig eller uforholdsmæssigt dyr, fastsættes afslaget skønsmæssigt - enten som forskellen mellem aftalt pris og hvad prisen ville have været for arbejdet i den foreliggende stand, eller som forskellen mellem arbejdets værdi uden mangler og med mangler.",
      },
      {
        nr: "§ 47",
        titel: "Du kan gå direkte til underentreprenører",
        tekst: "Hvis et krav vedrørende mangler ikke kan gennemføres mod håndværkeren - f.eks. ved konkurs - kan du gøre kravet gældende direkte mod håndværkerens underentreprenører og leverandører, hvis disse har udført det mangelfulde arbejde eller leveret mangelfulde materialer.",
      },
    ],
  },
  {
    emne: "Aflevering",
    ikon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    farve: "bg-green-50 border-green-100",
    badge: "bg-green-100 text-green-700",
    paragraffer: [
      {
        nr: "§ 37",
        titel: "Hvornår er arbejdet afleveret?",
        tekst: "Arbejdet betragtes som afleveret, når håndværkeren har meddelt dig, at det er udført, eller der er afholdt afleveringsforretning. Arbejdet betragtes ikke som afleveret, hvis der er væsentlige mangler, og du påberåber dig disse senest 10 arbejdsdage efter, at du har fået meddelelse om, at arbejdet er udført. Håndværkeren har bevisbyrden for, at arbejdet er afleveret.",
      },
      {
        nr: "§ 38",
        titel: "Afleveringsforretning",
        tekst: "Afleveringsforretning afholdes, hvis entreprisesummen er større end 50.000 kr., og en af parterne ønsker det og meddeler dette inden arbejdet er udført - eller hvis parterne har aftalt det. Håndværkeren indkalder med 5 arbejdsdages varsel til afholdelse senest 10 arbejdsdage efter, at arbejdet er udført. Der udarbejdes en afleveringsprotokol med alle påpegede mangler, som begge parter underskriver.",
      },
    ],
  },
  {
    emne: "1-års eftersyn",
    ikon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    farve: "bg-purple-50 border-purple-100",
    badge: "bg-purple-100 text-purple-700",
    paragraffer: [
      {
        nr: "§ 58",
        titel: "Hvornår afholdes 1-årseftersyn?",
        tekst: "1-årseftersyn afholdes obligatorisk, hvis prisen for arbejdet overstiger 500.000 kr. For arbejder under 500.000 kr. afholdes 1-årseftersyn, hvis en af parterne ønsker det og meddeler dette til den anden part inden 1 år efter arbejdets aflevering.",
      },
      {
        nr: "§ 59 & § 60",
        titel: "Sådan foregår eftersynet",
        tekst: "Håndværkeren indkalder dig skriftligt til eftersyn med højst 30 og mindst 10 arbejdsdages varsel. Eftersynet skal finde sted senest 1 år efter afleveringen. Der udfærdiges en eftersynsrapport, hvor alle mangler du påpeger noteres - uanset om håndværkeren er enig eller ej. Rapporten underskrives af begge parter.",
      },
    ],
  },
  {
    emne: "Ændringer i arbejdet",
    ikon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    farve: "bg-gray-50 border-gray-200",
    badge: "bg-gray-200 text-gray-600",
    paragraffer: [
      {
        nr: "§ 23",
        titel: "Ændringer skal aftales skriftligt",
        tekst: "Du kan forlange ændringer i arbejdets art og omfang, når ændringen har naturlig sammenhæng med de aftalte ydelser. Der skal snarest udarbejdes en skriftlig tillægsaftale om eventuelle ændringer - herunder omfang, kvalitet, pris og konsekvenser for tidsplanen. Håndværkeren har bevisbyrden for, hvilke ændringer der er aftalt.",
      },
      {
        nr: "§ 24, stk. 2",
        titel: "Prisoverslag: varsling ved overskridelse",
        tekst: "Har håndværkeren givet et prisoverslag, skal han hurtigst muligt indhente din stillingtagen til arbejdets fortsættelse, hvis prisen overstiger 15 %. Indhenter han ikke din stillingtagen, har du ikke pligt til at betale det beløb, der kunne være sparet, hvis du havde haft mulighed for at tage stilling.",
      },
      {
        nr: "§ 21",
        titel: "Uklar aftale: håndværkeren skal underrette dig",
        tekst: "Finder håndværkeren, at aftalen ikke yder tilstrækkelig vejledning til udførelse af arbejdet, eller at arbejdet ikke kan udføres i overensstemmelse med den indgåede aftale, skal han snarest muligt underrette dig og følge din anvisning. Har han ikke tid til at underrette dig, skal han - mod fornøden forlængelse af tidsfrister og mod betaling herfor - træffe de bedst mulige foranstaltninger for at undgå, at du lider tab. Håndværkeren skal desuden snarest underrette dig, hvis der opstår forhold, som hindrer eller vanskeliggør arbejdet, eller gør det nærliggende, at du påføres ulempe, tab eller ansvar over for tredjemand.",
      },
    ],
  },
  {
    emne: "Ophævelse af aftalen",
    ikon: "M18 6L6 18M6 6l12 12",
    farve: "bg-rose-50 border-rose-100",
    badge: "bg-rose-100 text-rose-700",
    paragraffer: [
      {
        nr: "§ 50",
        titel: "Din ret til at ophæve aftalen",
        tekst: "Du kan ophæve aftalen, hvis der foreligger væsentlig misligholdelse fra håndværkerens side, og det medfører betydelig ulempe for dig - herunder: (1) hvis der uden ret til tidsfristforlængelse foreligger en væsentlig forsinkelse fra håndværkerens side, eller (2) hvis det udførte arbejde er af en sådan kvalitet, at du har grund til at antage, at håndværkeren ikke vil være i stand til at fuldføre arbejdet uden væsentlige mangler.",
      },
      {
        nr: "§ 51",
        titel: "Håndværkerens ret til at ophæve aftalen",
        tekst: "Håndværkeren kan ophæve aftalen, hvis der foreligger væsentlig forsinkelse fra din side, og det medfører betydelig ulempe for ham - herunder hvis du ikke betaler til tiden. Aftalen kan dog ikke ophæves, hvis håndværkerens interesser er tilstrækkeligt tilgodeset ved stillet sikkerhed eller adgang til at standse arbejdet.",
      },
      {
        nr: "§ 52",
        titel: "Fremgangsmåden ved ophævelse",
        tekst: "Den part, der ønsker at ophæve aftalen, sender et varselsbrev med begrundelse og en rimelig frist til at reagere. Reageres der ikke, sendes endnu et brev med meddelelse om, at aftalen ophæves, og at der indkaldes til registreringsforretning.",
      },
    ],
  },
];

export default function ABForbruger() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/projekt/1" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tilbage til projekt
          </Link>
          <div className="flex items-center gap-2.5">
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            AB-Forbruger 2012
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Dine rettigheder som bygherre</h1>
          <p className="text-gray-500 leading-relaxed">
            AB-Forbruger (revideret juni 2012) er standardbetingelserne for private byggesager i Danmark. Her er de vigtigste paragraffer oversat til almindeligt dansk, fordelt efter situation.
          </p>

          {/* Vigtig note: AB-Forbruger er ikke automatisk */}
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" className="flex-shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">AB-Forbruger træder ikke automatisk i kraft</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                AB-Forbruger er standardbetingelser, ikke lovgivning. De skal eksplicit aftales mellem bygherre og entreprenør for at gælde. Det sker typisk ved at aftalen eller udbuddet reference til AB-Forbruger, og at entreprenøren accepterer dette. Nembyggestyring sørger for at dette er tydeligt fra starten, når du sender et projekt i udbud.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-accent border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-sm text-primary leading-relaxed">
              Platformen viser dig automatisk den relevante paragraf når noget sker i dit projekt, men kun hvis AB-Forbruger er aftalt som grundlag.
            </p>
          </div>
        </div>

        {/* Sektioner */}
        <div className="space-y-8">
          {sektioner.map((s) => (
            <div key={s.emne}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>{s.emne}</span>
              </div>
              <div className={`rounded-2xl border ${s.farve} overflow-hidden`}>
                {s.paragraffer.map((p, i) => (
                  <div key={p.nr} className={`p-5 bg-white ${i < s.paragraffer.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5 whitespace-nowrap ${s.badge}`}>{p.nr}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{p.titel}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{p.tekst}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-gray-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Vil du læse den fulde AB-Forbruger 2012?</p>
          <a
            href="https://www.byggerietsregler.dk/wp-content/uploads/2020/04/ABForbruger.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Åbn den officielle juridiske tekst (PDF)
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
