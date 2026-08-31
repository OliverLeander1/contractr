"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import Chat from "@/components/Chat";
import BesigtigelseKort from "@/components/BesigtigelseKort";
import DeadlineTæller from "@/components/DeadlineTæller";
import { createClient } from "@/lib/supabase";
import { hentOprindeligAftaltSlutdato, hentOprindeligAftaltStartdato } from "@/lib/kontraktSlutdato";

interface Kontrakt {
  id: string;
  projekt_id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  status: string;
  haandvaerker_navn: string | null;
  haandvaerker_email: string | null;
  haandvaerker_firma: string | null;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  startdato: string | null;
  slutdato: string | null;
  tidsplan: {
    type?: string;
    faser?: { navn?: string; startdato?: string; slutdato?: string }[];
    godkendt_af_bygherre?: boolean;
  } | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  oprettet_at: string;
  besigtigelse_dato: string | null;
  besigtigelse_tid: string | null;
  besigtigelse_bekraeftet: boolean | null;
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " kr.";

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

function dageImellem(fra: string, til: string): number {
  const msPerDag = 1000 * 60 * 60 * 24;
  return Math.round((new Date(til).getTime() - new Date(fra).getTime()) / msPerDag);
}

const aftaleStatus: Record<string, { label: string; klasse: string }> = {
  udkast:               { label: "Udkast",                klasse: "bg-gray-100 text-gray-600" },
  inviteret:            { label: "Invitation sendt",      klasse: "bg-blue-100 text-blue-700" },
  forhandling:          { label: "Under forhandling",     klasse: "bg-amber-100 text-amber-700" },
  bygherre_godkendt:    { label: "Afventer håndværker",   klasse: "bg-blue-100 text-blue-700" },
  haandvaerker_godkendt:{ label: "Afventer din godkendelse", klasse: "bg-amber-100 text-amber-700" },
  begge_godkendt:       { label: "Aftale indgået",        klasse: "bg-green-100 text-green-700" },
};

export default function ProjektOversigt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [kontrakt, setKontrakt] = useState<Kontrakt | null | "loading">("loading");
  const [bygherreNavn, setBygherreNavn] = useState("");
  const [visPaakrav, setVisPaakrav] = useState(false);
  const [paakravBesked, setPaakravBesked] = useState("");
  const [paakravFrist, setPaakravFrist] = useState("");
  const [senderPaakrav, setSenderPaakrav] = useState(false);
  const [paakravSendt, setPaakravSendt] = useState(false);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const [{ data }, { data: { user } }] = await Promise.all([
        supabase.from("kontrakter").select("*").eq("projekt_id", id).order("oprettet_at", { ascending: false }).limit(1).single(),
        supabase.auth.getUser(),
      ]);

      if (user) {
        const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
        setBygherreNavn(profil?.navn || user.email?.split("@")[0] || "Bygherre");
      }

      setKontrakt(data ?? null);
    };
    hent();
  }, [id]);

  if (kontrakt === "loading") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1e3a2a] rounded-full animate-spin" />
    </div>
  );

  if (!kontrakt) return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Projekt ikke fundet</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">Dette projekt eksisterer ikke eller du har ikke adgang til det.</p>
        <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#1e3a2a] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Tilbage til overblik
        </Link>
      </div>
    </div>
  );

  if (kontrakt) {
    const st = aftaleStatus[kontrakt.status] || { label: kontrakt.status, klasse: "bg-gray-100 text-gray-600" };
    const beggeGodkendt = kontrakt.status === "begge_godkendt";
    const idag = new Date().toISOString();

    const fmtDatoLang = (iso: string) =>
      new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

    async function sendPaakrav() {
      if (!kontrakt || typeof kontrakt !== "object") return;
      setSenderPaakrav(true);
      const { createClient: cc } = await import("@/lib/supabase");
      const supabase = cc();
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/paakrav", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, besked: paakravBesked, ny_frist: paakravFrist || null }),
      });
      setSenderPaakrav(false);
      if (res.ok) { setPaakravSendt(true); setVisPaakrav(false); }
    }

    if (beggeGodkendt) {
      const aftaltStartdato = hentOprindeligAftaltStartdato(kontrakt);
      const aftaltSlutdato = hentOprindeligAftaltSlutdato(kontrakt);
      const dageТilStart = aftaltStartdato ? dageImellem(idag, aftaltStartdato) : null;
      const erStartet    = dageТilStart !== null && dageТilStart <= 0;
      const tidsplanGodkendt = kontrakt.tidsplan?.type === "faser" && kontrakt.tidsplan?.godkendt_af_bygherre === true;

      return (
        <div className="min-h-screen bg-gray-50">
          <ProjektNav id={id} />
          <div className="max-w-2xl mx-auto px-4 py-8">

            {/* Kontraktkort */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-5">

              {/* Mørk header */}
              <div className="bg-[#111c17] px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Aftalegrundlag</p>
                  <h1 className="text-xl font-bold text-white leading-snug">{kontrakt.titel || "Projekt"}</h1>
                </div>
                <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/20 whitespace-nowrap">
                  Begge har godkendt
                </span>
              </div>

              {/* Parter */}
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Parter</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1">Bygherre</p>
                    <p className="text-sm font-bold text-gray-900">{bygherreNavn || "Bygherre"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1">Entreprenør</p>
                    <p className="text-sm font-bold text-gray-900">{kontrakt.haandvaerker_navn || "—"}</p>
                    {kontrakt.haandvaerker_firma && <p className="text-[10px] text-gray-400 mt-0.5">{kontrakt.haandvaerker_firma}</p>}
                  </div>
                </div>
              </div>

              {/* Aftalepunkter */}
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Aftalepunkter</p>
                <div className="space-y-0 divide-y divide-gray-50">
                  {kontrakt.total_pris && (
                    <div className="flex justify-between items-center py-2.5">
                      <p className="text-sm text-gray-500">Fast pris</p>
                      <p className="text-sm font-bold text-gray-900">{fmtKr(kontrakt.total_pris)} inkl. moms</p>
                    </div>
                  )}
                  {aftaltStartdato && (
                    <div className="flex justify-between items-center py-2.5">
                      <p className="text-sm text-gray-500">{tidsplanGodkendt ? "Aftalt opstart" : "Opstart"}</p>
                      <p className={`text-sm font-bold ${!erStartet ? "text-amber-600" : "text-gray-900"}`}>
                        {erStartet ? fmtDato(aftaltStartdato) : `${fmtDato(aftaltStartdato)} · om ${dageТilStart} dage`}
                      </p>
                    </div>
                  )}
                  {aftaltSlutdato && (
                    <div className="flex justify-between items-center py-2.5">
                      <p className="text-sm text-gray-500">{tidsplanGodkendt ? "Aftalt aflevering" : "Aflevering"}</p>
                      <p className="text-sm font-bold text-gray-900">{fmtDato(aftaltSlutdato)}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2.5">
                    <p className="text-sm text-gray-500">Aftalegrundlag</p>
                    <p className="text-sm font-bold text-gray-900">AB-Forbruger 2012</p>
                  </div>
                </div>
              </div>

              {/* Betalingsplan */}
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Betalingsplan</p>
                {kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0 ? (
                  <div className="space-y-2.5">
                    {kontrakt.betalingsplan.map((b, i) => {
                      const beloeb = kontrakt.total_pris && !isNaN(parseFloat(b.andel))
                        ? fmtKr(kontrakt.total_pris * (parseFloat(b.andel) / 100))
                        : null;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                            {i === 0 && <div className="w-2.5 h-2.5 rounded-full bg-[#1a5c38]" />}
                          </div>
                          <p className="text-sm text-gray-700 flex-1">{b.milepæl}</p>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900">{b.andel}</span>
                            {beloeb && <span className="text-xs text-gray-400 ml-2">{beloeb}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1a5c38] flex items-center justify-center flex-shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-sm text-gray-700">Betaling ved aflevering</p>
                    {kontrakt.total_pris && <p className="text-sm font-semibold text-gray-900 ml-auto">{fmtKr(kontrakt.total_pris)}</p>}
                  </div>
                )}
              </div>

              {/* Underskrifter */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="text-xs text-green-700 font-semibold">{bygherreNavn || "Bygherre"} · underskrevet</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="text-xs text-green-700 font-semibold">{kontrakt.haandvaerker_navn?.split(" ")[0] || "Entreprenør"} · underskrevet</p>
                </div>
              </div>
            </div>

            {/* Påkrav sendt-bekræftelse */}
            {paakravSendt && (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-sm font-semibold text-green-800">Påkrav sendt og registreret i logbogen.</p>
              </div>
            )}

            {/* Deadline-tæller */}
            {aftaltSlutdato && (
              <div className="mb-5">
                <DeadlineTæller
                  startdato={aftaltStartdato}
                  slutdato={aftaltSlutdato}
                  kanSendePaakrav={!!kontrakt.haandvaerker_email}
                  onSendPaakrav={() => {
                    const overskredetDage = aftaltSlutdato
                      ? Math.abs(Math.round((new Date(aftaltSlutdato).getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24)))
                      : 0;
                    const slutFormateret = aftaltSlutdato ? fmtDatoLang(aftaltSlutdato) : "";
                    setPaakravBesked(
                      `Kære ${kontrakt.haandvaerker_navn || "entreprenør"},\n\nJeg skal hermed gøre opmærksom på, at den aftalte afleveringsdato den ${slutFormateret} er overskredet med ${overskredetDage} ${overskredetDage === 1 ? "dag" : "dage"}.\n\nJeg anmoder om, at arbejdet afsluttes hurtigst muligt og senest til nedenstående frist. Såfremt dette ikke overholdes, forbeholder jeg mig retten til at søge erstatning for dokumenterede tab i henhold til AB-Forbruger 2012.\n\nMed venlig hilsen\n${bygherreNavn}`
                    );
                    setPaakravFrist("");
                    setVisPaakrav(true);
                  }}
                />
              </div>
            )}

            {/* Hurtige handlinger */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { href: `/projekt/${id}/logbog`,        ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: "Logbog" },
                { href: `/projekt/${id}/ekstraarbejde`, ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>, label: "Aftaleseddel" },
                { href: `/projekt/${id}/chat`,          ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: "Send besked" },
                { href: `/projekt/${id}/mangler`,       ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: "Registrér mangel" },
              ].map((a, i) => (
                <Link key={i} href={a.href} className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-4 hover:border-[#1a5c38]/20 hover:bg-[#f0f7f3] transition-all">
                  <div className="w-9 h-9 rounded-xl bg-[#f0f7f3] flex items-center justify-center">{a.ikon}</div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-snug">{a.label}</p>
                </Link>
              ))}
            </div>

            {/* AB-tips kompakt */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#1a5c38] text-white text-[10px] font-bold px-2 py-0.5 rounded">AB-Forbruger</span>
                <p className="text-xs text-gray-400">Husk disse rettigheder undervejs</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { tekst: "Ekstraarbejde aftales skriftligt inden opstart", para: "§ 23" },
                  { tekst: "Betal kun mod dokumenteret fremdrift", para: "§ 25 og § 37" },
                  { tekst: "Kræv afleveringsforretning når arbejdet er færdigt", para: "§ 38" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-600">{tip.tekst}</p>
                    <span className="text-[10px] font-bold text-[#1a5c38] whitespace-nowrap">{tip.para}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div id="besigtigelse">
            <BesigtigelseKort
              kontraktId={kontrakt.id}
              projektId={id}
              rolle="bygherre"
              legacyBesigtigelseDato={kontrakt.besigtigelse_dato}
              legacyBesigtigelseTid={kontrakt.besigtigelse_tid}
              legacyBesigtigelseBekraeftet={kontrakt.besigtigelse_bekraeftet}
            />
          </div>
          <Suspense><Chat bruger="bygherre" /></Suspense>

          {/* Påkrav-modal */}
          {visPaakrav && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </div>
                    <h2 className="font-bold text-gray-900">Send påkrav til entreprenøren</h2>
                  </div>
                  <p className="text-xs text-gray-400 ml-11 leading-relaxed">
                    Påkravet sendes som e-mail og registreres automatisk i logbogen som juridisk dokumentation.
                  </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Besked til entreprenøren</label>
                    <textarea
                      rows={9}
                      value={paakravBesked}
                      onChange={e => setPaakravBesked(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none transition-all font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Du kan redigere teksten før afsendelse.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Ny frist (valgfrit)</label>
                    <input
                      type="date"
                      value={paakravFrist}
                      onChange={e => setPaakravFrist(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Sæt en ny realistisk frist. Den fremgår tydeligt i e-mailen.</p>
                  </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setVisPaakrav(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Annuller
                  </button>
                  <button
                    onClick={sendPaakrav}
                    disabled={senderPaakrav || !paakravBesked.trim()}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {senderPaakrav ? "Sender..." : "Send påkrav"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Ikke-godkendt tilstand — vis status og send direkte til aftale
    const statusBeskrivelse = {
      udkast: "Aftalegrundlaget er et udkast. Udfyld felterne og inviter din entreprenør.",
      inviteret: `Invitation er sendt til ${kontrakt.haandvaerker_email}. Du afventer at entreprenøren åbner linket og udfylder sin del.`,
      forhandling: "Entreprenøren har foreslået ændringer. Gå til Aftale for at besvare dem.",
      bygherre_godkendt: "Du har godkendt aftalegrundlaget. Afventer nu entreprenørens underskrift.",
      haandvaerker_godkendt: "Entreprenøren har godkendt. Du mangler kun at give din endelige godkendelse.",
    }[kontrakt.status] ?? "";

    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-2xl mx-auto px-4 py-10">

          {/* Projekt-header */}
          <div className="mb-6">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.klasse} mb-3 inline-block`}>{st.label}</span>
            <h1 className="text-2xl font-bold text-gray-900">{kontrakt.titel || "Nyt projekt"}</h1>
          </div>

          {/* Statusforklaring + CTA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#1e3a2a]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 mb-1">Aftalegrundlag under udarbejdelse</p>
                <p className="text-sm text-gray-500 leading-relaxed">{statusBeskrivelse}</p>
                <Link
                  href={`/projekt/${id}/aftale`}
                  className="inline-flex items-center gap-2 mt-4 bg-[#1e3a2a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Gå til aftalegrundlag
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            </div>
          </div>

          <div id="besigtigelse">
            <BesigtigelseKort
              kontraktId={kontrakt.id}
              projektId={id}
              rolle="bygherre"
              legacyBesigtigelseDato={kontrakt.besigtigelse_dato}
              legacyBesigtigelseTid={kontrakt.besigtigelse_tid}
              legacyBesigtigelseBekraeftet={kontrakt.besigtigelse_bekraeftet}
            />
          </div>
        </div>
        <Suspense><Chat bruger="bygherre" /></Suspense>
      </div>
    );
  }

}
