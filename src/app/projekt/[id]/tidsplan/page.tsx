"use client";

import { use, useState, useEffect } from "react";
import ProjektNav from "@/components/ProjektNav";

interface Fase {
  id: string;
  label: string;
  ansvarlig: string;
  startDato: string;
  slutDato: string;
  status: "done" | "aktiv" | "kommende" | "forsinket";
  note?: string;
}

const fmtDato = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "long" });
};

const iDag = new Date().toISOString().split("T")[0];

function beregnStatus(startDato: string, slutDato: string, manueltStatus?: Fase["status"]): Fase["status"] {
  if (manueltStatus && manueltStatus !== "kommende") return manueltStatus;
  const nu = new Date();
  const start = new Date(startDato);
  const slut = new Date(slutDato);
  if (slut < nu) return "done";
  if (start <= nu) return "aktiv";
  return "kommende";
}

function StatusBadge({ status }: { status: Fase["status"] }) {
  const map = {
    done:      { label: "Afsluttet",    cls: "bg-[#e5ede7] text-[#1e3a2a]" },
    aktiv:     { label: "I gang nu",    cls: "bg-blue-100 text-blue-700" },
    kommende:  { label: "Kommer",       cls: "bg-gray-100 text-gray-500" },
    forsinket: { label: "Forsinket",    cls: "bg-amber-100 text-amber-700" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {status === "aktiv" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
      {s.label}
    </span>
  );
}

export default function Tidsplan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [faser, setFaser] = useState<Fase[]>([]);
  const [åben, setÅben] = useState<string | null>(null);
  const [visForm, setVisForm] = useState(false);
  const [nyFase, setNyFase] = useState({ label: "", ansvarlig: "", startDato: iDag, slutDato: "", note: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`contractr_tidsplan_${id}`);
      if (raw) setFaser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [id]);

  const gemFaser = (opdateret: Fase[]) => {
    setFaser(opdateret);
    localStorage.setItem(`contractr_tidsplan_${id}`, JSON.stringify(opdateret));
  };

  const tilføjFase = () => {
    if (!nyFase.label || !nyFase.slutDato) return;
    const fase: Fase = {
      id: Date.now().toString(),
      label: nyFase.label,
      ansvarlig: nyFase.ansvarlig || "Håndværker",
      startDato: nyFase.startDato,
      slutDato: nyFase.slutDato,
      status: beregnStatus(nyFase.startDato, nyFase.slutDato),
      note: nyFase.note || undefined,
    };
    gemFaser([...faser, fase].sort((a, b) => a.startDato.localeCompare(b.startDato)));
    setNyFase({ label: "", ansvarlig: "", startDato: iDag, slutDato: "", note: "" });
    setVisForm(false);
  };

  const sletFase = (faseid: string) => {
    gemFaser(faser.filter(f => f.id !== faseid));
  };

  const markerFærdig = (faseid: string) => {
    gemFaser(faser.map(f => f.id === faseid ? { ...f, status: "done" as const } : f));
  };

  const aktivFase = faser.find(f => f.status === "aktiv" || f.status === "forsinket");
  const næsteFase = faser.find(f => f.status === "kommende");
  const faserMedStatus = faser.map(f => ({ ...f, status: beregnStatus(f.startDato, f.slutDato, f.status) }));

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tidsplan</h1>
            <p className="text-sm text-gray-400 mt-1">Hvornår sker hvad i dit projekt</p>
          </div>
          <button
            onClick={() => setVisForm(!visForm)}
            className="flex items-center gap-2 bg-[#1e3a2a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#162d20] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tilføj fase
          </button>
        </div>

        {/* Tilføj fase formular */}
        {visForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Ny fase</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hvad sker der? *</label>
                <input
                  type="text"
                  placeholder="F.eks. Malerarbejde, Gulvlægning, Badeværelse..."
                  value={nyFase.label}
                  onChange={e => setNyFase(p => ({ ...p, label: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hvem er ansvarlig?</label>
                <input
                  type="text"
                  placeholder="F.eks. Hansen Maler ApS"
                  value={nyFase.ansvarlig}
                  onChange={e => setNyFase(p => ({ ...p, ansvarlig: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Startdato *</label>
                  <input
                    type="date"
                    value={nyFase.startDato}
                    onChange={e => setNyFase(p => ({ ...p, startDato: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slutdato *</label>
                  <input
                    type="date"
                    value={nyFase.slutDato}
                    onChange={e => setNyFase(p => ({ ...p, slutDato: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Note (valgfri)</label>
                <input
                  type="text"
                  placeholder="F.eks. Aftalt med håndværkeren d. 15. juni"
                  value={nyFase.note}
                  onChange={e => setNyFase(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setVisForm(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Annuller
              </button>
              <button
                onClick={tilføjFase}
                disabled={!nyFase.label || !nyFase.slutDato}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${nyFase.label && nyFase.slutDato ? "bg-[#1e3a2a] text-white hover:bg-[#162d20]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                Tilføj fase
              </button>
            </div>
          </div>
        )}

        {/* Tom tilstand */}
        {faser.length === 0 && !visForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-16 h-16 bg-[#e5ede7] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ingen tidsplan endnu</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
              Tilføj faserne i dit projekt, så du altid ved hvornår hvad sker, og kan holde styr på fremdriften.
            </p>
            <button
              onClick={() => setVisForm(true)}
              className="inline-flex items-center gap-2 bg-[#1e3a2a] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#162d20] transition-colors text-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tilføj første fase
            </button>

            {/* Eksempler */}
            <div className="mt-8 text-left">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Typiske faser for et malerarbejde</p>
              <div className="space-y-2">
                {[
                  { label: "Forberedelse og afdækning", who: "Håndværker" },
                  { label: "Grundering", who: "Håndværker" },
                  { label: "Maling", who: "Håndværker" },
                  { label: "Afleveringsforretning", who: "Begge parter" },
                ].map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs text-gray-500 font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">{ex.label}</p>
                      <p className="text-xs text-gray-400">{ex.who}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Aktiv fase */}
        {(aktivFase || næsteFase) && faser.length > 0 && (
          <div className="bg-[#e5ede7] border border-[#1e3a2a]/10 rounded-2xl p-5 mb-6">
            {aktivFase ? (
              <>
                <p className="text-xs font-bold text-[#1e3a2a] uppercase tracking-wide mb-2">I gang nu</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{aktivFase.label}</p>
                    <p className="text-sm text-gray-600">{aktivFase.ansvarlig} · til {fmtDato(aktivFase.slutDato)}</p>
                  </div>
                  <button
                    onClick={() => markerFærdig(aktivFase.id)}
                    className="text-xs font-semibold text-[#1e3a2a] border border-[#1e3a2a]/30 px-3 py-2 rounded-lg hover:bg-[#1e3a2a]/10 transition-colors"
                  >
                    Markér færdig
                  </button>
                </div>
              </>
            ) : næsteFase ? (
              <>
                <p className="text-xs font-bold text-[#1e3a2a] uppercase tracking-wide mb-2">Næste op</p>
                <p className="font-bold text-gray-900">{næsteFase.label}</p>
                <p className="text-sm text-gray-600">{næsteFase.ansvarlig} · starter {fmtDato(næsteFase.startDato)}</p>
              </>
            ) : null}
          </div>
        )}

        {/* Faselist */}
        {faserMedStatus.length > 0 && (
          <div className="space-y-2">
            {faserMedStatus.map((fase, i) => {
              const erÅben = åben === fase.id;
              return (
                <div
                  key={fase.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${fase.status === "aktiv" ? "border-[#1e3a2a]/30 ring-1 ring-[#1e3a2a]/10" : "border-gray-100"}`}
                >
                  <button
                    onClick={() => setÅben(erÅben ? null : fase.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    {/* Linje */}
                    <div className="flex flex-col items-center self-stretch shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        fase.status === "done" ? "bg-[#e5ede7] text-[#1e3a2a]" :
                        fase.status === "aktiv" ? "bg-blue-100 text-blue-600" :
                        fase.status === "forsinket" ? "bg-amber-100 text-amber-600" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {fase.status === "done" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < faserMedStatus.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-1 ${fase.status === "done" ? "bg-[#1e3a2a]/20" : "bg-gray-100"}`} style={{ minHeight: 16 }} />
                      )}
                    </div>

                    {/* Tekst */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`text-sm font-semibold ${fase.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {fase.label}
                        </p>
                        <StatusBadge status={fase.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {fmtDato(fase.startDato)} – {fmtDato(fase.slutDato)} · {fase.ansvarlig}
                      </p>
                    </div>

                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className={`text-gray-300 shrink-0 transition-transform ${erÅben ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {erÅben && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50">
                      <div className="pt-3 space-y-3">
                        {fase.note && (
                          <p className="text-sm text-gray-600 leading-relaxed">{fase.note}</p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {fase.status !== "done" && (
                            <button
                              onClick={() => markerFærdig(fase.id)}
                              className="text-xs font-semibold text-[#1e3a2a] border border-[#1e3a2a]/30 px-3 py-2 rounded-lg hover:bg-[#e5ede7] transition-colors"
                            >
                              Markér som afsluttet
                            </button>
                          )}
                          <button
                            onClick={() => sletFase(fase.id)}
                            className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Slet fase
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AB-tip */}
        {faser.length > 0 && (
          <div className="mt-6 bg-[#e5ede7] border border-[#1e3a2a]/10 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2" className="flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <p className="text-sm font-semibold text-[#1e3a2a] mb-1">AB-Forbruger § 38 — Husk afleveringsforretning</p>
                <p className="text-xs text-[#1e3a2a]/70 leading-relaxed">
                  Inden du overtager det færdige arbejde, har du ret til en formel gennemgang med håndværkeren. Mangler noteres skriftligt, og 5-årsgarantien starter herfra.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
