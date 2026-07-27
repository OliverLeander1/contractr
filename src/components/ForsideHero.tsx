"use client";

import { useState } from "react";
import Link from "next/link";

type Rolle = "bygherre" | "haandvaerker";

const indhold = {
  bygherre: {
    badge: "Hele byggesagen samlet ét sted",
    h1: <>Styr hele<br />byggeprojektet.<br /><span className="text-[#1e3a2a]">Fra start til aflevering.</span></>,
    tekst: "Opret dit projekt, inviter entreprenøren og styr alt fra kontrakt til aflevering ét sted. Du skriver under digitalt, godkender ekstraarbejde og holder styr på betalingsplanen.",
    fordele: [
      { ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, titel: "Aftalegrundlag på 5 minutter", tekst: "Beskriv projektet og inviter entreprenøren. Vi laver kontrakten klar til underskrift." },
      { ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, titel: "AB-Forbruger 2012 som standard", tekst: "Du ved altid hvilke rettigheder du har. Intet er gemt i småprint." },
      { ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>, titel: "Ekstraarbejde godkendes digitalt", tekst: "Ingen mundtlige aftaler. Alt ekstraarbejde beskrives, prissættes og godkendes inden opstart." },
    ],
    cta1: { href: "/opret", label: "Opret dit projekt gratis" },
    cta2: { href: "/opret/upload", label: "Tjek dit tilbud" },
    checks: ["Ingen konto krævet for at starte", "Gratis tilbudstjek", "AB-Forbruger 2012 som standard"],
  },
  haandvaerker: {
    badge: "Klarere aftaler. Færre tvister.",
    h1: <>Undgå tvister.<br />Dokumentér alt.<br /><span className="text-[#1e3a2a]">Fokus på arbejdet.</span></>,
    tekst: "Bygherre opretter projektet og inviterer dig. Du ser præcis hvad der er aftalt, godkender vilkårene digitalt og sender en tidsplan. Alt er dokumenteret fra dag 1.",
    fordele: [
      { ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, titel: "Klare aftaler fra dag 1", tekst: "Pris, tidsplan og betalingsbetingelser er aftalt og underskrevet digitalt inden du starter." },
      { ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, titel: "Ekstraarbejde dokumenteres", tekst: "Send en aftaleseddel direkte i platformen. Bygherre godkender digitalt — ingen diskussioner bagefter." },
      { ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, titel: "Betalingsplan koblet til fremdrift", tekst: "Betalinger frigives når milepæle er nået og godkendt. Færre forsinkelser og misforståelser." },
    ],
    cta1: { href: "/login?rolle=haandvaerker", label: "Opret profil som entreprenør" },
    cta2: null,
    checks: ["Gratis profil", "Modtag aftalesedler digitalt", "Dokumentation ved eventuel tvist"],
  },
};

// Samme kontrakt-mockup til begge roller
function KontraktMockup() {
  return (
    <div className="relative">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-3">Eksempel på aftalegrundlag</p>
      <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-xl overflow-hidden max-w-sm ml-auto">
        <div className="bg-[#1e3a2a] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-green-300/70 uppercase tracking-widest mb-0.5">Aftalegrundlag</p>
            <p className="text-sm font-bold text-white">Badeværelse · Valby</p>
          </div>
          <span className="bg-green-400/20 text-green-300 text-[10px] font-bold px-2.5 py-1 rounded-full">Klar til underskrift</span>
        </div>
        <div className="px-5 pt-4 pb-3 border-b border-[#f0ede8]">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Parter</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-[#f5f3ee] rounded-lg px-3 py-2">
              <p className="text-[9px] text-gray-400 mb-0.5">Bygherre</p>
              <p className="text-xs font-semibold text-gray-800">Mette Hansen</p>
              <p className="text-[10px] text-gray-400">Roskildevej 42, Valby</p>
            </div>
            <div className="flex-1 bg-[#f5f3ee] rounded-lg px-3 py-2">
              <p className="text-[9px] text-gray-400 mb-0.5">Entreprenør</p>
              <p className="text-xs font-semibold text-gray-800">TM Byg ApS</p>
              <p className="text-[10px] text-gray-400">CVR 34 56 78 90</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-b border-[#f0ede8] space-y-2">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Aftalepunkter</p>
          {[
            { label: "Fast pris", value: "87.500 kr. inkl. moms" },
            { label: "Opstart", value: "4. august 2025" },
            { label: "Aflevering", value: "29. august 2025" },
            { label: "Aftalegrundlag", value: "AB-Forbruger 2012" },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">{p.label}</span>
              <span className="text-[10px] font-semibold text-gray-800">{p.value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-b border-[#f0ede8]">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Betalingsplan</p>
          {[
            { milepæl: "Opstart", pct: "30%", beløb: "26.250 kr.", ok: true },
            { milepæl: "Halvvejs", pct: "40%", beløb: "35.000 kr.", ok: false },
            { milepæl: "Aflevering", pct: "30%", beløb: "26.250 kr.", ok: false },
          ].map(b => (
            <div key={b.milepæl} className="flex items-center gap-2 mb-1.5">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${b.ok ? "bg-[#1e3a2a]" : "border border-gray-200"}`}>
                {b.ok && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span className="text-[10px] text-gray-600 flex-1">{b.milepæl}</span>
              <span className="text-[10px] text-gray-400">{b.pct}</span>
              <span className="text-[10px] font-semibold text-gray-700">{b.beløb}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-[10px] text-gray-500">Mette Hansen · underskrevet</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-[10px] text-gray-500">TM Byg · afventer</p>
          </div>
        </div>
      </div>
      <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-[#1e3a2a]/6 rounded-2xl" />
    </div>
  );
}

export default function ForsideHero() {
  const [rolle, setRolle] = useState<Rolle>("bygherre");
  const v = indhold[rolle];

  return (
    <>
      {/* Toggle i header — vises her som sticky element */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center bg-white rounded-xl p-1 gap-1 border border-[#e0ddd6] shadow-sm">
          <button
            onClick={() => setRolle("bygherre")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${rolle === "bygherre" ? "bg-[#1e3a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Bygherre
          </button>
          <button
            onClick={() => setRolle("haandvaerker")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${rolle === "haandvaerker" ? "bg-[#1e3a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Entreprenør
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Venstre: Tekst */}
        <div>
          <span className="inline-flex items-center gap-2 bg-[#1e3a2a]/8 text-[#1e3a2a] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[#1e3a2a] rounded-full" />
            {v.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111816] leading-[1.08] tracking-tight mb-5">
            {v.h1}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
            {v.tekst}
          </p>

          {/* Fordele */}
          <div className="space-y-4 mb-8">
            {v.fordele.map((f, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-[#1e3a2a]/8 flex items-center justify-center flex-shrink-0 text-[#1e3a2a]">
                  {f.ikon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.titel}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link href={v.cta1.href}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1e3a2a] text-white font-bold rounded-xl hover:bg-[#162d20] transition-colors text-base shadow-sm">
              {v.cta1.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            {v.cta2 && (
              <Link href={v.cta2.href}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-[#e0ddd6]">
                {v.cta2.label}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
            {v.checks.map(s => (
              <span key={s} className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Højre: Mockup */}
        <KontraktMockup />
      </div>
    </>
  );
}
