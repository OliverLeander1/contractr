"use client";

import { useState } from "react";
import Link from "next/link";

const PAKKER = [
  {
    id: "lille",
    navn: "Lille opgave",
    eksempler: "Maling, gulv, vinduer, badeværelse",
    pris: 499,
    highlight: false,
    badge: null,
    features: [
      "Fuld aftalerapport med alle fund",
      "Kopiérbar besked til håndværkeren",
      "Projektrum med tidsplan og chat",
      "Upload og gem dokumenter",
      "AB-Forbruger 2012 som grundlag",
      "Data gemt i 5 år",
    ],
    ikkeInkluderet: [
      "Ekstraarbejde-sedler",
      "Betalingsplan koblet til fremdrift",
      "Afleveringsflow",
      "AB-Forbruger notifikationer",
    ],
  },
  {
    id: "renovering",
    navn: "Renovering",
    eksempler: "Badeværelse, køkken, tilbygning",
    pris: 999,
    highlight: true,
    badge: "Mest valgt",
    features: [
      "Alt fra Lille opgave",
      "Ekstraarbejde-sedler med digital godkendelse",
      "Betalingsplan koblet til fremdrift",
      "Afleveringsflow med tjekliste",
      "Mangel-registrering med billeder og status",
      "AB-Forbruger notifikationer på rette tidspunkt",
      "1-årseftersyn påmindelser",
    ],
    ikkeInkluderet: [
      "Gratis møde med byggesagkyndig",
    ],
  },
  {
    id: "totalrenovering",
    navn: "Totalrenovering",
    eksempler: "Totalrenovering, større tilbygning",
    pris: 1999,
    highlight: false,
    badge: null,
    features: [
      "Alt fra Renovering",
      "Gratis online møde med byggesagkyndig (30 min.)",
      "Koordination på tværs af flere håndværkere",
      "Prioriteret support",
      "Ubegrænset dokumentopload",
    ],
    ikkeInkluderet: [],
  },
];

export default function VaelgPakke() {
  const [valgt, setValgt] = useState<string>("renovering");
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [sendt, setSendt] = useState(false);

  const valgtPakke = PAKKER.find(p => p.id === valgt)!;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>
          <Link href="/opret/upload" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tjek tilbud gratis</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Overskrift */}
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Projektrum</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">Vælg din pakke</h1>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
            Alle pakker bruger AB-Forbruger 2012 som standard og dine data gemmes for altid, klar til 1-årseftersyn og 5-årsreklamationsret.
          </p>
        </div>

        {/* Pakke-kort */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {PAKKER.map((pakke) => (
            <button
              key={pakke.id}
              onClick={() => setValgt(pakke.id)}
              className={`text-left rounded-2xl border-2 p-6 transition-all ${
                valgt === pakke.id
                  ? pakke.highlight
                    ? "border-[#1e3a2a] bg-[#1e3a2a] text-white"
                    : "border-[#1e3a2a] bg-white"
                  : "border-[#e0ddd6] bg-white hover:border-[#1e3a2a]/30"
              }`}
            >
              {pakke.badge && (
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${
                  valgt === pakke.id && pakke.highlight ? "bg-white/20 text-white" : "bg-[#e5ede7] text-[#1e3a2a]"
                }`}>
                  {pakke.badge}
                </span>
              )}
              <p className={`font-bold text-lg mb-1 ${valgt === pakke.id && pakke.highlight ? "text-white" : "text-gray-900"}`}>
                {pakke.navn}
              </p>
              <p className={`text-xs mb-4 ${valgt === pakke.id && pakke.highlight ? "text-white/60" : "text-gray-400"}`}>
                {pakke.eksempler}
              </p>
              <p className={`text-4xl font-bold mb-1 ${valgt === pakke.id && pakke.highlight ? "text-white" : "text-gray-900"}`}>
                {pakke.pris} <span className={`text-lg font-medium ${valgt === pakke.id && pakke.highlight ? "text-white/60" : "text-gray-400"}`}>kr.</span>
              </p>
              <p className={`text-xs mb-5 ${valgt === pakke.id && pakke.highlight ? "text-white/50" : "text-gray-400"}`}>inkl. moms, engangsbetaling</p>

              <div className="space-y-2">
                {pakke.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={valgt === pakke.id && pakke.highlight ? "white" : "#1e3a2a"} strokeWidth="3" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className={`text-xs leading-relaxed ${valgt === pakke.id && pakke.highlight ? "text-white/90" : "text-gray-700"}`}>{f}</span>
                  </div>
                ))}
                {pakke.ikkeInkluderet.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={valgt === pakke.id && pakke.highlight ? "rgba(255,255,255,0.3)" : "#d1d5db"} strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span className={`text-xs leading-relaxed ${valgt === pakke.id && pakke.highlight ? "text-white/40" : "text-gray-300"}`}>{f}</span>
                  </div>
                ))}
              </div>

              {valgt === pakke.id && (
                <div className={`mt-4 pt-4 border-t flex items-center gap-2 ${pakke.highlight ? "border-white/20" : "border-[#e0ddd6]"}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${pakke.highlight ? "bg-white" : "bg-[#1e3a2a]"}`}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={pakke.highlight ? "#1e3a2a" : "white"} strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className={`text-xs font-semibold ${pakke.highlight ? "text-white/80" : "text-[#1e3a2a]"}`}>Valgt</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* AB-Forbruger garanti */}
        <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-2xl px-6 py-4 mb-8 flex items-start gap-4">
          <div className="w-9 h-9 bg-[#1e3a2a] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">AB-Forbruger 2012 er standard i alle pakker</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Platformen bruger AB-Forbruger 2012 som grundlag for alle projekter. Håndværkeren accepterer det ved at bruge platformen. Du behøver ikke at aftale det særskilt.
            </p>
          </div>
        </div>

        {/* Betaling */}
        <div className="max-w-md mx-auto">
          {!sendt ? (
            <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm overflow-hidden">
              <div className="bg-[#1e3a2a] px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-0.5">Valgt pakke</p>
                  <p className="text-white font-bold text-lg">{valgtPakke.navn}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs mb-0.5">inkl. moms</p>
                  <p className="text-white text-3xl font-bold">{valgtPakke.pris} <span className="text-base font-medium opacity-60">kr.</span></p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="text-xs text-green-700 font-medium">30 dages pengene-tilbage-garanti</p>
                </div>

                <input
                  type="text"
                  placeholder="Dit navn"
                  value={navn}
                  onChange={(e) => setNavn(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
                <input
                  type="email"
                  placeholder="Din e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />

                <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 bg-gray-50">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Kortoplysninger</p>
                    <p className="text-xs text-gray-300">Betalingsløsning aktiveres snart</p>
                  </div>
                </div>

                <button
                  onClick={() => { if (navn && email) setSendt(true); }}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                    navn && email
                      ? "bg-[#1e3a2a] text-white hover:bg-[#162d20] shadow-md shadow-[#1e3a2a]/20"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Betal {valgtPakke.pris} kr. og opret projektrum
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { t: "Sikker betaling via Stripe" },
                    { t: "Ingen abonnement" },
                    { t: "Permanent adgang" },
                    { t: "Engangskøb" },
                  ].map(i => (
                    <div key={i.t} className="flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      <p className="text-xs text-gray-400">{i.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">Tak, {navn.split(" ")[0]}!</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Vi skriver til <strong>{email}</strong> når betalingen er klar. I mellemtiden kan du oprette dit projekt gratis.
              </p>
              <Link
                href="/opret"
                className="block w-full bg-[#1e3a2a] text-white text-sm font-bold py-3.5 rounded-xl hover:bg-[#162d20] transition-colors"
              >
                Opret projekt i mellemtiden →
              </Link>
            </div>
          )}

          <div className="mt-5 text-center">
            <p className="text-xs text-gray-400">
              Brug for en uvildig fagmand til tilsyn, aflevering eller tvist?{" "}
              <Link href="/tilkoeb" className="text-[#1e3a2a] font-semibold hover:underline">Se rådgiverydelser →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
