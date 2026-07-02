"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const pakkeData = {
  lille: {
    navn: "Lille projekt",
    tagline: "Kom trygt i gang",
    beskrivelse: "Alt du behøver til et mindre byggeprojekt. Kontrakten er på plads, betalingerne er dokumenterede, og du har styr på manglerne.",
    pris: 499,
    budget: "Under 100.000 kr.",
    eksempler: "Badeværelse · Malerarbejde · Smårenoveringer",
    inkluderet: [
      { ikon: "doc", label: "Udbudsdokument med AB-Forbruger 2012" },
      { ikon: "contract", label: "Digital kontrakt til håndværker" },
      { ikon: "check", label: "Accept-flow med dokumenteret tidspunkt" },
      { ikon: "time", label: "Tidsplan med milepæle" },
      { ikon: "money", label: "Betalingsoverblik koblet til fremdrift" },
      { ikon: "folder", label: "Dokumentarkiv til kontrakter og fakturaer" },
      { ikon: "alert", label: "Mangel-registrering med billeder og status" },
      { ikon: "chat", label: "Projektchat — dokumenteret og tidsstemplet" },
      { ikon: "person", label: "Inviter 1 håndværker til projektet" },
      { ikon: "guide", label: "Guide og AB-Forbruger-oversigt" },
      { ikon: "support", label: "E-mail support inden for 3 hverdage" },
    ],
    ikkeInkluderet: [
      "AI-gennemgang af tilbud",
      "Inviter flere end 1 håndværker",
      "Ekstraarbejde-sedler",
      "Prioriteret support",
      "Dedikeret rådgiver",
    ],
  },
  mellem: {
    navn: "Mellem projekt",
    tagline: "Det fulde overblik",
    beskrivelse: "Til det seriøse projekt hvor der er penge på spil. Du får AI-screening af tilbuddet, plads til tre håndværkere og prioriteret support.",
    pris: 999,
    budget: "100.000 – 500.000 kr.",
    eksempler: "Tilbygning · Nyt tag · Køkken · Større renovering",
    popular: true,
    inkluderet: [
      { ikon: "doc", label: "Udbudsdokument med AB-Forbruger 2012" },
      { ikon: "contract", label: "Digital kontrakt til håndværker" },
      { ikon: "check", label: "Accept-flow med dokumenteret tidspunkt" },
      { ikon: "extra", label: "Ekstraarbejde-sedler med digital godkendelse" },
      { ikon: "ai", label: "AI-gennemgang af indkomne tilbud inkluderet" },
      { ikon: "risk", label: "Risikovurdering: lav / middel / høj" },
      { ikon: "question", label: "Konkrete spørgsmål du bør stille håndværkeren" },
      { ikon: "time", label: "Tidsplan med milepæle" },
      { ikon: "money", label: "Betalingsoverblik koblet til fremdrift" },
      { ikon: "folder", label: "Dokumentarkiv til kontrakter og fakturaer" },
      { ikon: "alert", label: "Mangel-registrering med billeder og status" },
      { ikon: "delivery", label: "Afleveringsflow med tjekliste" },
      { ikon: "chat", label: "Projektchat — dokumenteret og tidsstemplet" },
      { ikon: "person", label: "Inviter op til 3 håndværkere" },
      { ikon: "support", label: "Prioriteret support inden for 1 hverdag" },
    ],
    ikkeInkluderet: [
      "Mere end 3 håndværkere",
      "Dedikeret rådgiver tilknyttet",
      "Ugentlig statusrapport",
    ],
  },
  stort: {
    navn: "Stort projekt",
    tagline: "Professionel rygrad",
    beskrivelse: "Til de store projekter med mange parter og høj kompleksitet. Du får en dedikeret byggesagkyndig tilknyttet og ugentlig statusrapport.",
    pris: 1999,
    budget: "Over 500.000 kr.",
    eksempler: "Ombygning · Nybyg · Total renovering",
    inkluderet: [
      { ikon: "doc", label: "Udbudsdokument med AB-Forbruger 2012" },
      { ikon: "contract", label: "Digital kontrakt til håndværker" },
      { ikon: "check", label: "Accept-flow med dokumenteret tidspunkt" },
      { ikon: "extra", label: "Ekstraarbejde-sedler med digital godkendelse" },
      { ikon: "ai", label: "AI-gennemgang af alle tilbud inkluderet" },
      { ikon: "risk", label: "Risikovurdering: lav / middel / høj" },
      { ikon: "question", label: "Konkrete spørgsmål du bør stille håndværkeren" },
      { ikon: "time", label: "Tidsplan med milepæle" },
      { ikon: "money", label: "Betalingsoverblik koblet til fremdrift" },
      { ikon: "folder", label: "Dokumentarkiv til kontrakter og fakturaer" },
      { ikon: "alert", label: "Mangel-registrering med billeder og status" },
      { ikon: "delivery", label: "Afleveringsflow med tjekliste" },
      { ikon: "chat", label: "Projektchat — dokumenteret og tidsstemplet" },
      { ikon: "people", label: "Ubegrænsede håndværkere i projektet" },
      { ikon: "advisor", label: "Dedikeret byggesagkyndig tilknyttet" },
      { ikon: "report", label: "Ugentlig statusrapport fra rådgiveren" },
      { ikon: "support", label: "Prioriteret support — svar samme dag" },
    ],
    ikkeInkluderet: [
      "Fysisk byggetilsyn (kan tilkøbes)",
      "Juridisk bistand ved tvist (kan tilkøbes)",
    ],
  },
} as const;

type PakkeId = keyof typeof pakkeData;

const ikonSvg: Record<string, React.ReactElement> = {
  doc: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  contract: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  extra: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ai: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  risk: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
  question: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  time: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  money: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  folder: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  delivery: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  person: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  people: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  advisor: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  report: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  guide: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  support: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

const pakkeRaekkefoelge: PakkeId[] = ["lille", "mellem", "stort"];

export default function PakkeDetalje() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [sendt, setSendt] = useState(false);

  const pakke = pakkeData[id as PakkeId];

  if (!pakke) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pakken findes ikke.</p>
          <Link href="/pakke" className="text-[#1a5c38] font-semibold hover:underline">← Tilbage til pakker</Link>
        </div>
      </div>
    );
  }

  const erPopulaer = "popular" in pakke && pakke.popular;

  return (
    <div className="min-h-screen bg-[#f7f8f6]">

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/pakke" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Alle pakker
          </Link>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-lg" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
          <div className="w-24" />
        </div>
      </nav>

      {/* Hero-banner */}
      <div className="bg-[#111c17] text-white">
        <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div>
            {erPopulaer && (
              <span className="inline-block bg-[#1a5c38] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Mest valgte</span>
            )}
            <p className="text-sm text-white/50 uppercase tracking-widest mb-2 font-medium">{pakke.tagline}</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{pakke.navn}</h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-lg">{pakke.beskrivelse}</p>
            <p className="text-white/40 text-xs mt-3">{pakke.budget} · {pakke.eksempler}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-white/40 text-sm mb-1">Engangspris · inkl. moms</p>
            <p className="text-6xl font-bold tabular-nums">{pakke.pris.toLocaleString("da-DK")}<span className="text-2xl font-medium text-white/60 ml-2">kr.</span></p>
          </div>
        </div>
      </div>

      {/* Pakke-vælger under hero */}
      <div className="bg-[#0d1510] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex">
            {pakkeRaekkefoelge.map((pid) => (
              <Link
                key={pid}
                href={`/pakke/${pid}`}
                className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                  pid === id
                    ? "text-white border-[#4ade80]"
                    : "text-white/40 border-transparent hover:text-white/70"
                }`}
              >
                {pakkeData[pid].navn}
                <span className={`ml-2 text-xs ${pid === id ? "text-white/60" : "text-white/25"}`}>
                  {pakkeData[pid].pris.toLocaleString("da-DK")} kr.
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Indhold */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-5 gap-8">

          {/* Features (3/5) */}
          <div className="md:col-span-3 space-y-4">

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-900 tracking-wide">Hvad er inkluderet</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {pakke.inkluderet.map((item) => (
                  <div key={item.label} className="px-6 py-3.5 flex items-center gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-[#1a5c38]/10 flex items-center justify-center text-[#1a5c38] flex-shrink-0">
                      {ikonSvg[item.ikon]}
                    </div>
                    <p className="text-sm text-gray-700">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-400 tracking-wide">Ikke inkluderet i denne pakke</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {pakke.ikkeInkluderet.map((item) => (
                  <div key={item} className="px-6 py-3.5 flex items-center gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <p className="text-sm text-gray-400">{item}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Brug for mere?{" "}
                  <Link href="/tilkoeb" className="text-[#1a5c38] font-semibold hover:underline">Tilkøb enkeltydelser →</Link>
                  {" "}eller{" "}
                  <Link href="/pakke" className="text-[#1a5c38] font-semibold hover:underline">se en større pakke →</Link>
                </p>
              </div>
            </div>

          </div>

          {/* Betaling (2/5) */}
          <div className="md:col-span-2 space-y-4">

            {!sendt ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-6 py-5 ${erPopulaer ? "bg-[#1a5c38]" : "bg-gray-900"}`}>
                  <p className="text-white/60 text-xs mb-1">Engangsbetaling · inkl. moms</p>
                  <p className="text-white text-3xl font-bold">{pakke.pris.toLocaleString("da-DK")} <span className="text-lg font-medium opacity-70">kr.</span></p>
                </div>

                <div className="px-6 py-5 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Betales én gang ved oprettelse. Giver adgang til alle funktioner for hele projektets varighed.
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2.5 leading-relaxed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="mt-0.5 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    30 dages pengene-tilbage-garanti
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-3">
                  <input
                    type="text"
                    placeholder="Dit navn"
                    value={navn}
                    onChange={(e) => setNavn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Din e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />

                  {/* Kortfelt (ikke-funktionelt) */}
                  <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 bg-gray-50/50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Kortoplysninger</p>
                      <p className="text-xs text-gray-300">Betalingsløsning aktiveres snart</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      {["V", "M"].map(b => (
                        <div key={b} className="w-6 h-4 bg-gray-200 rounded text-[9px] font-bold text-gray-400 flex items-center justify-center">{b}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => { if (navn && email) setSendt(true); }}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                      navn && email
                        ? erPopulaer
                          ? "bg-[#1a5c38] text-white hover:bg-[#163f28] shadow-md shadow-[#1a5c38]/20"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Betal {pakke.pris.toLocaleString("da-DK")} kr. og opret projekt
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
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Vi sender en besked til <strong>{email}</strong> så snart betalingsløsningen er klar.
                </p>
                <button
                  onClick={() => router.push("/opret")}
                  className="w-full bg-[#1a5c38] text-white text-sm font-bold py-3.5 rounded-xl hover:bg-[#163f28] transition-colors"
                >
                  Opret projekt gratis i mellemtiden →
                </button>
              </div>
            )}

            {/* Tryghedssignaler */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              {[
                { ikon: "🔒", tekst: "Sikker betaling via Stripe" },
                { ikon: "📋", tekst: "Ingen binding — engangskøb" },
                { ikon: "↩️", tekst: "30 dages pengene-tilbage-garanti" },
                { ikon: "🧑‍💼", tekst: "Vi arbejder kun for dig" },
              ].map(t => (
                <div key={t.tekst} className="flex items-center gap-3">
                  <span className="text-base">{t.ikon}</span>
                  <p className="text-xs text-gray-500">{t.tekst}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
