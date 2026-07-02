"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const pakker = [
  {
    id: "lille",
    navn: "Lille projekt",
    pris: "499 kr.",
    budget: "Under 100.000 kr.",
    eksempler: "Nyt badeværelse, malerarbejde, smårenoveringer",
    features: ["Kontrakt baseret på AB-Forbruger", "Tidsplan med milepæle", "Betalingsoverblik", "Dokumentdeling", "Mangel-registrering"],
  },
  {
    id: "mellem",
    navn: "Mellem projekt",
    pris: "999 kr.",
    budget: "100.000 - 500.000 kr.",
    eksempler: "Tilbygning, nyt tag, køkken, større renovering",
    features: ["Kontrakt baseret på AB-Forbruger", "Tidsplan med milepæle", "Betalingsoverblik", "Dokumentdeling", "Mangel-registrering", "AI-tilbudsgennemgang inkluderet", "Inviter op til 3 entreprenører", "Prioriteret support"],
    popular: true,
  },
  {
    id: "stort",
    navn: "Stort projekt",
    pris: "1.999 kr.",
    budget: "Over 500.000 kr.",
    eksempler: "Ombygning, nybyg, total renovering",
    features: ["Kontrakt baseret på AB-Forbruger", "Tidsplan med milepæle", "Betalingsoverblik", "Dokumentdeling", "Mangel-registrering", "AI-tilbudsgennemgang inkluderet", "Ubegrænsede entreprenører", "Dedikeret rådgiver tilknyttet", "Ugentlig statusrapport"],
  },
];

export default function VaelgPakke() {
  const router = useRouter();
  const [valgt, setValgt] = useState("mellem");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-lg" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
          <p className="text-sm text-gray-400">Trin 1 af 3 - Vælg pakke</p>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Vælg den rigtige pakke</h1>
          <p className="text-gray-500">Engangspris baseret på dit projekts størrelse. Ingen abonnement.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {pakker.map((p) => (
            <button
              key={p.id}
              onClick={() => setValgt(p.id)}
              className={`text-left rounded-2xl border-2 p-6 transition-all relative ${valgt === p.id ? "border-primary bg-white shadow-md" : "border-gray-100 bg-white hover:border-gray-200"}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">Mest valgte</span>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{p.navn}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.budget}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${valgt === p.id ? "border-primary bg-primary" : "border-gray-300"}`}>
                  {valgt === p.id && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{p.pris}</p>
              <p className="text-xs text-gray-400 mb-5">Engangsbetaling · inkl. moms</p>
              <p className="text-xs text-gray-500 italic mb-4">{p.eksempler}</p>
              <div className="space-y-2">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <p className="text-xs text-gray-600">{f}</p>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/opret")}
            className="bg-primary text-white font-bold px-10 py-4 rounded-xl hover:opacity-90 transition-opacity text-base flex items-center gap-2"
          >
            Fortsæt med {pakker.find(p => p.id === valgt)?.navn}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Du betaler først når projektet er oprettet · 30 dages pengene-tilbage-garanti</p>
      </div>
    </div>
  );
}
