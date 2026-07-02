import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contractr — Tryggere byggeprojekter for private",
  description: "Contractr hjælper private bygherrer med at sende projekter i udbud, screene tilbud mod AB-Forbruger og styre hele byggeprojektet.",
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#1a5c38] rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "3px" }} className="text-white text-xl tracking-widest">
            contractr
          </span>
        </div>
        <Link href="/haandvaerker/sager" className="text-sm text-gray-400 hover:text-white transition-colors">
          Jeg er haandvaerker →
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#1a5c38]/20 border border-[#1a5c38]/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Baseret pa AB-Forbruger 2012
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
            Fa tjekket din<br />
            <span className="text-[#4ade80]">byggeaftale</span><br />
            for du siger ja
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            Send dit projekt i udbud, modtag sammenlignelige tilbud og styr hele byggeprojektet
            — med AB-Forbruger som din juridiske rygrad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/opret"
              className="px-8 py-4 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#1a5c38]/90 transition-all text-base shadow-lg shadow-green-900/30"
            >
              Jeg skal i gang med et projekt →
            </Link>
            <Link
              href="/opret/upload"
              className="px-8 py-4 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:border-gray-500 hover:text-white transition-all text-base"
            >
              Jeg har allerede et tilbud
            </Link>
          </div>

          <p className="text-gray-600 text-sm">
            Haandvaerker?{" "}
            <Link href="/haandvaerker/sager" className="text-gray-400 hover:text-white underline transition-colors">
              Log ind her
            </Link>
          </p>
        </div>
      </main>

      {/* Tre fordele */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
              titel: "Send projekt i udbud",
              tekst: "AI genererer et professionelt udbudsdokument med tilbudsliste. Del linket med 2-3 haandvaerkere og fa sammenlignelige tilbud.",
            },
            {
              ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
              titel: "Tjek dit tilbud",
              tekst: "Upload et tilbud du allerede har modtaget. Vi screener det mod AB-Forbruger og viser dig hvad du skal spørge om.",
            },
            {
              ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
              titel: "Styr projektet",
              tekst: "Naar du accepterer et tilbud oprettes dit projektrum automatisk med kontrakt, betalingsplan, mangler og ekstraarbejde.",
            },
          ].map((f) => (
            <div key={f.titel} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="w-10 h-10 bg-[#1a5c38]/20 rounded-xl flex items-center justify-center text-green-400 mb-4">
                {f.ikon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.titel}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-5 text-center text-gray-600 text-xs">
        © 2025 Contractr · <Link href="/vilkaar" className="hover:text-gray-400">Vilkaar</Link> · <Link href="/privatliv" className="hover:text-gray-400">Privatlivspolitik</Link>
      </footer>
    </div>
  );
}
