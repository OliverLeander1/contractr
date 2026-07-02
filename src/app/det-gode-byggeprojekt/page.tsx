import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Det gode byggeprojekt: Kommunikation og aftaler der holder | Contractr",
  description: "Læs om hvad der adskiller det gode byggeprojekt fra det kaotiske. Klare aftaler, skriftlig kommunikation og AB-Forbruger er nøglerne til et projekt der slutter godt for alle parter.",
  keywords: ["byggeprojekt", "kommunikation på byggepladsen", "aftale med håndværker", "AB-Forbruger", "bygherre rettigheder", "godt samarbejde håndværker", "renovering aftale", "byggekontrakt"],
  openGraph: {
    title: "Det gode byggeprojekt: Kommunikation og aftaler der holder",
    description: "Hvad adskiller det projekt der slutter med et håndtryk fra det der ender i konflikt? Svaret handler næsten aldrig om håndværket — det handler om aftalen.",
    type: "article",
  },
};

export default function DetGodeByggeprojekt() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 300, letterSpacing: "2px" }} className="text-gray-900 text-lg">
              contractr
            </span>
          </Link>
          <Link href="/opret" className="text-sm font-semibold bg-[#1a5c38] text-white px-5 py-2.5 rounded-lg hover:bg-[#163f28] transition-colors">
            Start projekt gratis →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#f8faf9] border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-6 inline-block">← Tilbage til forsiden</Link>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold bg-green-50 text-green-800 border border-green-100 px-3 py-1 rounded-full">Guide</span>
            <span className="text-xs text-gray-400">8 minutters læsning</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Det gode byggeprojekt starter ikke med en skovl — det starter med en aftale
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            Hvad adskiller det projekt der slutter med et håndtryk fra det der ender i en klage? Svaret handler næsten aldrig om håndværket. Det handler om aftalen der kom forud.
          </p>
        </div>
      </div>

      {/* Artikel */}
      <article className="max-w-3xl mx-auto px-6 py-14">
        <div className="prose prose-lg prose-gray max-w-none" style={{lineHeight: "1.8"}}>

          {/* Indledning */}
          <p className="text-xl text-gray-600 leading-relaxed mb-8 font-light">
            Hvert år påbegyndes over 100.000 private renoverings- og byggeprojekter i Danmark. Langt de fleste forløber uden store problemer. Men når det går galt — og det gør det for en betragtelig del — er historien næsten altid den samme: der var uklarhed om hvad der var aftalt.
          </p>

          <hr className="border-gray-100 my-10" />

          {/* Del 1 */}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-5">Den tavse antagelse: roden til de fleste konflikter</h2>

          <p className="text-gray-600 leading-relaxed mb-5">
            Forestil dig dette: En familie i Aarhus skal have renoveret badeværelset. De indhenter to tilbud, vælger den håndværker de har bedst mavefornemmelse for, og skriver "I kan bare gå i gang" i en SMS. Seks uger senere er projektet langt dyrere end forventet, tre ugers forsinkelse er ikke blevet kommunikeret, og der er strid om hvem der betaler for de fliser der ikke passede.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Ingen af parterne er nødvendigvis i ond tro. Håndværkeren mente det var indlysende at plisetypen ville koste ekstra. Bygherren mente det var indlysende at det var inkluderet i tilbuddet. Ingen af dem havde skrevet det ned.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Det er den tavse antagelse. Begge parter forstod aftalen — de forstod den bare forskelligt. Og uden et skriftligt grundlag er det umuligt at afklare hvem der havde ret.
          </p>

          {/* Callout */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 my-8">
            <p className="text-amber-900 font-semibold text-sm mb-1">Vidste du?</p>
            <p className="text-amber-800 text-sm leading-relaxed">
              AB-Forbruger 2012 — standardvilkårene for private byggesager i Danmark — kræver at ekstraarbejde aftales skriftligt inden det påbegyndes (§ 23). Det er ikke kun god praksis. Det er vilkårene begge parter forpligter sig til, hvis aftalen er baseret på AB-Forbruger.
            </p>
          </div>

          <hr className="border-gray-100 my-10" />

          {/* Del 2 */}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-5">Kommunikation er ikke blødt — det er juridisk rygrad</h2>

          <p className="text-gray-600 leading-relaxed mb-5">
            Mange bygherrer tænker på kommunikation som noget der handler om stemning og samarbejdsevner. Det er det også. Men god kommunikation i et byggeprojekt er samtidig en dokumentationspraksis der i yderste konsekvens bestemmer hvem der har ret, hvis det ender i tvist.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Et skriftligt spørgsmål sendt til håndværkeren er et tidsstemplet dokument. En godkendelse pr. mail er et gyldigt samtykke. En besked om forsinkelse er en formel meddelelse. Disse beskeder beskytter begge parter — ikke kun bygherren.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Den erfarne håndværker ved det. Gode entrepreneurfirmaer bruger skriftlige aftaler ikke fordi de er svære at arbejde med, men fordi de ved at klare forventninger er det eneste der giver et projekt det fundament det har brug for. Kvaliteten af samarbejdet afhænger direkte af tydeligheden i aftalen.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">De fem spørgsmål du altid bør have svar på inden opstart</h3>

          <div className="space-y-3 mb-8">
            {[
              { nr: "1", spørgsmål: "Er prisen fast eller er det et overslag?", forklaring: "Et overslag giver håndværkeren ret til at overskride beløbet med op til 15 % uden yderligere godkendelse (AB-Forbruger § 14)." },
              { nr: "2", spørgsmål: "Hvornår begynder arbejdet, og hvornår er det forventet afsluttet?", forklaring: "Uden en aftalt tidsplan er forsinkelse svær at dokumentere og endnu sværere at kræve kompensation for." },
              { nr: "3", spørgsmål: "Hvad sker der hvis der opstår ekstraarbejde?", forklaring: "Hvem godkender det, til hvilken pris, og skal det aftales skriftligt inden det påbegyndes?" },
              { nr: "4", spørgsmål: "Hvornår og hvordan betales der?", forklaring: "Betalingsplanen bør afspejle faktisk fremdrift — ikke faste datoer der ikke er knyttet til hvad der er udført." },
              { nr: "5", spørgsmål: "Hvad er proceduren ved mangler?", forklaring: "Hvornår anses arbejdet for afleveret, og hvad gøres der hvis der opdages fejl efterfølgende?" },
            ].map((item) => (
              <div key={item.nr} className="flex gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="w-7 h-7 bg-[#1a5c38] text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.nr}</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{item.spørgsmål}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.forklaring}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-gray-100 my-10" />

          {/* Del 3 */}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-5">Håndværkeren er ikke modparten — I er på samme hold</h2>

          <p className="text-gray-600 leading-relaxed mb-5">
            En af de mest udbredte misforståelser om aftaler og dokumentation i byggeprojekter er at det handler om at beskytte sig mod håndværkeren. Det gør det ikke.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            En veldokumenteret aftale er det bedste udgangspunkt for begge parter. Håndværkeren ved præcist hvad der er bestilt. Bygherren ved præcist hvad der er inkluderet. Ingen af dem bruger tid og energi på misforståelser, unødvendige afklaringsmøder eller den ubehagelige samtale om hvem der dækker et uventet beløb.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            De bedste håndværkere — dem der er i høj kurs og som leverer kvalitetsarbejde år efter år — er typisk dem der er mest professionelle omkring aftaler og kommunikation. Det er ikke en tilfældighed. Klare rammer giver dem mulighed for at fokusere på det de er gode til: at udføre arbejdet.
          </p>

          {/* Citat-boks */}
          <div className="border-l-4 border-[#1a5c38] pl-6 my-8">
            <p className="text-lg text-gray-700 italic leading-relaxed">
              "De projekter der slutter godt, er næsten altid dem hvor forventningerne var tydelige fra dag ét. Det handler ikke om om der opstår problemer — det gør der næsten altid. Det handler om at parterne har et fælles grundlag at løse dem fra."
            </p>
            <p className="text-sm text-gray-400 mt-3">Erfaring fra den danske byggebranche</p>
          </div>

          <hr className="border-gray-100 my-10" />

          {/* Del 4 */}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-5">Hvad AB-Forbruger egentlig giver dig</h2>

          <p className="text-gray-600 leading-relaxed mb-5">
            AB-Forbruger 2012 er ikke et dokument du behøver at læse fra ende til anden. Det er standardvilkår der kan aftales som ramme for private byggesager, og som giver bygherren en række konkrete rettigheder — men de træder kun i kraft, hvis begge parter eksplicit aftaler det.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Men AB-Forbruger er kun et fundament. Det siger ingenting om din specifikke aftale, din specifikke håndværker eller dit specifikke projekt. Det er her det skriftlige grundlag bliver afgørende: aftalen skal udfylde de rammer som AB-Forbruger sætter.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 my-8">
            {[
              { paragraf: "§ 12", titel: "Tidsplan", tekst: "Du har ret til at kræve en skriftlig tidsplan med angivelse af start og forventet afslutning." },
              { paragraf: "§ 23", titel: "Ekstraarbejde", tekst: "Ekstraarbejde skal aftales skriftligt inden opstart. Du er ikke forpligtet til at betale for ekstraarbejde der ikke er aftalt." },
              { paragraf: "§ 25 + 37", titel: "Betaling", tekst: "Betaling bør ske i takt med dokumenteret fremdrift — ikke på forhånd og ikke på faste datoer uafhængigt af hvad der er udført." },
              { paragraf: "§ 38", titel: "Aflevering", tekst: "Du har ret til en formel afleveringsforretning, hvor mangler registreres skriftligt og der aftales en frist for udbedring." },
              { paragraf: "§ 58", titel: "1-års eftersyn", tekst: "Indenfor ét år efter aflevering kan du kræve et eftersyn, hvor håndværkeren skal udbedre mangler der opdages." },
            ].map((p) => (
              <div key={p.paragraf} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#1a5c38] bg-green-50 border border-green-100 px-2 py-0.5 rounded-lg">{p.paragraf}</span>
                  <span className="font-semibold text-gray-900 text-sm">{p.titel}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{p.tekst}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-100 my-10" />

          {/* Del 5 */}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-5">Dokumentation er ikke bureaukrati — det er hukommelse</h2>

          <p className="text-gray-600 leading-relaxed mb-5">
            Et mellemstort renoveringsprojekt strækker sig typisk over 4 til 16 uger. I den periode passerer der hundredvis af beslutninger, beskeder og aftaler. Mundtlige aftaler glemmes, misforstås eller huskes forskelligt. Det er ikke et spørgsmål om vilje — det er bare sådan hukommelse fungerer.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Skriftlig dokumentation er ikke udtryk for manglende tillid. Det er projektets hukommelse. Et tidsstemplet billede af et problem, en skriftlig godkendelse af ekstraarbejde, en kvittering for en betaling koblet til en konkret milepæl — det er informationer der er til rådighed for alle parter, til enhver tid, på ethvert tidspunkt i projektet.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Og i de tilfælde hvor der opstår uenighed, er det netop denne dokumentation der afgør sagen. Ikke hvem der råber højest eller hvem der husker det bedst.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Hvad du bør have dokumenteret undervejs</h3>

          <div className="space-y-2 mb-8">
            {[
              "Den originale aftale eller det accepterede tilbud",
              "Alle aftaler om ekstraarbejde — skriftligt inden opstart",
              "Betalinger koblet til konkret fremdrift og datoer",
              "Billeder af arbejdet undervejs — særligt inden noget dækkes til",
              "Skriftlig accept af leverancer og milepæle",
              "Registrerede mangler ved aflevering med aftalt udbedringsfrist",
            ].map((punkt) => (
              <div key={punkt} className="flex items-start gap-3 text-sm text-gray-600">
                <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {punkt}
              </div>
            ))}
          </div>

          <hr className="border-gray-100 my-10" />

          {/* Del 6 — konklusion */}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-5">Det gode projekt er ikke held — det er forberedelse</h2>

          <p className="text-gray-600 leading-relaxed mb-5">
            De projekter der slutter godt, er sjældent dem der gik fuldstændig som planlagt. Planer ændres. Materialer er forsinkede. Noget viser sig at være mere kompliceret end forventet. Det er byggeprojekternes natur.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Det der adskiller det gode forløb fra det dårlige er ikke fraværet af problemer — det er tilstedeværelsen af et fundament der gør det muligt at løse dem. Et fundament af klare aftaler, løbende kommunikation og dokumentation der giver alle parter det samme billede af hvad der er sket og hvad der er aftalt.
          </p>

          <p className="text-gray-600 leading-relaxed mb-5">
            Bygherren er den eneste part i et byggeprojekt uden professionel rygrad. Håndværkeren har gjort det hundrede gange. Rådgiveren kender spillereglerne. Bygherren er måske i gang med det første og eneste store renoveringsprojekt i sit liv.
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">
            Det er præcis dér Contractr er bygget til at hjælpe.
          </p>

        </div>

        {/* CTA-boks */}
        <div className="bg-[#1a5c38] rounded-2xl p-8 text-white text-center mt-12">
          <h3 className="text-2xl font-bold mb-3">Klar til at starte dit projekt rigtigt?</h3>
          <p className="text-green-200 mb-7 leading-relaxed max-w-lg mx-auto">
            Contractr sørger for at aftaler, betalinger og kommunikation er dokumenteret fra første dag. Gratis at starte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#1a5c38] font-bold rounded-xl hover:bg-green-50 transition-colors">
              Start projekt
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link href="/opret/upload" className="inline-flex items-center justify-center px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20">
              Tjek et tilbud du allerede har
            </Link>
          </div>
        </div>

        {/* Relaterede links */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">Læs også</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/abforbruger" className="group flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-100 hover:bg-green-50/30 transition-all">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-[#1a5c38] transition-colors">AB-Forbruger 2012</p>
                <p className="text-xs text-gray-400 mt-0.5">Dine rettigheder som privat bygherre</p>
              </div>
            </Link>
            <Link href="/opret/upload" className="group flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-100 hover:bg-green-50/30 transition-all">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-[#1a5c38] transition-colors">Tjek dit tilbud</p>
                <p className="text-xs text-gray-400 mt-0.5">Upload kontrakt eller tilbud og få det screenet</p>
              </div>
            </Link>
          </div>
        </div>
      </article>

    </div>
  );
}
