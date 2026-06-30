"use client";

import { useEffect, useState } from "react";

interface TilbudsPost {
  id: string;
  beskrivelse: string;
  enhed: string;
  pris: string;
}

interface UdbudData {
  titel: string;
  resumé: string;
  dokument: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
  tilbudsposter?: TilbudsPost[];
}

function prisNum(p: string): number {
  const n = parseFloat(p.replace(/[^0-9,.]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export default function UdbudDel() {
  const [data, setData] = useState<UdbudData | null>(null);
  const [poster, setPoster] = useState<TilbudsPost[]>([]);
  const [fejl, setFejl] = useState(false);
  const [linkKopieret, setLinkKopieret] = useState(false);
  const [erBygherre, setErBygherre] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) { setFejl(true); return; }
      const json = decodeURIComponent(atob(hash.replace(/-/g, "+").replace(/_/g, "/")));
      const parsed = JSON.parse(json);
      setData(parsed);
      const initialPoster = (parsed.tilbudsposter || []).map((p: TilbudsPost) => ({
        ...p,
        pris: p.pris || "",
      }));
      setPoster(initialPoster);
      // If all prices are filled, this is the bygherre receiving the response
      const alUdfyldt = initialPoster.length > 0 && initialPoster.every((p: TilbudsPost) => p.pris && p.pris !== "");
      setErBygherre(alUdfyldt);
    } catch {
      setFejl(true);
    }
  }, []);

  function opdaterPris(id: string, pris: string) {
    setPoster(prev => prev.map(p => p.id === id ? { ...p, pris } : p));
  }

  function opdaterBeskrivelse(id: string, beskrivelse: string) {
    setPoster(prev => prev.map(p => p.id === id ? { ...p, beskrivelse } : p));
  }

  function tilfoejPost() {
    const nyId = String(Date.now());
    setPoster(prev => [...prev, { id: nyId, beskrivelse: "", enhed: "stk", pris: "" }]);
  }

  function sletPost(id: string) {
    setPoster(prev => prev.filter(p => p.id !== id));
  }

  function sendSvar() {
    if (!data) return;
    const payload = JSON.stringify({
      ...data,
      tilbudsposter: poster,
    });
    const token = btoa(encodeURIComponent(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${window.location.origin}/udbud/se#${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkKopieret(true);
      setTimeout(() => setLinkKopieret(false), 3000);
    });
  }

  const subtotal = poster.reduce((sum, p) => sum + prisNum(p.pris), 0);
  const moms = subtotal * 0.25;
  const total = subtotal + moms;
  const fmtKr = (n: number) => n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

  if (fejl) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <p className="text-gray-500 text-sm">Linket er ugyldigt eller udløbet.</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

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
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {erBygherre ? "Modtaget tilbud" : "Anmodning om tilbud"}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Titel */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{data.titel}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{data.resumé}</p>
        </div>

        {/* Bygherre-info (låst) */}
        {(data.bygherreNavn || data.bygherreKontakt) && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bygherrens kontaktoplysninger</p>
            </div>
            {data.bygherreNavn && <p className="text-sm font-medium text-gray-800">{data.bygherreNavn}</p>}
            {data.bygherreKontakt && <p className="text-sm text-gray-600">{data.bygherreKontakt}</p>}
          </div>
        )}

        {/* Vejledning til håndværkeren */}
        {!erBygherre && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Til håndværkeren</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Udfyld prisen pr. opgave i listen nedenfor. Tilføj eller slet poster efter behov. Send dit tilbud tilbage til bygherren med knappen i bunden.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Projektbeskrivelse (låst, sammenfoldet) */}
        <details className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <summary className="px-6 py-4 cursor-pointer flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Projektbeskrivelse</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="6 9 12 15 18 9"/></svg>
          </summary>
          <div className="px-6 pb-5 border-t border-gray-100 pt-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{data.dokument}</pre>
          </div>
        </details>

        {/* Tilbudsliste */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Tilbudsliste</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {erBygherre ? "Priser udfyldt af håndværker" : "Udfyld pris pr. opgave inkl. moms"}
            </p>
          </div>

          <div className="divide-y divide-gray-50">
            {poster.map((post, i) => (
              <div key={post.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-gray-400 mt-2.5 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {erBygherre ? (
                      <p className="text-sm text-gray-800 leading-relaxed">{post.beskrivelse}</p>
                    ) : (
                      <input
                        type="text"
                        value={post.beskrivelse}
                        onChange={(e) => opdaterBeskrivelse(post.id, e.target.value)}
                        className="w-full text-sm text-gray-800 border-0 border-b border-gray-200 focus:outline-none focus:border-primary pb-1 bg-transparent"
                        placeholder="Beskriv opgaven..."
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {erBygherre ? (
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {post.pris ? `${post.pris} kr.` : "Ikke angivet"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={post.pris}
                          onChange={(e) => opdaterPris(post.id, e.target.value)}
                          placeholder="0"
                          className="w-24 text-sm text-right border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-gray-400">kr.</span>
                      </div>
                    )}
                    {!erBygherre && (
                      <button
                        onClick={() => sletPost(post.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center shrink-0"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300 hover:text-red-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!erBygherre && (
            <div className="px-6 py-3 border-t border-gray-50">
              <button
                onClick={tilfoejPost}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tilføj post
              </button>
            </div>
          )}

          {/* Totaler */}
          {subtotal > 0 && (
            <div className="border-t border-gray-100 px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ekskl. moms</span>
                <span>{fmtKr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Moms (25%)</span>
                <span>{fmtKr(moms)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Samlet tilbudssum inkl. moms</span>
                <span className="text-primary">{fmtKr(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Send tilbage / bygherre-info */}
        {erBygherre ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="mx-auto mb-2"><polyline points="20 6 9 17 4 12"/></svg>
            <p className="text-sm font-semibold text-green-800 mb-1">Tilbud modtaget</p>
            <p className="text-xs text-green-700">Kontakt håndværkeren direkte for at gå videre.</p>
          </div>
        ) : (
          <button
            onClick={sendSvar}
            className={`w-full py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
              linkKopieret
                ? "bg-green-600 text-white"
                : "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
            }`}
          >
            {linkKopieret ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Link kopieret, send det til bygherren!</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send tilbud til bygherren</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
