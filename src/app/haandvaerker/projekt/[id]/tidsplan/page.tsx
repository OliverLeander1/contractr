"use client";

import { use, useState } from "react";
import Link from "next/link";

interface Fase {
  id: number;
  navn: string;
  dage: number;
  note: string;
}

const farver = [
  "#1a5c38", "#0369a1", "#b45309", "#6d28d9", "#c2410c", "#0f766e", "#be185d", "#374151",
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function parseDatoStr(str: string): Date {
  // "15. aug" → parse relative to current year
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, maj: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
  };
  const [dayStr, monthStr] = str.replace(".", "").split(" ");
  const month = months[monthStr?.toLowerCase()] ?? 0;
  return new Date(2025, month, parseInt(dayStr));
}

export default function HaandvaerkerTidsplan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const deadline = parseDatoStr("15. aug");
  const [startDato, setStartDato] = useState("2025-06-23");
  const [faser, setFaser] = useState<Fase[]>([
    { id: 1, navn: "Nedrivning og klargøring", dage: 3, note: "" },
    { id: 2, navn: "VVS — rørføring", dage: 4, note: "" },
    { id: 3, navn: "Flisemontage", dage: 5, note: "" },
    { id: 4, navn: "Afsluttende VVS og test", dage: 2, note: "" },
  ]);
  const [næstId, setNæstId] = useState(5);
  const [redigerId, setRedigerId] = useState<number | null>(null);
  const [sendt, setSendt] = useState(false);

  const startDate = new Date(startDato);
  const totalDage = faser.reduce((s, f) => s + f.dage, 0);
  const slutDato = addDays(startDate, totalDage);
  const dageForDeadline = Math.round((deadline.getTime() - slutDato.getTime()) / 86400000);
  const overDeadline = dageForDeadline < 0;

  function opdaterFase(id: number, felt: keyof Fase, value: string | number) {
    setFaser(prev => prev.map(f => f.id === id ? { ...f, [felt]: value } : f));
  }

  function tilføjFase() {
    setFaser(prev => [...prev, { id: næstId, navn: "", dage: 1, note: "" }]);
    setRedigerId(næstId);
    setNæstId(n => n + 1);
  }

  function sletFase(id: number) {
    setFaser(prev => prev.filter(f => f.id !== id));
    if (redigerId === id) setRedigerId(null);
  }

  function flytOp(idx: number) {
    if (idx === 0) return;
    const ny = [...faser];
    [ny[idx - 1], ny[idx]] = [ny[idx], ny[idx - 1]];
    setFaser(ny);
  }

  function flytNed(idx: number) {
    if (idx === faser.length - 1) return;
    const ny = [...faser];
    [ny[idx], ny[idx + 1]] = [ny[idx + 1], ny[idx]];
    setFaser(ny);
  }

  if (sendt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tidsplan sendt</h2>
          <p className="text-sm text-gray-500 mb-6">Camilla Jensen kan nu se din tidsplan og vil blive notificeret.</p>
          <Link href={`/haandvaerker/projekt/${id}`} className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            Tilbage til projektet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/haandvaerker/projekt/${id}`} className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <div>
              <p className="text-xs text-gray-400">Nyt badeværelse – Frederiksberg</p>
              <h1 className="text-sm font-bold text-gray-900">Opret tidsplan</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Deadline: 15. aug. 2025
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Startdato */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Hvornår starter du?</label>
          <input
            type="date"
            value={startDato}
            onChange={e => setStartDato(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Faserliste */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">

          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="col-span-1" />
            <div className="col-span-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fase / opgave</div>
            <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dage</div>
            <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periode</div>
            <div className="col-span-1" />
          </div>

          {/* Faser */}
          {(() => {
            let cursor = new Date(startDate);
            return faser.map((fase, idx) => {
              const faseStart = new Date(cursor);
              const faseSlut = addDays(cursor, fase.dage);
              cursor = faseSlut;
              const farve = farver[idx % farver.length];
              const erÅben = redigerId === fase.id;

              return (
                <div key={fase.id} className={`border-b border-gray-50 last:border-b-0 ${erÅben ? "bg-gray-50/40" : ""}`}>
                  <div className="grid grid-cols-12 gap-3 items-center px-5 py-3.5">

                    {/* Farve + rækkefølge */}
                    <div className="col-span-1 flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: farve }} />
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => flytOp(idx)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button onClick={() => flytNed(idx)} disabled={idx === faser.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Navn */}
                    <div className="col-span-5">
                      {erÅben ? (
                        <input
                          autoFocus
                          value={fase.navn}
                          onChange={e => opdaterFase(fase.id, "navn", e.target.value)}
                          onBlur={() => setRedigerId(null)}
                          placeholder="Beskriv opgaven..."
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      ) : (
                        <button
                          onClick={() => setRedigerId(fase.id)}
                          className="text-sm font-medium text-gray-800 hover:text-primary text-left w-full truncate"
                        >
                          {fase.navn || <span className="text-gray-300 italic">Klik for at navngive...</span>}
                        </button>
                      )}
                    </div>

                    {/* Dage */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => opdaterFase(fase.id, "dage", Math.max(1, fase.dage - 1))}
                          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
                        >−</button>
                        <span className="text-sm font-bold text-gray-900 w-5 text-center">{fase.dage}</span>
                        <button
                          onClick={() => opdaterFase(fase.id, "dage", fase.dage + 1)}
                          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
                        >+</button>
                      </div>
                    </div>

                    {/* Periode */}
                    <div className="col-span-3">
                      <p className="text-xs text-gray-500">{formatDate(faseStart)} – {formatDate(faseSlut)}</p>
                    </div>

                    {/* Slet */}
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => sletFase(fase.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Note-felt (kun når åben) */}
                  {erÅben && (
                    <div className="px-5 pb-3">
                      <input
                        value={fase.note}
                        onChange={e => opdaterFase(fase.id, "note", e.target.value)}
                        placeholder="Tilføj note (valgfrit) — fx materialer, forbehold..."
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 placeholder:text-gray-300"
                      />
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Tilføj-knap */}
          <button
            onClick={tilføjFase}
            className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-gray-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tilføj fase
          </button>
        </div>

        {/* Opsummering */}
        <div className={`rounded-2xl border p-5 mb-5 ${overDeadline ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${overDeadline ? "bg-red-100" : "bg-green-100"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={overDeadline ? "#dc2626" : "#15803d"} strokeWidth="2">
                  {overDeadline
                    ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                    : <polyline points="20 6 9 17 4 12" />
                  }
                </svg>
              </div>
              <div>
                <p className={`text-sm font-bold ${overDeadline ? "text-red-900" : "text-green-900"}`}>
                  {overDeadline
                    ? `Tidsplanen overskrider deadline med ${Math.abs(dageForDeadline)} dage`
                    : `Færdig ${formatDate(slutDato)} — ${dageForDeadline} dage før deadline`
                  }
                </p>
                <p className={`text-xs mt-0.5 ${overDeadline ? "text-red-600" : "text-green-600"}`}>
                  {totalDage} dage i alt · Start {formatDate(startDate)} · Slut {formatDate(slutDato)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Bygherre-deadline</p>
              <p className="text-sm font-bold text-gray-700">15. aug. 2025</p>
            </div>
          </div>
        </div>

        {/* Send-knap */}
        <button
          onClick={() => setSendt(true)}
          disabled={faser.some(f => !f.navn) || faser.length === 0}
          className="w-full bg-primary text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Send tidsplan til bygherre
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">Bygherre kan se din tidsplan og sammenligne med de øvrige entrepriser</p>
      </div>
    </div>
  );
}
