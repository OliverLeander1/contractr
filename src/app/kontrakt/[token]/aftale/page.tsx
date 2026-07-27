"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

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
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

export default function HaandvaerkerAftaleSide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [kontrakt, setKontrakt] = useState<Kontrakt | null>(null);
  const [indlæser, setIndlæser] = useState(true);
  const [fejl, setFejl]         = useState<string | null>(null);
  const [godkender, setGodkender] = useState(false);
  const [godkendt, setGodkendt]   = useState(false);

  // Navn-modal inden godkendelse
  const [visNavnModal, setVisNavnModal] = useState(false);
  const [navn, setNavn]   = useState("");
  const [firma, setFirma] = useState("");

  useEffect(() => {
    const hent = async () => {
      const res = await fetch(`/api/kontrakt/${token}`);
      if (!res.ok) { setFejl("Aftalegrundlaget blev ikke fundet. Tjek at linket er korrekt."); setIndlæser(false); return; }
      const data = await res.json();
      setKontrakt(data);
      if (data.haandvaerker_godkendt_at) setGodkendt(true);
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
          <span className="text-xs bg-[#1e3a2a]/10 text-[#1e3a2a] font-semibold px-3 py-1 rounded-full">Aftalegrundlag til gennemsyn</span>
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
              <p className="text-sm text-blue-700/70 mt-0.5">Afventer nu bygherrens godkendelse. Du modtager besked når begge parter har underskrevet.</p>
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
              <p className="font-bold text-amber-800">Afventer din godkendelse</p>
              <p className="text-sm text-amber-700/70 mt-0.5">Gennemgå aftalegrundlaget herunder og godkend hvis alt er som aftalt.</p>
            </div>
          </div>
        )}

        {/* Aftalegrundlag */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest mb-1">Aftalegrundlag</p>
              <h1 className="text-2xl font-bold text-gray-900">{kontrakt.titel ?? "Byggeprojekt"}</h1>
            </div>
            {kontrakt.total_pris && (
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Entreprisesum</p>
                <p className="text-xl font-bold text-gray-900">{fmtKr(kontrakt.total_pris)}</p>
                <p className="text-xs text-gray-400">inkl. moms</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {kontrakt.beskrivelse && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Arbejdets omfang</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{kontrakt.beskrivelse}</p>
              </div>
            )}

            {(kontrakt.startdato || kontrakt.slutdato) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                {kontrakt.startdato && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Opstart</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDato(kontrakt.startdato)}</p>
                  </div>
                )}
                {kontrakt.slutdato && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Aflevering</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDato(kontrakt.slutdato)}</p>
                  </div>
                )}
              </div>
            )}

            {kontrakt.betalingsplan && (
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Betalingsplan</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{kontrakt.betalingsplan}</p>
              </div>
            )}

            {kontrakt.vilkaar && (
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vilkår</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{kontrakt.vilkaar}</p>
              </div>
            )}
          </div>
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

        {/* CTA efter godkendelse */}
        {godkendt && (
          <div className="mt-6 bg-[#1e3a2a] rounded-2xl p-6 text-center">
            <p className="text-green-200/60 text-xs uppercase tracking-widest mb-2">Næste skridt</p>
            <h3 className="text-white font-bold text-lg mb-2">Opret en gratis konto som entreprenør</h3>
            <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
              Med en konto kan du modtage aftalesedler om ekstraarbejde, følge betalingsplan og tidsplan — og koordinere direkte med bygherren.
            </p>
            <a href={`/haandvaerker/opret-konto?email=${encodeURIComponent(kontrakt.haandvaerker_email ?? "")}&navn=${encodeURIComponent(kontrakt.haandvaerker_navn ?? "")}`}
              className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#f5f3ee] transition-colors">
              Opret gratis konto →
            </a>
            <p className="text-green-200/40 text-xs mt-4">Tager under 2 minutter. Ingen betalingskort kræves.</p>
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
                Ved at klikke "Underskriv" bekræfter du at du har gennemgået og accepterer aftalegrundlaget. Din godkendelse logges med navn og tidsstempel.
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
