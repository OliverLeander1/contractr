"use client";

import { useEffect, useState } from "react";

interface UdbudData {
  titel: string;
  resumé: string;
  dokument: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
}

export default function UdbudDel() {
  const [data, setData] = useState<UdbudData | null>(null);
  const [tekst, setTekst] = useState("");
  const [fejl, setFejl] = useState(false);
  const [kopieret, setKopieret] = useState(false);
  const [linkKopieret, setLinkKopieret] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) { setFejl(true); return; }
      const json = decodeURIComponent(atob(hash.replace(/-/g, "+").replace(/_/g, "/")));
      const parsed = JSON.parse(json);
      setData(parsed);
      setTekst(parsed.dokument);
    } catch {
      setFejl(true);
    }
  }, []);

  function kopier() {
    navigator.clipboard.writeText(tekst).then(() => {
      setKopieret(true);
      setTimeout(() => setKopieret(false), 2500);
    });
  }

  function sendSvarTilbage() {
    if (!data) return;
    const payload = JSON.stringify({
      titel: data.titel,
      resumé: data.resumé,
      dokument: tekst,
      bygherreNavn: data.bygherreNavn,
      bygherreKontakt: data.bygherreKontakt,
    });
    const token = btoa(encodeURIComponent(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${window.location.origin}/udbud/se#${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkKopieret(true);
      setTimeout(() => setLinkKopieret(false), 3000);
    });
  }

  if (fejl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Linket er ugyldigt eller udløbet.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Contractr</span>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Udbudsdokument</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Intro */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Anmodning om tilbud
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.titel}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{data.resumé}</p>
        </div>

        {/* Låst bygherre-info */}
        {(data.bygherreNavn || data.bygherreKontakt) && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bygherrens kontaktoplysninger</p>
            </div>
            <div className="space-y-1">
              {data.bygherreNavn && (
                <p className="text-sm text-gray-800 font-medium">{data.bygherreNavn}</p>
              )}
              {data.bygherreKontakt && (
                <p className="text-sm text-gray-600">{data.bygherreKontakt}</p>
              )}
            </div>
          </div>
        )}

        {/* Info til håndværkeren */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">Til håndværkeren</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Tilføj din pris, tidsplan og betalingsplan direkte i dokumentet nedenfor. Send det derefter tilbage til bygherren med knappen i bunden.
              </p>
            </div>
          </div>
        </div>

        {/* Redigerbart dokument */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Projektbeskrivelse</h2>
              <p className="text-xs text-gray-400 mt-0.5">Klik i teksten for at tilføje dit tilbud</p>
            </div>
            <button
              onClick={kopier}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                kopieret ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {kopieret ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Kopieret!</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopiér tekst</>
              )}
            </button>
          </div>
          <div className="px-6 py-5">
            <textarea
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              rows={Math.max(20, tekst.split("\n").length + 2)}
              className="w-full text-sm text-gray-700 leading-relaxed font-sans resize-none focus:outline-none border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Send tilbage */}
        <button
          onClick={sendSvarTilbage}
          className={`w-full py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
            linkKopieret
              ? "bg-green-600 text-white"
              : "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
          }`}
        >
          {linkKopieret ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Link kopieret, send det til bygherren!</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send svar tilbage til bygherren</>
          )}
        </button>
      </div>
    </div>
  );
}
