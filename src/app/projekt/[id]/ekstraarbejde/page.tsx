"use client";

import { use, useEffect, useState, useCallback } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import { createClient } from "@/lib/supabase";

interface Ekstraarbejde {
  id: string;
  projekt_id: string;
  oprettet_af: string;
  beskrivelse: string;
  pris_type: "fast" | "overslag";
  pris: number;
  tidspaavirkning_dage: number | null;
  status: "afventer" | "godkendt" | "afvist";
  godkendt_af: string | null;
  godkendt_at: string | null;
  oprettet_at: string;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

export default function EkstraarbejdeSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [userId, setUserId]     = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sedler, setSedler]     = useState<Ekstraarbejde[]>([]);
  const [haandvaerkerEmail, setHaandvaerkerEmail] = useState<string | null>(null);
  const [indlæser, setIndlæser] = useState(true);
  const [vis, setVis]           = useState(false);
  const [gemmer, setGemmer]     = useState(false);

  const [beskrivelse, setBeskrivelse] = useState("");
  const [pris, setPris]               = useState("");
  const [prisType, setPrisType]       = useState<"fast" | "overslag">("fast");
  const [dage, setDage]               = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); setUserEmail(user.email ?? null); }
    });
  }, []);

  const hentData = useCallback(async () => {
    setIndlæser(true);
    const [{ data: k }, { data: e }] = await Promise.all([
      supabase.from("kontrakter").select("haandvaerker_email").eq("projekt_id", id).maybeSingle(),
      supabase.from("ekstraarbejde").select("*").eq("projekt_id", id).order("oprettet_at", { ascending: false }),
    ]);
    setHaandvaerkerEmail(k?.haandvaerker_email ?? null);
    setSedler(e || []);
    setIndlæser(false);
  }, [id]);

  useEffect(() => { hentData(); }, [hentData]);

  const erHaandvaerker = !!(userEmail && haandvaerkerEmail &&
    userEmail.toLowerCase() === haandvaerkerEmail.toLowerCase());

  async function opret() {
    if (!beskrivelse.trim() || !pris || !userId || gemmer) return;
    setGemmer(true);
    const prisInkl = Math.round(parseFloat(pris) * 1.25);
    await supabase.from("ekstraarbejde").insert({
      projekt_id: id,
      oprettet_af: userId,
      beskrivelse: beskrivelse.trim(),
      pris_type: prisType,
      pris: prisInkl,
      tidspaavirkning_dage: dage ? parseInt(dage) : null,
      status: "afventer",
    });
    setBeskrivelse(""); setPris(""); setDage(""); setPrisType("fast");
    setVis(false);
    setGemmer(false);
    hentData();
  }

  async function skiftStatus(sedel_id: string, status: "godkendt" | "afvist") {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from("ekstraarbejde").update({
      status,
      godkendt_af: status === "godkendt" ? userId : null,
      godkendt_at: status === "godkendt" ? now : null,
    }).eq("id", sedel_id);
    setSedler(p => p.map(s => s.id === sedel_id ? { ...s, status, godkendt_af: userId, godkendt_at: now } : s));
  }

  const godkendtTotal = sedler.filter(s => s.status === "godkendt").reduce((sum, s) => sum + s.pris, 0);
  const afventerAntal = sedler.filter(s => s.status === "afventer").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ekstraarbejde</h1>
            <p className="text-sm text-gray-400 mt-1">
              {afventerAntal > 0 ? `${afventerAntal} afventer godkendelse · ` : ""}
              {godkendtTotal > 0 ? `${fmtKr(godkendtTotal)} godkendt` : "Ingen godkendte tillægsaftaler endnu"}
            </p>
          </div>
          <button onClick={() => setVis(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
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
                    placeholder="Beskriv præcist hvad der skal laves som ekstraarbejde..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pristype</label>
                  <div className="flex gap-2">
                    {(["fast", "overslag"] as const).map(t => (
                      <button key={t} onClick={() => setPrisType(t)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${prisType === t ? "border-[#1e3a2a] bg-[#1e3a2a]/5 text-[#1e3a2a]" : "border-gray-100 text-gray-500"}`}>
                        {t === "fast" ? "Fast pris" : "Overslag"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pris ekskl. moms (kr.)</label>
                    <input type="number" value={pris} onChange={e => setPris(e.target.value)} placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                    {pris && <p className="text-xs text-gray-400 mt-1">Inkl. moms: {fmtKr(Math.round(parseFloat(pris) * 1.25))}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tidspåvirkning (dage)</label>
                    <input type="number" value={dage} onChange={e => setDage(e.target.value)} placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setVis(false); setBeskrivelse(""); setPris(""); setDage(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Annuller
                </button>
                <button onClick={opret} disabled={!beskrivelse.trim() || !pris || gemmer}
                  className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                  {gemmer ? "Sender..." : "Send til godkendelse"}
                </button>
              </div>
            </div>
          </div>
        )}

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : sedler.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen aftalesedler endnu</p>
            <p className="text-sm text-gray-400">Alt ekstraarbejde udover den oprindelige kontrakt skal aftales skriftligt her.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {sedler.map((s, i) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">Aftaleseddel #{sedler.length - i}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        s.status === "godkendt" ? "bg-green-100 text-green-700" :
                        s.status === "afvist"   ? "bg-red-100 text-red-700" :
                                                  "bg-amber-100 text-amber-700"
                      }`}>
                        {s.status === "godkendt" ? "Godkendt" : s.status === "afvist" ? "Afvist" : "Afventer"}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{fmtDato(s.oprettet_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{s.beskrivelse}</p>
                    {s.tidspaavirkning_dage && (
                      <p className="text-xs text-gray-400 mt-1">Tidspåvirkning: +{s.tidspaavirkning_dage} dage</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-gray-900">{fmtKr(s.pris)}</p>
                    <p className="text-xs text-gray-400">inkl. moms · {s.pris_type}</p>
                  </div>
                </div>
                {s.status === "afventer" && !erHaandvaerker && (
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
            {godkendtTotal > 0 && (
              <div className="bg-gray-50 rounded-xl px-5 py-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Samlet godkendt ekstraarbejde</span>
                <span className="text-sm font-bold text-[#1e3a2a]">{fmtKr(godkendtTotal)}</span>
              </div>
            )}
          </div>
        )}

        <ABTip type="advarsel" paragraf="AB-Forbruger § 23" titel="Aftale altid ekstraarbejde skriftligt inden opstart"
          resumé="Mundtlige aftaler om ekstraarbejde er svære at bevise. Alle ændringer skal aftales skriftligt og prissættes på forhånd."
          detaljer="Jf. AB-Forbruger § 23 skal ekstraarbejde aftales skriftligt inden opstart. Brug denne side til alle tillægsaftaler, så du altid har dokumentation." />
      </div>
    </div>
  );
}
