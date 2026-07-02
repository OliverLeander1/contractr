"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import Chat from "@/components/Chat";

interface TilbudsPost { id: string; beskrivelse: string; enhed: string; pris: string; }
interface GemtProjekt {
  titel: string;
  resumé: string;
  bygherreNavn?: string;
  haandvaerkerNavn?: string;
  haandvaerkerFirma?: string;
  accepteretDato: string;
  total: number;
  tilbudsposter: TilbudsPost[];
}

const fmtKr = (n: number) => n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

export default function ProjektOversigt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [projekt, setProjekt] = useState<GemtProjekt | null | "loading">("loading");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_projekt");
      setProjekt(raw ? JSON.parse(raw) : null);
    } catch {
      setProjekt(null);
    }
  }, []);

  if (projekt === "loading") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  if (!projekt) return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Intet aktivt projekt endnu</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Projektet oprettes automatisk, naar du accepterer et tilbud fra en haandvaerker.
          Start med at beskrive dit projekt og indhente tilbud.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/opret" className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity">
            Beskriv dit projekt →
          </Link>
          <Link href="/opret/upload" className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Har du allerede et tilbud? Tjek det her
          </Link>
        </div>
      </div>
    </div>
  );

  const acceptDato = new Date(projekt.accepteretDato).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Projekt header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Tilbud accepteret {acceptDato}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{projekt.titel}</h1>
          <p className="text-gray-500 text-sm mt-1">{projekt.resumé}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Venstre — hoveddelen */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tilbudsoversigt */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Accepteret tilbud</h2>
                <Link href={`/projekt/${id}/kontrakt`} className="text-xs text-primary font-semibold hover:underline">Se fuld kontrakt →</Link>
              </div>

              {projekt.haandvaerkerNavn && (
                <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {projekt.haandvaerkerNavn.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{projekt.haandvaerkerNavn}</p>
                    {projekt.haandvaerkerFirma && <p className="text-xs text-gray-400">{projekt.haandvaerkerFirma}</p>}
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 text-xs font-semibold text-gray-400">Nr.</th>
                    <th className="pb-2 text-xs font-semibold text-gray-400">Opgave</th>
                    <th className="pb-2 text-xs font-semibold text-gray-400 text-right">Pris inkl. moms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projekt.tilbudsposter.map((p, i) => {
                    const prisInklMoms = (parseFloat(p.pris) || 0) * 1.25;
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 pr-3 text-gray-800">{p.beskrivelse}</td>
                        <td className="py-2.5 text-right font-medium text-gray-800">{prisInklMoms > 0 ? fmtKr(prisInklMoms) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={2} className="pt-3 font-bold text-gray-900">Total inkl. moms</td>
                    <td className="pt-3 text-right font-bold text-primary">{fmtKr(projekt.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Næste skridt */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Næste skridt</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Bed om skriftlig tidsplan</p>
                    <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                      AB-Forbruger § 12 anbefaler at start- og slutdato er aftalt skriftligt. Kontakt haandvaerkeren og bed om en tidsplan.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Aftal skriftlig procedure for ekstraarbejde</p>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                      Al ekstraarbejde ud over det aftalte skal godkendes skriftligt inden opstart jf. AB-Forbruger § 23.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Betal kun mod dokumenteret fremdrift</p>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                      Betaling bor kobles til milep&aelig;le og faktisk udfort arbejde jf. AB-Forbruger § 25 og § 37.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Højre kolonne — sidebar */}
          <div className="space-y-5">

            {/* Projekt-summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Projektoverblik</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Samlet tilbudssum</span>
                  <span className="text-sm font-bold text-primary">{fmtKr(projekt.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Tilbudsposter</span>
                  <span className="text-sm font-semibold text-gray-700">{projekt.tilbudsposter.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Accepteret</span>
                  <span className="text-xs text-gray-700">{acceptDato}</span>
                </div>
                {projekt.bygherreNavn && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Bygherre</span>
                    <span className="text-xs text-gray-700">{projekt.bygherreNavn}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <Link href={`/projekt/${id}/kontrakt`} className="flex items-center justify-between text-xs font-semibold text-primary hover:underline">
                  Se kontrakt →
                </Link>
                <Link href={`/projekt/${id}/betalinger`} className="flex items-center justify-between text-xs font-semibold text-primary hover:underline">
                  Se okonomi →
                </Link>
              </div>
            </div>

            {/* AB-Forbruger info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">AB-Forbruger</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Vidste du det?</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Du kan tilbageholde betaling for mangelfuldt arbejde, mens den ubestridte del betales. AB-Forbruger § 25 stk. 3.
              </p>
              <Link href="/abforbruger" className="text-xs text-primary font-semibold hover:underline">Laes mere om dine rettigheder →</Link>
            </div>

            {/* Book rådgiver */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Har du brug for hjælp?</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">En byggesagkyndig kan gennemga projektet og hjaelpe dig undervejs.</p>
              <Link
                href="/tilkoeb"
                className="block w-full text-center bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Book radgiver
              </Link>
            </div>

          </div>
        </div>
      </div>
      <Suspense><Chat bruger="bygherre" /></Suspense>
    </div>
  );
}
