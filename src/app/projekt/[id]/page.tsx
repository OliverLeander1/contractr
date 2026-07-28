"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import Chat from "@/components/Chat";
import BesigtigelseKort from "@/components/BesigtigelseKort";
import { createClient } from "@/lib/supabase";

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
  betalingsplan: { milepæl: string; andel: string }[] | null;
  oprettet_at: string;
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

    if (beggeGodkendt) {
      const dageТilStart = kontrakt.startdato ? dageImellem(idag, kontrakt.startdato) : null;
      const erStartet    = dageТilStart !== null && dageТilStart <= 0;

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
                  {kontrakt.startdato && (
                    <div className="flex justify-between items-center py-2.5">
                      <p className="text-sm text-gray-500">Opstart</p>
                      <p className={`text-sm font-bold ${!erStartet ? "text-amber-600" : "text-gray-900"}`}>
                        {erStartet ? fmtDato(kontrakt.startdato) : `${fmtDato(kontrakt.startdato)} · om ${dageТilStart} dage`}
                      </p>
                    </div>
                  )}
                  {kontrakt.slutdato && (
                    <div className="flex justify-between items-center py-2.5">
                      <p className="text-sm text-gray-500">Aflevering</p>
                      <p className="text-sm font-bold text-gray-900">{fmtDato(kontrakt.slutdato)}</p>
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

            {/* Hurtige handlinger */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { href: `/projekt/${id}/ekstraarbejde`, ikon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>, label: "Ny aftaleseddel" },
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
          <BesigtigelseKort kontraktId={kontrakt.id} projektId={id} rolle="bygherre" />
          <Suspense><Chat bruger="bygherre" /></Suspense>
        </div>
      );
    }

    // Ikke-godkendt tilstand
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-6xl mx-auto px-6 py-8">

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.klasse}`}>{st.label}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{kontrakt.titel || "Nyt projekt"}</h1>
            {kontrakt.beskrivelse && (
              <p className="text-gray-500 text-sm mt-1 leading-relaxed max-w-2xl">{kontrakt.beskrivelse}</p>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <BesigtigelseKort kontraktId={kontrakt.id} projektId={id} rolle="bygherre" />
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Aftalestatus</h2>
                <div className="flex items-start gap-3 p-4 bg-[#1e3a2a]/5 border border-[#1e3a2a]/15 rounded-xl hover:bg-[#1e3a2a]/10 transition-colors">
                  <div className="w-9 h-9 bg-[#1e3a2a]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1e3a2a]">Aftalegrundlag er under udarbejdelse</p>
                    <p className="text-xs text-[#1e3a2a]/70 mt-0.5 leading-relaxed">
                      {kontrakt.status === "udkast" && "Udfyld kontraktfelterne og inviter håndværkeren."}
                      {kontrakt.status === "inviteret" && `Invitation sendt til ${kontrakt.haandvaerker_email}. Afventer at håndværkeren åbner linket.`}
                      {kontrakt.status === "forhandling" && "Håndværkeren har foreslået ændringer. Gå til Aftale for at besvare dem."}
                      {kontrakt.status === "bygherre_godkendt" && "Du har godkendt. Afventer håndværkerens godkendelse."}
                      {kontrakt.status === "haandvaerker_godkendt" && "Håndværkeren har godkendt. Gå til Aftale for at give din godkendelse."}
                    </p>
                    <Link href={`/projekt/${id}/aftale`} className="inline-block mt-3 text-xs font-bold text-[#1e3a2a] underline underline-offset-2">
                      Gå til aftalegrundlag →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Projektoverblik</h3>
                <div className="space-y-3">
                  {kontrakt.total_pris && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Entreprisesum</span>
                      <span className="text-sm font-bold text-[#1e3a2a]">{fmtKr(kontrakt.total_pris)}</span>
                    </div>
                  )}
                  {kontrakt.startdato && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Opstart</span>
                      <span className="text-xs text-gray-700">{fmtDato(kontrakt.startdato)}</span>
                    </div>
                  )}
                  {kontrakt.slutdato && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Aflevering</span>
                      <span className="text-xs text-gray-700">{fmtDato(kontrakt.slutdato)}</span>
                    </div>
                  )}
                  {kontrakt.haandvaerker_navn && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Håndværker</span>
                      <span className="text-xs text-gray-700">{kontrakt.haandvaerker_navn}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Brug for hjælp?</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">En byggesagkyndig kan gennemgå projektet og hjælpe undervejs.</p>
                <Link href="/tilkoeb" className="block w-full text-center bg-[#1e3a2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                  Book rådgiver
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Suspense><Chat bruger="bygherre" /></Suspense>
      </div>
    );
  }

}
