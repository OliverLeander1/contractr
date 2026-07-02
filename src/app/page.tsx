import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contractr — Tryggere byggeprojekter for private",
  description: "Contractr hjælper private bygherrer med at sende projekter i udbud, screene tilbud mod AB-Forbruger og styre hele byggeprojektet.",
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-logo)", fontWeight: 300, letterSpacing: "2px" }} className="text-gray-900 text-lg">
            contractr
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/haandvaerker/sager" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Jeg er håndværker
          </Link>
          <Link href="/opret" className="text-sm font-semibold bg-[#1a5c38] text-white px-4 py-2 rounded-lg hover:bg-[#163f28] transition-colors">
            Kom i gang
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20">

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-4 py-2 rounded-full border border-green-100">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Baseret på AB-Forbruger 2012 — den officielle forbrugerbeskyttelse
            </span>
          </div>

          {/* Overskrift */}
          <div className="text-center max-w-3xl mx-auto mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              Få tjekket din byggeaftale<br />
              <span className="text-[#1a5c38]">før du siger ja</span>
            </h1>
          </div>

          <p className="text-center text-gray-500 text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Du er den eneste part i et byggeprojekt uden professionel rygrad. Contractr giver dig overblik, juridisk tryghed og konkrete næste skridt — uden at du skal forstå entrepriseretten.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#163f28] transition-colors text-base shadow-sm">
              Send projekt i udbud
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-50 text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-base border border-gray-200">
              Jeg har allerede et tilbud
            </Link>
          </div>
          <p className="text-center text-xs text-gray-400 mb-20">Gratis at komme i gang · Ingen konto krævet</p>

          {/* Sådan virker det */}
          <div className="border-t border-gray-100 pt-16 mb-16">
            <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">Sådan virker det</p>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  trin: "1",
                  ikon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  ),
                  titel: "Beskriv dit projekt",
                  tekst: "Fortæl hvad du skal bygge eller renovere. AI genererer et professionelt udbudsdokument med tilbudsliste klar til at sende ud.",
                },
                {
                  trin: "2",
                  ikon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ),
                  titel: "Modtag og sammenlign tilbud",
                  tekst: "Send linket til 2–3 håndværkere. Når de sender priser tilbage, screener vi tilbuddet mod AB-Forbruger og viser dig præcis hvad du skal spørge om.",
                },
                {
                  trin: "3",
                  ikon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  ),
                  titel: "Styr hele projektet",
                  tekst: "Acceptér tilbuddet og dit projektrum oprettes automatisk — med kontrakt, betalingsplan, mangelregistrering og ekstraarbejde samlet ét sted.",
                },
              ].map((s) => (
                <div key={s.trin} className="flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#1a5c38] flex-shrink-0">
                      {s.ikon}
                    </div>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Trin {s.trin}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.tekst}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tryghedssignaler */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-16">
            <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Hvad Contractr tjekker for dig</p>
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {[
                "Er AB-Forbruger nævnt i aftalen?",
                "Er prisen fast eller blot et overslag?",
                "Er betalingsplanen koblet til fremdrift?",
                "Er start- og slutdato aftalt skriftligt?",
                "Er procedure for ekstraarbejde beskrevet?",
                "Er afleverings- og mangelprocedure nævnt?",
              ].map((punkt) => (
                <div key={punkt} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-sm text-gray-700">{punkt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Citat */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <blockquote className="text-xl text-gray-700 leading-relaxed font-medium italic mb-4">
              "Håndværkeren kender spillereglerne. Rådgiveren er typisk tæt på entreprenørsiden. Bygherren står alene."
            </blockquote>
            <p className="text-sm text-gray-400">Contractr er bygherrens professionelle rygrad</p>
          </div>

          {/* Bundknapper */}
          <div className="text-center">
            <Link href="/opret" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#163f28] transition-colors text-base shadow-sm">
              Kom i gang gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-400">© 2025 Contractr</p>
          <div className="flex items-center gap-6">
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
            <Link href="/haandvaerker/sager" className="text-xs text-gray-400 hover:text-gray-600">Håndværker login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
