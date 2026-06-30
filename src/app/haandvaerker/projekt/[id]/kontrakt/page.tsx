"use client";

import { use, useState } from "react";
import Link from "next/link";

export default function HaandvaerkerKontrakt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [underskrevet, setUnderskrevet] = useState(false);
  const [accepteret, setAkcepteret] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/haandvaerker/projekt/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tilbage til projekt
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kontrakt til underskrift</h1>
            <p className="text-sm text-gray-400 mt-1">Indvendig renovering, Valby · TM Byg ApS</p>
          </div>
          {underskrevet && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Underskrevet
            </span>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded flex-shrink-0">AB-Forbruger</span>
          <p className="text-sm text-gray-600">Denne kontrakt er baseret på AB-Forbruger standardbetingelserne.</p>
        </div>

        {/* Kontraktindhold */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-5">Aftalens indhold</h2>
          <div className="divide-y divide-gray-50">
            {[
              { label: "Bygherre", value: "Camilla Jensen, Valby Langgade 85, 2500 Valby" },
              { label: "Entreprenør", value: "TM Byg ApS, CVR 12345678" },
              { label: "Arbejdets omfang", value: "Indvendig renovering inkl. gipsvægge, maling og lettere el-arbejde" },
              { label: "Entreprisesum", value: "112.500 kr. inkl. moms (fast pris)" },
              { label: "Startdato", value: "12. marts 2025" },
              { label: "Slutdato", value: "30. september 2025" },
              { label: "Ekstraarbejde", value: "Aftales skriftligt inden udførelse. Pris oplyses på forhånd." },
              { label: "Betalingsbetingelser", value: "Betaling sker ved godkendelse af milepæle. Se betalingsplan." },
              { label: "Reklamationsret", value: "5 år fra aflevering jf. AB-Forbruger § 36" },
            ].map((p) => (
              <div key={p.label} className="py-3.5 grid grid-cols-3 gap-4">
                <p className="text-sm text-gray-400 font-medium">{p.label}</p>
                <p className="text-sm text-gray-900 col-span-2">{p.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Betalingsplan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Betalingsplan</h2>
          <div className="space-y-2">
            {[
              { navn: "Opstart og nedrivning (20%)", beløb: "22.500 kr.", forfald: "12. mar. 2025" },
              { navn: "Gipsvægge og installationer (25%)", beløb: "28.125 kr.", forfald: "30. apr. 2025" },
              { navn: "Malerarbejde afsluttet (25%)", beløb: "28.125 kr.", forfald: "15. jun. 2025" },
              { navn: "Endelig aflevering (30%)", beløb: "33.750 kr.", forfald: "30. sep. 2025" },
            ].map((b) => (
              <div key={b.navn} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700">{b.navn}</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{b.beløb}</p>
                  <p className="text-xs text-gray-400">{b.forfald}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underskrift */}
        {!underskrevet ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Underskriv kontrakten</h2>
            <p className="text-sm text-gray-400 mb-5">Ved at underskrive bekræfter du at du har læst og accepterer ovenstående betingelser.</p>
            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input type="checkbox" checked={accepteret} onChange={e => setAkcepteret(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
              <p className="text-sm text-gray-600 leading-relaxed">Jeg bekræfter at jeg har læst kontrakten og accepterer betingelserne, herunder AB-Forbruger standardbetingelserne.</p>
            </label>
            <button
              onClick={() => accepteret && setUnderskrevet(true)}
              className={`w-full font-bold py-3.5 rounded-xl transition-all ${accepteret ? "bg-primary text-white hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              Underskriv digitalt
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Kontrakt underskrevet</h3>
            <p className="text-sm text-gray-500 mb-4">Bygherre er notificeret. Du kan nu gå i gang med arbejdet.</p>
            <Link href={`/haandvaerker/projekt/${id}`} className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Gå til projektet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
