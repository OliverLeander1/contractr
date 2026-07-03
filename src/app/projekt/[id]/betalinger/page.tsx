"use client";

import { use, useEffect, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

interface TilbudsPost { id: string; beskrivelse: string; enhed: string; pris: string; }
interface GemtProjekt {
  titel: string;
  bygherreNavn?: string;
  accepteretDato: string;
  total: number;
  tilbudsposter: TilbudsPost[];
}

const fmtKr = (n: number) => n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

const FASER = [
  { label: "Opstart", andel: 0.20 },
  { label: "Halvvejs", andel: 0.30 },
  { label: "Naesten faerdig", andel: 0.30 },
  { label: "Aflevering", andel: 0.20 },
];

export default function Betalinger({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [projekt, setProjekt] = useState<GemtProjekt | null | "loading">("loading");
  const [godkendt, setGodkendt] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_projekt");
      if (raw) {
        setProjekt(JSON.parse(raw));
        const saved = localStorage.getItem("contractr_betalinger_godkendt");
        if (saved) setGodkendt(JSON.parse(saved));
      } else { setProjekt(null); }
    } catch { setProjekt(null); }
  }, []);

  function godkendBetaling(i: number) {
    const ny = { ...godkendt, [i]: true };
    setGodkendt(ny);
    localStorage.setItem("contractr_betalinger_godkendt", JSON.stringify(ny));
  }

  if (projekt === "loading") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  if (!projekt) return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-500">Ingen projekt fundet. Accepter et tilbud for at se betalingsplan.</p>
      </div>
    </div>
  );

  const total = projekt.total;
  const betalinger = FASER.map((f, i) => ({
    navn: f.label,
    andel: Math.round(f.andel * 100) + "%",
    beløb: total * f.andel,
    status: godkendt[i] ? "betalt" : i === 0 ? "afventer" : "kommende",
    index: i,
  }));

  const betalt = betalinger.filter(b => b.status === "betalt").reduce((s, b) => s + b.beløb, 0);
  const tilbage = total - betalt;
  const afventer = betalinger.find(b => b.status === "afventer");

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Okonomi</h1>
          <p className="text-sm text-gray-400 mt-1">{projekt.titel}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Samlet entreprisesum", value: fmtKr(total), sub: "inkl. moms", color: "text-gray-900" },
            { label: "Betalt", value: fmtKr(betalt), sub: `${Math.round((betalt / total) * 100)}% af total`, color: "text-green-700" },
            { label: "Tilbagestaende", value: fmtKr(tilbage), sub: "inkl. moms", color: "text-gray-900" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 font-medium mb-2">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {afventer && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Afventer godkendelse</p>
                <p className="text-sm text-amber-800">
                  Milepael &ldquo;{afventer.navn}&rdquo; er naet. Godkend fremdriften og frigiv betaling pa {fmtKr(afventer.beløb)}.
                </p>
                <p className="text-xs text-amber-600 mt-1">Betal kun naar arbejdet er dokumenteret udfort jf. AB-Forbruger § 26</p>
              </div>
            </div>
            <button
              onClick={() => godkendBetaling(afventer.index)}
              className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors"
            >
              Godkend og betal
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Betalingsplan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Koblet til fremdrift jf. AB-Forbruger § 26</p>
          </div>
          <div className="divide-y divide-gray-50">
            {betalinger.map((b) => (
              <div key={b.index} className={`px-6 py-4 flex items-center gap-4 ${b.status === "afventer" ? "bg-amber-50/40" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  b.status === "betalt" ? "bg-green-100" : b.status === "afventer" ? "bg-amber-100" : "bg-gray-100"
                }`}>
                  {b.status === "betalt" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : b.status === "afventer" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">{b.index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{b.navn}</p>
                  <p className="text-xs text-gray-400">{b.andel} af entreprisesummen</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{fmtKr(b.beløb)}</p>
                  <p className={`text-xs font-medium ${
                    b.status === "betalt" ? "text-green-600" :
                    b.status === "afventer" ? "text-amber-600" : "text-gray-400"
                  }`}>
                    {b.status === "betalt" ? "Betalt" : b.status === "afventer" ? "Afventer godkendelse" : "Kommende"}
                  </p>
                </div>
                {b.status === "afventer" && (
                  <button
                    onClick={() => godkendBetaling(b.index)}
                    className="ml-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Godkend
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
            <span className="text-sm font-bold text-gray-900">Total inkl. moms</span>
            <span className="text-sm font-bold text-primary">{fmtKr(total)}</span>
          </div>
        </div>

        <ABTip type="vigtig" paragraf="AB-Forbruger § 26" titel="Betal altid mod dokumenteret fremdrift" resumé="Betal kun naar en milaepael er opfyldt og arbejdet er godkendt af dig. Hav aldrig betalt mere end 50% inden halvdelen af arbejdet er udfort." detaljer="Jf. AB-Forbruger § 26 skal betaling kobles til dokumenteret fremdrift. Du kan tilbageholde betaling svarende til mangler jf. § 25, stk. 3." />
      </div>
    </div>
  );
}
