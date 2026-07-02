"use client";

import { use, useEffect, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

interface Ekstraarbejde {
  id: string;
  beskrivelse: string;
  pris: number;
  tidspaavirkning: string;
  status: "afventer" | "godkendt" | "afvist";
  dato: string;
  oprettetAf: "bygherre" | "haandvaerker";
}

const fmtKr = (n: number) => n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

export default function Ekstraarbejde({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sedler, setSedler] = useState<Ekstraarbejde[]>([]);
  const [vis, setVis] = useState(false);
  const [beskrivelse, setBeskrivelse] = useState("");
  const [pris, setPris] = useState("");
  const [tid, setTid] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_ekstraarbejde");
      if (raw) setSedler(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function gem(liste: Ekstraarbejde[]) {
    setSedler(liste);
    localStorage.setItem("contractr_ekstraarbejde", JSON.stringify(liste));
  }

  function opret() {
    if (!beskrivelse.trim() || !pris) return;
    const ny: Ekstraarbejde = {
      id: String(Date.now()),
      beskrivelse,
      pris: parseFloat(pris) * 1.25,
      tidspaavirkning: tid,
      status: "afventer",
      dato: new Date().toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" }),
      oprettetAf: "bygherre",
    };
    gem([ny, ...sedler]);
    setBeskrivelse(""); setPris(""); setTid("");
    setVis(false);
  }

  function skiftStatus(sedel_id: string, status: Ekstraarbejde["status"]) {
    gem(sedler.map(s => s.id === sedel_id ? { ...s, status } : s));
  }

  const godkendt = sedler.filter(s => s.status === "godkendt").reduce((sum, s) => sum + s.pris, 0);
  const afventer = sedler.filter(s => s.status === "afventer").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ekstraarbejde</h1>
            <p className="text-sm text-gray-400 mt-1">
              {afventer > 0 ? `${afventer} afventer godkendelse · ` : ""}
              {godkendt > 0 ? `${fmtKr(godkendt)} godkendt ekstraarbejde` : "Ingen godkendte tillaegsaftaler endnu"}
            </p>
          </div>
          <button
            onClick={() => setVis(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ny aftaleseddel
          </button>
        </div>

        {vis && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="font-bold text-gray-900 mb-1">Ny aftaleseddel for ekstraarbejde</h2>
              <p className="text-xs text-gray-400 mb-5">Ekstraarbejde skal aftales skriftligt inden opstart jf. AB-Forbruger § 23</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse af arbejdet</label>
                  <textarea rows={3} value={beskrivelse} onChange={e => setBeskrivelse(e.target.value)}
                    placeholder="Beskriv praecist hvad der skal laves som ekstraarbejde..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pris ekskl. moms (kr.)</label>
                    <input type="number" value={pris} onChange={e => setPris(e.target.value)} placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    {pris && <p className="text-xs text-gray-400 mt-1">Inkl. moms: {fmtKr(parseFloat(pris) * 1.25)}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tidspaavirkning</label>
                    <input type="text" value={tid} onChange={e => setTid(e.target.value)} placeholder="F.eks. +3 dage"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setVis(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Annuller
                </button>
                <button onClick={opret} disabled={!beskrivelse.trim() || !pris}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all">
                  Send til haandvaerker
                </button>
              </div>
            </div>
          </div>
        )}

        {sedler.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen aftalesedler endnu</p>
            <p className="text-sm text-gray-400">Alt ekstraarbejde udover den oprindelige kontrakt skal aftales skriftligt her.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {sedler.map((s, i) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">Aftaleseddel #{sedler.length - i}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        s.status === "godkendt" ? "bg-green-100 text-green-700" :
                        s.status === "afvist" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>{s.status === "godkendt" ? "Godkendt" : s.status === "afvist" ? "Afvist" : "Afventer"}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{s.beskrivelse}</p>
                    {s.tidspaavirkning && <p className="text-xs text-gray-400 mt-1">Tidspaavirkning: {s.tidspaavirkning}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">{fmtKr(s.pris)}</p>
                    <p className="text-xs text-gray-400">inkl. moms</p>
                  </div>
                </div>
                {s.status === "afventer" && (
                  <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button onClick={() => skiftStatus(s.id, "godkendt")}
                      className="flex-1 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      Godkend
                    </button>
                    <button onClick={() => skiftStatus(s.id, "afvist")}
                      className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      Afvis
                    </button>
                  </div>
                )}
              </div>
            ))}
            {godkendt > 0 && (
              <div className="bg-gray-50 rounded-xl px-5 py-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Samlet godkendt ekstraarbejde</span>
                <span className="text-sm font-bold text-primary">{fmtKr(godkendt)}</span>
              </div>
            )}
          </div>
        )}

        <ABTip type="advarsel" paragraf="AB-Forbruger § 23" titel="Aftale altid ekstraarbejde skriftligt inden opstart" resumé="Mundtlige aftaler om ekstraarbejde er svaere at bevise. Alle aendringer skal aftales skriftligt og prissaettes paa forhaand." detaljer="Jf. AB-Forbruger § 23 skal ekstraarbejde aftales skriftligt inden opstart. Brug denne side til alle tillaegsaftaler saa du altid har dokumentation." />
      </div>
    </div>
  );
}
