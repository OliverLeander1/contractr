"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  id: string;
  beskrivelse: string;
  pris: string;
}

type Trin = "kunde" | "poster" | "sendt";

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

export default function NytTilbud() {
  const [trin, setTrin] = useState<Trin>("kunde");
  const [navn, setNavn] = useState("");
  const [firma, setFirma] = useState("");

  // Kunde-info
  const [kundeNavn, setKundeNavn] = useState("");
  const [kundeEmail, setKundeEmail] = useState("");
  const [projektTitel, setProjektTitel] = useState("");
  const [projektBeskrivelse, setProjektBeskrivelse] = useState("");

  // Tilbudsposter
  const [poster, setPoster] = useState<Post[]>([
    { id: "1", beskrivelse: "", pris: "" },
  ]);

  const [generetLink, setGeneretLink] = useState("");
  const [kopieret, setKopieret] = useState(false);

  useEffect(() => {
    try {
      setNavn(localStorage.getItem("contractr_haandvaerker_navn") || "");
      setFirma(localStorage.getItem("contractr_haandvaerker_firma") || "");
    } catch { /* ignore */ }
  }, []);

  function tilfoejPost() {
    setPoster(prev => [...prev, { id: String(Date.now()), beskrivelse: "", pris: "" }]);
  }

  function opdaterPost(id: string, felt: "beskrivelse" | "pris", val: string) {
    setPoster(prev => prev.map(p => p.id === id ? { ...p, [felt]: val } : p));
  }

  function sletPost(id: string) {
    if (poster.length === 1) return;
    setPoster(prev => prev.filter(p => p.id !== id));
  }

  const subtotal = poster.reduce((s, p) => s + (parseFloat(p.pris) || 0), 0);
  const total = subtotal * 1.25;

  const kanGaaTilPoster =
    kundeNavn.trim() && kundeEmail.trim() && projektTitel.trim();

  const kanSende =
    poster.some(p => p.beskrivelse.trim() && p.pris.trim());

  function genererOgSend() {
    const udbudData = {
      titel: projektTitel,
      resumé: projektBeskrivelse || `Tilbud fra ${navn || firma || "håndværker"} til ${kundeNavn}`,
      dokument: projektBeskrivelse,
      bygherreNavn: kundeNavn,
      bygherreKontakt: kundeEmail,
      tilbudsposter: poster,
      haandvaerkerNavn: navn,
      haandvaerkerFirma: firma,
    };

    const payload = JSON.stringify(udbudData);
    const token = btoa(encodeURIComponent(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const url = `${window.location.origin}/udbud/se#${token}`;

    // Gem sagen i håndværkerens portal
    const sag = {
      id: String(Date.now()),
      titel: projektTitel,
      resumé: projektBeskrivelse,
      bygherreNavn: kundeNavn,
      bygherreKontakt: kundeEmail,
      total,
      tilbudsposter: poster,
      sendtDato: new Date().toISOString(),
      status: "afventer",
      tilbudsLink: url,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("contractr_haandvaerker_sager") || "[]");
      localStorage.setItem("contractr_haandvaerker_sager", JSON.stringify([sag, ...existing]));
    } catch { /* ignore */ }

    setGeneretLink(url);
    setTrin("sendt");
  }

  function kopier() {
    navigator.clipboard.writeText(generetLink).then(() => {
      setKopieret(true);
      setTimeout(() => setKopieret(false), 3000);
    });
  }

  function mailLink() {
    const emne = encodeURIComponent(`Tilbud: ${projektTitel}`);
    const besked = encodeURIComponent(
      `Hej ${kundeNavn},\n\nHer er mit tilbud på ${projektTitel}.\n\nDu kan se tilbuddet og acceptere det her:\n${generetLink}\n\nMed venlig hilsen\n${navn}${firma ? `\n${firma}` : ""}`
    );
    window.open(`mailto:${kundeEmail}?subject=${emne}&body=${besked}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
            </Link>
            <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded ml-1">Håndværker</span>
          </div>
          <Link href="/haandvaerker/sager" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Mine sager
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Trin-indikator */}
        {trin !== "sendt" && (
          <div className="flex items-center gap-3 mb-8">
            {(["kunde", "poster"] as ("kunde" | "poster")[]).map((t, i) => (
              <div key={t} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 text-sm font-semibold ${trin === t ? "text-gray-900" : (t === "kunde" && trin === "poster") ? "text-[#1a5c38]" : "text-gray-400"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${trin === t ? "bg-[#1a5c38] text-white" : (t === "kunde" && trin === "poster") ? "bg-[#1a5c38]/20 text-[#1a5c38]" : "bg-gray-100 text-gray-400"}`}>
                    {t === "kunde" && trin === "poster" ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : i + 1}
                  </div>
                  {t === "kunde" ? "Kundeoplysninger" : "Tilbudsposter"}
                </div>
                {i === 0 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        )}

        {/* TRIN 1 — Kunde og projekt */}
        {trin === "kunde" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Nyt tilbud</h1>
              <p className="text-sm text-gray-500">Udfyld kundens oplysninger og beskriv opgaven. Bygherren modtager et link til at se og acceptere tilbuddet.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Kundeoplysninger</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kundens navn <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={kundeNavn}
                  onChange={e => setKundeNavn(e.target.value)}
                  placeholder="F.eks. Camilla Jensen"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kundens e-mail <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={kundeEmail}
                  onChange={e => setKundeEmail(e.target.value)}
                  placeholder="kunde@email.dk"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Projektet</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Projekttitel <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={projektTitel}
                  onChange={e => setProjektTitel(e.target.value)}
                  placeholder="F.eks. Renovering af badeværelse, Valby"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Projektbeskrivelse (valgfrit)</label>
                <textarea
                  value={projektBeskrivelse}
                  onChange={e => setProjektBeskrivelse(e.target.value)}
                  placeholder="Beskriv kort hvad tilbuddet dækker, eventuelle forbehold, materialevalg m.m."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={() => kanGaaTilPoster && setTrin("poster")}
              className={`w-full py-4 rounded-xl text-base font-bold transition-all ${kanGaaTilPoster ? "bg-[#1a5c38] text-white hover:opacity-90 shadow-md shadow-[#1a5c38]/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              Næste: tilbudsposter →
            </button>
          </div>
        )}

        {/* TRIN 2 — Tilbudsposter */}
        {trin === "poster" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Tilbudsposter</h1>
              <p className="text-sm text-gray-500">Tilbud til <strong>{kundeNavn}</strong> for <strong>{projektTitel}</strong>. Priser angives ekskl. moms.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Poster</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Priser ekskl. moms. Moms tilføjes automatisk (25%)</p>
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {poster.map((post, i) => (
                  <div key={post.id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 mt-3 w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={post.beskrivelse}
                          onChange={e => opdaterPost(post.id, "beskrivelse", e.target.value)}
                          placeholder="Beskriv opgaven..."
                          className="w-full text-sm border-0 border-b border-gray-200 focus:outline-none focus:border-[#1a5c38] pb-1 bg-transparent transition-colors"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={post.pris}
                            onChange={e => opdaterPost(post.id, "pris", e.target.value)}
                            placeholder="0"
                            className="w-28 text-sm text-right border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1a5c38] transition-colors"
                          />
                          <span className="text-xs text-gray-400">kr. ekskl. moms</span>
                          {post.pris && parseFloat(post.pris) > 0 && (
                            <span className="text-xs text-gray-400 ml-auto">
                              = {fmtKr(parseFloat(post.pris) * 1.25)} inkl. moms
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => sletPost(post.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300 hover:text-red-400 transition-colors">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 border-t border-gray-50">
                <button
                  onClick={tilfoejPost}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1a5c38] hover:opacity-70 transition-opacity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Tilføj post
                </button>
              </div>

              {subtotal > 0 && (
                <div className="border-t border-gray-100 px-6 py-4 space-y-1.5 bg-gray-50">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal ekskl. moms</span>
                    <span>{fmtKr(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Moms (25%)</span>
                    <span>{fmtKr(subtotal * 0.25)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Samlet tilbudssum inkl. moms</span>
                    <span className="text-[#1a5c38]">{fmtKr(total)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#1a5c38]/5 border border-[#1a5c38]/10 rounded-2xl p-4 flex items-start gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-xs text-[#1a5c38] leading-relaxed">
                Bygherren modtager et link til at se tilbuddet og acceptere det. Accepten registreres automatisk i din portal.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTrin("kunde")}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ← Tilbage
              </button>
              <button
                onClick={() => kanSende && genererOgSend()}
                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${kanSende ? "bg-[#1a5c38] text-white hover:opacity-90 shadow-md shadow-[#1a5c38]/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                Generer tilbudslink →
              </button>
            </div>
          </div>
        )}

        {/* SENDT */}
        {trin === "sendt" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Tilbud klar til afsendelse</h1>
              <p className="text-sm text-gray-500 mb-1 leading-relaxed">
                Send linket til <strong>{kundeNavn}</strong> via e-mail, SMS eller anden besked. Bygherren kan se og acceptere tilbuddet direkte.
              </p>
              {total > 0 && (
                <p className="text-sm font-bold text-[#1a5c38] mt-2">Tilbudssum: {fmtKr(total)} inkl. moms</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tilbudslink</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-4">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <p className="text-xs text-gray-400 truncate flex-1">{generetLink}</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={mailLink}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a5c38] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Åbn i e-mailprogram til {kundeEmail}
                </button>
                <button
                  onClick={kopier}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all border ${kopieret ? "bg-green-50 border-green-200 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {kopieret ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Kopieret!</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopiér link</>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hvad sker der nu?</p>
              <div className="space-y-3">
                {[
                  { n: "1", t: "Du sender linket til bygherren via e-mail eller SMS" },
                  { n: "2", t: "Bygherren åbner tilbuddet og ser alle poster og priser" },
                  { n: "3", t: `Bygherren accepterer. Sagen opdateres automatisk i din portal` },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1a5c38]/10 text-[#1a5c38] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPoster([{ id: "1", beskrivelse: "", pris: "" }]);
                  setKundeNavn(""); setKundeEmail(""); setProjektTitel(""); setProjektBeskrivelse("");
                  setGeneretLink(""); setTrin("kunde");
                }}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Opret nyt tilbud
              </button>
              <Link
                href="/haandvaerker/sager"
                className="flex-1 py-3.5 rounded-xl bg-[#1a5c38] text-white text-sm font-bold hover:opacity-90 transition-opacity text-center"
              >
                Gå til mine sager →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
