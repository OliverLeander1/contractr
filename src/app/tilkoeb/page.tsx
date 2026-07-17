"use client";

import Link from "next/link";

const SCENARIER = [
  {
    id: "tilbud",
    emoji: "📄",
    situation: "Har du modtaget et tilbud?",
    beskrivelse: "Få gennemgået om prisen er fair, om der mangler vigtige punkter, og hvad du skal afklare inden du siger ja.",
    ydelser: [
      { titel: "AI-gennemgang af tilbud", pris: "995 kr.", detalje: "Svar inden 24 timer · skriftlig rapport", href: "/tilkoeb/book?ydelse=ai-tilbud" },
      { titel: "Online møde med rådgiver", pris: "1.495 kr.", detalje: "90 min. inkl. forberedelse · video", href: "/tilkoeb/book?ydelse=raadgiver-online" },
    ],
  },
  {
    id: "igang",
    emoji: "🔨",
    situation: "Er arbejdet i gang?",
    beskrivelse: "Få et fagperson ud og tjek om materialer, udførelse og fremdrift er som aftalt. Eller få hjælp til at håndtere ekstraregninger.",
    ydelser: [
      { titel: "Tilsyn undervejs", pris: "Fra 2.495 kr.", detalje: "Fysisk besøg + skriftlig rapport", href: "/tilkoeb/book?ydelse=tilsyn" },
      { titel: "Hjælp til ekstraarbejde-tvist", pris: "Fra 1.995 kr.", detalje: "Rådgivning + brev til håndværker", href: "/tilkoeb/book?ydelse=mangel" },
    ],
  },
  {
    id: "faerdig",
    emoji: "🏁",
    situation: "Er arbejdet færdigt?",
    beskrivelse: "Inden du betaler den sidste rate, bør en fagmand gennemgå arbejdet. Og husk: du har ret til en formel afleveringsforretning.",
    ydelser: [
      { titel: "Afleveringstjek", pris: "Fra 2.995 kr.", detalje: "Fysisk gennemgang + rapport", href: "/tilkoeb/book?ydelse=aflevering" },
      { titel: "Mangelliste og dokumentation", pris: "Fra 1.995 kr.", detalje: "Rapport + mangelbrev til håndværker", href: "/tilkoeb/book?ydelse=mangel" },
    ],
  },
];

const RAADGIVER = {
  navn: "Mikkel Hornbæk",
  titel: "Byggesagkyndig & certificeret rådgiver",
  firma: "Hornbæk Byggerådgivning",
  by: "Dækker hele Sjælland",
  erfaring: "12 års erfaring som byggesagkyndig. Har hjulpet private bygherrer med alt fra badeværelsesrenovering til større tilbygninger.",
  specialer: ["Tilbudsvurdering", "Afleveringsforretning", "Mangelssager", "AB-Forbruger"],
  tilgaengelig: "Ledig fra uge 30",
};

export default function Tilkoeb() {
  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="logo">nembyggestyring</span>
          </Link>
          <Link href="/projekt/1" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage til projekt</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Overskrift */}
        <div className="mb-10">
          <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Rådgivning</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-3">Brug for hjælp fra en fagmand?</h1>
          <p className="text-gray-500 max-w-lg leading-relaxed">
            Uvildige rådgivere der arbejder udelukkende for dig som bygherre. Vælg din situation nedenfor.
          </p>
        </div>

        {/* 3 scenarie-kort */}
        <div className="space-y-4 mb-12">
          {SCENARIER.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#e0ddd6] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#f0ede8]">
                <div className="flex items-start gap-4">
                  <span className="text-3xl mt-0.5">{s.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{s.situation}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.beskrivelse}</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-[#f0ede8]">
                {s.ydelser.map((y) => (
                  <div key={y.titel} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{y.titel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{y.detalje}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{y.pris}</p>
                      <Link
                        href={y.href}
                        className="bg-[#1e3a2a] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#162d20] transition-colors whitespace-nowrap"
                      >
                        Book nu
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Fremhævet rådgiver */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Mød en af vores rådgivere</h2>
          <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 bg-[#1e3a2a] rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold select-none">
                {RAADGIVER.navn.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900">{RAADGIVER.navn}</p>
                    <p className="text-sm text-gray-500">{RAADGIVER.titel}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{RAADGIVER.firma} · {RAADGIVER.by}</p>
                  </div>
                  <span className="text-xs font-semibold bg-[#e5ede7] text-[#1e3a2a] px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">{RAADGIVER.tilgaengelig}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-3">{RAADGIVER.erfaring}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {RAADGIVER.specialer.map(s => (
                    <span key={s} className="text-xs bg-[#f5f3ee] text-gray-600 px-2.5 py-1 rounded-lg border border-[#e0ddd6]">{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-[#f0ede8] flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400">Uvildigt og uafhængigt. Rådgiveren arbejder kun for dig.</p>
              <Link
                href="/tilkoeb/book?raadgiver=mikkel"
                className="bg-[#1e3a2a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#162d20] transition-colors flex-shrink-0"
              >
                Book {RAADGIVER.navn.split(" ")[0]} →
              </Link>
            </div>
          </div>
        </div>

        {/* Er du rådgiver? */}
        <div className="bg-[#1e3a2a] rounded-2xl p-6 text-center">
          <p className="text-green-200/60 text-xs uppercase tracking-widest mb-2">For rådgivere og byggesagkyndige</p>
          <h3 className="text-white font-bold text-lg mb-2">Er du byggesagkyndig eller rådgiver?</h3>
          <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
            Modtag kvalificerede leads med dokumentation klar. Ingen forgæves henvendelser.
          </p>
          <Link
            href="/raadgiver"
            className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#f5f3ee] transition-colors"
          >
            Læs om rådgiverportalen →
          </Link>
        </div>

        {/* Tillidsmarkører */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { ikon: "🛡️", titel: "Uvildige rådgivere", tekst: "Arbejder kun for dig" },
            { ikon: "⚡", titel: "Hurtig levering", tekst: "Typisk 1-3 hverdage" },
            { ikon: "📋", titel: "Ingen binding", tekst: "Køb kun det du har brug for" },
            { ikon: "💬", titel: "Spørg os", tekst: "Vi hjælper dig med at vælge" },
          ].map(i => (
            <div key={i.titel} className="bg-white rounded-xl p-4 text-center border border-[#e0ddd6]">
              <p className="text-2xl mb-2">{i.ikon}</p>
              <p className="text-xs font-semibold text-gray-900">{i.titel}</p>
              <p className="text-xs text-gray-400 mt-0.5">{i.tekst}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
