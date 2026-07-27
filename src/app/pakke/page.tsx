"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const PAKKER = [
  {
    id: "lille",
    navn: "Mindre byggeprojekt",
    eksempler: "Maling, gulv, vinduer, badeværelse",
    pris: 299,
    features: [
      "Digitalt aftalegrundlag klar til underskrift",
      "Kopiérbar besked til håndværkeren",
      "Projektrum med dokumentarkiv",
      "Tjekliste over vigtige aftalepunkter",
      "Løbende rapporter du kan udtrække",
    ],
    ikkeInkluderet: [
      "Ekstraarbejde-sedler",
      "Betalingsplan koblet til fremdrift",
      "Afleveringsflow",
      "Møde med byggesagkyndig",
    ],
  },
  {
    id: "mellem",
    navn: "Mellemstort byggeprojekt",
    eksempler: "Badeværelse, køkken, tilbygning",
    pris: 2499,
    features: [
      "Alt fra Mindre byggeprojekt",
      "Ekstraarbejde-sedler med digital godkendelse",
      "Betalingsplan koblet til dokumenteret fremdrift",
      "Afleveringsflow med tjekliste",
      "Mangelregistrering med billeder og status",
      "Løbende rapporter du kan udtrække",
    ],
    ikkeInkluderet: [
      "Møde med byggesagkyndig",
    ],
  },
  {
    id: "stor",
    navn: "Stort byggeprojekt",
    eksempler: "Totalrenovering, større tilbygning",
    pris: 4999,
    features: [
      "Alt fra Mellemstort byggeprojekt",
      "Gratis online møde med byggesagkyndig (30 min.)",
      "Koordination på tværs af flere håndværkere",
      "Prioriteret support",
      "Ubegrænset dokumentopload",
    ],
    ikkeInkluderet: [],
  },
];

export default function VaelgPakke() {
  const [valgt, setValgt] = useState<string>("mellem");
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [projekId, setProjektId] = useState<string | null>(null);
  const [brugerId, setBrugerId] = useState<string | null>(null);
  const [betaler, setBetaler] = useState(false);
  const [fejl, setFejl] = useState("");

  const valgtPakke = PAKKER.find(p => p.id === valgt)!;

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setBrugerId(user.id);
        setEmail(user.email ?? "");
        const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
        if (profil?.navn) setNavn(profil.navn);
      }
      const projektId = sessionStorage.getItem("screening_projekt_id");
      if (projektId) setProjektId(projektId);
    };
    hent();
  }, []);

  const startBetaling = async () => {
    if (!email) return;
    setFejl("");
    setBetaler(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, navn, pakke: valgt, projekt_id: projekId, bruger_id: brugerId }),
      });
      const data = await res.json();
      if (data.error) {
        setFejl(data.error);
        setBetaler(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Netværksfejl");
      setBetaler(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">

        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Projektrum</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">Vælg din pakkeløsning</h1>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
            Vælg den løsning der passer til dit byggeprojekt. Er du i tvivl, er du velkommen til at kontakte os for vejledning.
          </p>
        </div>

        {/* Pakke-kort — samme højde */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10 items-stretch">
          {PAKKER.map((pakke) => {
            const erValgt = valgt === pakke.id;
            const erMork = erValgt && pakke.id === "mellem";
            return (
              <button
                key={pakke.id}
                onClick={() => setValgt(pakke.id)}
                className={`text-left rounded-2xl border-2 p-6 transition-all flex flex-col ${
                  erValgt
                    ? pakke.id === "mellem"
                      ? "border-[#1e3a2a] bg-[#1e3a2a] text-white"
                      : "border-[#1e3a2a] bg-white"
                    : "border-[#e0ddd6] bg-white hover:border-[#1e3a2a]/30"
                }`}
              >
                <div className="flex-1">
                  <p className={`font-bold text-lg mb-1 ${erMork ? "text-white" : "text-gray-900"}`}>
                    {pakke.navn}
                  </p>
                  <p className={`text-xs mb-4 ${erMork ? "text-white/60" : "text-gray-400"}`}>
                    {pakke.eksempler}
                  </p>
                  <p className={`text-4xl font-bold mb-1 ${erMork ? "text-white" : "text-gray-900"}`}>
                    {pakke.pris.toLocaleString("da-DK")} <span className={`text-lg font-medium ${erMork ? "text-white/60" : "text-gray-400"}`}>kr.</span>
                  </p>
                  <p className={`text-xs mb-5 ${erMork ? "text-white/50" : "text-gray-400"}`}>inkl. moms, engangsbetaling</p>

                  <div className="space-y-2">
                    {pakke.features.map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={erMork ? "white" : "#1e3a2a"} strokeWidth="3" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className={`text-xs leading-relaxed ${erMork ? "text-white/90" : "text-gray-700"}`}>{f}</span>
                      </div>
                    ))}
                    {pakke.ikkeInkluderet.map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={erMork ? "rgba(255,255,255,0.3)" : "#d1d5db"} strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span className={`text-xs leading-relaxed ${erMork ? "text-white/40" : "text-gray-300"}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {erValgt && (
                  <div className={`mt-4 pt-4 border-t flex items-center gap-2 ${erMork ? "border-white/20" : "border-[#e0ddd6]"}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${erMork ? "bg-white" : "bg-[#1e3a2a]"}`}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={erMork ? "#1e3a2a" : "white"} strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span className={`text-xs font-semibold ${erMork ? "text-white/80" : "text-[#1e3a2a]"}`}>Valgt</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tryghedssignal */}
        <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-2xl px-6 py-4 mb-8 flex items-start gap-4">
          <div className="w-9 h-9 bg-[#1e3a2a] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Du og din håndværker er i sikre hænder</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Alle pakker samler aftalegrundlaget ét sted og sikrer at begge parter er juridisk dækket. Undervejs kan du til enhver tid udtrække rapporter over projektets status.
            </p>
          </div>
        </div>

        {/* Betaling */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm overflow-hidden">
            <div className="bg-[#1e3a2a] px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Valgt pakke</p>
                <p className="text-white font-bold text-lg">{valgtPakke.navn}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs mb-0.5">inkl. moms</p>
                <p className="text-white text-3xl font-bold">{valgtPakke.pris.toLocaleString("da-DK")} <span className="text-base font-medium opacity-60">kr.</span></p>
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

              <button
                onClick={startBetaling}
                disabled={betaler || !email}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                  email && !betaler
                    ? "bg-[#1e3a2a] text-white hover:bg-[#162d20] shadow-md shadow-[#1e3a2a]/20"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {betaler ? "Sender til betaling..." : `Betal ${valgtPakke.pris.toLocaleString("da-DK")} kr. og opret projektrum`}
              </button>

              {fejl && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs text-red-700">{fejl}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { t: "Sikker betaling via Stripe" },
                  { t: "Ingen abonnement" },
                  { t: "Engangskøb" },
                  { t: "Permanent adgang" },
                ].map(i => (
                  <div key={i.t} className="flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <p className="text-xs text-gray-400">{i.t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
