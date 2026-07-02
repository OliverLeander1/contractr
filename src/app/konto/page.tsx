"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Betaling {
  id: string;
  type: "platform" | "raadgiver" | "entreprise";
  beskrivelse: string;
  beloeb: number;
  dato: string;
  status: "betalt" | "afventer" | "refunderet";
  projekt?: string;
}

const demoBetalinger: Betaling[] = [
  { id: "b1", type: "entreprise", beskrivelse: "Betaling til Sven Hansen VVS · Milepæl 2", beloeb: 22500, dato: "2025-06-01", status: "betalt", projekt: "Badeværelse, Valby" },
  { id: "b2", type: "entreprise", beskrivelse: "Betaling til Sven Hansen VVS · Milepæl 1", beloeb: 18000, dato: "2025-05-10", status: "betalt", projekt: "Badeværelse, Valby" },
  { id: "b3", type: "raadgiver", beskrivelse: "Rådgivergennemgang · Maria Davidsen", beloeb: 1495, dato: "2025-05-05", status: "betalt", projekt: "Badeværelse, Valby" },
  { id: "b4", type: "platform", beskrivelse: "Abonnement Starter · Maj 2025", beloeb: 299, dato: "2025-05-01", status: "betalt" },
  { id: "b5", type: "platform", beskrivelse: "Aftaletjek rapport", beloeb: 995, dato: "2025-04-22", status: "betalt" },
  { id: "b6", type: "entreprise", beskrivelse: "Betaling til Sven Hansen VVS · Milepæl 3", beloeb: 28000, dato: "2025-06-20", status: "afventer", projekt: "Badeværelse, Valby" },
  { id: "b7", type: "platform", beskrivelse: "Abonnement Starter · Jun 2025", beloeb: 299, dato: "2025-06-01", status: "betalt" },
];

const typeLabel: Record<Betaling["type"], string> = {
  platform: "Contractr",
  raadgiver: "Rådgiver",
  entreprise: "Håndværker",
};

const typeFarve: Record<Betaling["type"], string> = {
  platform: "bg-[#1a5c38]/10 text-[#1a5c38]",
  raadgiver: "bg-blue-100 text-blue-700",
  entreprise: "bg-amber-100 text-amber-700",
};

const statusFarve: Record<Betaling["status"], string> = {
  betalt: "text-green-700 bg-green-50",
  afventer: "text-amber-700 bg-amber-50",
  refunderet: "text-gray-500 bg-gray-100",
};

const statusLabel: Record<Betaling["status"], string> = {
  betalt: "Betalt",
  afventer: "Afventer",
  refunderet: "Refunderet",
};

function beloebFormat(kr: number) {
  return kr.toLocaleString("da-DK") + " kr.";
}

function datoFormat(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
}

export default function MinSide() {
  const [filter, setFilter] = useState<"alle" | "platform" | "raadgiver" | "entreprise">("alle");
  const [navn, setNavn] = useState("Camilla Jensen");
  const [email, setEmail] = useState("camilla.jensen@email.dk");

  useEffect(() => {
    const raw = localStorage.getItem("contractr_projekt");
    if (raw) {
      const p = JSON.parse(raw);
      if (p.navn) setNavn(p.navn);
      if (p.kontakt) setEmail(p.kontakt);
    }
  }, []);

  const filtreretBetalinger = filter === "alle" ? demoBetalinger : demoBetalinger.filter(b => b.type === filter);

  const totalBetalt = demoBetalinger.filter(b => b.status === "betalt").reduce((sum, b) => sum + b.beloeb, 0);
  const totalAfventer = demoBetalinger.filter(b => b.status === "afventer").reduce((sum, b) => sum + b.beloeb, 0);
  const totalEntreprise = demoBetalinger.filter(b => b.type === "entreprise" && b.status === "betalt").reduce((sum, b) => sum + b.beloeb, 0);
  const totalPlatform = demoBetalinger.filter(b => b.type === "platform" && b.status === "betalt").reduce((sum, b) => sum + b.beloeb, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/hub" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Mine projekter
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-lg" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </div>
          <button className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">Log ud</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#1a5c38]/10 flex items-center justify-center text-[#1a5c38] font-bold text-xl flex-shrink-0">
              {navn.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{navn}</h1>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Aktiv pakke</p>
              <span className="bg-[#1a5c38] text-white text-xs font-bold px-3 py-1 rounded-full">Starter</span>
            </div>
          </div>
        </div>

        {/* Økonomi-overblik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Betalt i alt", beloeb: totalBetalt, farve: "text-gray-900" },
            { label: "Afventer betaling", beloeb: totalAfventer, farve: "text-amber-600" },
            { label: "Til håndværkere", beloeb: totalEntreprise, farve: "text-gray-900" },
            { label: "Til Contractr", beloeb: totalPlatform, farve: "text-gray-900" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1.5">{k.label}</p>
              <p className={`text-lg font-bold ${k.farve}`}>{beloebFormat(k.beloeb)}</p>
            </div>
          ))}
        </div>

        {/* Betalingsoversigt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">Betalingsoversigt</h2>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {([
                { val: "alle", label: "Alle" },
                { val: "entreprise", label: "Håndværkere" },
                { val: "raadgiver", label: "Rådgivere" },
                { val: "platform", label: "Contractr" },
              ] as const).map(f => (
                <button
                  key={f.val}
                  onClick={() => setFilter(f.val)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${filter === f.val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filtreretBetalinger.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">Ingen betalinger i denne kategori</div>
            )}
            {filtreretBetalinger.map(b => (
              <div key={b.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${typeFarve[b.type]}`}>
                  {b.type === "platform" ? "C" : b.type === "raadgiver" ? "R" : "H"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.beskrivelse}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{datoFormat(b.dato)}</span>
                    {b.projekt && <span className="text-xs text-gray-300">·</span>}
                    {b.projekt && <span className="text-xs text-gray-400">{b.projekt}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{beloebFormat(b.beloeb)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusFarve[b.status]}`}>
                    {statusLabel[b.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pakke */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Din pakke</h2>
            <Link href="/pakke" className="text-sm font-semibold text-[#1a5c38] hover:underline">Opgradér</Link>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1a5c38] rounded-xl flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Gratis adgang</p>
                <p className="text-xs text-gray-500">Screening og grundlæggende overblik inkluderet</p>
              </div>
            </div>
            <Link href="/pakke" className="text-xs font-bold text-[#1a5c38] bg-[#1a5c38]/10 px-3 py-1.5 rounded-full hover:bg-[#1a5c38]/20 transition-colors">
              Udvid adgang
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { navn: "Lille projekt", pris: "499 kr.", href: "/pakke/lille" },
              { navn: "Mellem projekt", pris: "999 kr.", href: "/pakke/mellem" },
              { navn: "Stort projekt", pris: "1.999 kr.", href: "/pakke/stort" },
            ].map(p => (
              <Link key={p.navn} href={p.href} className="flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-[#1a5c38]/30 hover:bg-[#1a5c38]/5 transition-all group text-center">
                <p className="text-xs font-semibold text-gray-700 group-hover:text-[#1a5c38] transition-colors">{p.navn}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.pris}</p>
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Engangspris · Opgraderer du betaler du kun differencen</p>
        </div>

        {/* Mine projekter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Mine projekter</h2>
            <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-[#1a5c38] hover:underline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nyt projekt
            </Link>
          </div>
          <Link href="/projekt/1" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1a5c38]/30 hover:shadow-sm transition-all group">
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1a5c38] transition-colors">Badeværelse, Valby</p>
              <p className="text-xs text-gray-400 mt-0.5">Oprettet mar. 2025 · 112.500 kr.</p>
            </div>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">I gang</span>
          </Link>
        </div>

        {/* Kontoindstillinger */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Kontoindstillinger</h2>
          <div className="space-y-1">
            {[
              { label: "Notifikationsindstillinger", ikon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" },
              { label: "Download mine data", ikon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" },
              { label: "Slet konto", ikon: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", danger: true },
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.danger ? "bg-red-50" : "bg-gray-100 group-hover:bg-gray-200"} transition-colors`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.danger ? "#dc2626" : "#6b7280"} strokeWidth="2">
                    <path d={item.ikon}/>
                  </svg>
                </div>
                <span className={`text-sm font-medium ${item.danger ? "text-red-600" : "text-gray-700"}`}>{item.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" className="ml-auto">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
