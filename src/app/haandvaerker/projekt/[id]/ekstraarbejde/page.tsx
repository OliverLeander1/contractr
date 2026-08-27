"use client";

import { use, useEffect, useState, useCallback } from "react";
import SimpleNav from "@/components/SimpleNav";
import HaandvaerkerBadgeLinks from "@/components/HaandvaerkerBadgeLinks";
import { createClient } from "@/lib/supabase";

type MaterialeAfregning = "inkluderet" | "dokumenteret_pris" | "dokumenteret_pris_med_tillaeg";

interface Sedel {
  id: string;
  beskrivelse: string;
  status: "afventer_entreprenoer" | "afventer_bygherre" | "godkendt" | "afvist";
  oprettet_af_navn: string | null;
  haandvaerker_pris: number | null;
  haandvaerker_pris_type: "fast" | "medgaaet_tid" | null;
  haandvaerker_timepris: number | null;
  materiale_afregning: MaterialeAfregning | null;
  materiale_tillaeg_procent: number | null;
  haandvaerker_prisoverslag: number | null;
  haandvaerker_tidsdage: number | null;
  haandvaerker_besked: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_udfyldt_at: string | null;
  bygherre_godkendt_navn: string | null;
  bygherre_godkendt_at: string | null;
  oprettet_at: string;
}

interface SedelBillede {
  id: string;
  billedtekst: string | null;
  oprettet_at: string;
  url: string | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

const fmtTid = (iso: string) =>
  new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });

const materialeLabel: Record<MaterialeAfregning, string> = {
  inkluderet: "Materialer inkluderet i timeprisen",
  dokumenteret_pris: "Materialer faktureres til dokumenteret indkøbspris",
  dokumenteret_pris_med_tillaeg: "Materialer faktureres til dokumenteret indkøbspris + tillæg",
};

export default function HaandvaerkerEkstraarbejde({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [userId, setUserId]       = useState<string | null>(null);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [sedler, setSedler]       = useState<Sedel[]>([]);
  const [indlæser, setIndlæser]   = useState(true);
  const [aktivSedel, setAktivSedel] = useState<Sedel | null>(null);
  const [sender, setSender]       = useState(false);
  const [svarFejl, setSvarFejl]   = useState<string | null>(null);

  // Udfyld-formular
  const [prisform, setPrisform]           = useState<"fast" | "medgaaet_tid">("fast");
  const [pris, setPris]                   = useState("");
  const [timepris, setTimepris]           = useState("");
  const [materialeAfregning, setMaterialeAfregning] = useState<MaterialeAfregning>("inkluderet");
  const [tillaegProcent, setTillaegProcent] = useState("");
  const [prisoverslag, setPrisoverslag]   = useState("");
  const [dage, setDage]                   = useState("");
  const [besked, setBesked]               = useState("");

  // Billeder pr. aftaleseddel, hentet via signerede læse-URLs — samme
  // mønster som bygherresidens projekt/[id]/ekstraarbejde/page.tsx.
  const [sedelBilleder, setSedelBilleder] = useState<Record<string, SedelBillede[]>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
      setBrugerNavn(profil?.navn || user.email?.split("@")[0] || "Entreprenør");
    });
  }, []);

  const hentData = useCallback(async () => {
    setIndlæser(true);
    const { data } = await supabase
      .from("ekstraarbejde")
      .select("*")
      .eq("projekt_id", id)
      .order("oprettet_at", { ascending: false });
    const hentedeSedler = (data || []) as Sedel[];
    setSedler(hentedeSedler);
    setIndlæser(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await Promise.all(hentedeSedler.map(async (s) => {
        const res = await fetch(`/api/ekstraarbejde/${s.id}/billeder`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const billedData = await res.json().catch(() => null);
        if (billedData?.billeder) {
          setSedelBilleder((prev) => ({ ...prev, [s.id]: billedData.billeder }));
        }
      }));
    }
  }, [id]);

  useEffect(() => { hentData(); }, [hentData]);

  function åbnSedel(s: Sedel) {
    setAktivSedel(s);
    setPrisform(s.haandvaerker_pris_type === "medgaaet_tid" ? "medgaaet_tid" : "fast");
    setPris(s.haandvaerker_pris !== null ? String(s.haandvaerker_pris) : "");
    setTimepris(s.haandvaerker_timepris !== null ? String(s.haandvaerker_timepris) : "");
    setMaterialeAfregning(s.materiale_afregning || "inkluderet");
    setTillaegProcent(s.materiale_tillaeg_procent !== null ? String(s.materiale_tillaeg_procent) : "");
    setPrisoverslag(s.haandvaerker_prisoverslag !== null ? String(s.haandvaerker_prisoverslag) : "");
    setDage(s.haandvaerker_tidsdage !== null ? String(s.haandvaerker_tidsdage) : "");
    setBesked(s.haandvaerker_besked || "");
    setSvarFejl(null);
  }

  const kanSende = prisform === "fast"
    ? pris !== "" && dage !== ""
    : timepris !== "" && dage !== "" && (materialeAfregning !== "dokumenteret_pris_med_tillaeg" || tillaegProcent !== "");

  async function indsendSvar() {
    if (!kanSende || !userId || sender || !aktivSedel) return;
    setSender(true);
    setSvarFejl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSvarFejl("Din session er udløbet. Log ind igen for at fortsætte.");
        return;
      }
      const body: Record<string, unknown> = {
        haandvaerker_pris_type: prisform,
        haandvaerker_tidsdage: dage !== "" ? parseInt(dage) : null,
        haandvaerker_besked: besked.trim() || null,
      };
      if (prisform === "fast") {
        body.haandvaerker_pris = parseFloat(pris);
      } else {
        body.haandvaerker_timepris = parseFloat(timepris);
        body.materiale_afregning = materialeAfregning;
        body.materiale_tillaeg_procent = materialeAfregning === "dokumenteret_pris_med_tillaeg" ? parseFloat(tillaegProcent) : null;
        body.haandvaerker_prisoverslag = prisoverslag !== "" ? parseFloat(prisoverslag) : null;
      }
      const res = await fetch(`/api/ekstraarbejde/${aktivSedel.id}/svar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSvarFejl(data.error || "Kunne ikke sende svaret. Prøv igen.");
        return;
      }
      setAktivSedel(null);
      hentData();
    } finally {
      setSender(false);
    }
  }

  const afventer = sedler.filter(s => s.status === "afventer_entreprenoer").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNav tilbage={`/haandvaerker/projekt/${id}`} tilbageLabel="Tilbage til projekt" højre={<HaandvaerkerBadgeLinks />} />

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ekstraarbejde</h1>
          <p className="text-sm text-gray-400 mt-1">
            {afventer > 0
              ? `${afventer} anmodning${afventer > 1 ? "er" : ""} afventer din prissætning`
              : "Alle anmodninger er besvaret"}
          </p>
        </div>

        {/* Udfyld-modal */}
        {aktivSedel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

              {/* Bygherrens anmodning — læsbar kontekst, ikke en del af formularen */}
              <div className="bg-[#f0f7f3] px-6 pt-6 pb-5 border-b border-[#1e3a2a]/10">
                <p className="text-xs font-semibold text-[#1e3a2a]/70 uppercase tracking-widest mb-2">Bygherrens anmodning</p>
                <p className="text-sm text-gray-800 leading-relaxed break-words">{aktivSedel.beskrivelse}</p>

                {(sedelBilleder[aktivSedel.id]?.length ?? 0) > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {sedelBilleder[aktivSedel.id].map(b => b.url && (
                      <button key={b.id} onClick={() => setLightboxUrl(b.url)}>
                        <img src={b.url} alt={b.billedtekst || "Billede fra bygherre"}
                          className="w-16 h-16 object-cover rounded-xl border border-[#1e3a2a]/15 hover:opacity-90 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-[#1e3a2a]/60 mt-3">
                  Fra {aktivSedel.oprettet_af_navn || "bygherre"} · {fmtDato(aktivSedel.oprettet_at)}
                </p>
              </div>

              <div className="px-6 pt-5 pb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Dit svar</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Prisform</label>
                    <div className="flex gap-2">
                      {(["fast", "medgaaet_tid"] as const).map(t => (
                        <button key={t} onClick={() => setPrisform(t)}
                          className={`flex-1 py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-semibold transition-all ${
                            prisform === t ? "border-[#1e3a2a] bg-[#1e3a2a]/5 text-[#1e3a2a]" : "border-[#e0ddd6] text-gray-500"
                          }`}>
                          {t === "fast" ? "Fast pris" : "Medgået tid"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {prisform === "fast" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Fast pris inkl. moms (kr.)</label>
                        <input type="number" min="0" value={pris} onChange={e => setPris(e.target.value)} placeholder="0"
                          className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tidskonsekvens (dage)</label>
                        <input type="number" min="0" value={dage} onChange={e => setDage(e.target.value)} placeholder="0"
                          className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        <p className="text-xs text-gray-400 mt-1">0 dage betyder ingen tidsforlængelse.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Timepris inkl. moms (kr.)</label>
                        <input type="number" min="0" value={timepris} onChange={e => setTimepris(e.target.value)} placeholder="0"
                          className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Materialer</label>
                        <div className="space-y-2">
                          {(Object.keys(materialeLabel) as MaterialeAfregning[]).map(m => (
                            <button key={m} onClick={() => setMaterialeAfregning(m)}
                              className={`w-full text-left px-4 py-2.5 min-h-[44px] rounded-xl border-2 text-sm transition-all ${
                                materialeAfregning === m ? "border-[#1e3a2a] bg-[#1e3a2a]/5 text-[#1e3a2a] font-semibold" : "border-[#e0ddd6] text-gray-600"
                              }`}>
                              {materialeLabel[m]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {materialeAfregning === "dokumenteret_pris_med_tillaeg" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tillæg i %</label>
                          <input type="number" min="0" value={tillaegProcent} onChange={e => setTillaegProcent(e.target.value)} placeholder="0"
                            className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Prisoverslag inkl. moms (valgfrit)</label>
                          <input type="number" min="0" value={prisoverslag} onChange={e => setPrisoverslag(e.target.value)} placeholder="0"
                            className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tidskonsekvens (dage)</label>
                          <input type="number" min="0" value={dage} onChange={e => setDage(e.target.value)} placeholder="0"
                            className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                          <p className="text-xs text-gray-400 mt-1">0 dage betyder ingen tidsforlængelse.</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Note til bygherre (valgfrit)</label>
                    <textarea rows={2} value={besked} onChange={e => setBesked(e.target.value)}
                      placeholder="F.eks. forudsætninger, materialevalg, hvad der er inkluderet..."
                      className="w-full border border-[#e0ddd6] rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none" />
                  </div>
                </div>

                <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-xl px-4 py-3 mt-4">
                  <p className="text-xs text-[#1e3a2a] leading-relaxed">
                    Dit svar logges med navn og tidsstempel som <strong>{brugerNavn}</strong>. Bygherre skal herefter godkende inden arbejdet kan påbegyndes.
                  </p>
                </div>

                {svarFejl && (
                  <p className="text-xs text-red-600 font-medium mt-3">{svarFejl}</p>
                )}

                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setAktivSedel(null); setSvarFejl(null); }}
                    className="flex-1 py-3 min-h-[44px] rounded-xl border border-[#e0ddd6] text-gray-600 text-sm font-medium hover:bg-gray-50">
                    Annuller
                  </button>
                  <button onClick={indsendSvar} disabled={!kanSende || sender}
                    className="flex-1 py-3 min-h-[44px] rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    {sender ? "Sender..." : "Send svar til bygherre"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : sedler.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen aftalesedler endnu</p>
            <p className="text-sm text-gray-400">Bygherren sender en anmodning når der opstår ekstraarbejde.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sedler.map((s, i) => {
              const billeder = sedelBilleder[s.id] ?? [];
              const forsideBillede = billeder.find(b => b.url)?.url ?? null;
              return (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                s.status === "afventer_entreprenoer" ? "border-amber-200" : "border-[#e0ddd6]"
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    {forsideBillede && (
                      <button onClick={() => setLightboxUrl(forsideBillede)} className="flex-shrink-0 order-first">
                        <img src={forsideBillede} alt="Billede fra bygherre"
                          className="w-16 h-16 rounded-xl object-cover border border-[#e0ddd6] hover:opacity-90 transition-opacity" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400">Aftaleseddel #{sedler.length - i}</span>
                        <HvStatusBadge status={s.status} />
                        <span className="text-xs text-gray-300 ml-auto">{fmtDato(s.oprettet_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed break-words">{s.beskrivelse}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {s.oprettet_af_navn ? `Fra ${s.oprettet_af_navn}` : "Fra bygherre"}
                        {billeder.length > 0 ? ` · ${billeder.length} billede${billeder.length > 1 ? "r" : ""}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Dit svar */}
                  {s.status !== "afventer_entreprenoer" && (
                    <div className="bg-gray-50 rounded-xl p-3 mt-3 mb-3">
                      <p className="text-xs text-gray-400 mb-1">Dit svar</p>
                      {s.haandvaerker_pris_type === "fast" ? (
                        <div className="flex gap-4 flex-wrap">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{s.haandvaerker_pris !== null ? fmtKr(s.haandvaerker_pris) : "—"}</p>
                            <p className="text-xs text-gray-400">Fast pris inkl. moms</p>
                          </div>
                          {s.haandvaerker_tidsdage !== null && (
                            <div>
                              <p className="text-sm font-bold text-gray-900">{s.haandvaerker_tidsdage === 0 ? "Ingen tidsforlængelse" : `+${s.haandvaerker_tidsdage} dage`}</p>
                              <p className="text-xs text-gray-400">Tidskonsekvens</p>
                            </div>
                          )}
                        </div>
                      ) : s.haandvaerker_pris_type === "medgaaet_tid" ? (
                        <div className="space-y-1.5">
                          <div className="flex gap-4 flex-wrap">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{s.haandvaerker_timepris !== null ? `${fmtKr(s.haandvaerker_timepris)}/time` : "—"}</p>
                              <p className="text-xs text-gray-400">Medgået tid, timepris inkl. moms</p>
                            </div>
                            {s.haandvaerker_tidsdage !== null && (
                              <div>
                                <p className="text-sm font-bold text-gray-900">{s.haandvaerker_tidsdage === 0 ? "Ingen tidsforlængelse" : `+${s.haandvaerker_tidsdage} dage`}</p>
                                <p className="text-xs text-gray-400">Tidskonsekvens</p>
                              </div>
                            )}
                          </div>
                          {s.materiale_afregning && (
                            <p className="text-xs text-gray-500">
                              {materialeLabel[s.materiale_afregning]}
                              {s.materiale_afregning === "dokumenteret_pris_med_tillaeg" && s.materiale_tillaeg_procent !== null ? ` (${s.materiale_tillaeg_procent} %)` : ""}
                            </p>
                          )}
                          {s.haandvaerker_prisoverslag !== null && (
                            <p className="text-xs text-gray-500">Prisoverslag: cirka {fmtKr(s.haandvaerker_prisoverslag)}. Ikke en fast maksimal pris.</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Endnu ikke fuldt udfyldt.</p>
                      )}
                    </div>
                  )}

                  {/* Begge signaturer ved godkendelse */}
                  {s.status === "godkendt" && s.bygherre_godkendt_at && (
                    <div className="border border-green-100 bg-green-50 rounded-xl p-3 mt-3">
                      <p className="text-xs font-semibold text-green-700 mb-2">Digitalt underskrevet af begge parter</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-green-600/70">Bygherre</p>
                          <p className="text-sm font-semibold text-green-800">{s.bygherre_godkendt_navn || "Bygherre"}</p>
                          <p className="text-xs text-green-600/60">{fmtDato(s.bygherre_godkendt_at)} · {fmtTid(s.bygherre_godkendt_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600/70">Entreprenør</p>
                          <p className="text-sm font-semibold text-green-800">{s.haandvaerker_navn || brugerNavn}</p>
                          <p className="text-xs text-green-600/60">{s.haandvaerker_udfyldt_at ? `${fmtDato(s.haandvaerker_udfyldt_at)} · ${fmtTid(s.haandvaerker_udfyldt_at)}` : "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Handling */}
                  {s.status === "afventer_entreprenoer" && (
                    <button onClick={() => åbnSedel(s)}
                      className="w-full mt-3 py-2.5 min-h-[44px] bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
                      Udfyld pris og tid
                    </button>
                  )}
                  {s.status === "afventer_bygherre" && (
                    <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <p className="text-xs font-semibold">Afventer bygherrens godkendelse</p>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Billed-lightbox — genbruges af listekortet og udfyld-modalen */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Luk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <img src={lightboxUrl} alt="Billede fra bygherre" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function HvStatusBadge({ status }: { status: Sedel["status"] }) {
  const map = {
    afventer_entreprenoer: { label: "Afventer din prissætning", cls: "bg-amber-100 text-amber-700" },
    afventer_bygherre:     { label: "Sendt · afventer bygherre", cls: "bg-blue-100 text-blue-700" },
    godkendt:               { label: "Godkendt af begge parter", cls: "bg-green-100 text-green-700" },
    afvist:                 { label: "Afvist", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}
