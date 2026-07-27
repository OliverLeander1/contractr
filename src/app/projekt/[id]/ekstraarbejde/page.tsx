"use client";

import { use, useEffect, useState, useCallback } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import { createClient } from "@/lib/supabase";

interface Sedel {
  id: string;
  projekt_id: string;
  oprettet_af: string;
  oprettet_af_navn: string | null;
  beskrivelse: string;
  status: "sendt" | "haandvaerker_udfyldt" | "godkendt" | "afvist";
  haandvaerker_pris: number | null;
  haandvaerker_pris_type: "fast" | "overslag" | null;
  haandvaerker_tidsdage: number | null;
  haandvaerker_besked: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_udfyldt_at: string | null;
  bygherre_godkendt_navn: string | null;
  bygherre_godkendt_at: string | null;
  oprettet_at: string;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

const fmtTid = (iso: string) =>
  new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });

export default function EkstraarbejdeSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [userId, setUserId]       = useState<string | null>(null);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sedler, setSedler]       = useState<Sedel[]>([]);
  const [haandvaerkerEmail, setHaandvaerkerEmail] = useState<string | null>(null);
  const [indlæser, setIndlæser]   = useState(true);
  const [visOpret, setVisOpret]   = useState(false);
  const [gemmer, setGemmer]       = useState(false);
  const [godkender, setGodkender] = useState<string | null>(null);

  // Opret-formular
  const [beskrivelse, setBeskrivelse] = useState("");

  // Godkend-modal
  const [godkendSedel, setGodkendSedel] = useState<Sedel | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? null);
      const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
      setBrugerNavn(profil?.navn || user.email?.split("@")[0] || "Bygherre");
    });
  }, []);

  const hentData = useCallback(async () => {
    setIndlæser(true);
    const [{ data: k }, { data: e }] = await Promise.all([
      supabase.from("kontrakter").select("haandvaerker_email").eq("projekt_id", id).maybeSingle(),
      supabase.from("ekstraarbejde").select("*").eq("projekt_id", id).order("oprettet_at", { ascending: false }),
    ]);
    setHaandvaerkerEmail(k?.haandvaerker_email ?? null);
    setSedler((e || []) as Sedel[]);
    setIndlæser(false);
  }, [id]);

  useEffect(() => { hentData(); }, [hentData]);

  const erHaandvaerker = !!(userEmail && haandvaerkerEmail &&
    userEmail.toLowerCase() === haandvaerkerEmail.toLowerCase());

  async function opretSedel() {
    if (!beskrivelse.trim() || !userId || gemmer) return;
    setGemmer(true);
    await supabase.from("ekstraarbejde").insert({
      projekt_id: id,
      oprettet_af: userId,
      oprettet_af_navn: brugerNavn,
      beskrivelse: beskrivelse.trim(),
      status: "sendt",
      pris_type: "fast",
      pris: 0,
    });
    // Notifikation til håndværker
    if (haandvaerkerEmail) {
      await supabase.from("notifikationer").insert({
        bruger_id: userId,
        projekt_id: id,
        type: "ekstraarbejde_anmodning",
        titel: "Ny aftaleseddel til udfyldelse",
        besked: `Bygherre har sendt en anmodning om ekstraarbejde: "${beskrivelse.trim().slice(0, 80)}..."`,
        ab_paragraf: "§ 23",
      });
    }
    setBeskrivelse("");
    setVisOpret(false);
    setGemmer(false);
    hentData();
  }

  async function godkendSedlen(sedel: Sedel) {
    if (!userId || godkender) return;
    setGodkender(sedel.id);
    const now = new Date().toISOString();
    await supabase.from("ekstraarbejde").update({
      status: "godkendt",
      godkendt_af: userId,
      godkendt_at: now,
      bygherre_godkendt_navn: brugerNavn,
      bygherre_godkendt_at: now,
    }).eq("id", sedel.id);
    setGodkendSedel(null);
    setGodkender(null);
    hentData();
  }

  async function afvisSedel(sedelId: string) {
    if (!userId) return;
    await supabase.from("ekstraarbejde").update({ status: "afvist" }).eq("id", sedelId);
    setSedler(p => p.map(s => s.id === sedelId ? { ...s, status: "afvist" } : s));
  }

  const godkendtTotal = sedler.filter(s => s.status === "godkendt").reduce((sum, s) => sum + (s.haandvaerker_pris || 0), 0);
  const afventerAntal = sedler.filter(s => s.status === "haandvaerker_udfyldt").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ekstraarbejde</h1>
            <p className="text-sm text-gray-400 mt-1">
              {afventerAntal > 0 ? `${afventerAntal} afventer din godkendelse · ` : ""}
              {godkendtTotal > 0 ? `${fmtKr(godkendtTotal)} godkendt i alt` : "Ingen godkendte tillægsaftaler endnu"}
            </p>
          </div>
          {!erHaandvaerker && (
            <button onClick={() => setVisOpret(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ny aftaleseddel
            </button>
          )}
        </div>

        {/* Opret modal */}
        {visOpret && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="font-bold text-gray-900 mb-1">Ny aftaleseddel</h2>
              <p className="text-xs text-gray-400 mb-5">
                Beskriv arbejdet. Entreprenøren udfylder herefter pris og tidspåvirkning, og du godkender.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse af ekstraarbejdet</label>
                <textarea rows={4} value={beskrivelse} onChange={e => setBeskrivelse(e.target.value)}
                  placeholder="Beskriv præcist hvad der ønskes lavet som ekstraarbejde — jo mere detaljeret, jo bedre grundlag for prissætning..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none" />
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mt-4">
                Jf. AB-Forbruger § 23 skal ekstraarbejde aftales skriftligt inden opstart. Entreprenøren modtager denne anmodning og skal bekræfte pris og tidspåvirkning, inden arbejdet kan gå i gang.
              </p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setVisOpret(false); setBeskrivelse(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Annuller
                </button>
                <button onClick={opretSedel} disabled={!beskrivelse.trim() || gemmer}
                  className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                  {gemmer ? "Sender..." : "Send til entreprenøren"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Godkend-modal med digital underskrift */}
        {godkendSedel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 bg-[#1e3a2a]/10 rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Digital godkendelse</h2>
                  <p className="text-xs text-gray-400">Aftaleseddel #{sedler.indexOf(godkendSedel) + 1}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Arbejde</p>
                  <p className="text-sm text-gray-800">{godkendSedel.beskrivelse}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Pris inkl. moms</p>
                    <p className="text-base font-bold text-gray-900">{godkendSedel.haandvaerker_pris ? fmtKr(godkendSedel.haandvaerker_pris) : "—"}</p>
                    <p className="text-xs text-gray-400">{godkendSedel.haandvaerker_pris_type === "fast" ? "Fast pris" : "Overslag"}</p>
                  </div>
                  {godkendSedel.haandvaerker_tidsdage && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Tidspåvirkning</p>
                      <p className="text-base font-bold text-gray-900">+{godkendSedel.haandvaerker_tidsdage} dage</p>
                    </div>
                  )}
                </div>
                {godkendSedel.haandvaerker_besked && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Note fra entreprenøren</p>
                    <p className="text-sm text-gray-600">{godkendSedel.haandvaerker_besked}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-[#1e3a2a] font-semibold mb-1">Din digitale underskrift</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ved at klikke "Godkend og underskriv" bekræfter du, <strong>{brugerNavn}</strong>, at du godkender ovenstående ekstraarbejde til den angivne pris og på de angivne vilkår. Din godkendelse logges med tidsstempel.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setGodkendSedel(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Gå tilbage
                </button>
                <button onClick={() => godkendSedlen(godkendSedel)} disabled={!!godkender}
                  className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Godkend og underskriv
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
            <p className="text-sm text-gray-400 max-w-sm mx-auto">Alt ekstraarbejde ud over den oprindelige kontrakt skal aftales skriftligt her — inden arbejdet påbegyndes.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {sedler.map((s, i) => (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                s.status === "haandvaerker_udfyldt" ? "border-amber-200" : "border-gray-100"
              }`}>
                {/* Header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400">Aftaleseddel #{sedler.length - i}</span>
                        <StatusBadge status={s.status} />
                        <span className="text-xs text-gray-300 ml-auto">{fmtDato(s.oprettet_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{s.beskrivelse}</p>
                      {s.oprettet_af_navn && (
                        <p className="text-xs text-gray-400 mt-1">Oprettet af {s.oprettet_af_navn}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entreprenørens svar */}
                {(s.status === "haandvaerker_udfyldt" || s.status === "godkendt") && s.haandvaerker_pris && (
                  <div className="mx-5 mb-4 bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Entreprenørens tilbud</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Pris inkl. moms</p>
                        <p className="text-xl font-bold text-gray-900">{fmtKr(s.haandvaerker_pris)}</p>
                        <p className="text-xs text-gray-400">{s.haandvaerker_pris_type === "fast" ? "Fast pris" : "Overslag"}</p>
                      </div>
                      {s.haandvaerker_tidsdage && (
                        <div>
                          <p className="text-xs text-gray-400">Tidspåvirkning</p>
                          <p className="text-xl font-bold text-gray-900">+{s.haandvaerker_tidsdage} dage</p>
                        </div>
                      )}
                    </div>
                    {s.haandvaerker_besked && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200 leading-relaxed">&ldquo;{s.haandvaerker_besked}&rdquo;</p>
                    )}
                    {s.haandvaerker_navn && s.haandvaerker_udfyldt_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Udfyldt af {s.haandvaerker_navn} · {fmtDato(s.haandvaerker_udfyldt_at)} kl. {fmtTid(s.haandvaerker_udfyldt_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Begge underskrifter når godkendt */}
                {s.status === "godkendt" && s.bygherre_godkendt_at && (
                  <div className="mx-5 mb-4">
                    <div className="border border-green-100 bg-green-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Digitalt underskrevet</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-green-600/70 mb-0.5">Bygherre</p>
                          <p className="text-sm font-semibold text-green-800">{s.bygherre_godkendt_navn || "Bygherre"}</p>
                          <p className="text-xs text-green-600/60">{fmtDato(s.bygherre_godkendt_at)} · {fmtTid(s.bygherre_godkendt_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600/70 mb-0.5">Entreprenør</p>
                          <p className="text-sm font-semibold text-green-800">{s.haandvaerker_navn || "Entreprenør"}</p>
                          <p className="text-xs text-green-600/60">{s.haandvaerker_udfyldt_at ? `${fmtDato(s.haandvaerker_udfyldt_at)} · ${fmtTid(s.haandvaerker_udfyldt_at)}` : "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Afventer svar fra entreprenør */}
                {s.status === "sendt" && (
                  <div className="mx-5 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-700">Afventer at entreprenøren udfylder pris og tidspåvirkning.</p>
                  </div>
                )}

                {/* Bygherre godkender */}
                {s.status === "haandvaerker_udfyldt" && !erHaandvaerker && (
                  <div className="flex gap-2 px-5 pb-5">
                    <button onClick={() => afvisSedel(s.id)}
                      className="flex-1 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                      Afvis
                    </button>
                    <button onClick={() => setGodkendSedel(s)}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-[#1e3a2a] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Godkend og underskriv
                    </button>
                  </div>
                )}
              </div>
            ))}

            {godkendtTotal > 0 && (
              <div className="bg-gray-50 rounded-xl px-5 py-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Samlet godkendt ekstraarbejde</span>
                <span className="text-sm font-bold text-[#1e3a2a]">{fmtKr(godkendtTotal)}</span>
              </div>
            )}
          </div>
        )}

        <ABTip type="advarsel" paragraf="AB-Forbruger § 23"
          titel="Ekstraarbejde skal aftales skriftligt inden opstart"
          resumé="Mundtlige aftaler om ekstraarbejde er svære at bevise og anerkendes sjældent ved tvist."
          detaljer="Jf. AB-Forbruger § 23 skal ekstraarbejde aftales skriftligt og prissættes på forhånd. Brug aftalesedlerne her — de udgør din juridiske dokumentation." />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Sedel["status"] }) {
  const map = {
    sendt:                 { label: "Afventer pris fra entreprenør", cls: "bg-amber-100 text-amber-700" },
    haandvaerker_udfyldt:  { label: "Klar til din godkendelse", cls: "bg-blue-100 text-blue-700" },
    godkendt:              { label: "Godkendt · digitalt underskrevet", cls: "bg-green-100 text-green-700" },
    afvist:                { label: "Afvist", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}
