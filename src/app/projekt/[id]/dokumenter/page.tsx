"use client";

import { use, useState } from "react";
import ProjektNav from "@/components/ProjektNav";

const dokumenter = [
  { navn: "Kontrakt (underskrevet)", type: "PDF", størrelse: "1,2 MB", dato: "12. mar. 2025", kategori: "Kontrakt", uploadetAf: "Contractr" },
  { navn: "Tilbud fra TM Byg ApS", type: "PDF", størrelse: "890 KB", dato: "8. mar. 2025", kategori: "Tilbud", uploadetAf: "Camilla Jensen" },
  { navn: "Plantegning, stueplan", type: "PDF", størrelse: "4,8 MB", dato: "12. mar. 2025", kategori: "Tegninger", uploadetAf: "Camilla Jensen" },
  { navn: "Aftaleseddel #1 - ekstra el", type: "PDF", størrelse: "345 KB", dato: "2. apr. 2025", kategori: "Aftalesedler", uploadetAf: "TM Byg ApS" },
  { navn: "Aftaleseddel #2 - nye fliser", type: "PDF", størrelse: "290 KB", dato: "15. apr. 2025", kategori: "Aftalesedler", uploadetAf: "TM Byg ApS" },
  { navn: "Flisevalg - badeværelse (til godkendelse)", type: "JPG", størrelse: "2,1 MB", dato: "20. apr. 2025", kategori: "Materialer", uploadetAf: "TM Byg ApS", afventerGodkendelse: true },
  { navn: "Tidsplan v2", type: "PDF", størrelse: "780 KB", dato: "15. mar. 2025", kategori: "Tidsplan", uploadetAf: "TM Byg ApS" },
];

const kategorier = ["Alle", "Kontrakt", "Tilbud", "Tegninger", "Aftalesedler", "Materialer", "Tidsplan"];

const ikonForType = (type: string) => {
  if (type === "JPG" || type === "PNG") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
};

export default function Dokumenter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [aktivKategori, setAktivKategori] = useState("Alle");

  const synligeDokumenter = dokumenter.filter(d =>
    !d.afventerGodkendelse && (aktivKategori === "Alle" || d.kategori === aktivKategori)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dokumenter</h1>
            <p className="text-sm text-gray-400 mt-1">Alle filer delt mellem bygherre og entreprenør</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload dokument
          </button>
        </div>

        {/* Til godkendelse */}
        {dokumenter.filter(d => d.afventerGodkendelse).map((d) => (
          <div key={d.navn} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-0.5">Afventer din godkendelse</p>
                  <p className="text-sm font-semibold text-gray-900">{d.navn}</p>
                  <p className="text-xs text-gray-400">Uploadet af {d.uploadetAf} · {d.dato}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Godkend</button>
                <button className="border border-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Afvis</button>
              </div>
            </div>
          </div>
        ))}

        {/* Upload zone */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center mb-6 hover:border-primary/40 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Træk og slip filer her</p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG, ZIP - op til 50 MB</p>
        </div>

        {/* Kategorier */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {kategorier.map((k) => (
            <button
              key={k}
              onClick={() => setAktivKategori(k)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${k === aktivKategori ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Dokumentliste */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {synligeDokumenter.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Ingen dokumenter i denne kategori</p>
          ) : synligeDokumenter.map((d) => (
            <div key={d.navn} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {ikonForType(d.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.navn}</p>
                  <p className="text-xs text-gray-400">{d.type} · {d.størrelse} · {d.dato} · {d.uploadetAf}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{d.kategori}</span>
                <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
