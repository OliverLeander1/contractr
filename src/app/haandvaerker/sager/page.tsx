"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Sag {
  id: string;
  titel: string;
  resumé: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
  total: number;
  tilbudsposter: { id: string; beskrivelse: string; enhed: string; pris: string }[];
  sendtDato: string;
  status: "afventer" | "accepteret" | "afsluttet";
  tilbudsLink: string;
}

const fmtKr = (n: number) => n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";
const fmtDato = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

export default function HaandvaerkerSager() {
  const [sager, setSager] = useState<Sag[]>([]);
  const [navn, setNavn] = useState("");
  const [firma, setFirma] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_haandvaerker_sager");
      if (raw) setSager(JSON.parse(raw));
      setNavn(localStorage.getItem("contractr_haandvaerker_navn") || "");
      setFirma(localStorage.getItem("contractr_haandvaerker_firma") || "");
    } catch { /* ignore */ }
  }, []);

  const aktive = sager.filter(s => s.status === "afventer" || s.status === "accepteret");
  const afsluttede = sager.filter(s => s.status === "afsluttet");
  const samletVærdi = aktive.reduce((sum, s) => sum + s.total, 0);

  const initials = navn ? navn.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "H";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <span style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded">Håndværker</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Forside</Link>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{initials}</div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mine sager</h1>
          {navn && <p className="text-sm text-gray-400 mt-1">{navn}{firma ? ` · ${firma}` : ""}</p>}
        </div>

        {sager.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Ingen sager endnu</h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              Når du udfylder et tilbud via et link fra en bygherre og sender det, dukker sagen op her automatisk.
            </p>
          </div>
        ) : (
          <>
            {/* Overblik */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Aktive tilbud</p>
                <p className="text-3xl font-bold text-primary">{aktive.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Afventer svar</p>
                <p className="text-3xl font-bold text-amber-500">{sager.filter(s => s.status === "afventer").length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Samlet tilbudsværdi</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{fmtKr(samletVærdi)}</p>
              </div>
            </div>

            {/* Aktive sager */}
            {aktive.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aktive tilbud</h2>
                <div className="space-y-3">
                  {aktive.map((s) => (
                    <Link key={s.id} href={`/haandvaerker/projekt/${s.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">{s.titel}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              s.status === "accepteret" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {s.status === "accepteret" ? "Accepteret" : "Afventer"}
                            </span>
                          </div>
                          {s.bygherreNavn && <p className="text-sm text-gray-500 mb-2">{s.bygherreNavn}{s.bygherreKontakt ? ` · ${s.bygherreKontakt}` : ""}</p>}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              Sendt {fmtDato(s.sendtDato)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              {s.tilbudsposter.length} poster
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{fmtKr(s.total)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">inkl. moms</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Afsluttede */}
            {afsluttede.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Afsluttede</h2>
                <div className="space-y-3">
                  {afsluttede.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 opacity-60">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{s.titel}</h3>
                            <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Afsluttet</span>
                          </div>
                          {s.bygherreNavn && <p className="text-sm text-gray-400">{s.bygherreNavn}</p>}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{fmtKr(s.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

