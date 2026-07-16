"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TilbudsPost {
  id: string;
  beskrivelse: string;
  enhed: string;
  pris: string;
  erNy?: boolean;
}

interface UdbudData {
  titel: string;
  resumé: string;
  dokument: string;
  dokument_original?: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
  tilbudsposter?: TilbudsPost[];
  tilbudsposter_original?: TilbudsPost[];
  billeder?: { navn: string; data: string }[];
}

function prisNum(p: string): number {
  const n = parseFloat(p.replace(/[^0-9,.]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

type DiffLine = { type: "same" | "added" | "removed"; text: string };

function diffLines(original: string, revised: string): DiffLine[] {
  const origLines = original.split("\n");
  const revLines = revised.split("\n");

  // Build LCS table
  const m = origLines.length;
  const n = revLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (origLines[i] === revLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && origLines[i] === revLines[j]) {
      result.push({ type: "same", text: origLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added", text: revLines[j] });
      j++;
    } else {
      result.push({ type: "removed", text: origLines[i] });
      i++;
    }
  }
  return result;
}

export default function UdbudDel() {
  const router = useRouter();
  const [data, setData] = useState<UdbudData | null>(null);
  const [poster, setPoster] = useState<TilbudsPost[]>([]);
  const [dokument, setDokument] = useState("");
  const [fejl, setFejl] = useState(false);
  const [linkKopieret, setLinkKopieret] = useState(false);
  const [erBygherre, setErBygherre] = useState(false);
  const [visDiff, setVisDiff] = useState(true);
  const [accepteret, setAcepteret] = useState(false);
  const [haandvaerkerNavn, sethaandvaerkerNavn] = useState("");
  const [haandvaerkerFirma, sethaandvaerkerFirma] = useState("");
  const [visNavnForm, setVisNavnForm] = useState(false);

  function accepterTilbud(d: UdbudData, p: TilbudsPost[]) {
    // Beregn total eksplicit fra de aktuelle poster
    const beregnetTotal = p.reduce((s, post) => s + (parseFloat(post.pris) || 0), 0) * 1.25;
    const projekt = {
      id: "1",
      titel: d.titel,
      resumé: d.resumé,
      // Gem den reviderede dokumenttekst (håndværkerens version)
      dokument: d.dokument,
      dokument_original: d.dokument_original ?? d.dokument,
      bygherreNavn: d.bygherreNavn,
      bygherreKontakt: d.bygherreKontakt,
      // Gem håndværkerens oplysninger til kontrakt
      haandvaerkerNavn: (d as UdbudData & { haandvaerkerNavn?: string }).haandvaerkerNavn ?? "",
      haandvaerkerFirma: (d as UdbudData & { haandvaerkerFirma?: string }).haandvaerkerFirma ?? "",
      tilbudsposter: p,
      tilbudsposter_original: d.tilbudsposter_original ?? p,
      billeder: d.billeder || [],
      accepteretDato: new Date().toISOString(),
      total: beregnetTotal,
    };
    localStorage.setItem("contractr_projekt", JSON.stringify(projekt));
    setAcepteret(true);
    setTimeout(() => router.push("/projekt/1"), 1800);
  }

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) { setFejl(true); return; }
      const json = decodeURIComponent(atob(hash.replace(/-/g, "+").replace(/_/g, "/")));
      const parsed = JSON.parse(json);
      setData(parsed);
      setDokument(parsed.dokument || "");
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
    if (!haandvaerkerNavn) { setVisNavnForm(true); return; }
    afsendTilbud();
  }

  function afsendTilbud() {
    if (!data) return;
    const payload = JSON.stringify({
      ...data,
      dokument,
      dokument_original: data.dokument_original ?? data.dokument,
      tilbudsposter: poster,
      tilbudsposter_original: data.tilbudsposter_original ?? data.tilbudsposter,
      haandvaerkerNavn,
      haandvaerkerFirma,
    });
    const token = btoa(encodeURIComponent(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${window.location.origin}/udbud/se#${token}`;

    // Gem sagen i Håndværkerens lokale portal
    const sag = {
      id: String(Date.now()),
      titel: data.titel,
      resumé: data.resumé,
      bygherreNavn: data.bygherreNavn,
      bygherreKontakt: data.bygherreKontakt,
      total: poster.reduce((s, p) => s + (parseFloat(p.pris) || 0), 0) * 1.25,
      tilbudsposter: poster,
      sendtDato: new Date().toISOString(),
      status: "afventer",
      tilbudsLink: url,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("contractr_haandvaerker_sager") || "[]");
      localStorage.setItem("contractr_haandvaerker_sager", JSON.stringify([sag, ...existing]));
      localStorage.setItem("contractr_haandvaerker_navn", haandvaerkerNavn);
      localStorage.setItem("contractr_haandvaerker_firma", haandvaerkerFirma);
    } catch { /* ignore */ }

    navigator.clipboard.writeText(url).then(() => {
      setLinkKopieret(true);
      setVisNavnForm(false);
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
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${erBygherre ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {erBygherre ? "Tilbud modtaget" : "Anmodning om tilbud"}
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

        {/* Billeder fra bygherre */}
        {data.billeder && data.billeder.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Billeder af eksisterende forhold</p>
            <div className="flex flex-wrap gap-3">
              {data.billeder.map((b, i) => (
                <a key={i} href={b.data} target="_blank" rel="noopener noreferrer">
                  <img src={b.data} alt={b.navn} className="w-24 h-24 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in" />
                </a>
              ))}
            </div>
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

        {/* Projektbeskrivelse */}
        <details className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6" open={!erBygherre}>
          <summary className="px-6 py-4 cursor-pointer flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Projektbeskrivelse</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="6 9 12 15 18 9"/></svg>
          </summary>
          <div className="border-t border-gray-100">
            {erBygherre && data.dokument_original && data.dokument_original !== data.dokument ? (
              /* Diff-visning for bygherre */
              <div>
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-300" />Tilføjet af håndværker</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />Fjernet af håndværker</span>
                  </div>
                  <button
                    onClick={() => setVisDiff(v => !v)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    {visDiff ? "Vis fuld tekst" : "Vis ændringer"}
                  </button>
                </div>
                {visDiff ? (
                  <div className="px-6 pb-5 text-sm leading-relaxed font-sans">
                    {diffLines(data.dokument_original, data.dokument).map((line, i) => (
                      line.type === "same" ? (
                        <div key={i} className="text-gray-700 whitespace-pre-wrap">{line.text || " "}</div>
                      ) : line.type === "added" ? (
                        <div key={i} className="bg-green-50 text-green-800 whitespace-pre-wrap rounded px-1 my-0.5">{line.text || " "}</div>
                      ) : (
                        <div key={i} className="bg-red-50 text-red-700 line-through whitespace-pre-wrap rounded px-1 my-0.5 opacity-70">{line.text || " "}</div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="px-6 pb-5">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{data.dokument}</pre>
                  </div>
                )}
              </div>
            ) : erBygherre ? (
              /* Bygherre, ingen ændringer */
              <div className="px-6 py-5">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{data.dokument}</pre>
              </div>
            ) : (
              /* Contractor kan redigere */
              <div className="px-6 py-5">
                <p className="text-xs text-gray-400 mb-2">Du kan tilføje forbehold, rettelser eller præciseringer direkte i teksten.</p>
                <textarea
                  value={dokument}
                  onChange={(e) => setDokument(e.target.value)}
                  rows={Math.max(15, dokument.split("\n").length + 2)}
                  className="w-full text-sm text-gray-700 leading-relaxed font-sans resize-none focus:outline-none border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            )}
          </div>
        </details>

        {/* Tilbudsliste */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Tilbudsliste</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {erBygherre ? "Priser ekskl. moms, total inkl. moms" : "Udfyld pris pr. opgave ekskl. moms"}
            </p>
          </div>

          <div className="divide-y divide-gray-50">
            {poster.map((post, i) => {
              const erNyPost = erBygherre && data?.tilbudsposter_original
                ? !data.tilbudsposter_original.some(o => o.id === post.id)
                : false;
              return (
              <div key={post.id} className={`px-6 py-4 ${erNyPost ? "bg-green-50" : ""}`}>
                {erNyPost && (
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1 block">Tilfojet af handvaerker</span>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-gray-400 mt-2.5 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {erBygherre ? (
                      <p className="text-sm text-gray-800 leading-relaxed break-words">{post.beskrivelse}</p>
                    ) : (
                      <textarea
                        value={post.beskrivelse}
                        onChange={(e) => opdaterBeskrivelse(post.id, e.target.value)}
                        rows={Math.max(1, Math.ceil(post.beskrivelse.length / 50))}
                        className="w-full text-sm text-gray-800 border-0 border-b border-gray-200 focus:outline-none focus:border-primary pb-1 bg-transparent resize-none leading-relaxed"
                        placeholder="Beskriv opgaven..."
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {erBygherre ? (
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {post.pris ? fmtKr(prisNum(post.pris) * 1.25) : "Ikke angivet"}
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
            );
            })}
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
              {erBygherre ? (
                <div className="flex justify-between text-base font-bold text-gray-900">
                  <span>Samlet pris inkl. moms</span>
                  <span className="text-primary">{fmtKr(total)}</span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Navn-modal for Håndværker */}
        {visNavnForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h2 className="font-bold text-gray-900 mb-1">Hvem sender tilbuddet?</h2>
              <p className="text-xs text-gray-400 mb-5">Dit navn vises for bygherren og gemmes i din portal</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dit navn</label>
                  <input type="text" value={haandvaerkerNavn} onChange={e => sethaandvaerkerNavn(e.target.value)}
                    placeholder="F.eks. Thomas Madsen"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Firma (valgfrit)</label>
                  <input type="text" value={haandvaerkerFirma} onChange={e => sethaandvaerkerFirma(e.target.value)}
                    placeholder="F.eks. TM Byg ApS"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setVisNavnForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">Annuller</button>
                <button onClick={afsendTilbud} disabled={!haandvaerkerNavn.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all">
                  Send tilbud
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accepter tilbud / send svar */}
        {erBygherre ? (
          accepteret ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-base font-bold text-green-800 mb-1">Tilbud accepteret</p>
              <p className="text-sm text-green-700 mb-2">
                Din accept er registreret. Du sendes videre til dit projekt...
              </p>
              <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pris-resumé så bygherre kan verificere inden accept */}
              {total > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Du er ved at acceptere</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Samlet pris inkl. moms</span>
                    <span className="text-xl font-bold text-gray-900">{fmtKr(total)}</span>
                  </div>
                  <div className="space-y-1">
                    {poster.map((p, i) => p.pris ? (
                      <div key={p.id} className="flex justify-between text-xs text-gray-400">
                        <span className="truncate pr-4">{i + 1}. {p.beskrivelse || "Post"}</span>
                        <span className="flex-shrink-0">{fmtKr(prisNum(p.pris) * 1.25)}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Inden du accepterer</p>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      <li>Er prisen fast eller et overslag?</li>
                      <li>Er start- og slutdato aftalt skriftligt?</li>
                      <li>Er betalingsplan koblet til fremdrift?</li>
                      <li>Er ekstraarbejde-procedure beskrevet?</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={() => accepterTilbud(data!, poster)}
                className="w-full py-4 rounded-xl text-base font-bold bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Jeg accepterer tilbuddet
              </button>
              <p className="text-center text-xs text-gray-400">
                Accepten er vejledende. Send en skriftlig bekræftelse direkte til håndværkeren.
              </p>
            </div>
          )
        ) : linkKopieret ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-sm font-bold text-green-800 mb-1">Tilbud sendt!</p>
              <p className="text-xs text-green-700">Linket er kopieret. Send det til bygherren via SMS, mail eller anden besked.</p>
            </div>
            <button
              onClick={() => router.push("/haandvaerker/sager")}
              className="w-full py-4 rounded-xl text-base font-bold bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Gå til min portal
            </button>
          </div>
        ) : (
          <button
            onClick={sendSvar}
            className="w-full py-4 rounded-xl text-base font-bold bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send tilbud til bygherren
          </button>
        )}
      </div>
    </div>
  );
}

