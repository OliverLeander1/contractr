"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export type MaterialeAfregning = "inkluderet" | "dokumenteret_pris" | "dokumenteret_pris_med_tillaeg";

// Eneste kilde til disse labels — begge entreprenørsider brugte tidligere
// hver sin let forskellige ordlyd, hvilket er præcis den type drift, denne
// komponent skal forhindre.
export const materialeLabel: Record<MaterialeAfregning, string> = {
  inkluderet: "Materialer inkluderet i timeprisen",
  dokumenteret_pris: "Materialer faktureres til dokumenteret indkøbspris",
  dokumenteret_pris_med_tillaeg: "Materialer faktureres til dokumenteret indkøbspris + tillæg",
};

// Minimumsfelterne modalen har brug for. Begge kaldende sider har deres
// egen, bredere Sedel-type til listevisning — denne type beskriver kun det
// snit, svarflowet reelt bruger, så begge sider kan sende deres eksisterende
// sedler ind uden en ny, parallel datamodel.
export interface AftaleseddelForSvar {
  id: string;
  beskrivelse: string;
  status: "afventer_entreprenoer" | "afventer_bygherre" | "godkendt" | "afvist";
  oprettet_af_navn: string | null;
  oprettet_at: string;
  haandvaerker_pris: number | null;
  haandvaerker_pris_type: "fast" | "medgaaet_tid" | null;
  haandvaerker_timepris: number | null;
  materiale_afregning: MaterialeAfregning | null;
  materiale_tillaeg_procent: number | null;
  haandvaerker_prisoverslag: number | null;
  haandvaerker_tidsdage: number | null;
  haandvaerker_besked: string | null;
}

export interface AftaleseddelBillede {
  id: string;
  billedtekst: string | null;
  oprettet_at: string;
  url: string | null;
}

const statusLabel: Record<AftaleseddelForSvar["status"], { label: string; klasse: string }> = {
  afventer_entreprenoer: { label: "Afventer dit svar", klasse: "bg-amber-100 text-amber-700" },
  afventer_bygherre:     { label: "Afventer bygherre", klasse: "bg-blue-100 text-blue-700" },
  godkendt:              { label: "Godkendt",          klasse: "bg-green-100 text-green-700" },
  afvist:                { label: "Afvist",            klasse: "bg-red-100 text-red-700" },
};

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

interface Props {
  sedel: AftaleseddelForSvar;
  brugerNavn: string;
  onLuk: () => void;
  onSvarSendt: () => void;
}

// Entreprenørens ene, kanoniske svarflow på en konkret aftaleseddel — brugt
// identisk fra både den dedikerede /haandvaerker/projekt/[id]/ekstraarbejde-
// side og "Aftalesedler"-fanen på /haandvaerker/projekt/[id]. Ejer selv sin
// formular-state, billedhentning og indsendelse, så de to kaldende sider
// kun behøver at holde styr på HVILKEN aftaleseddel der er åben.
export default function AftaleseddelSvarModal({ sedel, brugerNavn, onLuk, onSvarSendt }: Props) {
  const [prisform, setPrisform] = useState<"fast" | "medgaaet_tid">(
    sedel.haandvaerker_pris_type === "medgaaet_tid" ? "medgaaet_tid" : "fast",
  );
  const [pris, setPris] = useState(sedel.haandvaerker_pris !== null ? String(sedel.haandvaerker_pris) : "");
  const [timepris, setTimepris] = useState(sedel.haandvaerker_timepris !== null ? String(sedel.haandvaerker_timepris) : "");
  const [materialeAfregning, setMaterialeAfregning] = useState<MaterialeAfregning>(sedel.materiale_afregning || "inkluderet");
  const [tillaegProcent, setTillaegProcent] = useState(sedel.materiale_tillaeg_procent !== null ? String(sedel.materiale_tillaeg_procent) : "");
  const [prisoverslag, setPrisoverslag] = useState(sedel.haandvaerker_prisoverslag !== null ? String(sedel.haandvaerker_prisoverslag) : "");
  const [dage, setDage] = useState(sedel.haandvaerker_tidsdage !== null ? String(sedel.haandvaerker_tidsdage) : "");
  const [besked, setBesked] = useState(sedel.haandvaerker_besked || "");
  const [sender, setSender] = useState(false);
  const [svarFejl, setSvarFejl] = useState<string | null>(null);

  const [billeder, setBilleder] = useState<AftaleseddelBillede[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    let annulleret = false;
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) return;
      const res = await fetch(`/api/ekstraarbejde/${sedel.id}/billeder`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok || annulleret) return;
      const data = await res.json().catch(() => null);
      if (data?.billeder && !annulleret) setBilleder(data.billeder);
    });
    return () => { annulleret = true; };
  }, [sedel.id]);

  const kanSende = prisform === "fast"
    ? pris !== "" && dage !== ""
    : timepris !== "" && dage !== "" && (materialeAfregning !== "dokumenteret_pris_med_tillaeg" || tillaegProcent !== "");

  async function indsendSvar() {
    if (!kanSende || sender) return;
    setSender(true);
    setSvarFejl(null);
    try {
      const supabase = createClient();
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
      const res = await fetch(`/api/ekstraarbejde/${sedel.id}/svar`, {
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
      onSvarSendt();
    } finally {
      setSender(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Bygherrens anmodning — læsbar kontekst, ikke en del af formularen */}
        <div className="bg-[#f0f7f3] px-6 pt-6 pb-5 border-b border-[#1e3a2a]/10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-semibold text-[#1e3a2a]/70 uppercase tracking-widest">Bygherrens anmodning</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusLabel[sedel.status].klasse}`}>
              {statusLabel[sedel.status].label}
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed break-words">{sedel.beskrivelse}</p>

          {billeder.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {billeder.map(b => b.url && (
                <button key={b.id} onClick={() => setLightboxUrl(b.url)}>
                  <img src={b.url} alt={b.billedtekst || "Billede fra bygherre"}
                    className="w-20 h-20 object-cover rounded-xl border border-[#1e3a2a]/15 hover:opacity-90 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-[#1e3a2a]/60 mt-3">
            Fra {sedel.oprettet_af_navn || "bygherre"} · {fmtDato(sedel.oprettet_at)}
          </p>
        </div>

        {/* Dit svar — entreprenørens eget input */}
        <div className="px-6 pt-5 pb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Dit svar</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prisform</label>
              <div className="grid grid-cols-2 gap-3">
                {(["fast", "medgaaet_tid"] as const).map(t => (
                  <button key={t} onClick={() => setPrisform(t)}
                    className={`py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-semibold transition-all ${
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
            <button onClick={onLuk}
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

      {/* Billed-lightbox */}
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
