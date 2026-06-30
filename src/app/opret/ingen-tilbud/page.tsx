"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";
import Link from "next/link";

const tjekliste = [
  {
    id: "pris",
    spørgsmål: "Er I blevet enige om en pris eller pristype?",
    tip: "Fast pris giver dig størst tryghed. Et overslag kan overskrides. Spørg altid til det maksimale beløb.",
    vigtigt: "AB-Forbruger § 14",
  },
  {
    id: "tidsplan",
    spørgsmål: "Er der aftalt en start- og slutdato?",
    tip: "Uden en slutdato har du ingen ret til dagbod ved forsinkelse. Kræv altid en dato i kontrakten.",
    vigtigt: "AB-Forbruger § 18",
  },
  {
    id: "betaling",
    spørgsmål: "Er I enige om hvornår og hvordan der betales?",
    tip: "Undgå stor forudbetaling. Betal i rater koblet til fremdrift, ikke til datoer.",
    vigtigt: "AB-Forbruger § 22",
  },
  {
    id: "abforbruger",
    spørgsmål: "Ved håndværkeren at AB-Forbruger 2012 skal gælde?",
    tip: "Spørg direkte: \"Accepterer du AB-Forbruger 2012 som grundlag for aftalen?\" Det skal stå i kontrakten.",
    vigtigt: "AB-Forbruger § 1",
  },
  {
    id: "ekstra",
    spørgsmål: "Er I enige om at ekstraarbejde skal aftales skriftligt?",
    tip: "Mundtlige aftaler om ekstra er svære at bevise. Kræv at alle ændringer bekræftes skriftligt.",
    vigtigt: "AB-Forbruger § 15",
  },
];

const skabeloner = [
  {
    id: "prisspørgsmål",
    titel: "Spørg til pristype og betalingsplan",
    besked: `Hej [navn],

Tak for vores snak om projektet. Inden vi går videre, vil jeg gerne have afklaret et par ting:

1. Er tilbuddet en fast pris eller et overslag? Hvis overslag - hvad er det maksimale beløb?
2. Hvordan ønsker du betalingen opdelt? Jeg foretrækker rater koblet til færdige milepæle.
3. Accepterer du AB-Forbruger 2012 som grundlag for aftalen?

Ser frem til dit svar.

Med venlig hilsen`,
  },
  {
    id: "tidsplan",
    titel: "Spørg til tidsplan og startdato",
    besked: `Hej [navn],

Jeg er interesseret i at gå videre med projektet. Kan du sende mig:

1. Hvornår kan I starte?
2. Hvornår forventes projektet afsluttet?
3. Hvad sker der hvis slutdatoen ikke overholdes?

Med venlig hilsen`,
  },
  {
    id: "kontrakt",
    titel: "Bed om et skriftligt tilbud/kontrakt",
    besked: `Hej [navn],

Inden vi aftaler noget endeligt, vil jeg gerne modtage et skriftligt tilbud med følgende:

• Præcis beskrivelse af arbejdet
• Pris (fast pris eller overslag med maksimum)
• Start- og slutdato
• Betalingsplan koblet til milepæle
• At AB-Forbruger 2012 gælder for aftalen

Når jeg har modtaget tilbuddet, kan jeg hurtigt få det gennemgået og vende tilbage.

Med venlig hilsen`,
  },
];

export default function IngenTilbud() {
  const router = useRouter();
  const [svar, setSvar] = useState<Record<string, boolean | null>>({});
  const [aktivSkabelon, setAktivSkabelon] = useState<string | null>(null);
  const [kopieret, setKopieret] = useState(false);

  const besvar = (id: string, ja: boolean) => {
    setSvar(prev => ({ ...prev, [id]: ja }));
  };

  const nej = Object.values(svar).filter(v => v === false).length;
  const besvaret = Object.keys(svar).length;

  const kopier = (tekst: string) => {
    navigator.clipboard.writeText(tekst);
    setKopieret(true);
    setTimeout(() => setKopieret(false), 2000);
  };

  return (
    <FlowLayout aktivTrin={1}>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Endnu intet tilbud
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forbered dig til forhandlingen</h1>
        <p className="text-gray-500 leading-relaxed">Du er i dialog med en håndværker men har intet skriftligt endnu. Her er hvad du skal sikre dig inden du siger ja - og skabeloner til at spørge om det.</p>
      </div>

      {/* Tjekliste */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">5 ting du skal afklare inden du siger ja</h2>
          {besvaret > 0 && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {besvaret}/{tjekliste.length} besvaret
            </span>
          )}
        </div>
        <div className="space-y-3">
          {tjekliste.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border p-4 transition-all ${
                svar[t.id] === true ? "border-green-200 bg-green-50" :
                svar[t.id] === false ? "border-amber-200 bg-amber-50" :
                "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{t.spørgsmål}</p>
                  <span className="text-[10px] font-bold text-primary/70">{t.vigtigt}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => besvar(t.id, true)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${svar[t.id] === true ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200"}`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => besvar(t.id, false)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${svar[t.id] === false ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200"}`}
                  >
                    Nej
                  </button>
                </div>
              </div>
              {svar[t.id] === false && (
                <p className="text-xs text-amber-800 leading-relaxed mt-2 pt-2 border-t border-amber-200">
                  💡 {t.tip}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resultat */}
      {besvaret === tjekliste.length && (
        <div className={`rounded-2xl border p-5 mb-5 ${nej === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          {nej === 0 ? (
            <>
              <p className="font-semibold text-green-800 mb-1">Du er godt forberedt!</p>
              <p className="text-sm text-green-700">Bed nu om et skriftligt tilbud og upload det her for at få en fuld screening.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-800 mb-1">{nej} ting skal afklares inden du siger ja</p>
              <p className="text-sm text-amber-700">Brug skabelonerne nedenfor til at spørge håndværkeren om de manglende punkter.</p>
            </>
          )}
        </div>
      )}

      {/* Skabeloner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Færdige beskeder til håndværkeren</h2>
        <p className="text-sm text-gray-400 mb-4">Kopiér og send direkte - tilpas navn og detaljer</p>
        <div className="space-y-3">
          {skabeloner.map((s) => (
            <div key={s.id}>
              <button
                onClick={() => setAktivSkabelon(aktivSkabelon === s.id ? null : s.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-gray-800">{s.titel}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-gray-400 transition-transform ${aktivSkabelon === s.id ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {aktivSkabelon === s.id && (
                <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans mb-3">{s.besked}</pre>
                  <button
                    onClick={() => kopier(s.besked)}
                    className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                  >
                    {kopieret ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Kopieret!</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Kopiér besked</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AB-Forbruger info */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-8">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Vidste du? AB-Forbruger beskytter dig - men kun hvis det er aftalt</p>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">AB-Forbruger 2012 gælder ikke automatisk. Det skal stå i kontrakten at begge parter accepterer den. Uden den reference er du ikke dækket af rettigheder om mangler, reklamation og dagbod.</p>
          <Link href="/abforbruger" className="text-xs font-semibold text-primary hover:underline">Læs alle dine rettigheder →</Link>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
          ← Tilbage
        </button>
        <button
          onClick={() => router.push("/opret/upload")}
          className="flex-1 py-4 rounded-xl text-base font-bold bg-primary text-white hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
        >
          Jeg har nu fået et tilbud. Upload det →
        </button>
      </div>
    </FlowLayout>
  );
}
