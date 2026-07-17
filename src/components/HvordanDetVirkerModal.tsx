"use client";

import { useState, useEffect } from "react";

const TRIN = [
  {
    nummer: 1,
    titel: "Upload dit tilbud eller kontrakt",
    beskrivelse: "Træk og slip din PDF direkte ind. Nembyggestyring læser dokumentet på sekunder - du behøver ikke forklare noget.",
    farve: "#1e3a2a",
    baggrund: "#f0fdf4",
    ikon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    detaljer: ["PDF, Word eller billede af dokument", "Krypteret upload - kun du ser det", "Analyseret på under 60 sekunder"],
  },
  {
    nummer: 2,
    titel: "AI screener aftalen mod AB-Forbruger",
    beskrivelse: "Platformen gennemgår alle klausuler og sammenligner med AB-Forbruger 2012 - den standard der beskytter dig som forbruger.",
    farve: "#b45309",
    baggrund: "#fffbeb",
    ikon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    detaljer: ["Pris og betalingsplan", "Tidsplan og slutdato", "Ekstraarbejde og ændringer", "Mangler og reklamationsret"],
  },
  {
    nummer: 3,
    titel: "Du får en klar risikorapport",
    beskrivelse: "Rapporten viser grønt, gult eller rødt på hvert punkt - med præcis forklaring på hvad der mangler, og hvad du skal kræve.",
    farve: "#0369a1",
    baggrund: "#eff6ff",
    ikon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    detaljer: ["Risikoniveau: lav / middel / høj", "Konkrete ændringsforslag", "Klar til at sende til håndværkeren"],
  },
  {
    nummer: 4,
    titel: "Afklar og underskriv trygt",
    beskrivelse: "Send dine ændringsønsker direkte fra platformen. Når I er enige, underskrives kontrakten digitalt - og projektet går i gang.",
    farve: "#6d28d9",
    baggrund: "#f5f3ff",
    ikon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    detaljer: ["Send forslag direkte til håndværker", "Chat og forhandl i platformen", "Digital underskrift med fuld juridisk gyldighed"],
  },
];

export default function HvordanDetVirkerModal({ åben, luk }: { åben: boolean; luk: () => void }) {
  const [aktivtTrin, setAktivtTrin] = useState(0);
  const [animerer, setAnimerer] = useState(false);

  useEffect(() => {
    if (!åben) return;
    setAktivtTrin(0);
    const interval = setInterval(() => {
      setAktivtTrin(prev => {
        if (prev >= TRIN.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [åben]);

  useEffect(() => {
    setAnimerer(true);
    const t = setTimeout(() => setAnimerer(false), 350);
    return () => clearTimeout(t);
  }, [aktivtTrin]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") luk(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [luk]);

  if (!åben) return null;

  const trin = TRIN[aktivtTrin];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={luk}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Sådan virker det</p>
            <h2 className="text-2xl font-bold text-gray-900">Fra tilbud til tryghed på 4 trin</h2>
          </div>
          <button
            onClick={luk}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Trin-indikatorer */}
        <div className="px-8 mb-6">
          <div className="flex items-center gap-2">
            {TRIN.map((t, i) => (
              <button
                key={i}
                onClick={() => setAktivtTrin(i)}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ backgroundColor: i <= aktivtTrin ? trin.farve : "#e5e7eb" }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">Trin {aktivtTrin + 1} af {TRIN.length}</span>
            <span className="text-xs font-medium" style={{ color: trin.farve }}>
              {aktivtTrin === TRIN.length - 1 ? "Færdig!" : "Automatisk fremgang..."}
            </span>
          </div>
        </div>

        {/* Trin-indhold */}
        <div
          className="mx-8 mb-6 rounded-2xl p-7 transition-all duration-300"
          style={{ backgroundColor: trin.baggrund, opacity: animerer ? 0.6 : 1, transform: animerer ? "translateY(6px)" : "translateY(0)" }}
        >
          <div className="flex items-start gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: trin.farve + "20", color: trin.farve }}
            >
              {trin.ikon}
            </div>
            <div className="flex-1">
              <div
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: trin.farve }}
              >
                Trin {trin.nummer}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{trin.titel}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{trin.beskrivelse}</p>
              <ul className="space-y-1.5">
                {trin.detaljer.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={trin.farve} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex items-center justify-between gap-3">
          <button
            onClick={() => setAktivtTrin(Math.max(0, aktivtTrin - 1))}
            disabled={aktivtTrin === 0}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Forrige
          </button>

          {aktivtTrin < TRIN.length - 1 ? (
            <button
              onClick={() => setAktivtTrin(aktivtTrin + 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: trin.farve }}
            >
              Næste trin →
            </button>
          ) : (
            <a
              href="/opret"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1e3a2a" }}
            >
              Tjek min byggeaftale gratis →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
