"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import DokumentRenderer from "@/components/DokumentRenderer";

interface TidsplanFase {
  navn: string;
  startdato: string;
  slutdato: string;
}

interface Tidsplan {
  type: "faser" | "ingen_tidsplan";
  faser?: TidsplanFase[];
  godkendt_af_bygherre: boolean;
  godkendt_at?: string | null;
  indsendt_at?: string;
}

interface Kontrakt {
  id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  betalingsplan: string | null;
  vilkaar: string | null;
  startdato: string | null;
  slutdato: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  haandvaerker_email: string | null;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  status: string;
  tidsplan: Tidsplan | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

const fmtDatoKort = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

export default function HaandvaerkerAftaleSide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [kontrakt, setKontrakt] = useState<Kontrakt | null>(null);
  const [indlæser, setIndlæser] = useState(true);
  const [fejl, setFejl]         = useState<string | null>(null);
  const [godkender, setGodkender] = useState(false);
  const [godkendt, setGodkendt]   = useState(false);

  const [visNavnModal, setVisNavnModal] = useState(false);
  const [navn, setNavn]   = useState("");
  const [firma, setFirma] = useState("");

  // Tidsplan state
  const [loggetInd, setLoggetInd] = useState(false);
  const [visTidsplanEditor, setVisTidsplanEditor] = useState(false);
  const [tidsplanType, setTidsplanType] = useState<"faser" | "ingen_tidsplan">("faser");
  const [faser, setFaser] = useState<TidsplanFase[]>([
    { navn: "", startdato: "", slutdato: "" },
  ]);
  const [gemmerTidsplan, setGemmerTidsplan] = useState(false);
  const [tidsplanGemt, setTidsplanGemt] = useState(false);

  useEffect(() => {
    const hent = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const [res, { data: { user } }] = await Promise.all([
        fetch(`/api/kontrakt/${token}`),
        supabase.auth.getUser(),
      ]);
      if (user) setLoggetInd(true);
      if (!res.ok) { setFejl("Aftalegrundlaget blev ikke fundet. Tjek at linket er korrekt."); setIndlæser(false); return; }
      const data = await res.json();
      setKontrakt(data);
      if (data.haandvaerker_godkendt_at) setGodkendt(true);
      if (data.tidsplan) setTidsplanGemt(true);
      setIndlæser(false);
    };
    hent();
  }, [token]);

  async function godkend() {
    if (!navn.trim() || godkender) return;
    setGodkender(true);
    const res = await fetch(`/api/kontrakt/${token}/godkend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forfatter: "haandvaerker", haandvaerker_navn: navn.trim(), haandvaerker_firma: firma.trim() || null }),
    });
    if (res.ok) {
      setGodkendt(true);
      setVisNavnModal(false);
      setKontrakt(prev => prev ? { ...prev, haandvaerker_godkendt_at: new Date().toISOString(), haandvaerker_navn: navn.trim() } : prev);
    }
    setGodkender(false);
  }

  async function gemTidsplan() {
    if (gemmerTidsplan) return;
    if (tidsplanType === "faser" && faser.some(f => !f.navn.trim() || !f.startdato || !f.slutdato)) return;
    setGemmerTidsplan(true);

    const payload: Tidsplan = tidsplanType === "ingen_tidsplan"
      ? { type: "ingen_tidsplan", godkendt_af_bygherre: false }
      : { type: "faser", faser: faser.filter(f => f.navn.trim()), godkendt_af_bygherre: false };

    const res = await fetch(`/api/kontrakt/${token}/tidsplan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tidsplan: payload }),
    });
    if (res.ok) {
      const data = await res.json();
      setKontrakt(data);
      setTidsplanGemt(true);
      setVisTidsplanEditor(false);
    }
    setGemmerTidsplan(false);
  }

  if (indlæser) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
    </div>
  );

  if (fejl || !kontrakt) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="font-bold text-gray-900 mb-2">Siden blev ikke fundet</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{fejl ?? "Linket er ugyldigt eller udløbet."}</p>
        <Link href="/" className="inline-block mt-6 text-sm font-semibold text-[#1e3a2a] hover:underline">← Gå til forsiden</Link>
      </div>
    </div>
  );

  const beggeGodkendt = !!(kontrakt.bygherre_godkendt_at && kontrakt.haandvaerker_godkendt_at);
  const tidsplan = kontrakt.tidsplan;
  const tidsplanGodkendt = tidsplan?.godkendt_af_bygherre === true;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3a2a] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "2px" }} className="text-gray-900">contractr</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/haandvaerker/sager" className="text-sm text-gray-500 hover:text-[#1e3a2a] transition-colors">← Mine sager</Link>
            <span className="text-xs bg-[#1e3a2a]/10 text-[#1e3a2a] font-semibold px-3 py-1 rounded-full">Aftalegrundlag til gennemsyn</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Status-banner */}
        {beggeGodkendt ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="font-bold text-green-800">Aftalegrundlaget er godkendt af begge parter</p>
              <p className="text-sm text-green-700/70 mt-0.5">Aftalen er juridisk bindende. Begge parters godkendelse er logget med tidsstempel.</p>
            </div>
          </div>
        ) : godkendt ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="font-bold text-blue-800">Du har godkendt aftalegrundlaget</p>
              <p className="text-sm text-blue-700/70 mt-0.5">Afventer nu bygherrens godkendelse.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-amber-800">Afventer din gennemgang</p>
              <p className="text-sm text-amber-700/70 mt-0.5">Gennemgå aftalegrundlaget og udfyld tidsplan inden du godkender.</p>
            </div>
          </div>
        )}

        {/* Aftalegrundlag — samme dokumentlayout som ved oprettelse */}
        <div className="mb-5">
          {kontrakt.beskrivelse ? (
            <DokumentRenderer
              tekst={kontrakt.beskrivelse}
              titel={kontrakt.titel || undefined}
              bygherreNavn={undefined}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <p className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest mb-1">Aftalegrundlag</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{kontrakt.titel ?? "Byggeprojekt"}</h1>
              {kontrakt.total_pris && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <p className="text-sm text-gray-500">Entreprisesum</p>
                  <p className="text-sm font-bold text-gray-900">{fmtKr(kontrakt.total_pris)} inkl. moms</p>
                </div>
              )}
              {kontrakt.startdato && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <p className="text-sm text-gray-500">Opstart</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDato(kontrakt.startdato)}</p>
                </div>
              )}
              {kontrakt.slutdato && (
                <div className="flex justify-between items-center py-2.5">
                  <p className="text-sm text-gray-500">Aflevering</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDato(kontrakt.slutdato)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── TIDSPLAN ─── */}
        <div className="mb-5">
          {tidsplan && !visTidsplanEditor ? (
            /* Indsendt tidsplan */
            <div className="bg-[#111c17] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 12</p>
                    <p className="text-base font-bold text-white">
                      {tidsplan.type === "ingen_tidsplan" ? "Ingen fast tidsplan aftalt" : "Tidsplan indsendt"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tidsplanGodkendt ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/20">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Godkendt af bygherre
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/20">
                      Afventer bygherrens godkendelse
                    </span>
                  )}
                </div>
              </div>

              {tidsplan.type === "ingen_tidsplan" ? (
                <div className="px-6 pb-6">
                  <div className="bg-white/5 rounded-xl px-5 py-4 border border-white/10">
                    <p className="text-sm text-white/70 leading-relaxed">
                      Parterne har aftalt at arbejdet udføres uden en fast faseopdelt tidsplan. Dette udgør en eksplicit fravigelse af AB-Forbruger § 12.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-6">
                  {/* Timeline visualization */}
                  <div className="relative">
                    {(tidsplan.faser ?? []).map((fase, i) => (
                      <div key={i} className="flex gap-4 mb-4 last:mb-0">
                        {/* Linje og cirkel */}
                        <div className="flex flex-col items-center flex-shrink-0 w-8">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${tidsplanGodkendt ? "bg-[#4ade80] text-[#111c17]" : "bg-[#1a5c38] text-white"}`}>
                            {i + 1}
                          </div>
                          {i < (tidsplan.faser?.length ?? 0) - 1 && (
                            <div className="w-0.5 flex-1 bg-white/10 mt-1 min-h-[16px]" />
                          )}
                        </div>
                        {/* Indhold */}
                        <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/8 mb-1">
                          <p className="text-sm font-semibold text-white mb-1">{fase.navn}</p>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <span>{fase.startdato ? fmtDatoKort(fase.startdato) : "—"}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            <span>{fase.slutdato ? fmtDatoKort(fase.slutdato) : "—"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!godkendt && (
                <div className="px-6 pb-5">
                  <button
                    onClick={() => {
                      if (tidsplan.type === "faser" && tidsplan.faser) setFaser(tidsplan.faser);
                      setTidsplanType(tidsplan.type);
                      setVisTidsplanEditor(true);
                      setTidsplanGemt(false);
                    }}
                    className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
                  >
                    Ret tidsplan
                  </button>
                </div>
              )}
            </div>
          ) : visTidsplanEditor || !tidsplan ? (
            /* Tidsplan-editor */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-[#111c17] px-6 py-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 12</p>
                    <p className="text-base font-bold text-white">Opsæt tidsplan</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mt-2">
                  AB-Forbruger § 12 kræver en aftalt tidsplan med start- og sluttidspunkt. Udfyld faserne herunder, eller vælg at fravige kravet.
                  {(kontrakt.startdato || kontrakt.slutdato) && (
                    <span className="text-white/70"> Aftalt ramme: {kontrakt.startdato ? fmtDatoKort(kontrakt.startdato) : "?"} → {kontrakt.slutdato ? fmtDatoKort(kontrakt.slutdato) : "?"}</span>
                  )}
                </p>
              </div>

              <div className="p-6">
                {/* Type-valg */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setTidsplanType("faser")}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      tidsplanType === "faser"
                        ? "border-[#1a5c38] bg-[#f0f7f3]"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${tidsplanType === "faser" ? "border-[#1a5c38]" : "border-gray-300"}`}>
                      {tidsplanType === "faser" && <div className="w-2.5 h-2.5 rounded-full bg-[#1a5c38]" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${tidsplanType === "faser" ? "text-[#1a5c38]" : "text-gray-700"}`}>Fast tidsplan</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">Faseopdelt plan med datoer</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setTidsplanType("ingen_tidsplan")}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      tidsplanType === "ingen_tidsplan"
                        ? "border-amber-400 bg-amber-50"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${tidsplanType === "ingen_tidsplan" ? "border-amber-500" : "border-gray-300"}`}>
                      {tidsplanType === "ingen_tidsplan" && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${tidsplanType === "ingen_tidsplan" ? "text-amber-700" : "text-gray-700"}`}>Ingen fast tidsplan</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">Eksplicit fravigelse af § 12</p>
                    </div>
                  </button>
                </div>

                {tidsplanType === "ingen_tidsplan" ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-5">
                    <div className="flex items-start gap-3">
                      <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 mb-1">Fravigelse af AB-Forbruger § 12</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Begge parter anerkender at arbejdet udføres uden en faseopdelt tidsplan. Bygherren modtager dette til godkendelse og begge parter er bevidste om at standarden fraviges.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {faser.map((fase, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        {/* Nummer */}
                        <div className="w-7 h-7 rounded-full bg-[#1e3a2a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                          {i + 1}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 space-y-2">
                          <input
                            placeholder="Fasenavn (fx Nedrivning, Grovinstallation, Overfladebehandling)"
                            value={fase.navn}
                            onChange={e => {
                              const ny = [...faser];
                              ny[i] = { ...ny[i], navn: e.target.value };
                              setFaser(ny);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Start</label>
                              <input
                                type="date"
                                value={fase.startdato}
                                min={kontrakt.startdato ?? undefined}
                                max={kontrakt.slutdato ?? undefined}
                                onChange={e => {
                                  const ny = [...faser];
                                  ny[i] = { ...ny[i], startdato: e.target.value };
                                  setFaser(ny);
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Slut</label>
                              <input
                                type="date"
                                value={fase.slutdato}
                                min={fase.startdato || (kontrakt.startdato ?? undefined)}
                                max={kontrakt.slutdato ?? undefined}
                                onChange={e => {
                                  const ny = [...faser];
                                  ny[i] = { ...ny[i], slutdato: e.target.value };
                                  setFaser(ny);
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                              />
                            </div>
                          </div>
                        </div>
                        {faser.length > 1 && (
                          <button
                            onClick={() => setFaser(prev => prev.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-400 transition-colors mt-2 flex-shrink-0"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setFaser(prev => [...prev, { navn: "", startdato: "", slutdato: "" }])}
                      className="flex items-center gap-2 text-sm font-semibold text-[#1a5c38] hover:underline pl-10"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Tilføj fase
                    </button>
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  {visTidsplanEditor && (
                    <button onClick={() => { setVisTidsplanEditor(false); setTidsplanGemt(true); }}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">
                      Annuller
                    </button>
                  )}
                  <button
                    onClick={gemTidsplan}
                    disabled={gemmerTidsplan || (tidsplanType === "faser" && faser.some(f => !f.navn.trim() || !f.startdato || !f.slutdato))}
                    className="flex-1 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {gemmerTidsplan ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Gemmer...</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Send tidsplan til bygherre</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Godkendelsesstatus */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Godkendelsesstatus</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${kontrakt.bygherre_godkendt_at ? "bg-green-100" : "bg-gray-100"}`}>
                {kontrakt.bygherre_godkendt_at
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Bygherre</p>
                <p className="text-xs text-gray-400">{kontrakt.bygherre_godkendt_at ? `Godkendt ${fmtDato(kontrakt.bygherre_godkendt_at)}` : "Afventer"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${kontrakt.haandvaerker_godkendt_at ? "bg-green-100" : "bg-gray-100"}`}>
                {kontrakt.haandvaerker_godkendt_at
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{kontrakt.haandvaerker_navn ?? "Entreprenør"}</p>
                <p className="text-xs text-gray-400">{kontrakt.haandvaerker_godkendt_at ? `Godkendt ${fmtDato(kontrakt.haandvaerker_godkendt_at)}` : "Afventer din godkendelse"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Godkend-knap */}
        {!godkendt && (
          <button onClick={() => setVisNavnModal(true)}
            className="w-full py-4 bg-[#1e3a2a] text-white font-bold text-base rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Godkend aftalegrundlag
          </button>
        )}

        {!godkendt && (
          <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
            Har du spørgsmål til aftalegrundlaget? Kontakt bygherren direkte inden du godkender.
          </p>
        )}

        {godkendt && (
          <div className="mt-6 bg-[#1e3a2a] rounded-2xl p-6 text-center">
            <p className="text-green-200/60 text-xs uppercase tracking-widest mb-2">Næste skridt</p>
            {loggetInd ? (
              <>
                <h3 className="text-white font-bold text-lg mb-2">Gå til dit projektrum</h3>
                <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
                  Følg tidsplan, aftalesedler og mangler direkte fra dit projektrum.
                </p>
                <a href="/haandvaerker/sager"
                  className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#f5f3ee] transition-colors">
                  Mine sager →
                </a>
              </>
            ) : (
              <>
                <h3 className="text-white font-bold text-lg mb-2">Opret en gratis konto som entreprenør</h3>
                <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
                  Med en konto kan du modtage aftalesedler, følge betalingsplan og tidsplan og koordinere direkte med bygherren.
                </p>
                <a href={`/haandvaerker/opret-konto?email=${encodeURIComponent(kontrakt?.haandvaerker_email ?? "")}&navn=${encodeURIComponent(kontrakt?.haandvaerker_navn ?? "")}`}
                  className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#f5f3ee] transition-colors">
                  Opret gratis konto →
                </a>
              </>
            )}
          </div>
        )}

        {beggeGodkendt && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">Aftalen er bindende for begge parter</p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
              Begge parter har underskrevet digitalt. Dokumentationen er gemt og kan fremvises ved eventuel tvist.
            </p>
          </div>
        )}
      </div>

      {/* Navn-modal */}
      {visNavnModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#1e3a2a]/10 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Digital godkendelse</h2>
                <p className="text-xs text-gray-400">Bekræft din identitet inden underskrift</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dit fulde navn</label>
                <input type="text" value={navn} onChange={e => setNavn(e.target.value)}
                  placeholder="Fornavn Efternavn"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Firma (valgfrit)</label>
                <input type="text" value={firma} onChange={e => setFirma(e.target.value)}
                  placeholder="Firma ApS"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
              </div>
            </div>

            <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-gray-600 leading-relaxed">
                Ved at klikke &ldquo;Underskriv&rdquo; bekræfter du at du har gennemgået og accepterer aftalegrundlaget inkl. tidsplan. Din godkendelse logges med navn og tidsstempel.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setVisNavnModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                Annuller
              </button>
              <button onClick={godkend} disabled={!navn.trim() || godkender}
                className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {godkender ? "Gemmer..." : "Underskriv"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
