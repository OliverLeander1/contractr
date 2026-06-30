"use client";

import { useEffect, useState } from "react";

interface UdbudData {
  titel: string;
  resumé: string;
  dokument: string;
}

export default function UdbudDel() {
  const [data, setData] = useState<UdbudData | null>(null);
  const [fejl, setFejl] = useState(false);
  const [kopieret, setKopieret] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) { setFejl(true); return; }
      const json = decodeURIComponent(atob(hash.replace(/-/g, "+").replace(/_/g, "/")));
      setData(JSON.parse(json));
    } catch {
      setFejl(true);
    }
  }, []);

  function kopier() {
    if (!data) return;
    navigator.clipboard.writeText(data.dokument).then(() => {
      setKopieret(true);
      setTimeout(() => setKopieret(false), 2500);
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
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Anmodning om tilbud
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.titel}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{data.resumé}</p>
        </div>

        {/* Info til håndværkeren */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">Til håndværkeren</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Bygherre ønsker tilbud på nedenstående projekt. Send dit tilbud direkte til bygherrens kontaktoplysninger i dokumentet. Tilbuddet bør indeholde fast pris, tidsplan og betalingsplan.
              </p>
            </div>
          </div>
        </div>

        {/* Dokument */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Projektbeskrivelse</h2>
            <button
              onClick={kopier}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                kopieret
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {kopieret ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Kopieret!
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Kopiér tekst
                </>
              )}
            </button>
          </div>
          <div className="px-6 py-5">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {data.dokument}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Har du modtaget et tilbud du vil tjekke?</p>
          <a
            href="https://contractr.dk/opret"
            className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
          >
            Tjek dit tilbud på Contractr
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
