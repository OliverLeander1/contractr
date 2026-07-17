"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [synlig, setSynlig] = useState(false);

  useEffect(() => {
    const samtykke = localStorage.getItem("cookie-samtykke");
    if (!samtykke) setSynlig(true);
  }, []);

  const accepter = (alle: boolean) => {
    localStorage.setItem("cookie-samtykke", alle ? "alle" : "nødvendige");
    setSynlig(false);
  };

  if (!synlig) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Vi bruger cookies</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Vi bruger nødvendige cookies for at platformen virker, og valgfrie cookies til at forbedre din oplevelse. Læs mere i vores{" "}
              <Link href="/privatliv" className="text-primary font-medium hover:underline">privatlivspolitik</Link>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button
              onClick={() => accepter(false)}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Kun nødvendige
            </button>
            <button
              onClick={() => accepter(true)}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Accepter alle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
