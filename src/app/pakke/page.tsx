"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const features = [
  { ikon: "doc", label: "Udbudsdokument med AB-Forbruger 2012 som grundlag" },
  { ikon: "contract", label: "Digital kontrakt til håndværker" },
  { ikon: "check", label: "Accept-flow med dokumenteret tidspunkt" },
  { ikon: "extra", label: "Ekstraarbejde-sedler med digital godkendelse" },
  { ikon: "time", label: "Tidsplan med milepæle" },
  { ikon: "money", label: "Betalingsoverblik koblet til fremdrift" },
  { ikon: "folder", label: "Dokumentarkiv: kontrakter, fakturaer og billeder" },
  { ikon: "alert", label: "Mangel-registrering med billeder og status" },
  { ikon: "delivery", label: "Afleveringsflow med tjekliste" },
  { ikon: "chat", label: "Projektchat: dokumenteret og tidsstemplet" },
  { ikon: "people", label: "Inviter håndværkere til projektet" },
  { ikon: "forever", label: "Dine data gemmes for altid, klar til 1-års eftersyn og 5-års reklamationsret" },
];

export default function VaelgPakke() {
  const router = useRouter();
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [sendt, setSendt] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8f6]">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
          </Link>
          <Link href="/opret/upload" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tjek tilbud gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#111c17] text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-medium">Nembyggestyring Projektrum</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hele projektet samlet ét sted</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Én engangsbeløb. Ingen abonnement. Dine data gemmes for altid, klar til 1-års eftersyn og 5-års reklamationsret.
          </p>
          <div className="inline-flex items-end gap-3 bg-white/10 rounded-2xl px-8 py-5 mb-3">
            <p className="text-6xl font-bold">499</p>
            <div className="mb-2">
              <p className="text-2xl font-medium text-white/70">kr.</p>
              <p className="text-xs text-white/40">inkl. moms</p>
            </div>
          </div>
          <p className="text-white/40 text-sm">Engangsbetaling · Permanent adgang · Ingen binding</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-5 gap-8">

          {/* Features */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Alt er inkluderet</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {features.map((f) => (
                  <div key={f.label} className="px-6 py-3.5 flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1a5c38]/10 flex items-center justify-center text-[#1a5c38] flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-sm text-gray-700">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data-garanti */}
            <div className="bg-[#1a5c38]/5 rounded-2xl border border-[#1a5c38]/10 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#1a5c38] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Dine data slettes aldrig</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Jf. AB-Forbruger har du reklamationsret i 5 år og ret til 1-års eftersyn ved entrepriser over 500.000 kr. Dit projektrum er altid tilgængeligt. Du sletter selv hvis du vil.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Betaling */}
          <div className="md:col-span-2 space-y-4">
            {!sendt ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#1a5c38] px-6 py-5">
                  <p className="text-white/60 text-xs mb-1">Engangsbetaling · inkl. moms</p>
                  <p className="text-white text-4xl font-bold">499 <span className="text-xl font-medium opacity-60">kr.</span></p>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="text-xs text-gray-500 leading-relaxed space-y-2">
                    <div className="flex items-start gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Betales én gang. Adgang for hele projektets varighed.
                    </div>
                    <div className="flex items-start gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="mt-0.5 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Data gemmes permanent, klar til 1-års eftersyn.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    <p className="text-xs text-green-700 font-medium">30 dages pengene-tilbage-garanti</p>
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-3">
                  <input
                    type="text"
                    placeholder="Dit navn"
                    value={navn}
                    onChange={(e) => setNavn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Din e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
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
                        ? "bg-[#1a5c38] text-white hover:bg-[#163f28] shadow-md shadow-[#1a5c38]/20"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Betal 499 kr. og opret projekt
                  </button>
                  <p className="text-xs text-gray-400 text-center">Betalingsløsning aktiveres snart</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="font-bold text-gray-900 text-lg mb-1">Tak, {navn.split(" ")[0]}!</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">Vi sender dig en besked på <strong>{email}</strong> når betalingsløsningen er klar.</p>
                <button
                  onClick={() => router.push("/opret")}
                  className="w-full bg-[#1a5c38] text-white text-sm font-bold py-3.5 rounded-xl hover:bg-[#163f28] transition-colors"
                >
                  Opret projekt gratis i mellemtiden →
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              {[
                { ikon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, t: "Sikker betaling via Stripe" },
                { ikon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t: "Data gemmes permanent" },
                { ikon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, t: "Ingen binding, engangskøb" },
                { ikon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>, t: "30 dages pengene-tilbage-garanti" },
              ].map(i => (
                <div key={i.t} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-[#1a5c38]/10 flex items-center justify-center flex-shrink-0">{i.ikon}</div>
                  <p className="text-xs text-gray-500">{i.t}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Har du brug for en fagmand?</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">Book en uvildig byggesagkyndig til gennemgang, tilsyn eller aflevering.</p>
              <Link href="/tilkoeb" className="text-xs font-bold text-[#1a5c38] hover:underline">Se rådgiverydelser →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
