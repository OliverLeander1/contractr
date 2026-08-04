"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import BesigtigelseKort from "@/components/BesigtigelseKort";
import DokumentRenderer from "@/components/DokumentRenderer";

type Fane = "aftale" | "tidsplan" | "sedler" | "mangler" | "besigtigelse";

interface Kontrakt {
  id: string;
  projekt_id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  status: string;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  haandvaerker_email: string;
  haandvaerker_token: string | null;
  startdato: string | null;
  slutdato: string | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  tidsplan: Record<string, unknown> | null;
  oprettet_at: string;
  haandvaerker_godkendt_at: string | null;
  bygherre_godkendt_at: string | null;
  besigtigelse_dato: string | null;
  besigtigelse_tid: string | null;
  besigtigelse_bekraeftet: boolean | null;
}

interface Sedel {
  id: string;
  beskrivelse: string;
  status: string;
  haandvaerker_pris: number | null;
  haandvaerker_pris_type: string | null;
  haandvaerker_tidsdage: number | null;
  haandvaerker_besked: string | null;
  haandvaerker_udfyldt_at: string | null;
  bygherre_godkendt_at: string | null;
  oprettet_at: string;
}

interface Mangel {
  id: string;
  beskrivelse: string;
  alvorlighed: string | null;
  status: string;
  oprettet_at: string;
  billeder: string[] | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);
const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

const statusLabel: Record<string, { label: string; klasse: string }> = {
  sendt:               { label: "Afventer dit svar",    klasse: "bg-amber-100 text-amber-700" },
  haandvaerker_udfyldt:{ label: "Afventer bygherre",    klasse: "bg-blue-100 text-blue-700" },
  godkendt:            { label: "Godkendt",             klasse: "bg-green-100 text-green-700" },
  afvist:              { label: "Afvist",               klasse: "bg-red-100 text-red-700" },
};

const mangelStatus: Record<string, { label: string; klasse: string }> = {
  registreret: { label: "Registreret",  klasse: "bg-amber-100 text-amber-700" },
  sendt:       { label: "Sendt",        klasse: "bg-blue-100 text-blue-700" },
  udbedret:    { label: "Udbedret",     klasse: "bg-green-100 text-green-700" },
  afvist:      { label: "Afvist",       klasse: "bg-red-100 text-red-700" },
};

export default function HaandvaerkerProjekt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [fane, setFane] = useState<Fane>("aftale");
  const [kontrakt, setKontrakt] = useState<Kontrakt | null>(null);
  const [sedler, setSedler] = useState<Sedel[]>([]);
  const [mangler, setMangler] = useState<Mangel[]>([]);
  const [indlæser, setIndlæser] = useState(true);
  const [fejl, setFejl] = useState("");
  const [navn, setNavn] = useState("");
  const [initials, setInitials] = useState("H");

  // Svar på aftaleseddel
  const [åbnSedel, setÅbnSedel] = useState<Sedel | null>(null);
  const [svarPris, setSvarPris] = useState("");
  const [svarPrisType, setSvarPrisType] = useState<"fast" | "overslag">("fast");
  const [svarDage, setSvarDage] = useState("");
  const [svarBesked, setSvarBesked] = useState("");
  const [gemmer, setGemmer] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.email) { setFejl("Du er ikke logget ind."); setIndlæser(false); return; }

      const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).maybeSingle();
      const n = profil?.navn || user.email.split("@")[0];
      setNavn(n);
      setInitials(n.split(" ").map((x: string) => x[0]).join("").toUpperCase().slice(0, 2) || "H");

      const res = await fetch(`/api/haandvaerker/projekt/${id}?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.error) { setFejl(data.error); setIndlæser(false); return; }
      setKontrakt(data.kontrakt);
      setSedler(data.sedler);
      setMangler(data.mangler);
      setIndlæser(false);
    });
  }, [id]);

  async function svarPåSeddel() {
    if (!åbnSedel || gemmer) return;
    setGemmer(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await fetch(`/api/ekstraarbejde/${åbnSedel.id}/svar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        haandvaerker_pris: svarPris ? parseFloat(svarPris) : null,
        haandvaerker_pris_type: svarPrisType,
        haandvaerker_tidsdage: svarDage ? parseInt(svarDage) : null,
        haandvaerker_besked: svarBesked,
        haandvaerker_navn: navn,
        haandvaerker_email: user?.email,
      }),
    });
    const res = await fetch(`/api/haandvaerker/projekt/${id}?email=${encodeURIComponent(user?.email ?? "")}`);
    const data = await res.json();
    setSedler(data.sedler);
    setÅbnSedel(null);
    setGemmer(false);
  }

  if (indlæser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1e3a2a] rounded-full animate-spin" />
    </div>
  );

  if (fejl || !kontrakt) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-gray-500">{fejl || "Projekt ikke fundet."}</p>
      <Link href="/haandvaerker/sager" className="text-sm text-[#1e3a2a] font-semibold underline">Tilbage til mine sager</Link>
    </div>
  );

  const tidsplan = kontrakt.tidsplan as { type?: string; faser?: { navn: string; startdato: string; slutdato: string }[]; godkendt_af_bygherre?: boolean } | null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/haandvaerker/sager" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Mine sager
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Projekt-titel */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{kontrakt.titel || "Projekt"}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {kontrakt.total_pris && <span className="text-sm text-gray-500">{fmtKr(kontrakt.total_pris)}</span>}
            {kontrakt.startdato && <span className="text-sm text-gray-400">· Opstart {fmtDato(kontrakt.startdato)}</span>}
            {(() => {
              const hG = !!kontrakt.haandvaerker_godkendt_at;
              const bG = !!kontrakt.bygherre_godkendt_at;
              if (hG && bG)  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aftale indgået</span>;
              if (hG)        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Afventer bygherre</span>;
              if (bG)        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Afventer din godkendelse</span>;
              return               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Afventer dit tilbud</span>;
            })()}
          </div>
        </div>

        {/* Chat-handling */}
        {kontrakt.haandvaerker_email ? (
          <Link
            href={`/haandvaerker/projekt/${kontrakt.projekt_id}/chat/${kontrakt.id}`}
            className="inline-flex items-center gap-2 mb-6 text-sm font-semibold bg-[#1e3a2a] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat med bygherre
          </Link>
        ) : (
          <p className="text-xs text-gray-400 mb-6">Chat er ikke tilgængeligt på denne sag.</p>
        )}

        {/* Faner */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {([
            { id: "aftale",        label: "Aftalegrundlag" },
            { id: "besigtigelse",  label: "Besigtigelse" },
            { id: "tidsplan",      label: "Tidsplan" },
            { id: "sedler",        label: `Aftalesedler${sedler.length > 0 ? ` (${sedler.length})` : ""}` },
            { id: "mangler",       label: `Mangler${mangler.length > 0 ? ` (${mangler.length})` : ""}` },
          ] as { id: Fane; label: string }[]).map(f => (
            <button key={f.id} onClick={() => setFane(f.id)}
              className={`flex-1 text-sm font-semibold py-2 px-3 rounded-lg whitespace-nowrap transition-all ${
                fane === f.id ? "bg-white text-[#1e3a2a] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Aftalegrundlag */}
        {fane === "aftale" && (
          <div className="space-y-4">
            {/* Handlingsknapper — baseret på godkendelsestimestamps */}
            {kontrakt.haandvaerker_token && (() => {
              const hG = !!kontrakt.haandvaerker_godkendt_at;
              const bG = !!kontrakt.bygherre_godkendt_at;

              if (hG && bG) {
                return (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-5 py-3.5 text-sm font-semibold text-green-800">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Aftalegrundlaget er godkendt af begge parter
                  </div>
                );
              }

              if (hG) {
                return (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5 text-sm font-semibold text-amber-800">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Aftalegrundlaget er sendt – afventer bygherre
                  </div>
                );
              }

              if (bG) {
                return (
                  <div className="flex gap-3">
                    <Link
                      href={`/kontrakt/${kontrakt.haandvaerker_token}/aftale`}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a2a] text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Gennemgå og godkend aftalegrundlag
                    </Link>
                  </div>
                );
              }

              return (
                <div className="flex gap-3">
                  <Link
                    href={`/kontrakt/${kontrakt.haandvaerker_token}/aftale`}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a2a] text-white text-sm font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Rediger, indsend tilbud og godkend
                  </Link>
                </div>
              );
            })()}
            {/* Dokumentvisning */}
            <DokumentRenderer
              tekst={kontrakt.beskrivelse || undefined}
              titel={kontrakt.titel || undefined}
              totalPris={kontrakt.total_pris}
              startdato={kontrakt.startdato}
              slutdato={kontrakt.slutdato}
              betalingsplan={kontrakt.betalingsplan}
              tidsplan={kontrakt.tidsplan as Parameters<typeof DokumentRenderer>[0]["tidsplan"]}
              haandvaerkerNavn={kontrakt.haandvaerker_navn}
              haandvaerkerFirma={kontrakt.haandvaerker_firma}
            />
          </div>
        )}

        {/* Tidsplan */}
        {fane === "tidsplan" && (() => {
          const hG = !!kontrakt.haandvaerker_godkendt_at;
          const bG = !!kontrakt.bygherre_godkendt_at;
          const tidsplanLaast = hG || bG;

          const laastTekst = (() => {
            if (!tidsplan) {
              if (hG && bG) return "Der er ikke angivet en tidsplan i det godkendte aftalegrundlag.";
              if (hG)       return "Der er ikke angivet en tidsplan i det fremsendte aftalegrundlag.";
                            return "Der er ikke angivet en tidsplan i det aftalegrundlag, som bygherren har godkendt.";
            }
            if (hG && bG) return "Tidsplanen er en del af det godkendte aftalegrundlag.";
            if (hG)       return "Tidsplanen er sendt og afventer bygherrens svar.";
                          return "Bygherren har godkendt aftalegrundlaget. Tidsplanen kan ikke længere redigeres.";
          })();

          return (
            <div className="space-y-4">
              {!tidsplan ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Ingen tidsplan indsendt endnu</p>
                  {tidsplanLaast ? (
                    <p className="text-xs text-gray-500">{laastTekst}</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-4">Indsend en faseopdelt tidsplan via aftalesiden</p>
                      {kontrakt.haandvaerker_token && (
                        <Link href={`/kontrakt/${kontrakt.haandvaerker_token}/aftale`}
                          className="inline-flex items-center gap-2 text-sm font-semibold bg-[#1e3a2a] text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                          Indsend tidsplan
                        </Link>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-[#111c17] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">AB-Forbruger § 12</p>
                      <p className="text-sm font-semibold text-white">
                        {tidsplan.type === "ingen_tidsplan" ? "Ingen fast tidsplan aftalt" : "Faseopdelt tidsplan"}
                      </p>
                    </div>
                    {tidsplan.godkendt_af_bygherre ? (
                      <span className="text-xs font-semibold bg-green-500 text-white px-2.5 py-1 rounded-full">Godkendt</span>
                    ) : (
                      <span className="text-xs font-semibold bg-amber-400 text-white px-2.5 py-1 rounded-full">Afventer bygherre</span>
                    )}
                  </div>
                  {tidsplan.faser && (tidsplan.faser as { navn: string; startdato: string; slutdato: string }[]).length > 0 && (
                    <div className="divide-y divide-gray-50">
                      {(tidsplan.faser as { navn: string; startdato: string; slutdato: string }[]).map((f, i) => (
                        <div key={i} className="px-5 py-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{f.navn}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtDato(f.startdato)} – {fmtDato(f.slutdato)}</p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-xs font-bold text-[#1e3a2a]">{i + 1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-5 py-4 border-t border-gray-50">
                    {tidsplanLaast ? (
                      <p className="text-xs text-gray-400">{laastTekst}</p>
                    ) : kontrakt.haandvaerker_token && (
                      <Link href={`/kontrakt/${kontrakt.haandvaerker_token}/aftale`}
                        className="text-sm font-semibold text-[#1e3a2a] hover:underline">
                        Opdater tidsplan
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Aftalesedler */}
        {fane === "sedler" && (
          <div className="space-y-3">
            {sedler.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-500">Ingen aftalesedler på dette projekt endnu.</p>
              </div>
            ) : sedler.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-gray-900 flex-1">{s.beskrivelse}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${(statusLabel[s.status] ?? { klasse: "bg-gray-100 text-gray-600" }).klasse}`}>
                    {(statusLabel[s.status] ?? { label: s.status }).label}
                  </span>
                </div>
                {s.haandvaerker_pris != null && (
                  <p className="text-sm text-gray-600 mb-1">Pris: <span className="font-semibold">{fmtKr(s.haandvaerker_pris)}</span> ({s.haandvaerker_pris_type})</p>
                )}
                {s.haandvaerker_tidsdage != null && (
                  <p className="text-sm text-gray-600 mb-1">Tidsforbrug: <span className="font-semibold">{s.haandvaerker_tidsdage} dage</span></p>
                )}
                {s.haandvaerker_besked && (
                  <p className="text-sm text-gray-500 italic mb-2">"{s.haandvaerker_besked}"</p>
                )}
                <p className="text-xs text-gray-400">Oprettet {fmtDato(s.oprettet_at)}</p>
                {s.status === "sendt" && (
                  <button onClick={() => {
                    setÅbnSedel(s);
                    setSvarPris(s.haandvaerker_pris?.toString() ?? "");
                    setSvarPrisType((s.haandvaerker_pris_type as "fast" | "overslag") ?? "fast");
                    setSvarDage(s.haandvaerker_tidsdage?.toString() ?? "");
                    setSvarBesked(s.haandvaerker_besked ?? "");
                  }} className="mt-3 text-sm font-semibold bg-[#1e3a2a] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                    Svar på aftaleseddel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mangler */}
        {fane === "mangler" && (
          <div className="space-y-3">
            {mangler.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-500">Ingen mangler registreret på dette projekt.</p>
              </div>
            ) : mangler.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-gray-900 flex-1">{m.beskrivelse}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${(mangelStatus[m.status] ?? { klasse: "bg-gray-100 text-gray-600" }).klasse}`}>
                    {(mangelStatus[m.status] ?? { label: m.status }).label}
                  </span>
                </div>
                {m.alvorlighed && <p className="text-xs text-gray-400 mb-1">Alvorlighed: {m.alvorlighed}</p>}
                <p className="text-xs text-gray-400">Registreret {fmtDato(m.oprettet_at)}</p>
                {m.billeder && m.billeder.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {m.billeder.slice(0, 3).map((b, i) => (
                      <img key={i} src={b} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Besigtigelse */}
        {fane === "besigtigelse" && kontrakt && (
          <BesigtigelseKort
            kontraktId={kontrakt.id}
            projektId={kontrakt.projekt_id}
            rolle="haandvaerker"
            legacyBesigtigelseDato={kontrakt.besigtigelse_dato}
            legacyBesigtigelseTid={kontrakt.besigtigelse_tid}
            legacyBesigtigelseBekraeftet={kontrakt.besigtigelse_bekraeftet}
          />
        )}
      </div>

      {/* Svar-modal */}
      {åbnSedel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 mb-1">Svar på aftaleseddel</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">{åbnSedel.beskrivelse}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">Pris (kr. ekskl. moms)</label>
                <input type="number" value={svarPris} onChange={e => setSvarPris(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20" placeholder="F.eks. 12500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["fast", "overslag"] as const).map(t => (
                  <button key={t} onClick={() => setSvarPrisType(t)}
                    className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${svarPrisType === t ? "bg-[#1e3a2a] text-white border-[#1e3a2a]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {t === "fast" ? "Fast pris" : "Overslag"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">Antal arbejdsdage</label>
                <input type="number" value={svarDage} onChange={e => setSvarDage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20" placeholder="F.eks. 3" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">Besked (valgfri)</label>
                <textarea value={svarBesked} onChange={e => setSvarBesked(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 resize-none" placeholder="Eventuelle kommentarer" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setÅbnSedel(null)} className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Annuller</button>
              <button onClick={svarPåSeddel} disabled={gemmer}
                className="flex-1 py-3 text-sm font-semibold bg-[#1e3a2a] text-white rounded-xl hover:opacity-90 disabled:opacity-50">
                {gemmer ? "Sender..." : "Send svar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
