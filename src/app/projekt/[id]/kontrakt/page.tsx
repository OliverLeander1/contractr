"use client";

import { use, useEffect, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import Link from "next/link";

interface TilbudsPost { id: string; beskrivelse: string; enhed: string; pris: string; }
interface GemtProjekt {
  titel: string;
  resumé: string;
  dokument: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
  haandvaerkerNavn?: string;
  haandvaerkerFirma?: string;
  accepteretDato: string;
  total: number;
  tilbudsposter: TilbudsPost[];
}

const fmtKr = (n: number) => n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr.";

export default function Kontrakt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [projekt, setProjekt] = useState<GemtProjekt | null | "loading">("loading");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_projekt");
      setProjekt(raw ? JSON.parse(raw) : null);
    } catch { setProjekt(null); }
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
        <p className="text-gray-500">Ingen kontrakt fundet. Accepter et tilbud for at se kontrakten her.</p>
        <Link href="/opret" className="mt-4 inline-block text-primary text-sm underline">Gaa til opret</Link>
      </div>
    </div>
  );

  const acceptDato = new Date(projekt.accepteretDato).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  const total = projekt.total;

  // Auto-generer betalingsplan fra total
  const betalingsplan = [
    { milepæl: "Opstart", andel: "20%", beløb: fmtKr(total * 0.20), status: "kommende" },
    { milepæl: "Halvvejs", andel: "30%", beløb: fmtKr(total * 0.30), status: "kommende" },
    { milepæl: "Naesten faerdig", andel: "30%", beløb: fmtKr(total * 0.30), status: "kommende" },
    { milepæl: "Aflevering", andel: "20%", beløb: fmtKr(total * 0.20), status: "kommende" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kontrakt</h1>
            <p className="text-sm text-gray-400 mt-1">Accepteret {acceptDato} · AB-Forbruger 2012</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Tilbud accepteret
            </span>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Print / PDF
            </button>
          </div>
        </div>

        <div className="bg-accent border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded flex-shrink-0">AB-Forbruger 2012</span>
          <p className="text-sm text-primary leading-relaxed">Denne kontrakt er baseret pa AB-Forbruger standardbetingelserne, som giver dig som forbruger den bedste beskyttelse ved private byggesager over 3.000 kr.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">

          <div className="text-center mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Entreprisekontrakt</p>
            <h2 className="text-xl font-bold text-gray-900">{projekt.titel}</h2>
            <p className="text-sm text-gray-500 mt-1">Baseret pa AB-Forbruger (Almindelige betingelser for aftaler om byggearbejder for forbrugere, 2012)</p>
          </div>

          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest text-primary">§ 1 - Parterne</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Bygherre (forbruger)</p>
                  <p className="font-semibold text-gray-900">{projekt.bygherreNavn || "Bygherre"}</p>
                  {projekt.bygherreKontakt && <p className="text-gray-500">{projekt.bygherreKontakt}</p>}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Entreprenør</p>
                  {projekt.haandvaerkerNavn ? (
                    <>
                      <p className="font-semibold text-gray-900">{projekt.haandvaerkerNavn}</p>
                      {projekt.haandvaerkerFirma && <p className="text-gray-500 text-sm">{projekt.haandvaerkerFirma}</p>}
                    </>
                  ) : (
                    <p className="text-gray-400 text-xs mt-1">Udfyldes af håndværker inden underskrift</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest text-primary">§ 2 - Arbejdets omfang</h3>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{projekt.dokument}</pre>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest text-primary">§ 3 - Entreprisesum</h3>
              <p className="mb-5">Entreprisesummen er aftalt til fast pris. Ændringer i arbejdets art og omfang aftales skriftligt jf. AB-Forbruger § 23.</p>
              <div className="bg-[#f0f7f3] border border-green-100 rounded-xl px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Samlet entreprisesum</p>
                  <p className="text-xs text-gray-400">Fast pris inkl. moms · AB-Forbruger § 23</p>
                </div>
                <p className="text-2xl font-bold text-[#1e3a2a]">{fmtKr(total)}</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">Detaljeret tilbudsliste fra entreprenøren vedlægges som bilag og er en del af aftalegrundlaget.</p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest text-primary">§ 4 - Betalingsplan</h3>
              <p className="mb-4">Betaling sker i rater koblet til fremdrift jf. AB-Forbruger § 26.</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 font-semibold text-gray-500">Milepael</th>
                    <th className="pb-2 font-semibold text-gray-500">Andel</th>
                    <th className="pb-2 font-semibold text-gray-500">Belob</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {betalingsplan.map((b, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 text-gray-800">{b.milepæl}</td>
                      <td className="py-2 pr-3 text-gray-500">{b.andel}</td>
                      <td className="py-2 font-medium text-gray-800">{b.beløb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest text-primary">§ 5 - Aflevering og mangler</h3>
              <p>Arbejdet afleveres ved skriftlig meddelelse til forbrugeren jf. AB-Forbruger § 37. Forbrugeren har 5 ars reklamationsret pa mangler fra afleveringsdatoen. Forbrugeren kan tilbageholde betaling svarende til manglernes udbedring ved dokumenterede mangler jf. § 25, stk. 3.</p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest text-primary">§ 6 - Aftalegrundlag</h3>
              <p>AB-Forbruger 2012 er gaeldende for denne aftale i sin helhed. Fravigelse gaeldes kun hvis det sker tydeligt og udtrykkeligt jf. § 1, stk. 2.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Underskrifter</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-green-100 bg-green-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Bygherre</p>
              <p className="text-sm font-semibold text-gray-900 mb-2">{projekt.bygherreNavn || "Bygherre"}</p>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-xs text-green-700">Accepteret {acceptDato}</p>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Entreprenor</p>
              <p className="text-xs text-gray-400 mt-2">Haandvaerkeren skal bekraefte aftalen skriftligt</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <p className="text-xs text-amber-600 font-medium">Afventer bekraeftelse</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/abforbruger" className="flex-1 text-center border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Laes AB-Forbruger
          </Link>
          <Link href={`/projekt/${id}/aflevering`} className="flex-1 text-center bg-primary text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
            Ga til afleveringsforretning →
          </Link>
        </div>
      </div>
    </div>
  );
}
