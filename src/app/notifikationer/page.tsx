"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const typeIkon = (type: string) => {
  switch (type) {
    case "betaling": return { path: "M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm0 5h20", bg: "bg-green-100", farve: "#16a34a" };
    case "mangel": return { path: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", bg: "bg-red-100", farve: "#dc2626" };
    case "besked": return { path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", bg: "bg-blue-100", farve: "#3b82f6" };
    case "abforbruger": return { path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", bg: "bg-primary/10", farve: "#1a5c38" };
    case "dokument": return { path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6", bg: "bg-gray-100", farve: "#6b7280" };
    case "tidsplan": return { path: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", bg: "bg-amber-100", farve: "#d97706" };
    case "eftersyn": return { path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", bg: "bg-[#1a5c38]/10", farve: "#1a5c38" };
    default: return { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", bg: "bg-gray-100", farve: "#6b7280" };
  }
};

type Notifikation = {
  id: number;
  type: string;
  titel: string;
  tekst: string;
  tid: string;
  ulæst: boolean;
  link: string;
  linkTekst: string;
};

export default function Notifikationer() {
  const [notifikationer, setNotifikationer] = useState<Notifikation[]>([]);

  useEffect(() => {
    let haandvaerkerNavn = "Håndværkeren";
    let projektNavn = "dit projekt";

    try {
      const rawProjekt = localStorage.getItem("contractr_projekt");
      if (rawProjekt) {
        const p = JSON.parse(rawProjekt);
        if (p.haandvaerkerNavn) haandvaerkerNavn = p.haandvaerkerNavn;
        if (p.projekttype) projektNavn = p.projekttype;
      }
      const rawHv = localStorage.getItem("contractr_haandvaerker");
      if (rawHv) {
        const h = JSON.parse(rawHv);
        if (h.navn) haandvaerkerNavn = h.navn;
      }
    } catch { /* ignore */ }

    setNotifikationer([
      {
        id: 0,
        type: "abforbruger",
        titel: "AB-Forbruger: Sørg for skriftlig tidsplan",
        tekst: `Jf. AB-Forbruger § 12 skal start- og slutdato aftales skriftligt. Bed ${haandvaerkerNavn} bekræfte tidsplanen skriftligt inden opstart.`,
        tid: "I dag",
        ulæst: true,
        link: "/abforbruger",
        linkTekst: "Læs § 12",
      },
      {
        id: 1,
        type: "abforbruger",
        titel: "AB-Forbruger: Ekstraarbejde skal aftales skriftligt",
        tekst: "Jf. AB-Forbruger § 23 skal alt ekstraarbejde aftales og prissættes skriftligt inden udførelse. Accepter aldrig mundtlige aftaler om merarbejde.",
        tid: "I dag",
        ulæst: true,
        link: "/abforbruger",
        linkTekst: "Læs § 23",
      },
      {
        id: 2,
        type: "abforbruger",
        titel: "AB-Forbruger: Betaling mod dokumenteret fremdrift",
        tekst: "Jf. AB-Forbruger § 25 og § 37 bør du kun betale mod dokumenteret fremdrift. Undgå at forudbetale store beløb.",
        tid: "I dag",
        ulæst: false,
        link: "/abforbruger",
        linkTekst: "Læs § 25",
      },
      {
        id: 3,
        type: "abforbruger",
        titel: "AB-Forbruger: Kræv afleveringsforretning",
        tekst: `Jf. AB-Forbruger § 38 bør du afholde en afleveringsforretning med ${haandvaerkerNavn} inden du overtager arbejdet. Mangler noteres i protokollen.`,
        tid: "Kommende",
        ulæst: false,
        link: "/projekt/1/aflevering",
        linkTekst: "Se afleveringsflow",
      },
    ]);
  }, []);

  const ulæste = notifikationer.filter(n => n.ulæst).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/projekt/1" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tilbage til projekt
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Nembyggestyring</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikationer</h1>
            {ulæste > 0 && <p className="text-sm text-gray-400 mt-1">{ulæste} ulæste</p>}
          </div>
          <button className="text-sm font-medium text-primary hover:underline">Markér alle som læst</button>
        </div>

        <div className="space-y-3">
          {notifikationer.map((n) => {
            const ikon = typeIkon(n.type);
            return (
              <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${n.ulæst ? "border-primary/20" : "border-gray-100"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ikon.bg}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ikon.farve} strokeWidth="2">
                      <path d={ikon.path}/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold ${n.ulæst ? "text-gray-900" : "text-gray-700"}`}>{n.titel}</p>
                      {n.ulæst && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{n.tekst}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{n.tid}</span>
                      <Link href={n.link} className="text-xs font-semibold text-primary hover:underline">
                        {n.linkTekst} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
