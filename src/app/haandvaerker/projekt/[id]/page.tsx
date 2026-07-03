"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface TilbudsPost {
  id: string;
  beskrivelse: string;
  enhed: string;
  pris: string;
}

interface Fase {
  id: string;
  navn: string;
  beskrivelse: string;
  posterIds: string[];
  status: "ikke-startet" | "igang" | "done" | "godkendt";
}

interface Sag {
  id: string;
  titel: string;
  resumé: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
  total: number;
  tilbudsposter: TilbudsPost[];
  sendtDato: string;
  status: "afventer" | "accepteret" | "afsluttet";
  tilbudsLink: string;
  faser?: Fase[];
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";
const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

export default function HaandvaerkerProjekt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sag, setSag] = useState<Sag | null>(null);
  const [navn, setNavn] = useState("");
  const [firma, setFirma] = useState("");
  const [aktivTab, setAktivTab] = useState("tilbud");
  const [linkKopieret, setLinkKopieret] = useState(false);

  // Fase-oprettelse
  const [visFaseForm, setVisFaseForm] = useState(false);
  const [faseNavn, setFaseNavn] = useState("");
  const [faseBeskrivelse, setFaseBeskrivelse] = useState("");
  const [fasePosterIds, setFasePosterIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_haandvaerker_sager");
      if (raw) {
        const sager: Sag[] = JSON.parse(raw);
        const fundet = sager.find(s => s.id === id);
        if (fundet) setSag(fundet);
      }
      setNavn(localStorage.getItem("contractr_haandvaerker_navn") || "");
      setFirma(localStorage.getItem("contractr_haandvaerker_firma") || "");
    } catch { /* ignore */ }
  }, [id]);

  function gemSag(opdateret: Sag) {
    try {
      const raw = localStorage.getItem("contractr_haandvaerker_sager");
      const sager: Sag[] = raw ? JSON.parse(raw) : [];
      const opdateret_sager = sager.map(s => s.id === opdateret.id ? opdateret : s);
      localStorage.setItem("contractr_haandvaerker_sager", JSON.stringify(opdateret_sager));
      setSag(opdateret);
    } catch { /* ignore */ }
  }

  function opretFase() {
    if (!sag || !faseNavn.trim()) return;
    const nyFase: Fase = {
      id: String(Date.now()),
      navn: faseNavn.trim(),
      beskrivelse: faseBeskrivelse.trim(),
      posterIds: fasePosterIds,
      status: "ikke-startet",
    };
    const opdateret = { ...sag, faser: [...(sag.faser || []), nyFase] };
    gemSag(opdateret);
    setFaseNavn(""); setFaseBeskrivelse(""); setFasePosterIds([]);
    setVisFaseForm(false);
  }

  function opdaterFaseStatus(faseId: string, status: Fase["status"]) {
    if (!sag) return;
    const opdateret = {
      ...sag,
      faser: (sag.faser || []).map(f => f.id === faseId ? { ...f, status } : f),
    };
    gemSag(opdateret);
  }

  function sletFase(faseId: string) {
    if (!sag) return;
    gemSag({ ...sag, faser: (sag.faser || []).filter(f => f.id !== faseId) });
  }

  function togglePosterId(pid: string) {
    setFasePosterIds(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  }

  const initials = navn
    ? navn.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "H";

  if (!sag) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-4">Sag ikke fundet.</p>
        <Link href="/haandvaerker/sager" className="text-[#1a5c38] font-semibold text-sm hover:underline">
          ← Tilbage til mine sager
        </Link>
      </div>
    </div>
  );

  const faser = sag.faser || [];
  const tabs = sag.status === "accepteret"
    ? [{ id: "tilbud", label: "Tilbud" }, { id: "faser", label: `Faser & fakturering${faser.length > 0 ? ` (${faser.length})` : ""}` }]
    : [{ id: "tilbud", label: "Tilbud" }];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}} className="text-gray-900">contractr</span>
            </Link>
            <span className="ml-1 text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded">Håndværker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/haandvaerker/sager" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              ← Mine sager
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#1a5c38]/10 flex items-center justify-center text-[#1a5c38] font-semibold text-sm">
              {initials}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Projektheader */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{sag.titel}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  sag.status === "accepteret" ? "bg-green-100 text-green-700" :
                  sag.status === "afsluttet" ? "bg-gray-100 text-gray-500" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {sag.status === "accepteret" ? "Accepteret" : sag.status === "afsluttet" ? "Afsluttet" : "Afventer svar"}
                </span>
              </div>
              {sag.bygherreNavn && (
                <p className="text-sm text-gray-500">
                  Bygherre: {sag.bygherreNavn}{sag.bygherreKontakt ? ` · ${sag.bygherreKontakt}` : ""}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-0.5">
                Tilbud sendt: {fmtDato(sag.sendtDato)} · Tilbudssum:{" "}
                <span className="font-semibold text-gray-700">{fmtKr(sag.total)}</span> inkl. moms
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sag.tilbudsLink);
                setLinkKopieret(true);
                setTimeout(() => setLinkKopieret(false), 2500);
              }}
              className={`flex items-center gap-2 text-sm font-semibold border px-4 py-2 rounded-xl flex-shrink-0 transition-all ${
                linkKopieret
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-[#1a5c38]/30 bg-[#f0f7f3] text-[#1a5c38] hover:bg-[#1a5c38] hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {linkKopieret ? "Kopieret!" : "Kopiér tilbudslink"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setAktivTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  aktivTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* TILBUD-TAB */}
        {aktivTab === "tilbud" && (
          <div className="space-y-4">

            {/* Status-banner */}
            {sag.status === "afventer" && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Afventer svar fra bygherre</p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Bygherren har ikke accepteret tilbuddet endnu. Send linket igen via knappen øverst, eller afvent deres svar.
                      Når de accepterer, kan du oprette faser og faktureringsmilestones herinde.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sag.status === "accepteret" && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-sm font-semibold text-green-800">
                    Tilbud accepteret. Gå til &quot;Faser &amp; fakturering&quot; for at opdele arbejdet og fakturere etapevis.
                  </p>
                </div>
              </div>
            )}

            {/* Tilbudsliste — fuldt ud */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Tilbudsposter</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Priser ekskl. moms · Total inkl. moms: {fmtKr(sag.total)}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {sag.tilbudsposter.map((p, i) => {
                  const prisInkl = (parseFloat(p.pris) || 0) * 1.25;
                  return (
                    <div key={p.id} className="px-6 py-4 flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">{i + 1}</span>
                      <p className="text-sm text-gray-800 flex-1 leading-relaxed">{p.beskrivelse}</p>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {prisInkl > 0 ? fmtKr(prisInkl) : "—"}
                        </p>
                        {prisInkl > 0 && <p className="text-xs text-gray-400">inkl. moms</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 px-6 py-4 flex justify-between bg-gray-50">
                <span className="text-sm font-bold text-gray-900">Samlet inkl. moms</span>
                <span className="text-sm font-bold text-[#1a5c38]">{fmtKr(sag.total)}</span>
              </div>
            </div>

            {/* Projektbeskrivelse */}
            {sag.resumé && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Projektbeskrivelse</p>
                <p className="text-sm text-gray-700 leading-relaxed">{sag.resumé}</p>
              </div>
            )}
          </div>
        )}

        {/* FASER-TAB */}
        {aktivTab === "faser" && (
          <div className="space-y-4">
            <div className="bg-[#f0f7f3] border border-[#1a5c38]/15 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[#1a5c38] mb-1">Fakturering koblet til fremdrift (AB-Forbruger §25)</p>
                  <p className="text-sm text-[#1a5c38]/80 leading-relaxed">
                    Opdel arbejdet i faser. Når en fase er færdig og godkendt af bygherren, kan du fakturere for den del.
                    Bygherren kan tilbageholde betaling ved dokumenterede mangler.
                  </p>
                </div>
              </div>
            </div>

            {/* Eksisterende faser */}
            {faser.length > 0 && (
              <div className="space-y-3">
                {faser.map(fase => {
                  const fasePoster = sag.tilbudsposter.filter(p => fase.posterIds.includes(p.id));
                  const faseTotal = fasePoster.reduce((s, p) => s + (parseFloat(p.pris) || 0), 0) * 1.25;

                  const statusConfig = {
                    "ikke-startet": { label: "Ikke startet", bg: "bg-gray-100", text: "text-gray-600" },
                    "igang": { label: "I gang", bg: "bg-blue-100", text: "text-blue-700" },
                    "done": { label: "Klar til godkendelse", bg: "bg-amber-100", text: "text-amber-700" },
                    "godkendt": { label: "Godkendt, klar til fakturering", bg: "bg-green-100", text: "text-green-700" },
                  }[fase.status];

                  return (
                    <div key={fase.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{fase.navn}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          {fase.beskrivelse && (
                            <p className="text-xs text-gray-500 leading-relaxed mb-2">{fase.beskrivelse}</p>
                          )}
                          {fasePoster.length > 0 && (
                            <div className="text-xs text-gray-400 space-y-0.5">
                              {fasePoster.map((p, i) => (
                                <div key={p.id} className="flex justify-between">
                                  <span className="truncate pr-3">{i + 1}. {p.beskrivelse}</span>
                                  <span className="flex-shrink-0">{fmtKr((parseFloat(p.pris) || 0) * 1.25)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {faseTotal > 0 && (
                            <>
                              <p className="text-sm font-bold text-gray-900">{fmtKr(faseTotal)}</p>
                              <p className="text-xs text-gray-400">inkl. moms</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status-actions */}
                      <div className="border-t border-gray-50 px-5 py-3 flex items-center justify-between gap-3 bg-gray-50">
                        <div className="flex gap-2 flex-wrap">
                          {fase.status === "ikke-startet" && (
                            <button
                              onClick={() => opdaterFaseStatus(fase.id, "igang")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1a5c38] text-white hover:opacity-90 transition-opacity"
                            >
                              Marker som i gang
                            </button>
                          )}
                          {fase.status === "igang" && (
                            <button
                              onClick={() => opdaterFaseStatus(fase.id, "done")}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:opacity-90 transition-opacity"
                            >
                              Meld klar til bygherre-gennemgang
                            </button>
                          )}
                          {fase.status === "done" && (
                            <span className="text-xs text-amber-700 font-medium">
                              Afventer bygherrens godkendelse...
                            </span>
                          )}
                          {fase.status === "godkendt" && (
                            <span className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              Klar til fakturering {faseTotal > 0 ? `: ${fmtKr(faseTotal)}` : ""}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => sletFase(fase.id)}
                          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                        >
                          Slet
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Opret ny fase */}
            {!visFaseForm ? (
              <button
                onClick={() => setVisFaseForm(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-5 text-sm font-semibold text-gray-400 hover:border-[#1a5c38] hover:text-[#1a5c38] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tilføj fase
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Ny fase</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fasenavn</label>
                  <input
                    type="text"
                    value={faseNavn}
                    onChange={e => setFaseNavn(e.target.value)}
                    placeholder="F.eks. Badeværelse, Køkken, Stue..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Beskrivelse (valgfrit)</label>
                  <textarea
                    value={faseBeskrivelse}
                    onChange={e => setFaseBeskrivelse(e.target.value)}
                    placeholder="Kort beskrivelse af hvad der indgår i denne fase"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all resize-none"
                  />
                </div>

                {sag.tilbudsposter.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Tilknyt tilbudsposter til denne fase</label>
                    <div className="space-y-2">
                      {sag.tilbudsposter.map((p, i) => {
                        const alleredeIFase = (sag.faser || []).some(
                          f => f.posterIds.includes(p.id) && !fasePosterIds.includes(p.id)
                        );
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              fasePosterIds.includes(p.id)
                                ? "border-[#1a5c38] bg-[#f0f7f3]"
                                : alleredeIFase
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={fasePosterIds.includes(p.id)}
                              onChange={() => !alleredeIFase && togglePosterId(p.id)}
                              disabled={alleredeIFase}
                              className="mt-0.5 accent-[#1a5c38]"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-gray-400 mr-2">{i + 1}.</span>
                              <span className="text-sm text-gray-800">{p.beskrivelse || "Post uden beskrivelse"}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500 flex-shrink-0">
                              {p.pris ? fmtKr((parseFloat(p.pris) || 0) * 1.25) : "—"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {fasePosterIds.length > 0 && (
                      <p className="text-xs text-[#1a5c38] font-semibold mt-2">
                        Fasebeløb: {fmtKr(
                          sag.tilbudsposter
                            .filter(p => fasePosterIds.includes(p.id))
                            .reduce((s, p) => s + (parseFloat(p.pris) || 0), 0) * 1.25
                        )} inkl. moms
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setVisFaseForm(false); setFaseNavn(""); setFaseBeskrivelse(""); setFasePosterIds([]); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Annuller
                  </button>
                  <button
                    onClick={opretFase}
                    disabled={!faseNavn.trim()}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${faseNavn.trim() ? "bg-[#1a5c38] text-white hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    Opret fase
                  </button>
                </div>
              </div>
            )}

            {/* Opsummering */}
            {faser.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Oversigt</p>
                <div className="space-y-2">
                  {faser.map(fase => {
                    const faseTotal = sag.tilbudsposter
                      .filter(p => fase.posterIds.includes(p.id))
                      .reduce((s, p) => s + (parseFloat(p.pris) || 0), 0) * 1.25;
                    return (
                      <div key={fase.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{fase.navn}</span>
                        <span className="font-medium text-gray-900">{faseTotal > 0 ? fmtKr(faseTotal) : "—"}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Total tilbudssum</span>
                    <span className="text-[#1a5c38]">{fmtKr(sag.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
