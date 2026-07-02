"use client";

import { use, useEffect, useState } from "react";
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

export default function HaandvaerkerProjekt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sag, setSag] = useState<Sag | null>(null);
  const [navn, setNavn] = useState("");
  const [firma, setFirma] = useState("");
  const [aktivTab, setAktivTab] = useState("overblik");
  const [linkKopieret, setLinkKopieret] = useState(false);

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

  // Betalingsplan: 20/30/30/20 af total
  const betalingsplan = sag ? [
    { navn: "Opstartsbeløb (ved igangsætning)", pct: 0.20, status: "afventer" as const },
    { navn: "Delbetaling 1 (halvvejs)", pct: 0.30, status: "afventer" as const },
    { navn: "Delbetaling 2 (ved aflevering)", pct: 0.30, status: "afventer" as const },
    { navn: "Tilbageholdelse (efter 1-måneds eftersyn)", pct: 0.20, status: "afventer" as const },
  ].map(b => ({ ...b, beløb: sag.total * b.pct })) : [];

  const initials = navn ? navn.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "H";

  if (!sag) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-4">Sag ikke fundet.</p>
        <Link href="/haandvaerker/sager" className="text-primary font-semibold text-sm hover:underline">← Tilbage til mine sager</Link>
      </div>
    </div>
  );

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
            <Link href="/haandvaerker/sager" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Mine sager</Link>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{initials}</div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Projektheader */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
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
              {sag.bygherreNavn && <p className="text-sm text-gray-500">Bygherre: {sag.bygherreNavn}{sag.bygherreKontakt ? ` · ${sag.bygherreKontakt}` : ""}</p>}
              <p className="text-sm text-gray-400 mt-0.5">Tilbud sendt: {fmtDato(sag.sendtDato)} · Tilbudssum: <span className="font-semibold text-gray-700">{fmtKr(sag.total)}</span> inkl. moms</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sag.tilbudsLink);
                setLinkKopieret(true);
                setTimeout(() => setLinkKopieret(false), 2500);
              }}
              className={`flex items-center gap-2 text-sm font-semibold border px-4 py-2 rounded-xl flex-shrink-0 transition-all ${
                linkKopieret ? "border-green-300 bg-green-50 text-green-700" : "border-primary/30 bg-accent text-primary hover:bg-primary hover:text-white"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {linkKopieret ? "Kopieret!" : "Kopiér tilbudslink"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: "overblik", label: "Overblik" },
            { id: "poster", label: "Tilbudsposter" },
            { id: "betaling", label: "Betalingsplan" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setAktivTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${aktivTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overblik */}
        {aktivTab === "overblik" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Tilbudssum inkl. moms</p>
                <p className="text-2xl font-bold text-gray-900">{fmtKr(sag.total)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Antal poster</p>
                <p className="text-2xl font-bold text-gray-900">{sag.tilbudsposter.length}</p>
              </div>
            </div>

            {sag.resumé && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Projektbeskrivelse</p>
                <p className="text-sm text-gray-700 leading-relaxed">{sag.resumé}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    {sag.status === "afventer" ? "Afventer svar fra bygherre" : "Tilbud accepteret"}
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {sag.status === "afventer"
                      ? "Bygherren har ikke accepteret tilbuddet endnu. Du kan sende linket igen med knappen ovenfor."
                      : "Bygherren har accepteret dit tilbud. Aftal opstartsdato og underskrift af kontrakt direkte med bygherren."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tilbudsposter */}
        {aktivTab === "poster" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Dine tilbudsposter</h2>
              <p className="text-xs text-gray-400 mt-0.5">Priser ekskl. moms · Total inkl. moms: {fmtKr(sag.total)}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {sag.tilbudsposter.map((p, i) => (
                <div key={p.id} className="px-6 py-4 flex items-start gap-3">
                  <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">{i + 1}</span>
                  <p className="text-sm text-gray-800 flex-1 leading-relaxed">{p.beskrivelse}</p>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.pris ? fmtKr(parseFloat(p.pris) * 1.25) : "—"}
                    </p>
                    <p className="text-xs text-gray-400">inkl. moms</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between">
              <span className="text-sm font-bold text-gray-900">Samlet inkl. moms</span>
              <span className="text-sm font-bold text-primary">{fmtKr(sag.total)}</span>
            </div>
          </div>
        )}

        {/* Betalingsplan */}
        {aktivTab === "betaling" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Forventet betalingsplan</h2>
            <p className="text-xs text-gray-400 mb-5">Baseret på standard 20/30/30/20-opdeling jf. AB-Forbruger anbefalinger</p>
            <div className="space-y-3">
              {betalingsplan.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.navn}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{Math.round(b.pct * 100)}% af tilbudssum</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{fmtKr(b.beløb)}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Afventer</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-sm font-bold text-primary">{fmtKr(sag.total)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              Betalingsplan koordineres endeligt med bygherren. Betalinger frigives ved dokumenteret fremdrift jf. AB-Forbruger § 25.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
