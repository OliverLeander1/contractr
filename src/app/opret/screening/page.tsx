"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

const trin = [
  "Læser dokumentet...",
  "Identificerer aftaletype og parter...",
  "Tjekker pris og betalingsplan...",
  "Analyserer tidsplan og forsinkelsesvilkår...",
  "Tjekker AB-Forbruger og aftalegrundlag...",
  "Vurderer ekstraarbejde og forbehold...",
  "Gennemgår mangler og afleveringsvilkår...",
  "Beregner samlet risikovurdering...",
];

export default function Screening() {
  const router = useRouter();
  const [aktivtTrin, setAktivtTrin] = useState(0);
  const [færdig, setFærdig] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAktivtTrin((prev) => {
        if (prev >= trin.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setFærdig(true);
            setTimeout(() => router.push("/opret/rapport"), 1200);
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [router]);

  const fremgang = Math.round(((aktivtTrin + 1) / trin.length) * 100);

  return (
    <FlowLayout aktivTrin={3}>
      <div className="text-center mb-12">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 transition-all duration-500 ${
          færdig ? "bg-green-100" : "bg-accent"
        }`}>
          {færdig ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-spin" style={{ animationDuration: "2s" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {færdig ? "Screening færdig!" : "Vi screener din aftale..."}
        </h1>
        <p className="text-gray-500">
          {færdig ? "Din rapport er klar. Du sendes videre nu." : "Det tager typisk under et minut. Vent venligst."}
        </p>
      </div>

      {/* Fremgang */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Fremgang</span>
          <span className="text-sm font-bold text-primary">{færdig ? 100 : fremgang}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${færdig ? 100 : fremgang}%` }}
          />
        </div>

        <div className="space-y-3">
          {trin.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                i < aktivtTrin || færdig ? "bg-primary" :
                i === aktivtTrin ? "bg-primary/20 border-2 border-primary" :
                "bg-gray-100"
              }`}>
                {(i < aktivtTrin || færdig) && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
                {i === aktivtTrin && !færdig && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={`text-sm transition-colors ${
                i <= aktivtTrin || færdig ? "text-gray-900 font-medium" : "text-gray-400"
              }`}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hvad vi tjekker */}
      <div className="bg-accent rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-accent-foreground mb-1">Vi screener mod AB-Forbruger</p>
            <p className="text-xs text-accent-foreground/80 leading-relaxed">
              AB-Forbruger er de standardbetingelser, der beskytter private bygherrer. Vi tjekker om din aftale lever op til dem — eller om du mangler vigtig beskyttelse.
            </p>
          </div>
        </div>
      </div>
    </FlowLayout>
  );
}
