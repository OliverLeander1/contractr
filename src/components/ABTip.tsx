"use client";

import { useState } from "react";

type ABTipProps = {
  paragraf: string;
  titel: string;
  resumé: string;
  detaljer: string;
  type?: "info" | "advarsel" | "vigtig";
};

export default function ABTip({ paragraf, titel, resumé, detaljer, type = "info" }: ABTipProps) {
  const [udvidet, setUdvidet] = useState(false);

  const farver = {
    info: { bg: "bg-blue-50", border: "border-blue-100", badge: "bg-blue-100 text-blue-700", ikon: "#3b82f6" },
    advarsel: { bg: "bg-amber-50", border: "border-amber-100", badge: "bg-amber-100 text-amber-700", ikon: "#d97706" },
    vigtig: { bg: "bg-red-50", border: "border-red-100", badge: "bg-red-100 text-red-700", ikon: "#dc2626" },
  }[type];

  return (
    <div className={`rounded-2xl border ${farver.border} ${farver.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={farver.ikon} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${farver.badge}`}>{paragraf}</span>
            <p className="text-sm font-semibold text-gray-900">{titel}</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{resumé}</p>
          {udvidet && (
            <div className="mt-3 pt-3 border-t border-white/60">
              <p className="text-sm text-gray-600 leading-relaxed">{detaljer}</p>
              <a href="/abforbruger" className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline">
                Læs alle AB-Forbruger paragraffer
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
          )}
        </div>
        <button
          onClick={() => setUdvidet(!udvidet)}
          className="text-xs font-semibold text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
        >
          {udvidet ? "Luk" : "Læs mere"}
        </button>
      </div>
    </div>
  );
}
