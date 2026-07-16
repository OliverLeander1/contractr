"use client";

import { useState } from "react";
import Link from "next/link";

const eksempler = [
  { spørgsmål: "Jeg vil fjerne en væg mellem stue og køkken", svar: "høj", tekst: "Bærende vægge kræver altid statiker og ingeniørberegninger inden nedrivning." },
  { spørgsmål: "Jeg vil bygge en tilbygning på 20 m²", svar: "høj", tekst: "Tilbygninger kræver ingeniørberegninger og typisk byggetilladelse fra kommunen." },
  { spørgsmål: "Jeg vil renovere badeværelset og montere badekar", svar: "middel", tekst: "Et fritstående badekar vejer 200-400 kg fyldt. I etageejendomme kræves vådrumsberegning." },
  { spørgsmål: "Jeg vil lægge nyt tag og ændre tagkonstruktionen", svar: "høj", tekst: "Ændringer i tagkonstruktionen kræver statiske beregninger." },
  { spørgsmål: "Jeg vil male og renovere overflader", svar: "ingen", tekst: "Maler- og overfladearbejde kræver ikke statiker eller ingeniørberegninger." },
  { spørgsmål: "Jeg vil skifte vinduer", svar: "ingen", tekst: "Standardudskiftning af vinduer kræver ikke ingeniørberegninger." },
];

export default function StatikerVurdering() {
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [sendt, setSendt] = useState(false);

  const kanSende = navn.trim() && email.trim() && beskrivelse.trim();

  const send = () => {
    if (!kanSende) return;
    setSendt(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
          </Link>
          <Link href="/tilkoeb" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Alle ydelser</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#111c17] text-white">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white/80">Gratis vurdering af en byggerådgiver</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Kræver dit projekt en statiker?</h1>
          <p className="text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            Mange bygherrer finder ud af det for sent. Beskriv hvad du vil bygge — en byggerådgiver svarer inden for 1 hverdag. Gratis, uforpligtende, dansk.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-5 gap-8">

          {/* Venstre: form */}
          <div className="md:col-span-3">
            {!sendt ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Beskriv dit projekt</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Vi sender dig svar inden for 1 hverdag</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dit navn</label>
                      <input
                        type="text"
                        placeholder="Anders Jensen"
                        value={navn}
                        onChange={e => setNavn(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Telefon (valgfri)</label>
                      <input
                        type="tel"
                        placeholder="20 12 34 56"
                        value={telefon}
                        onChange={e => setTelefon(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Din e-mail</label>
                    <input
                      type="email"
                      placeholder="din@email.dk"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Beskriv hvad du vil bygge eller ændre</label>
                    <textarea
                      rows={5}
                      placeholder="F.eks.: Jeg vil fjerne væggen mellem stue og køkken. Huset er fra 1968 og væggen ser bærende ud. Vil også gerne vide om der kræves tilladelse."
                      value={beskrivelse}
                      onChange={e => setBeskrivelse(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Jo mere du skriver, jo præcisere svar får du.</p>
                  </div>
                  <button
                    onClick={send}
                    disabled={!kanSende}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${kanSende ? "bg-[#1a5c38] text-white hover:opacity-90 shadow-md shadow-[#1a5c38]/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    Send til gratis vurdering
                  </button>
                  <p className="text-xs text-gray-400 text-center">Ingen forpligtelse. En byggerådgiver vender tilbage inden for 1 hverdag.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Tak, {navn.split(" ")[0]}!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Vi har modtaget din beskrivelse og sender svar til <strong>{email}</strong> inden for 1 hverdag. Hvis vi har brug for at stille et opklarende spørgsmål, ringer vi.
                </p>
                <div className="bg-[#f0f7f3] rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-[#1a5c38] mb-2">Hvad sker der nu?</p>
                  {[
                    "En byggerådgiver gennemgår din beskrivelse",
                    "Du modtager en klar anbefaling: ja/nej til statiker og hvad det koster",
                    "Har du brug for hjælp videre, kan vi tilkøbe beregningerne direkte",
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                      <span className="text-[#1a5c38] font-bold text-xs mt-0.5">{i + 1}.</span>
                      <p className="text-xs text-gray-600">{s}</p>
                    </div>
                  ))}
                </div>
                <Link href="/opret" className="inline-block bg-[#1a5c38] text-white text-sm font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                  Opret dit projekt imens →
                </Link>
              </div>
            )}
          </div>

          {/* Højre: eksempler + info */}
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Hvornår kræves der statiker?</h3>
              <div className="space-y-3">
                {eksempler.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${e.svar === "høj" ? "bg-red-100" : e.svar === "middel" ? "bg-amber-100" : "bg-green-100"}`}>
                      {e.svar === "ingen" ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={e.svar === "høj" ? "#dc2626" : "#d97706"} strokeWidth="2.5"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{e.spørgsmål}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{e.tekst}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Har du brug for beregninger?</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Hvis din vurdering viser at der kræves statiker, kan vi tilkøbe ingeniørberegninger direkte. Prisen afhænger af opgavens omfang.
              </p>
              <Link href="/tilkoeb" className="flex items-center justify-between p-3 bg-[#f0f7f3] rounded-xl hover:bg-[#e6f4ec] transition-colors group">
                <div>
                  <p className="text-xs font-bold text-[#1a5c38]">Statiker og ingeniørberegninger</p>
                  <p className="text-xs text-gray-500">Fra 3.995 kr.</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>

            <div className="bg-[#1a5c38] text-white rounded-2xl p-5">
              <p className="font-bold text-sm mb-1">Gratis. Ingen binding.</p>
              <p className="text-xs text-white/70 leading-relaxed">
                Vurderingen er gratis og uforpligtende. Vi tjener kun penge hvis du vælger at gå videre med beregninger eller en rådgiverydelse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
