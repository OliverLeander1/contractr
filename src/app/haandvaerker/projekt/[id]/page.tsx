"use client";

import { use, useState } from "react";
import Link from "next/link";
import Chat from "@/components/Chat";

const projekter: Record<string, {
  titel: string; bygherre: string; adresse: string; entreprisesum: string;
  aflevering: string; status: string; type: string;
  næsteMilepæl?: string; næsteBetaling?: string; åbneMangler: number;
  milepæle: { id: number; navn: string; dato: string; status: string }[];
  betalinger: { navn: string; beløb: string; status: string; dato: string }[];
}> = {
  "1": {
    titel: "Indvendig renovering, Valby", bygherre: "Camilla Jensen",
    adresse: "Valby Langgade 85, 2500 Valby", entreprisesum: "112.500 kr.",
    aflevering: "30. sep. 2025", status: "igang", type: "Renovering",
    næsteMilepæl: "Gipsvægge", næsteBetaling: "28.125 kr.", åbneMangler: 1,
    milepæle: [
      { id: 1, navn: "Kontrakt underskrevet", dato: "12. mar. 2025", status: "done" },
      { id: 2, navn: "Nedrivning", dato: "28. mar. 2025", status: "done" },
      { id: 3, navn: "Gipsvægge", dato: "30. apr. 2025", status: "active" },
      { id: 4, navn: "Malerarbejde", dato: "15. jun. 2025", status: "upcoming" },
      { id: 5, navn: "Aflevering", dato: "30. sep. 2025", status: "upcoming" },
    ],
    betalinger: [
      { navn: "Opstart og nedrivning", beløb: "22.500 kr.", status: "udbetalt", dato: "14. mar. 2025" },
      { navn: "Gipsvægge og installationer", beløb: "28.125 kr.", status: "udbetalt", dato: "2. maj 2025" },
      { navn: "Malerarbejde afsluttet", beløb: "28.125 kr.", status: "afventer bygherre", dato: "15. jun. 2025" },
      { navn: "Endelig aflevering", beløb: "33.750 kr.", status: "ikke forfalden", dato: "30. sep. 2025" },
    ],
  },
  "2": {
    titel: "Nyt badeværelse, Frederiksberg", bygherre: "Henrik Møller",
    adresse: "Smallegade 22, 2000 Frederiksberg", entreprisesum: "68.500 kr.",
    aflevering: "15. aug. 2025", status: "igang", type: "Badeværelse",
    næsteMilepæl: "Fliser og VVS", næsteBetaling: "17.125 kr.", åbneMangler: 0,
    milepæle: [
      { id: 1, navn: "Kontrakt underskrevet", dato: "3. apr. 2025", status: "done" },
      { id: 2, navn: "Nedrivning og klargøring", dato: "20. apr. 2025", status: "done" },
      { id: 3, navn: "Fliser og VVS", dato: "20. jun. 2025", status: "active" },
      { id: 4, navn: "Aflevering", dato: "15. aug. 2025", status: "upcoming" },
    ],
    betalinger: [
      { navn: "Opstart", beløb: "17.125 kr.", status: "udbetalt", dato: "5. apr. 2025" },
      { navn: "Fliser og VVS", beløb: "17.125 kr.", status: "afventer bygherre", dato: "20. jun. 2025" },
      { navn: "Aflevering", beløb: "34.250 kr.", status: "ikke forfalden", dato: "15. aug. 2025" },
    ],
  },
  "3": {
    titel: "Tagudskiftning, Hellerup", bygherre: "Mette Lund",
    adresse: "Strandvejen 12, 2900 Hellerup", entreprisesum: "245.000 kr.",
    aflevering: "15. nov. 2024", status: "afsluttet", type: "Tag",
    åbneMangler: 0,
    milepæle: [
      { id: 1, navn: "Kontrakt underskrevet", dato: "2. sep. 2024", status: "done" },
      { id: 2, navn: "Nedtagning af gammelt tag", dato: "20. sep. 2024", status: "done" },
      { id: 3, navn: "Ny tagkonstruktion", dato: "18. okt. 2024", status: "done" },
      { id: 4, navn: "Aflevering og godkendelse", dato: "15. nov. 2024", status: "done" },
    ],
    betalinger: [
      { navn: "Opstart", beløb: "61.250 kr.", status: "udbetalt", dato: "4. sep. 2024" },
      { navn: "Halvvejs", beløb: "91.875 kr.", status: "udbetalt", dato: "20. okt. 2024" },
      { navn: "Aflevering", beløb: "91.875 kr.", status: "udbetalt", dato: "17. nov. 2024" },
    ],
  },
};

export default function HaandvaerkerProjekt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projekt = projekter[id] ?? projekter["1"];
  const { milepæle, betalinger } = projekt;
  const [aktivTab, setAktivTab] = useState("overblik");
  const [uploadBesked, setUploadBesked] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded">Håndværker</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">T</div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">Thomas Madsen</p>
              <p className="text-xs text-gray-400">TM Byg ApS</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Projektheader */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{projekt.titel}</h1>
                {projekt.status === "afsluttet"
                  ? <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">Afsluttet</span>
                  : <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">I gang</span>
                }
              </div>
              <p className="text-sm text-gray-400">Bygherre: {projekt.bygherre} · {projekt.adresse}</p>
              <p className="text-sm text-gray-400 mt-0.5">Entreprisesum: <span className="font-semibold text-gray-700">{projekt.entreprisesum}</span> · Aflevering: <span className="font-semibold text-gray-700">{projekt.aflevering}</span></p>
            </div>
            <Link
              href={`/haandvaerker/projekt/${id}/kontrakt`}
              className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 bg-accent px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Se kontrakt
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: "overblik", label: "Overblik" },
            { id: "tidsplan", label: "Tidsplan" },
            { id: "betaling", label: "Betaling" },
            { id: "dokumenter", label: "Dokumenter" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setAktivTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${aktivTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overblik */}
        {aktivTab === "overblik" && (
          <div className="space-y-5">
            {projekt.status === "afsluttet" ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Projekt afsluttet</h2>
                <p className="text-sm text-gray-400 mb-6">Alle milepæle er gennemført og betaling modtaget</p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Total entreprisesum</p>
                    <p className="text-lg font-bold text-gray-900">{projekt.entreprisesum}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Afsluttet</p>
                    <p className="text-lg font-bold text-gray-900">{projekt.aflevering}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Næste handling */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Din næste handling</h2>
                  <div className="bg-accent rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-primary mb-1">Marker &ldquo;{projekt.næsteMilepæl}&rdquo; som færdig</p>
                    <p className="text-sm text-gray-500 leading-relaxed">Når du markerer milepælen som færdig, bliver bygherre notificeret og kan godkende betalingen på {projekt.næsteBetaling}.</p>
                  </div>
                  <button className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                    Marker {projekt.næsteMilepæl} som færdig ✓
                  </button>
                </div>

                {/* Status kort */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs text-gray-400 mb-1">Næste betaling</p>
                    <p className="text-xl font-bold text-gray-900">{projekt.næsteBetaling}</p>
                    <p className="text-xs text-gray-400 mt-1">Afventer din markering af {projekt.næsteMilepæl}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs text-gray-400 mb-1">Åbne mangler fra bygherre</p>
                    <p className={`text-xl font-bold ${projekt.åbneMangler > 0 ? "text-red-600" : "text-green-600"}`}>{projekt.åbneMangler}</p>
                    <p className="text-xs text-gray-400 mt-1">{projekt.åbneMangler > 0 ? "Kræver din tilbagemelding" : "Ingen åbne mangler"}</p>
                  </div>
                </div>

                {/* Åben mangel */}
                {projekt.åbneMangler > 0 && (
                  <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">Mangel registreret af bygherre</p>
                        <p className="text-sm text-gray-500 mb-3">&ldquo;Skæve fliser i badeværelse&rdquo; - bygherre tilbageholder 5.000 kr.</p>
                        <div className="flex gap-2">
                          <button className="text-sm font-semibold text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-accent transition-colors">
                            Se detaljer
                          </button>
                          <button className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            Giv tilbagemelding
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tidsplan */}
        {aktivTab === "tidsplan" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Tidsplan og milepæle</h2>
            <div className="space-y-3">
              {milepæle.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-4 rounded-xl border ${m.status === "active" ? "border-primary/30 bg-accent" : "border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.status === "done" ? "bg-green-100" : m.status === "active" ? "bg-primary" : "bg-gray-100"}`}>
                      {m.status === "done" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      {m.status === "active" && <div className="w-3 h-3 rounded-full bg-white" />}
                      {m.status === "upcoming" && <span className="text-xs text-gray-400 font-bold">{m.id}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${m.status === "active" ? "text-primary" : "text-gray-900"}`}>{m.navn}</p>
                      <p className="text-xs text-gray-400">{m.dato}</p>
                    </div>
                  </div>
                  {m.status === "active" && (
                    <button className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                      Marker færdig
                    </button>
                  )}
                  {m.status === "done" && <span className="text-xs text-green-600 font-semibold">Afsluttet</span>}
                  {m.status === "upcoming" && <span className="text-xs text-gray-400">Kommende</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Betaling */}
        {aktivTab === "betaling" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Din betalingsplan</h2>
            <div className="space-y-3">
              {betalinger.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.navn}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Forfald: {b.dato}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{b.beløb}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      b.status === "udbetalt" ? "bg-green-100 text-green-700" :
                      b.status === "afventer bygherre" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {b.status === "udbetalt" ? "Udbetalt" : b.status === "afventer bygherre" ? "Afventer bygherre" : "Ikke forfalden"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
              <p className="text-sm font-semibold text-gray-900">Total entreprisesum</p>
              <p className="text-sm font-bold text-gray-900">{projekt.entreprisesum}</p>
            </div>
          </div>
        )}

        {/* Dokumenter */}
        {aktivTab === "dokumenter" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Upload til bygherre</h2>
              <p className="text-sm text-gray-400 mb-4">Send billeder, dokumentation eller materialevalg til bygherrens godkendelse</p>
              <div
                onClick={() => setUploadBesked(true)}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Klik for at uploade</p>
                <p className="text-xs text-gray-400 mt-1">Billeder, PDF, ZIP - op til 50 MB</p>
              </div>
              {uploadBesked && (
                <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="text-sm text-green-700 font-medium">Fil uploaded - bygherre kan nu se den</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Projektdokumenter</h2>
              <div className="space-y-2">
                {[
                  { navn: "Kontrakt (underskrevet)", type: "PDF", dato: "12. mar. 2025" },
                  { navn: "Plantegning, stueplan", type: "PDF", dato: "12. mar. 2025" },
                  { navn: "Tidsplan v2", type: "PDF", dato: "15. mar. 2025" },
                ].map((d) => (
                  <div key={d.navn} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.navn}</p>
                        <p className="text-xs text-gray-400">{d.type} · {d.dato}</p>
                      </div>
                    </div>
                    <button className="text-xs text-primary font-semibold hover:underline">Download</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Chat bruger="haandvaerker" />
    </div>
  );
}
