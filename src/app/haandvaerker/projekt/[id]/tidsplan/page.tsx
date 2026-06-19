"use client";

import { use, useState } from "react";
import Link from "next/link";

// Shared project timeline — all trades
// "min" = the logged-in contractor (maler)
interface TradeBlock {
  id: string;
  navn: string;
  firma: string;
  startDag: number; // days from project start
  slutDag: number;
  farve: string;
  status: "done" | "active" | "upcoming" | "min";
  eget: boolean; // true = this contractor's own block
}

interface MinFase {
  id: number;
  navn: string;
  dage: number;
  note: string;
}

const PROJEKT_START = new Date(2025, 3, 3); // 3. apr 2025
const DEADLINE = new Date(2025, 7, 15);     // 15. aug 2025
const TOTAL_DAGE = Math.round((DEADLINE.getTime() - PROJEKT_START.getTime()) / 86400000);

// Andre faggrupper — read only
const ANDRE_TRADES: TradeBlock[] = [
  { id: "nedrivning", navn: "Nedrivning og klargøring", firma: "TM Byg ApS", startDag: 0, slutDag: 17, farve: "#64748b", status: "done", eget: false },
  { id: "vvs", navn: "VVS — rørføring", firma: "VVS-firma ApS", startDag: 17, slutDag: 38, farve: "#0369a1", status: "done", eget: false },
  { id: "fliser", navn: "Flisemontage", firma: "Flise & Klinke ApS", startDag: 38, slutDag: 73, farve: "#6d28d9", status: "active", eget: false },
];

// Tidligst mulig startdag for maleren = når fliserne er færdige
const TIDLIGST_START_DAG = 73;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function dagTilDato(dag: number): Date {
  return addDays(PROJEKT_START, dag);
}

function dateTilDag(date: Date): number {
  return Math.round((date.getTime() - PROJEKT_START.getTime()) / 86400000);
}

const pct = (dag: number) => `${Math.min(100, (dag / TOTAL_DAGE) * 100)}%`;
const barW = (fra: number, til: number) => `${Math.max(3, ((til - fra) / TOTAL_DAGE) * 100)}%`;

const MONTHS = [
  { label: "Apr", dag: 0 }, { label: "Maj", dag: 27 }, { label: "Jun", dag: 58 },
  { label: "Jul", dag: 88 }, { label: "Aug", dag: 119 },
];

export default function HaandvaerkerTidsplan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const defaultStartDag = TIDLIGST_START_DAG;
  const defaultStartIso = addDays(PROJEKT_START, defaultStartDag).toISOString().split("T")[0];

  const [startDato, setStartDato] = useState(defaultStartIso);
  const [faser, setFaser] = useState<MinFase[]>([
    { id: 1, navn: "Grundmaling", dage: 3, note: "" },
    { id: 2, navn: "Toplag og detaljer", dage: 4, note: "" },
  ]);
  const [næstId, setNæstId] = useState(3);
  const [redigerId, setRedigerId] = useState<number | null>(null);
  const [sendt, setSendt] = useState(false);

  const startDate = new Date(startDato);
  const startDag = dateTilDag(startDate);
  const totalMineDage = faser.reduce((s, f) => s + f.dage, 0);
  const slutDag = startDag + totalMineDage;
  const slutDato = dagTilDato(slutDag);
  const forTidlig = startDag < TIDLIGST_START_DAG;
  const overDeadline = slutDag > TOTAL_DAGE;
  const dageForDeadline = TOTAL_DAGE - slutDag;

  const alleTrades: TradeBlock[] = [
    ...ANDRE_TRADES,
    {
      id: "min", navn: "Malerarbejde", firma: "Dit firma",
      startDag, slutDag,
      farve: "#1a5c38", status: "min", eget: true,
    },
  ];

  function opdaterFase(id: number, felt: keyof MinFase, value: string | number) {
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

  if (sendt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tidsplan sendt</h2>
          <p className="text-sm text-gray-500 mb-6">Camilla Jensen og de øvrige faggrupper kan nu se din tidsplan.</p>
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/haandvaerker/projekt/${id}`} className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <div>
              <p className="text-xs text-gray-400">Nyt badeværelse – Frederiksberg</p>
              <h1 className="text-sm font-bold text-gray-900">Din tidsplan</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Deadline: 15. aug. 2025
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">

        {/* Advarsel: for tidlig start */}
        {forTidlig && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p className="text-sm font-semibold text-red-900">Du starter før flisemontagen er færdig</p>
              <p className="text-xs text-red-600 mt-0.5">Flise & Klinke ApS er planlagt færdig <strong>{formatDate(dagTilDato(TIDLIGST_START_DAG))}</strong>. Du kan tidligst starte den dato.</p>
            </div>
          </div>
        )}

        {/* Fælles tidslinje — alle faggrupper */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Projektets samlede tidsplan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Grå = andre faggrupper · Grøn = din periode</p>
          </div>

          <div className="px-5 py-4">
            {/* Månedslabels */}
            <div className="relative h-5 mb-2">
              {MONTHS.map((m, i) => {
                const nextDag = MONTHS[i + 1]?.dag ?? TOTAL_DAGE;
                return (
                  <div key={m.label} className="absolute top-0 flex items-center" style={{ left: pct(m.dag), width: barW(m.dag, nextDag) }}>
                    <span className="text-[10px] font-semibold text-gray-400">{m.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Grid linjer + bars */}
            <div className="relative">
              {/* Vertikale grid-linjer */}
              {MONTHS.map(m => (
                <div key={m.label} className="absolute top-0 bottom-0 w-px bg-gray-100" style={{ left: pct(m.dag) }} />
              ))}
              {/* Deadline-linje */}
              <div className="absolute top-0 bottom-0 w-px bg-red-200" style={{ left: "100%" }} />

              {/* Trade bars */}
              <div className="space-y-2 py-1">
                {alleTrades.map((t) => (
                  <div key={t.id} className="relative h-9 flex items-center">
                    {/* Label til venstre — absolut positioneret via margin trick */}
                    <div
                      className="absolute inset-y-0 flex items-center"
                      style={{ left: 0, width: pct(t.startDag), minWidth: 0 }}
                    />
                    {/* Bar */}
                    <div
                      className="absolute h-7 rounded-full flex items-center px-3 gap-1.5"
                      style={{
                        left: pct(t.startDag),
                        width: barW(t.startDag, t.slutDag),
                        backgroundColor: t.eget ? "#1a5c38" : t.status === "done" ? "#e2e8f0" : t.status === "active" ? "#dbeafe" : "#f1f5f9",
                        border: `1.5px solid ${t.eget ? "#1a5c3850" : t.status === "done" ? "#94a3b8" : t.status === "active" ? "#93c5fd" : "#e2e8f0"}`,
                      }}
                    >
                      {t.status === "done" && !t.eget && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                      {t.status === "active" && !t.eget && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                      <span className={`text-[10px] font-semibold truncate ${t.eget ? "text-white" : t.status === "done" ? "text-gray-500" : "text-blue-700"}`}>
                        {t.eget ? "Din periode" : t.navn}
                      </span>
                    </div>

                    {/* Firma-label til højre for baren */}
                    <div
                      className="absolute flex items-center"
                      style={{ left: `calc(${pct(t.slutDag)} + 6px)` }}
                    >
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{t.firma}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deadline diamond */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-3 h-3 bg-red-400 rotate-45" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-4 text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5"><div className="w-8 h-2.5 rounded-full bg-gray-200 border border-gray-300" /><span>Afsluttet</span></div>
                <div className="flex items-center gap-1.5"><div className="w-8 h-2.5 rounded-full bg-blue-100 border border-blue-300" /><span>I gang</span></div>
                <div className="flex items-center gap-1.5"><div className="w-8 h-2.5 rounded-full bg-[#1a5c38]" /><span>Din periode</span></div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-red-400">
                <div className="w-2.5 h-2.5 bg-red-400 rotate-45 shrink-0" />
                <span>Deadline 15. aug.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Startdato */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Hvornår starter du?</label>
              <p className="text-[11px] text-gray-400">Flisemontagen forventes færdig {formatDate(dagTilDato(TIDLIGST_START_DAG))}</p>
            </div>
            <input
              type="date"
              value={startDato}
              min={addDays(PROJEKT_START, TIDLIGST_START_DAG).toISOString().split("T")[0]}
              onChange={e => setStartDato(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Dine faser */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Dine faser</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tilføj opgaver i den rækkefølge de skal udføres</p>
          </div>

          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100">
            <div className="col-span-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opgave</div>
            <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dage</div>
            <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periode</div>
            <div className="col-span-1" />
          </div>

          {(() => {
            let cursor = new Date(startDate);
            return faser.map((fase) => {
              const faseStart = new Date(cursor);
              const faseSlut = addDays(cursor, fase.dage);
              cursor = faseSlut;
              const erÅben = redigerId === fase.id;

              return (
                <div key={fase.id} className={`border-b border-gray-50 last:border-b-0 ${erÅben ? "bg-gray-50/40" : ""}`}>
                  <div className="grid grid-cols-12 gap-3 items-center px-5 py-3.5">
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
                        <button onClick={() => setRedigerId(fase.id)} className="text-sm font-medium text-gray-800 hover:text-primary text-left w-full truncate">
                          {fase.navn || <span className="text-gray-300 italic">Klik for at navngive...</span>}
                        </button>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => opdaterFase(fase.id, "dage", Math.max(1, fase.dage - 1))} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors">−</button>
                        <span className="text-sm font-bold text-gray-900 w-5 text-center">{fase.dage}</span>
                        <button onClick={() => opdaterFase(fase.id, "dage", fase.dage + 1)} className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors">+</button>
                      </div>
                    </div>

                    <div className="col-span-4">
                      <p className="text-xs text-gray-500">{formatDate(faseStart)} – {formatDate(faseSlut)}</p>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => sletFase(fase.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  {erÅben && (
                    <div className="px-5 pb-3">
                      <input
                        value={fase.note}
                        onChange={e => opdaterFase(fase.id, "note", e.target.value)}
                        placeholder="Tilføj note — fx materialer, forbehold, forudsætninger..."
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 placeholder:text-gray-300"
                      />
                    </div>
                  )}
                </div>
              );
            });
          })()}

          <button onClick={tilføjFase} className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tilføj fase
          </button>
        </div>

        {/* Opsummering */}
        <div className={`rounded-2xl border p-5 ${overDeadline ? "bg-red-50 border-red-100" : forTidlig ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${overDeadline ? "bg-red-100" : forTidlig ? "bg-amber-100" : "bg-green-100"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={overDeadline ? "#dc2626" : forTidlig ? "#d97706" : "#15803d"} strokeWidth="2">
                  {overDeadline || forTidlig
                    ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                    : <polyline points="20 6 9 17 4 12"/>
                  }
                </svg>
              </div>
              <div>
                <p className={`text-sm font-bold ${overDeadline ? "text-red-900" : forTidlig ? "text-amber-900" : "text-green-900"}`}>
                  {overDeadline
                    ? `Overskrider deadline med ${Math.abs(dageForDeadline)} dage`
                    : forTidlig
                    ? "Start er sat før flisemontagen er færdig"
                    : `Færdig ${formatDate(slutDato)} — ${dageForDeadline} dage før deadline`}
                </p>
                <p className={`text-xs mt-0.5 ${overDeadline ? "text-red-600" : forTidlig ? "text-amber-600" : "text-green-600"}`}>
                  {totalMineDage} dage i alt · {formatDate(startDate)} → {formatDate(slutDato)}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">Bygherre-deadline</p>
              <p className="text-sm font-bold text-gray-700">15. aug. 2025</p>
            </div>
          </div>
        </div>

        {/* Send */}
        <button
          onClick={() => setSendt(true)}
          disabled={faser.some(f => !f.navn) || faser.length === 0 || forTidlig}
          className="w-full bg-primary text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Send tidsplan til bygherre
        </button>
        <p className="text-xs text-gray-400 text-center -mt-2 pb-8">Bygherre og øvrige faggrupper kan se din periode i den samlede tidsplan</p>

      </div>
    </div>
  );
}
