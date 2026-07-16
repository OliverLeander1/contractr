"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface DawaForslag {
  tekst: string;
  data?: { id: string; postnr?: { nr: string; navn: string } };
}

interface Raadgiver {
  id: string;
  navn: string;
  firma: string;
  speciale: string[];
  afstand: string;
  by: string;
  rating: number;
  anmeldelser: number;
  tilgaengelig: string;
  billede: string;
}

const ydelser = [
  {
    id: "ai-tilbud",
    titel: "Er tilbuddet fair?",
    beskrivelse: "AI-gennemgang af dit tilbud: pris, forbehold og mangler på almindeligt dansk.",
    pris: "995 kr.",
    detalje: "Svar inden for 24 timer",
    ikon: "search",
  },
  {
    id: "raadgiver-online",
    titel: "Tal med en rådgiver",
    beskrivelse: "90 minutters online møde med en uvildig byggerådgiver der har forberedt sig på dit projekt.",
    pris: "1.495 kr.",
    detalje: "Online video · 90 min. inkl. forberedelse",
    ikon: "video",
  },
  {
    id: "tilsyn",
    titel: "Tilsyn undervejs",
    beskrivelse: "En rådgiver stikker forbi og sikrer at materialer, udførelse og fremdrift er som aftalt.",
    pris: "Fra 2.495 kr.",
    detalje: "Fysisk tilsyn + notat",
    ikon: "eye",
  },
  {
    id: "mangel",
    titel: "Håndværkeren retter ikke fejlene",
    beskrivelse: "Dokumentér mangler fagligt og få hjælp til at tilbageholde betaling lovligt.",
    pris: "Fra 1.995 kr.",
    detalje: "Rapport + mangelbrev",
    ikon: "alert",
    popular: true,
  },
  {
    id: "aflevering",
    titel: "Er arbejdet gjort ordentligt?",
    beskrivelse: "Gennemgang af udført arbejde før du betaler den sidste rate. Inkluderer skriftlig rapport.",
    pris: "Fra 2.995 kr.",
    detalje: "Fysisk besøg + rapport",
    ikon: "check",
  },
  {
    id: "tilladelse",
    titel: "Skal jeg have tilladelse?",
    beskrivelse: "Afklaring om du har brug for byggetilladelse, anmeldelse eller ingeniørbistand.",
    pris: "1.495 kr.",
    detalje: "Skriftlig afklaring",
    ikon: "license",
  },
  {
    id: "statiker",
    titel: "Statiker og ingeniørberegninger",
    beskrivelse: "Får du fjernet bærende vægge, lavet tilbygning eller monteret tungt udstyr? Vi kobler dig med en certificeret ingeniør der leverer de nødvendige beregninger.",
    pris: "Fra 3.995 kr.",
    detalje: "Beregninger + erklæring klar til kommunen",
    ikon: "statiker",
    popular: true,
  },
];

const ikoner: Record<string, React.ReactElement> = {
  search: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  video: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  eye: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>,
  license: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  statiker: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><rect x="3" y="20" width="18" height="2" rx="1"/></svg>,
};

export default function Tilkoeb() {
  const [adresse, setAdresse] = useState("");
  const [soegt, setSoegt] = useState(false);
  const [forslag, setForslag] = useState<DawaForslag[]>([]);
  const [visForslag, setVisForslag] = useState(false);
  const [raadgivere] = useState<Raadgiver[]>([]);
  const adresseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (adresseRef.current && !adresseRef.current.contains(e.target as Node)) {
        setVisForslag(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (adresse.length < 3) { setForslag([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(adresse)}&type=adresse&per_side=5`);
        const data = await res.json();
        setForslag(data);
        setVisForslag(true);
      } catch { setForslag([]); }
    }, 200);
    return () => clearTimeout(timeout);
  }, [adresse]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
          </Link>
          <Link href="/projekt/1" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage til projekt</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Overskrift */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Rådgivning og tilkøb</h1>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
            Uvildige rådgivere der arbejder udelukkende for dig. Book online eller find en rådgiver nær din byggeplads.
          </p>
        </div>

        {/* Adressesøgning */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-[#1a5c38]/10 rounded-xl flex items-center justify-center text-[#1a5c38] flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Find rådgivere nær din byggeplads</p>
              <p className="text-xs text-gray-400">Tast din adresse og se hvem der er tilgængelig i dit område</p>
            </div>
          </div>
          <div ref={adresseRef} className="relative flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="F.eks. Valby Langgade 85, 2500 Valby"
                value={adresse}
                onChange={(e) => { setAdresse(e.target.value); setSoegt(false); }}
                onFocus={() => forslag.length > 0 && setVisForslag(true)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                autoComplete="off"
              />
              {visForslag && forslag.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {forslag.map((f, i) => (
                    <li
                      key={f.data?.id ?? i}
                      onMouseDown={() => { setAdresse(f.tekst); setVisForslag(false); setForslag([]); }}
                      className="px-4 py-3 text-sm text-gray-800 hover:bg-[#1a5c38]/5 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      {f.tekst}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => { if (adresse.trim()) setSoegt(true); }}
              className="bg-[#1a5c38] text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#163f28] transition-colors flex-shrink-0"
            >
              Søg
            </button>
          </div>

          {/* Resultat: tom tilstand */}
          {soegt && (
            <div className="mt-6 text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-700 mb-1">Ingen rådgivere i dit område endnu</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed mb-5">
                Vi er ved at opbygge netværket af certificerede rådgivere. I mellemtiden kan du booke et online møde med en rådgiver fra hele landet.
              </p>
              <Link
                href="/tilkoeb/book?ydelse=raadgiver-online"
                className="inline-flex items-center gap-2 bg-[#1a5c38] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#163f28] transition-colors"
              >
                Book online møde i stedet
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          )}

          {/* Demo: rådgivere når de er tilgængelige */}
          {raadgivere.length > 0 && (
            <div className="mt-5 space-y-3">
              {raadgivere.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-[#1a5c38]/30 transition-all">
                  <div className="w-10 h-10 bg-[#1a5c38]/10 rounded-xl flex items-center justify-center text-sm font-bold text-[#1a5c38] flex-shrink-0">
                    {r.navn.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.navn}</p>
                    <p className="text-xs text-gray-400">{r.firma} · {r.afstand} fra dig</p>
                  </div>
                  <Link href={`/tilkoeb/book?raadgiver=${r.id}`} className="text-sm font-semibold text-[#1a5c38] hover:underline flex-shrink-0">
                    Book →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ydelser */}
        <h2 className="text-lg font-bold text-gray-900 mb-5">Alle ydelser</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {ydelser.map((y) => (
            <div key={y.id} className={`bg-white rounded-2xl border shadow-sm p-5 relative ${y.popular ? "border-[#1a5c38]/30" : "border-gray-100"}`}>
              {y.popular && (
                <span className="absolute -top-2.5 left-5 bg-[#1a5c38] text-white text-xs font-bold px-3 py-0.5 rounded-full">Populær</span>
              )}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1a5c38]/10 flex items-center justify-center flex-shrink-0 text-[#1a5c38]">
                  {ikoner[y.ikon]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{y.titel}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{y.beskrivelse}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-900">{y.pris}</p>
                      <p className="text-xs text-gray-400">{y.detalje}</p>
                    </div>
                    <Link
                      href={`/tilkoeb/book?ydelse=${y.id}`}
                      className="bg-[#1a5c38] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#163f28] transition-colors"
                    >
                      Book nu
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tillid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { ikon: "🛡️", titel: "Uvildig og uafhængig", tekst: "Vi arbejder kun for dig" },
              { ikon: "⚡", titel: "Hurtig levering", tekst: "Typisk 1-3 hverdage" },
              { ikon: "📋", titel: "Ingen binding", tekst: "Køb kun det du har brug for" },
              { ikon: "💬", titel: "Spørg os", tekst: "Er du i tvivl, så skriv til os" },
            ].map((i) => (
              <div key={i.titel}>
                <p className="text-2xl mb-2">{i.ikon}</p>
                <p className="text-xs font-semibold text-gray-900">{i.titel}</p>
                <p className="text-xs text-gray-400 mt-0.5">{i.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
