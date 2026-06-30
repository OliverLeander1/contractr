"use client";

import { use } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

const mangler = [
  {
    id: 1,
    titel: "Skæve fliser i badeværelse",
    beskrivelse: "Flere fliser er lagt med synlig skævhed. Murer afviser, men tolerance er overskredet.",
    dato: "2. maj 2025",
    status: "åben",
    svar: "Håndværker: Fliserne er inden for tolerance.",
    beløbTilbageholdt: "5.000 kr.",
  },
];

export default function Mangler({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mangler</h1>
            <p className="text-sm text-gray-400 mt-1">Registrér og følg op på fejl og mangler i arbejdet</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrér mangel
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <ABTip
            paragraf="AB-Forbruger § 42"
            titel="Reklamér så snart du opdager en mangel"
            resumé="Du kan kun påberåbe dig mangler, som håndværkeren har fået meddelelse om inden rimelig tid efter, at manglerne er eller burde have været opdaget. Gør du det her på platformen, er din reklamation datostemplet og juridisk dokumenteret."
            detaljer="Reklamationsfristen gælder ikke, hvis håndværkeren har gjort sig skyldig i groft uforsvarlige forhold. Vi sender automatisk et mangelbrev med reference til AB-Forbruger § 42."
            type="vigtig"
          />
          <ABTip
            paragraf="AB-Forbruger § 43"
            titel="Håndværkeren har pligt og ret til at udbedre"
            resumé="Håndværkeren har pligt og ret til inden rimelig tid at afhjælpe mangler. Sker det ikke, kan du lade en anden udbedre for håndværkerens regning - eller kræve afslag i prisen."
            detaljer="Du kan også lade mangler udbedre for håndværkerens regning, når afhjælpning er uopsættelig og håndværkeren ikke umiddelbart kan foretage den, eller når du har grund til at antage, at han ikke vil foretage afhjælpning på rette måde og uden ufornødent ophold."
            type="advarsel"
          />
          <ABTip
            paragraf="AB-Forbruger § 25, stk. 3"
            titel="Tilbageholdelsesret ved uenighed om faktura"
            resumé="Er du uenig i en faktura, kan du holde hele eller dele af betalingen tilbage. Du skal dog betale den del af fakturaen, der er enighed om."
            detaljer="Tilbageholdelsen skal stå i rimeligt forhold til manglen eller uenigheden. Er du i tvivl om beløbet, kan du booke en rådgiver til at vurdere det - det kan spare dig for en tvist."
            type="info"
          />
        </div>

        {/* Åbne mangler */}
        {mangler.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">Åben mangel</span>
                  <span className="text-xs text-gray-400">{m.dato}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{m.titel}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{m.beskrivelse}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">Tilbageholdt</p>
                <p className="text-sm font-bold text-red-600">{m.beløbTilbageholdt}</p>
              </div>
            </div>

            {/* Håndværkers svar */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">Håndværkers svar</p>
              <p className="text-sm text-gray-600">{m.svar}</p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                Book mangelgennemgang med rådgiver
              </button>
              <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download mangelbrev
              </button>
            </div>
          </div>
        ))}

        {/* Ny mangel formular */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Registrér ny mangel</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel på manglen</label>
              <input type="text" placeholder="F.eks. Skæve fliser, utæt rør, manglende maling..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskriv manglen</label>
              <textarea rows={3} placeholder="Beskriv præcist hvad du har observeret og hvornår..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Billeder (valgfrit)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 transition-colors">
                <p className="text-sm text-gray-400">Klik for at uploade billeder af manglen</p>
              </div>
            </div>
            <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Registrér mangel og send mangelbrev
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
