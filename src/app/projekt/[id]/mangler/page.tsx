"use client";

import { use, useEffect, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

interface Mangel {
  id: string;
  beskrivelse: string;
  alvorlighed: "lav" | "middel" | "hoj";
  status: "aaben" | "under-behandling" | "lukket";
  billede?: string;
  dato: string;
}

export default function Mangler({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mangler, setMangler] = useState<Mangel[]>([]);
  const [vis, setVis] = useState(false);
  const [beskrivelse, setBeskrivelse] = useState("");
  const [alvorlighed, setAlvorlighed] = useState<"lav" | "middel" | "hoj">("middel");
  const [billede, setBillede] = useState<string | undefined>();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_mangler");
      if (raw) setMangler(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function gem(liste: Mangel[]) {
    setMangler(liste);
    localStorage.setItem("contractr_mangler", JSON.stringify(liste));
  }

  function tilfoej() {
    if (!beskrivelse.trim()) return;
    const ny: Mangel = {
      id: String(Date.now()),
      beskrivelse,
      alvorlighed,
      status: "aaben",
      billede,
      dato: new Date().toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" }),
    };
    gem([ny, ...mangler]);
    setBeskrivelse("");
    setAlvorlighed("middel");
    setBillede(undefined);
    setVis(false);
  }

  function skiftStatus(mangel_id: string, status: Mangel["status"]) {
    gem(mangler.map(m => m.id === mangel_id ? { ...m, status } : m));
  }

  const aabne = mangler.filter(m => m.status === "aaben").length;
  const underBehandling = mangler.filter(m => m.status === "under-behandling").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mangler</h1>
            <p className="text-sm text-gray-400 mt-1">{aabne} aabne · {underBehandling} under behandling</p>
          </div>
          <button
            onClick={() => setVis(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrer mangel
          </button>
        </div>

        {vis && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="font-bold text-gray-900 mb-5">Ny mangel</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse</label>
                  <textarea
                    rows={3}
                    value={beskrivelse}
                    onChange={e => setBeskrivelse(e.target.value)}
                    placeholder="Beskriv manglen praecist — hvad, hvor og hvornaar det blev opdaget..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Alvorlighed</label>
                  <div className="flex gap-2">
                    {[
                      { id: "lav", label: "Lav", sel: "border-green-300 bg-green-50 text-green-700", def: "border-gray-100 text-gray-500" },
                      { id: "middel", label: "Middel", sel: "border-amber-300 bg-amber-50 text-amber-700", def: "border-gray-100 text-gray-500" },
                      { id: "hoj", label: "Hoj", sel: "border-red-300 bg-red-50 text-red-700", def: "border-gray-100 text-gray-500" },
                    ].map(a => (
                      <button key={a.id} onClick={() => setAlvorlighed(a.id as Mangel["alvorlighed"])}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${alvorlighed === a.id ? a.sel : a.def}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Billede (valgfrit)</label>
                  <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary transition-colors">
                    {billede ? (
                      <img src={billede} alt="Mangel" className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">{billede ? "Skift billede" : "Upload billede af manglen"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const fil = e.target.files?.[0];
                      if (!fil) return;
                      const reader = new FileReader();
                      reader.onload = () => setBillede(reader.result as string);
                      reader.readAsDataURL(fil);
                    }} />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setVis(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Annuller
                </button>
                <button onClick={tilfoej} disabled={!beskrivelse.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all">
                  Gem mangel
                </button>
              </div>
            </div>
          </div>
        )}

        {mangler.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen registrerede mangler</p>
            <p className="text-sm text-gray-400">Brug knappen ovenfor til at registrere mangler naar du opdager dem.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {mangler.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  {m.billede && <img src={m.billede} alt="Mangel" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        m.alvorlighed === "hoj" ? "bg-red-100 text-red-700" :
                        m.alvorlighed === "middel" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      }`}>{m.alvorlighed === "hoj" ? "Hoj" : m.alvorlighed === "middel" ? "Middel" : "Lav"}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        m.status === "lukket" ? "bg-gray-100 text-gray-500" :
                        m.status === "under-behandling" ? "bg-blue-100 text-blue-700" : "bg-red-50 text-red-600"
                      }`}>{m.status === "lukket" ? "Lukket" : m.status === "under-behandling" ? "Under behandling" : "Aaben"}</span>
                      <span className="text-xs text-gray-400 ml-auto">{m.dato}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{m.beskrivelse}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  {m.status === "aaben" && (
                    <button onClick={() => skiftStatus(m.id, "under-behandling")} className="text-xs font-semibold text-blue-600 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      Marker under behandling
                    </button>
                  )}
                  {m.status !== "lukket" && (
                    <button onClick={() => skiftStatus(m.id, "lukket")} className="text-xs font-semibold text-green-600 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      Marker som lukket
                    </button>
                  )}
                  {m.status === "lukket" && (
                    <button onClick={() => skiftStatus(m.id, "aaben")} className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      Genaaben
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ABTip type="info" paragraf="AB-Forbruger § 25" titel="Din ret til at tilbageholde betaling" resumé="Ved dokumenterede mangler kan du tilbageholde et beloeb svarende til manglernes udbedring. Tag altid billeder og dato-noter som dokumentation." detaljer="Jf. AB-Forbruger § 43 har entreprenøren pligt og ret til at afhjælpe mangler inden rimelig tid. Du har 5 ars reklamationsret fra afleveringsdatoen." />
      </div>
    </div>
  );
}
