"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

interface Tip {
  ikon: string;
  titel: string;
  tekst: string;
  vigtighed: "vigtig" | "god-ide" | "overvej";
}

const TIPS: Record<string, { label: string; tips: Tip[] }> = {
  badevarelse: {
    label: "Badeværelse",
    tips: [
      { ikon: "⚡", titel: "Stikkontakter i sikker afstand", tekst: "Stikkontakter skal placeres minimum 60 cm fra brusezonen. Overvej ekstra stik til barbermaskine, hårtørrer og tandbørste.", vigtighed: "vigtig" },
      { ikon: "🌡️", titel: "Gulvvarme betaler sig", tekst: "El-gulvvarme i badeværelset koster typisk 5.000–10.000 kr. ekstra men giver markant komfort. Aftales inden fliser lægges — ikke efterfølgende.", vigtighed: "god-ide" },
      { ikon: "💨", titel: "Ventilation er lovpligtigt", tekst: "Badeværelset skal have mekanisk ventilation. Afklar om eksisterende emhætte er godkendt — ellers skal det med i tilbuddet.", vigtighed: "vigtig" },
      { ikon: "🪟", titel: "Vindueshøjde og privathed", tekst: "Badeværelsesvinduet bør sidde højt (over øjenhøjde) eller have frostet glas. Aftal eksplicit med håndværkeren hvad der leveres.", vigtighed: "overvej" },
      { ikon: "🚿", titel: "Vandtæt zone — fejl her er dyre", tekst: "Den vandtætte membran bag bruser og badekar skal udføres korrekt. Mangler her giver skimmel og fugtskader. Bed om dokumentation.", vigtighed: "vigtig" },
      { ikon: "💡", titel: "Spejlbelysning og stik", tekst: "Et spejl med integreret belysning kræver strøm. Placer el-punkt over spejl inden fliser monteres — det er dyrt at lave om bagefter.", vigtighed: "god-ide" },
    ],
  },
  kokken: {
    label: "Køkken",
    tips: [
      { ikon: "⚡", titel: "Nok stikkontakter fra start", tekst: "Planlæg mindst 6–8 stikkontakter i arbejdszonen. Kaffemaskine, brødrister, blender og oplader sluger dem alle. Umuligt at tilføje bagefter.", vigtighed: "vigtig" },
      { ikon: "💨", titel: "Emhætte — frisk luft eller recirkulation", tekst: "Aftræksemhætte kræver hul i ydervæg og er mest effektiv. Recirkulationsemhætte er lettere at montere. Diskuter med VVS hvad der passer til din bolig.", vigtighed: "vigtig" },
      { ikon: "💡", titel: "Arbejdslys under skabene", tekst: "LED-strip under overskabe giver godt arbejdslys og koster lidt. Kræver el-punkt — aftal det inden køkkenet monteres.", vigtighed: "god-ide" },
      { ikon: "🪵", titel: "Gulvtype tæt på vask", tekst: "Gulvet ved opvask og vask skal tåle vand. Fliser eller vinyl er bedre end trægulv tæt på vand. Aftal korrekt overgang.", vigtighed: "overvej" },
      { ikon: "🔧", titel: "Vandhaner og fleksslanger", tekst: "Bed om at fleksslanger til vand og brugsvandsrør skiftes i forbindelse med nyt køkken. Det er billigt nu — dyrt ved et vandskade.", vigtighed: "god-ide" },
      { ikon: "📐", titel: "Arbejdshøjde er personlig", tekst: "Standardhøjde er 90 cm. Aftal eksplicit hvilken højde der passer jer — afvigelser kræver skræddersyet løsning.", vigtighed: "overvej" },
    ],
  },
  tag: {
    label: "Tag",
    tips: [
      { ikon: "🌡️", titel: "Isolering — krav og gevinst", tekst: "Ny isolering i tagrum skal leve op til BR18. God isolering sparer 5.000–15.000 kr./år i varme. Bed om dokumentation på U-værdier.", vigtighed: "vigtig" },
      { ikon: "💨", titel: "Ventilation under tag", tekst: "Undertaget skal ventileres korrekt — manglende luftcirkulation giver kondensation og råd. Afklar med tømreren at vindskeder og rygning er åbne.", vigtighed: "vigtig" },
      { ikon: "🌧️", titel: "Tagrender og nedløb", tekst: "Skift tagrender og nedløb samtidig med taget. Det koster lidt ekstra men undgår vandskader i soklen og sparer en ny opstilling.", vigtighed: "god-ide" },
      { ikon: "🔒", titel: "Dampspærre — ingen genveje", tekst: "Dampspærren beskytter isoleringen mod fugt indefra. Mangler eller huller giver skimmel. Kræv at den limes og tapes korrekt ved alle gennemføringer.", vigtighed: "vigtig" },
      { ikon: "🏠", titel: "Kviste og ovenlys — byggetilladelse", tekst: "Ændringer i tagformen kræver typisk byggetilladelse. Afklar hos kommunen inden du accepterer tilbuddet — ansvaret er dit.", vigtighed: "overvej" },
    ],
  },
  tilbygning: {
    label: "Tilbygning",
    tips: [
      { ikon: "📋", titel: "Byggetilladelse — din opgave", tekst: "Tilbygninger kræver næsten altid byggetilladelse fra kommunen. Det er bygherrens ansvar at indhente den — ikke håndværkerens.", vigtighed: "vigtig" },
      { ikon: "🏗️", titel: "Fundament og jordbund", tekst: "Afklar jordbundsforhold inden tilbud accepteres. Overraskelser i fundamentet er den hyppigste årsag til markant prisstigning.", vigtighed: "vigtig" },
      { ikon: "⚡", titel: "El og vand — forlæng fra eksisterende", tekst: "Tilbygningens el og VVS kobles på husets eksisterende installation. Bed om vurdering af om tavle og rør kan klare kapaciteten.", vigtighed: "god-ide" },
      { ikon: "🌡️", titel: "Varmekilde til tilbygningen", tekst: "Afklar om gulvvarme, radiator eller varmepumpe er bedst. Valget påvirker fundament og el-kapacitet — beslut inden støbning.", vigtighed: "god-ide" },
      { ikon: "🔗", titel: "Overgang til eksisterende hus", tekst: "Overgangen mellem ny og gammel bygning er teknisk kritisk — fugt, isolering og sætninger skal håndteres. Insistér på detaljeret løsningsbeskrivelse.", vigtighed: "vigtig" },
    ],
  },
  totalrenovering: {
    label: "Totalrenovering",
    tips: [
      { ikon: "📋", titel: "Koordinering er dit ansvar", tekst: "Ved totalrenovering med flere fag er det typisk bygherrens ansvar at koordinere. Overvej en byggesagkyndig som byggeleder.", vigtighed: "vigtig" },
      { ikon: "⚡", titel: "El-tavlen er fundamentet", tekst: "Skift el-tavlen inden andre fag starter. En moderne gruppe-tavle med HPFI er basis for alt andet — og billig at lave nu, dyr bagefter.", vigtighed: "vigtig" },
      { ikon: "🔧", titel: "VVS — skift det hele mens væggene er åbne", tekst: "Når væggene alligevel er åbne, er det optimalt tidspunkt at skifte brugsvandsrør. Aftales proaktivt med VVS inden lukning.", vigtighed: "god-ide" },
      { ikon: "🏠", titel: "Rækkefølge redder penge", tekst: "Forkert rækkefølge er dyr. Korrekt orden: nedrivning → el rå → VVS rå → gips → maling → gulv → køkken/bad. Afvigelser koster altid.", vigtighed: "vigtig" },
      { ikon: "💾", titel: "Dokumentér alt løbende", tekst: "Tag billeder af rørføring og el-kabler inden væggene lukkes. Det sparer tid og penge ved fremtidigt arbejde og forsikringssager.", vigtighed: "god-ide" },
    ],
  },
  vinduer: {
    label: "Vinduer & facade",
    tips: [
      { ikon: "🌡️", titel: "Energiklasse — kræv dokumentation", tekst: "Nye vinduer skal have energimærke A eller bedre. Bed om produktdatablad med U-værdi — det er lovkrav og påvirker varmeforbrug markant.", vigtighed: "vigtig" },
      { ikon: "💧", titel: "Fugtspærre og inddækning", tekst: "Fugtinddækning rundt om vinduet er kritisk. Mangler giver vandindtrængning og råd. Bed om beskrivelse af inddækningsmetode.", vigtighed: "vigtig" },
      { ikon: "🔊", titel: "Støjreduktion — lag af glas", tekst: "Bor du tæt på vej eller jernbane? Overvej trinlyd-glas (Rw > 35 dB). Koster lidt mere men gør markant forskel i søvnkvalitet.", vigtighed: "overvej" },
      { ikon: "🏠", titel: "Facadepuds — undgå revner", tekst: "Facadearbejde skal udføres i tørt vejr over 5°C. Aftal vejrforbehold i kontrakten så du ikke ender med revner pga. frost.", vigtighed: "god-ide" },
    ],
  },
  maler: {
    label: "Maler & gips",
    tips: [
      { ikon: "🕐", titel: "Tørretid — hastværk er lastværk", tekst: "Grundmaling skal tørre minimum 24 timer inden næste lag. Spar ikke på tørretiden — det giver blærer og dårlig vedhæftning.", vigtighed: "vigtig" },
      { ikon: "🏠", titel: "Spartling og slibearbejde er halvdelen", tekst: "Et flot malerresultat starter med god spartling. Aftal med maleren at spartling, slibning og grundning er inkluderet i tilbuddet.", vigtighed: "vigtig" },
      { ikon: "💡", titel: "Belysning afslører alt", tekst: "Kontroller malerarbejdet med en stærk lygte langs væggen — det afslører ujævnheder som ikke ses i normalt lys. Gør det ved afleveringen.", vigtighed: "god-ide" },
      { ikon: "🎨", titel: "Farveprøver på væggen", tekst: "Farver ser altid anderledes ud på væggen end på kip. Mal A4-store prøver og lad dem sidde 24 timer i dagslys inden du beslutter.", vigtighed: "overvej" },
    ],
  },
  andet: {
    label: "Generel renovering",
    tips: [
      { ikon: "📄", titel: "Få alt skriftligt fra start", tekst: "Mundtlige aftaler er svære at håndhæve. Insistér på skriftligt tilbud med beskrivelse af materialer, arbejde og betalingsplan.", vigtighed: "vigtig" },
      { ikon: "🔍", titel: "Tjek CVR og referencer", tekst: "Søg håndværkerens CVR-nummer på virk.dk. Bed om 2–3 referencer du kan ringe til. Seriøse håndværkere afviser ikke det.", vigtighed: "vigtig" },
      { ikon: "💰", titel: "Reserver 10–15% til uforudsete", tekst: "Næsten alle renoveringsprojekter støder på overraskelser. Hav en buffer — det giver ro og forhandlingsstyrke.", vigtighed: "god-ide" },
      { ikon: "📸", titel: "Dokumentér inden og under", tekst: "Tag billeder af eksisterende forhold og under arbejdet. Det beskytter dig ved uenigheder og er guld ved forsikringssager.", vigtighed: "god-ide" },
    ],
  },
};

const vigtighedStyle = {
  vigtig: { bg: "bg-red-50", border: "border-red-100", badge: "bg-red-100 text-red-700", label: "Vigtigt" },
  "god-ide": { bg: "bg-blue-50", border: "border-blue-100", badge: "bg-blue-100 text-blue-700", label: "God idé" },
  overvej: { bg: "bg-gray-50", border: "border-gray-100", badge: "bg-gray-100 text-gray-600", label: "Overvej" },
};

export default function Tips() {
  const router = useRouter();
  const [projekttype, setProjekttype] = useState("");

  useEffect(() => {
    const type = sessionStorage.getItem("screening_projekttype") || "andet";
    setProjekttype(type);
  }, []);

  const data = TIPS[projekttype] ?? TIPS.andet;

  return (
    <FlowLayout aktivTrin={2}>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-accent text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Inden du accepterer tilbuddet
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Praktiske tips til {data.label.toLowerCase()}
        </h1>
        <p className="text-gray-500">
          Disse punkter er værd at overveje og afklare med din håndværker — inden du skriver under.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {data.tips.map((tip, i) => {
          const style = vigtighedStyle[tip.vigtighed];
          return (
            <div key={i} className={`rounded-2xl border p-5 ${style.bg} ${style.border}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{tip.ikon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-gray-900 text-sm">{tip.titel}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.tekst}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-accent rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p className="text-sm text-accent-foreground leading-relaxed">
            <span className="font-semibold">Husk:</span> I næste trin screener vi dit konkrete tilbud mod AB-Forbruger og finder det der specifikt mangler eller bør afklares i din aftale.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
          ← Tilbage
        </button>
        <button
          onClick={() => router.push("/opret/upload")}
          className="flex-1 py-4 rounded-xl text-base font-bold bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20 transition-all"
        >
          Upload dit tilbud →
        </button>
      </div>
    </FlowLayout>
  );
}
