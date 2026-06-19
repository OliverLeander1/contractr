"use client";

import { use, useState } from "react";
import Link from "next/link";

const PROJEKT_START = new Date(2025, 3, 3); // 3. apr 2025
const DEADLINE = new Date(2025, 7, 15);     // 15. aug 2025

const ANDRE_TRADES = [
  { id: "nedrivning", navn: "Nedrivning og klargøring", firma: "TM Byg ApS", fra: new Date(2025, 3, 3), til: new Date(2025, 3, 20), status: "done" as const },
  { id: "vvs", navn: "VVS — rørføring", firma: "VVS-firma ApS", fra: new Date(2025, 3, 20), til: new Date(2025, 4, 11), status: "done" as const },
  { id: "fliser", navn: "Flisemontage", firma: "Flise & Klinke ApS", fra: new Date(2025, 4, 11), til: new Date(2025, 5, 15), status: "active" as const },
];

const TIDLIGST_START = new Date(2025, 5, 15); // fliser færdige

interface Fase {
  id: number;
  navn: string;
  startDato: string;
  dage: number;
  note: string;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  return date.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function isoToDate(iso: string): Date {
  return new Date(iso);
}

function dateToIso(d: Date): string {
  return d.toISOString().split("T")[0];
}

const STATUS_COLORS = {
  done: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400", label: "Afsluttet" },
  active: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", label: "I gang" },
};

export default function HaandvaerkerTidsplan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [faser, setFaser] = useState<Fase[]>([
    { id: 1, navn: "Grundmaling", startDato: dateToIso(TIDLIGST_START), dage: 3, note: "" },
    { id: 2, navn: "Toplag og detaljer", startDato: dateToIso(addDays(TIDLIGST_START, 3)), dage: 4, note: "" },
  ]);
  const [næstId, setNæstId] = useState(3);
  const [redigerId, setRedigerId] = useState<number | null>(null);
  const [sendt, setSendt] = useState(false);

  // Find samlet slutdato for mine faser
  const minSlutDato = faser.reduce((max, f) => {
    const slut = addDays(isoToDate(f.startDato), f.dage);
    return slut > max ? slut : max;
  }, new Date(0));

  const overDeadline = minSlutDato > DEADLINE;
  const forTidligFase = faser.find(f => isoToDate(f.startDato) < TIDLIGST_START);
  const dageForDeadline = Math.round((DEADLINE.getTime() - minSlutDato.getTime()) / 86400000);

  function opdater(id: number, felt: keyof Fase, value: string | number) {
    setFaser(prev => prev.map(f => f.id === id ? { ...f, [felt]: value } : f));
  }

  function tilføj() {
    // Foreslå at starte hvor sidst fase slutter
    const sidstSlut = faser.length > 0
      ? addDays(isoToDate(faser[faser.length - 1].startDato), faser[faser.length - 1].dage)
      : TIDLIGST_START;
    const forslag = sidstSlut < TIDLIGST_START ? TIDLIGST_START : sidstSlut;
    setFaser(prev => [...prev, { id: næstId, navn: "", startDato: dateToIso(forslag), dage: 1, note: "" }]);
    setRedigerId(næstId);
    setNæstId(n => n + 1);
  }

  function slet(id: number) {
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
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/haandvaerker/projekt/${id}`} className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <div>
              <p className="text-xs text-gray-400">Nyt badeværelse – Frederiksberg</p>
              <h1 className="text-sm font-bold text-gray-900">Din tidsplan</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Deadline 15. aug. 2025
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* Andre faggrupper — overblik */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Projektets øvrige faggrupper</h2>
            <p className="text-xs text-gray-400 mt-0.5">Du kan se hvornår de andre er færdige — men ikke redigere dem</p>
          </div>
          <div className="divide-y divide-gray-50">
            {ANDRE_TRADES.map(t => {
              const c = STATUS_COLORS[t.status];
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.navn}</p>
                      <p className="text-xs text-gray-400">{t.firma}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{fmt(t.fra)} – {fmt(t.til)}</span>
                  </div>
                </div>
              );
            })}

            {/* Din periode */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Malerarbejde</p>
                  <p className="text-xs text-gray-400">Dit firma — redigeres nedenfor</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">Din periode</span>
                {faser.length > 0
                  ? <span className="text-xs text-gray-500 whitespace-nowrap">{fmt(isoToDate(faser[0].startDato))} – {fmt(minSlutDato)}</span>
                  : <span className="text-xs text-gray-400 italic">Ikke sat endnu</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Advarsel */}
        {forTidligFase && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p className="text-sm font-semibold text-red-900">"{forTidligFase.navn}" starter før flisemontagen er færdig</p>
              <p className="text-xs text-red-600 mt-0.5">Flise & Klinke ApS forventes færdig <strong>{fmt(TIDLIGST_START)}</strong>.</p>
            </div>
          </div>
        )}

        {/* Dine faser */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Dine faser</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sæt startdato og antal dage for hver opgave — de kan godt overlappe</p>
          </div>

          <div className="divide-y divide-gray-50">
            {faser.map((fase, idx) => {
              const faseSlut = addDays(isoToDate(fase.startDato), fase.dage);
              const forTidlig = isoToDate(fase.startDato) < TIDLIGST_START;
              const erÅben = redigerId === fase.id;

              return (
                <div key={fase.id} className={erÅben ? "bg-gray-50/50" : ""}>
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Nummer */}
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Navn */}
                        {erÅben ? (
                          <input
                            autoFocus
                            value={fase.navn}
                            onChange={e => opdater(fase.id, "navn", e.target.value)}
                            placeholder="Navn på opgaven..."
                            className="w-full text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        ) : (
                          <button onClick={() => setRedigerId(fase.id)} className="text-sm font-medium text-gray-900 hover:text-primary text-left mb-3 block">
                            {fase.navn || <span className="text-gray-300 italic font-normal">Klik for at navngive...</span>}
                          </button>
                        )}

                        {/* Startdato + dage */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Startdato</p>
                            <input
                              type="date"
                              value={fase.startDato}
                              onChange={e => opdater(fase.id, "startDato", e.target.value)}
                              className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${forTidlig ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Antal dage</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => opdater(fase.id, "dage", Math.max(1, fase.dage - 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors">−</button>
                              <span className="text-sm font-bold text-gray-900 w-6 text-center">{fase.dage}</span>
                              <button onClick={() => opdater(fase.id, "dage", fase.dage + 1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors">+</button>
                            </div>
                          </div>
                          <div className="pt-4">
                            <p className="text-xs text-gray-400">{fmt(isoToDate(fase.startDato))} → <span className="font-semibold text-gray-700">{fmt(faseSlut)}</span></p>
                          </div>
                        </div>

                        {/* Note */}
                        {erÅben && (
                          <input
                            value={fase.note}
                            onChange={e => opdater(fase.id, "note", e.target.value)}
                            placeholder="Note — fx materialer, forbehold, forudsætninger (valgfrit)"
                            className="w-full mt-3 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 placeholder:text-gray-300"
                          />
                        )}
                      </div>

                      {/* Handlinger */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setRedigerId(erÅben ? null : fase.id)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => slet(fase.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={tilføj} className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tilføj fase
          </button>
        </div>

        {/* Opsummering */}
        {faser.length > 0 && (
          <div className={`rounded-2xl border p-5 ${overDeadline ? "bg-red-50 border-red-100" : forTidligFase ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${overDeadline ? "bg-red-100" : forTidligFase ? "bg-amber-100" : "bg-green-100"}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={overDeadline ? "#dc2626" : forTidligFase ? "#d97706" : "#15803d"} strokeWidth="2">
                    {overDeadline || forTidligFase
                      ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                      : <polyline points="20 6 9 17 4 12"/>}
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-bold ${overDeadline ? "text-red-900" : forTidligFase ? "text-amber-900" : "text-green-900"}`}>
                    {overDeadline
                      ? `Overskrider deadline med ${Math.abs(dageForDeadline)} dage`
                      : forTidligFase
                      ? "En fase starter for tidligt"
                      : `Færdig ${fmt(minSlutDato)} — ${dageForDeadline} dage før deadline`}
                  </p>
                  <p className={`text-xs mt-0.5 ${overDeadline ? "text-red-600" : forTidligFase ? "text-amber-600" : "text-green-600"}`}>
                    {faser.length} faser · tidligst {fmt(isoToDate(faser[0].startDato))} · senest færdig {fmt(minSlutDato)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">Bygherre-deadline</p>
                <p className="text-sm font-bold text-gray-700">15. aug. 2025</p>
              </div>
            </div>
          </div>
        )}

        {/* Send */}
        <div className="pb-8">
          <button
            onClick={() => setSendt(true)}
            disabled={faser.some(f => !f.navn) || faser.length === 0 || !!forTidligFase || overDeadline}
            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Send tidsplan til bygherre
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">Bygherre og øvrige faggrupper kan se din periode i den samlede tidsplan</p>
        </div>

      </div>
    </div>
  );
}
