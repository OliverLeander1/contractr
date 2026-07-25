"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Aendring {
  id: string;
  felt: string;
  gammel_vaerdi: string;
  ny_vaerdi: string;
  forfatter: string;
  forfatter_navn: string | null;
  kommentar: string | null;
  status: "afventer" | "accepteret" | "afvist";
  oprettet_at: string;
}

interface Kontrakt {
  id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  vilkaar: string | null;
  haandvaerker_token: string;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  status: string;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  kontraktaendringer: Aendring[];
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

const feltLabels: Record<string, string> = {
  titel: "Projekttitel",
  beskrivelse: "Arbejdets omfang",
  total_pris: "Entreprisesum",
  vilkaar: "Vilkår",
};

export default function HaandvaerkerKontraktView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [kontrakt, setKontrakt] = useState<Kontrakt | null | "loading">("loading");
  const [aktivtFelt, setAktivtFelt] = useState<string | null>(null);
  const [nytIndhold, setNytIndhold] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [hvNavn, setHvNavn] = useState("");
  const [hvFirma, setHvFirma] = useState("");
  const [sender, setSender] = useState(false);
  const [godkender, setGodkender] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const [visNavnForm, setVisNavnForm] = useState(false);

  useEffect(() => {
    fetch(`/api/kontrakt/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setKontrakt(null); return; }
        setKontrakt(d);
        if (d.haandvaerker_navn) setHvNavn(d.haandvaerker_navn);
        if (d.haandvaerker_firma) setHvFirma(d.haandvaerker_firma);
      })
      .catch(() => setKontrakt(null));
  }, [token]);

  async function sendForslag(felt: string) {
    if (!nytIndhold.trim()) return;
    setSender(true);
    setFejl(null);
    try {
      const r = await fetch(`/api/kontrakt/${token}/forslag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          felt,
          ny_vaerdi: nytIndhold.trim(),
          forfatter: "haandvaerker",
          forfatter_navn: hvNavn || "Håndværker",
          kommentar: kommentar.trim() || null,
        }),
      });
      const data = await r.json();
      if (data.error) { setFejl(data.error); return; }
      setKontrakt(prev => prev && typeof prev === "object" ? {
        ...prev,
        kontraktaendringer: [...prev.kontraktaendringer, data],
        status: "forhandling",
      } : prev);
      setAktivtFelt(null);
      setNytIndhold("");
      setKommentar("");
    } finally {
      setSender(false);
    }
  }

  async function godkendKontrakt() {
    if (!hvNavn.trim()) { setVisNavnForm(true); return; }
    setGodkender(true);
    setFejl(null);
    try {
      const r = await fetch(`/api/kontrakt/${token}/godkend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forfatter: "haandvaerker",
          haandvaerker_navn: hvNavn.trim(),
          haandvaerker_firma: hvFirma.trim() || null,
        }),
      });
      const data = await r.json();
      if (data.error) { setFejl(data.error); return; }
      setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
      setVisNavnForm(false);
    } finally {
      setGodkender(false);
    }
  }

  if (kontrakt === "loading") {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!kontrakt) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Linket er ikke gyldigt</h1>
        <p className="text-sm text-gray-500 text-center">Det kan være udløbet eller allerede brugt. Bed bygherre om at sende et nyt link.</p>
      </div>
    );
  }

  const erGodkendt = kontrakt.status === "begge_godkendt";
  const haandvaerkerGodkendt = !!kontrakt.haandvaerker_godkendt_at;
  const afventerForslag = kontrakt.kontraktaendringer.filter(a => a.status === "afventer");

  if (erGodkendt) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kontrakt underskrevet</h1>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Begge parter har godkendt kontrakten. {kontrakt.titel || "Projektet"} er aktivt.
        </p>
        <p className="text-xs text-gray-400 mt-8">
          Powered by <span className="font-semibold">nembyggestyring</span>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      {/* Nav */}
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "2px" }} className="text-[#1e3a2a]">
            nembyggestyring
          </span>
          <span className="text-xs text-gray-400 bg-white border border-[#e0ddd6] px-3 py-1.5 rounded-full font-medium">
            Kontraktgennemgang
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#1e3a2a] text-white text-[10px] font-bold px-2.5 py-1 rounded">AB-Forbruger 2012</span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              haandvaerkerGodkendt
                ? "bg-green-100 text-green-700"
                : afventerForslag.length > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {haandvaerkerGodkendt ? "Du har godkendt" : afventerForslag.length > 0 ? `${afventerForslag.length} forslag afventer svar` : "Afventer din gennemgang"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{kontrakt.titel || "Kontraktudkast"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gennemgå kontrakten nedenfor. Du kan foreslå ændringer til hvert punkt — bygherre ser dine forslag med det samme.
          </p>
        </div>

        {/* Afventende forslag fra bygherre */}
        {afventerForslag.filter(a => a.forfatter === "bygherre").length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-900 mb-1">Bygherre har foreslået ændringer</p>
            <p className="text-xs text-amber-700">Se forslagene nedenfor og acceptér eller afvis dem.</p>
          </div>
        )}

        {/* Kontraktfelter */}
        <div className="space-y-4 mb-6">
          {(["beskrivelse", "total_pris", "vilkaar"] as const).map((felt) => {
            const vaerdi = felt === "total_pris"
              ? (kontrakt.total_pris ? fmtKr(kontrakt.total_pris) : null)
              : kontrakt[felt];

            const afventendeFeltForslag = kontrakt.kontraktaendringer.filter(
              a => a.felt === felt && a.status === "afventer"
            );
            const erAktiv = aktivtFelt === felt;
            const erLaast = felt === "vilkaar";

            return (
              <div key={felt} className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{feltLabels[felt]}</p>
                      {erLaast && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e3a2a] bg-[#1e3a2a]/8 px-1.5 py-0.5 rounded">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Låst · AB-Forbruger 2012
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {vaerdi || <span className="text-gray-400 italic">Ikke udfyldt</span>}
                    </p>
                  </div>
                  {!haandvaerkerGodkendt && !erAktiv && !erLaast && (
                    <button
                      onClick={() => {
                        setAktivtFelt(felt);
                        setNytIndhold(vaerdi ? String(vaerdi) : "");
                        setKommentar("");
                      }}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#1e3a2a] border border-[#1e3a2a]/20 bg-[#1e3a2a]/5 hover:bg-[#1e3a2a]/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Foreslå ændring
                    </button>
                  )}
                </div>

                {/* Forslags-formular */}
                {erAktiv && (
                  <div className="border-t border-[#e0ddd6] bg-[#f5f3ee] px-5 py-4">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Dit forslag til ændring</p>
                    {felt === "total_pris" ? (
                      <input
                        type="number"
                        value={nytIndhold}
                        onChange={e => setNytIndhold(e.target.value)}
                        placeholder="Ny pris i kr. ekskl. moms"
                        className="w-full border border-[#e0ddd6] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                      />
                    ) : (
                      <textarea
                        rows={4}
                        value={nytIndhold}
                        onChange={e => setNytIndhold(e.target.value)}
                        className="w-full border border-[#e0ddd6] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                      />
                    )}
                    <input
                      type="text"
                      value={kommentar}
                      onChange={e => setKommentar(e.target.value)}
                      placeholder="Tilføj en kommentar (valgfrit)..."
                      className="w-full mt-2 border border-[#e0ddd6] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setAktivtFelt(null); setNytIndhold(""); setKommentar(""); }}
                        className="flex-1 py-2 border border-[#e0ddd6] text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Annuller
                      </button>
                      <button
                        onClick={() => sendForslag(felt)}
                        disabled={sender || !nytIndhold.trim()}
                        className="flex-1 py-2 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                      >
                        {sender ? "Sender..." : "Send forslag"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Afventende forslag på dette felt */}
                {afventendeFeltForslag.map(a => (
                  <div key={a.id} className={`border-t px-5 py-4 ${a.forfatter === "bygherre" ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${a.forfatter === "bygherre" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {a.forfatter === "bygherre" ? "Bygherre foreslår" : "Dit forslag — afventer svar"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 leading-relaxed mb-1 font-medium">{a.ny_vaerdi}</p>
                    {a.kommentar && <p className="text-xs text-gray-500 italic mb-2">&ldquo;{a.kommentar}&rdquo;</p>}
                  </div>
                ))}

                {/* Accepterede/afviste forslag */}
                {kontrakt.kontraktaendringer.filter(a => a.felt === felt && a.status !== "afventer").map(a => (
                  <div key={a.id} className="border-t border-gray-100 px-5 py-3 flex items-center gap-3 bg-gray-50">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${a.status === "accepteret" ? "bg-green-100" : "bg-red-100"}`}>
                      {a.status === "accepteret"
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    </div>
                    <p className="text-xs text-gray-500">
                      {a.status === "accepteret" ? "Forslag accepteret" : "Forslag afvist"}
                      {a.forfatter_navn ? ` af ${a.forfatter_navn}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Betalingsplan */}
          <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Betalingsplan</p>
            <p className="text-xs text-gray-500 mb-4">Koblet til fremdrift jf. AB-Forbruger § 26</p>
            {kontrakt.betalingsplan?.map((b, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700">{b.milepæl}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {b.andel}
                  {kontrakt.total_pris && ` · ${fmtKr(kontrakt.total_pris * (parseFloat(b.andel) / 100))}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fejl */}
        {fejl && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <p className="text-xs text-red-700">{fejl}</p>
          </div>
        )}

        {/* Navn-formular (vises hvis man godkender uden navn) */}
        {visNavnForm && (
          <div className="bg-white border border-[#e0ddd6] rounded-2xl p-5 mb-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Hvem er du?</p>
            <p className="text-xs text-gray-400 mb-4">Dit navn tilknyttes kontrakten som underskriver.</p>
            <div className="space-y-3">
              <input
                type="text"
                value={hvNavn}
                onChange={e => setHvNavn(e.target.value)}
                placeholder="Dit fulde navn"
                className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
              />
              <input
                type="text"
                value={hvFirma}
                onChange={e => setHvFirma(e.target.value)}
                placeholder="Firmanavn (valgfrit)"
                className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
              />
            </div>
          </div>
        )}

        {/* Godkend-knap */}
        {!haandvaerkerGodkendt ? (
          <button
            onClick={godkendKontrakt}
            disabled={godkender}
            className="w-full bg-[#1e3a2a] text-white font-bold py-4 rounded-2xl hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 transition-all text-sm"
          >
            {godkender ? "Godkender..." : "Godkend kontrakt"}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="mx-auto mb-3"><polyline points="20 6 9 17 4 12"/></svg>
            <p className="font-semibold text-gray-900 mb-1">Du har godkendt kontrakten</p>
            <p className="text-sm text-gray-500">
              {kontrakt.status === "begge_godkendt"
                ? "Begge parter har godkendt. Projektet er nu aktivt."
                : "Bygherre skal nu også godkende for at kontrakten er bindende."}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <Link href="/" className="font-semibold hover:underline">nembyggestyring</Link>
        </p>
      </div>
    </div>
  );
}
