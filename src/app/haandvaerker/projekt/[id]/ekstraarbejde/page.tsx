"use client";

import { use, useEffect, useState, useCallback } from "react";
import SimpleNav from "@/components/SimpleNav";
import HaandvaerkerBadgeLinks from "@/components/HaandvaerkerBadgeLinks";
import { createClient } from "@/lib/supabase";
import AftaleseddelSvarModal, { MaterialeAfregning, materialeLabel } from "@/components/AftaleseddelSvarModal";

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

export default function HaandvaerkerEkstraarbejde({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [brugerNavn, setBrugerNavn] = useState("");
  const [sedler, setSedler]       = useState<Sedel[]>([]);
  const [indlæser, setIndlæser]   = useState(true);
  const [aktivSedel, setAktivSedel] = useState<Sedel | null>(null);

  // Billeder pr. aftaleseddel, hentet via signerede læse-URLs — samme
  // mønster som bygherresidens projekt/[id]/ekstraarbejde/page.tsx.
  const [sedelBilleder, setSedelBilleder] = useState<Record<string, SedelBillede[]>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
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

        {aktivSedel && (
          <AftaleseddelSvarModal
            sedel={aktivSedel}
            brugerNavn={brugerNavn}
            onLuk={() => setAktivSedel(null)}
            onSvarSendt={() => { setAktivSedel(null); hentData(); }}
          />
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
                    <button onClick={() => setAktivSedel(s)}
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
