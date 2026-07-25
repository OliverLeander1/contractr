"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import Chat from "@/components/Chat";
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
  oprettet_at: string;
}

interface LocalProjekt {
  titel: string;
  resumé: string;
  bygherreNavn?: string;
  haandvaerkerNavn?: string;
  haandvaerkerFirma?: string;
  accepteretDato: string;
  total: number;
  tilbudsposter: { id: string; beskrivelse: string; enhed: string; pris: string }[];
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " kr.";

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
  const [lokalProjekt, setLokalProjekt] = useState<LocalProjekt | null>(null);

  useEffect(() => {
    const hent = async () => {
      // Prøv Supabase først
      const supabase = createClient();
      const { data } = await supabase
        .from("kontrakter")
        .select("*")
        .eq("projekt_id", id)
        .order("oprettet_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setKontrakt(data);
        return;
      }

      // Fallback: localStorage (legacy)
      try {
        const raw = localStorage.getItem("contractr_projekt");
        if (raw) {
          setLokalProjekt(JSON.parse(raw));
        }
      } catch { /* ignorer */ }
      setKontrakt(null);
    };
    hent();
  }, [id]);

  if (kontrakt === "loading") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1e3a2a] rounded-full animate-spin" />
    </div>
  );

  // Intet projekt — hverken i Supabase eller localStorage
  if (!kontrakt && !lokalProjekt) return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Projekt ikke fundet</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Dette projekt eksisterer ikke eller du har ikke adgang til det.
        </p>
        <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#1e3a2a] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Tilbage til overblik
        </Link>
      </div>
    </div>
  );

  // Supabase-baseret projektvisning (ny flow)
  if (kontrakt) {
    const st = aftaleStatus[kontrakt.status] || { label: kontrakt.status, klasse: "bg-gray-100 text-gray-600" };
    const beggeGodkendt = kontrakt.status === "begge_godkendt";

    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.klasse}`}>
                {st.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {kontrakt.titel || "Nyt projekt"}
            </h1>
            {kontrakt.beskrivelse && (
              <p className="text-gray-500 text-sm mt-1 leading-relaxed max-w-2xl">{kontrakt.beskrivelse}</p>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">

              {/* Aftale-status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Aftalestatus</h2>

                {beggeGodkendt ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">Aftale indgået — begge parter har godkendt</p>
                      <p className="text-xs text-green-600 mt-0.5">Projektet er aktivt. Brug fanerne herover til at styre det videre forløb.</p>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Næste skridt */}
              {beggeGodkendt && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Næste skridt</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Bed om skriftlig tidsplan</p>
                        <p className="text-xs text-amber-700 leading-relaxed mt-0.5">AB-Forbruger § 12 — start- og slutdato bør være aftalt skriftligt.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Betal kun mod dokumenteret fremdrift</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">AB-Forbruger § 25 og § 37 — betaling kobles til faktisk udført arbejde.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Aftal ekstraarbejde skriftligt</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">AB-Forbruger § 23 — ekstraarbejde godkendes skriftligt inden opstart.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
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
                      <span className="text-xs text-gray-700">{new Date(kontrakt.startdato).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                  {kontrakt.slutdato && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Aflevering</span>
                      <span className="text-xs text-gray-700">{new Date(kontrakt.slutdato).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                  {kontrakt.haandvaerker_navn && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Håndværker</span>
                      <span className="text-xs text-gray-700">{kontrakt.haandvaerker_navn}</span>
                    </div>
                  )}
                  {kontrakt.haandvaerker_firma && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Firma</span>
                      <span className="text-xs text-gray-700">{kontrakt.haandvaerker_firma}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <Link href={`/projekt/${id}/aftale`} className="flex items-center justify-between text-xs font-semibold text-[#1e3a2a] hover:underline">
                    Aftalegrundlag →
                  </Link>
                  <Link href={`/projekt/${id}/betalinger`} className="flex items-center justify-between text-xs font-semibold text-[#1e3a2a] hover:underline">
                    Se økonomi →
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#1e3a2a] text-white text-[10px] font-bold px-2 py-0.5 rounded">AB-Forbruger</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Du kan tilbageholde betaling for mangelfuldt arbejde, mens den ubestridte del betales. § 25 stk. 3.
                </p>
                <Link href="/abforbruger" className="text-xs text-[#1e3a2a] font-semibold hover:underline">Læs mere →</Link>
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

  // Legacy: localStorage-baseret projekt
  const lp = lokalProjekt!;
  const acceptDato = new Date(lp.accepteretDato).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Tilbud accepteret {acceptDato}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{lp.titel}</h1>
          <p className="text-gray-500 text-sm mt-1">{lp.resumé}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Accepteret tilbud</h2>
            <Link href={`/projekt/${id}/aftale`} className="text-xs text-[#1e3a2a] font-semibold hover:underline">Opret aftalegrundlag →</Link>
          </div>
          {lp.haandvaerkerNavn && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-sm">
                {lp.haandvaerkerNavn.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{lp.haandvaerkerNavn}</p>
                {lp.haandvaerkerFirma && <p className="text-xs text-gray-400">{lp.haandvaerkerFirma}</p>}
              </div>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-2 text-xs font-semibold text-gray-400">Opgave</th>
                <th className="pb-2 text-xs font-semibold text-gray-400 text-right">Pris inkl. moms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lp.tilbudsposter.map(p => {
                const pris = (parseFloat(p.pris) || 0) * 1.25;
                return (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 text-gray-800">{p.beskrivelse}</td>
                    <td className="py-2.5 text-right font-medium text-gray-800">{pris > 0 ? fmtKr(pris) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="pt-3 font-bold text-gray-900">Total inkl. moms</td>
                <td className="pt-3 text-right font-bold text-[#1e3a2a]">{fmtKr(lp.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <Suspense><Chat bruger="bygherre" /></Suspense>
    </div>
  );
}
