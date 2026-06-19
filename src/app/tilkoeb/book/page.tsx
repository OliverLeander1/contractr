"use client";

import { useState } from "react";
import Link from "next/link";

const ydelser = [
  { id: "ai-tilbud", label: "Er tilbuddet fair?", pris: "995 kr.", varighed: "AI-analyse, svar inden 24 timer" },
  { id: "raadgiver-online", label: "Tal med en rådgiver", pris: "1.495 kr.", varighed: "Online video, 90 min." },
  { id: "tilsyn", label: "Hold øje med arbejdet", pris: "Fra 2.495 kr.", varighed: "Fysisk besøg, ca. 2 timer" },
  { id: "mangel", label: "Håndværkeren vil ikke rette fejlene", pris: "Fra 1.995 kr.", varighed: "Rapport + mangelbrev" },
  { id: "aflevering", label: "Er arbejdet gjort ordentligt?", pris: "Fra 2.995 kr.", varighed: "Fysisk besøg + rapport" },
  { id: "tilladelse", label: "Skal jeg have tilladelse?", pris: "1.495 kr.", varighed: "Skriftlig afklaring" },
];

const tider = ["08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "13:00", "13:45", "14:30", "15:15", "16:00"];

const inkluderet = [
  "Forberedelse af din sag",
  "Gennemgang med erfaren rådgiver",
  "Digital rapport med anbefalinger",
  "Svar på dine spørgsmål",
];

export default function BookRaadgiver() {
  const [valgtYdelse, setValgtYdelse] = useState(ydelser[1]);
  const [valgtTid, setValgtTid] = useState("11:00");
  const [trin, setTrin] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Contractr</span>
          </Link>
          <Link href="/tilkoeb" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Alle ydelser</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book rådgiver</h1>
        <p className="text-sm text-gray-400 mb-8">Vælg ydelse og tidspunkt — vi sender bekræftelse inden for 2 timer</p>

        {/* Trin-indikator */}
        <div className="flex items-center gap-2 mb-8">
          {["Vælg ydelse", "Vælg tidspunkt", "Dine oplysninger", "Bekræftelse"].map((t, i) => (
            <div key={t} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${i + 1 <= trin ? "text-primary" : "text-gray-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i + 1 < trin ? "bg-primary border-primary text-white" : i + 1 === trin ? "border-primary text-primary bg-white" : "border-gray-200 text-gray-400 bg-white"}`}>
                  {i + 1 < trin ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{t}</span>
              </div>
              {i < 3 && <div className="w-8 h-px bg-gray-200 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Vælg ydelse */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Vælg den rådgivning du har brug for</h2>
              <div className="grid grid-cols-2 gap-3">
                {ydelser.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => setValgtYdelse(y)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${valgtYdelse.id === y.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <p className={`text-sm font-semibold mb-1 ${valgtYdelse.id === y.id ? "text-primary" : "text-gray-900"}`}>{y.label}</p>
                    <p className="text-xs text-gray-400">{y.varighed}</p>
                    <p className="text-sm font-bold text-gray-900 mt-2">{y.pris}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Vælg dato og tid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Vælg tidspunkt</h2>
              <p className="text-sm text-gray-500 mb-4">Onsdag d. 11. juni 2025</p>
              <div className="grid grid-cols-4 gap-2">
                {tider.map((t) => (
                  <button
                    key={t}
                    onClick={() => setValgtTid(t)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${valgtTid === t ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-700 hover:border-primary/40"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Varighed: ca. 90 minutter · Tiderne vises i dansk tid (CET)
              </p>
            </div>

            <button
              onClick={() => setTrin(Math.min(trin + 1, 4))}
              className="w-full bg-primary text-white text-base font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Fortsæt
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-3">Din booking</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5 flex-shrink-0"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                  <div>
                    <p className="text-xs text-gray-400">Ydelse</p>
                    <p className="text-sm font-medium text-gray-900">{valgtYdelse.label}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5 flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <div>
                    <p className="text-xs text-gray-400">Tidspunkt</p>
                    <p className="text-sm font-medium text-gray-900">Ons. 11. jun. · {valgtTid}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5 flex-shrink-0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <div>
                    <p className="text-xs text-gray-400">Projekt</p>
                    <p className="text-sm font-medium text-gray-900">Indvendig renovering – Valby</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <p className="text-sm text-gray-700">Pris inkl. moms</p>
                  <p className="text-lg font-bold text-gray-900">{valgtYdelse.pris}</p>
                </div>
                <p className="text-xs text-green-600 flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Ingen skjulte gebyrer
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-3">Det er inkluderet</p>
              <div className="space-y-2">
                {inkluderet.map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <p className="text-sm text-gray-600">{i}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">Trygt og uvildig — vores rådgivere er uafhængige og arbejder udelukkende for dig.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
