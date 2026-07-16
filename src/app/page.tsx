import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nembyggestyring - Forstå din byggeaftale inden du siger ja",
  description: "Upload dit tilbud eller kontrakt og få det tjekket gratis på 2 minutter. Nembyggestyring sørger for at du forstår hvad du skriver under på.",
  keywords: ["byggeprojekt", "bygherre", "tilbud håndværker", "AB-Forbruger", "kontrakt screening", "digital projektrum", "renovering", "byggeaftale"],
  openGraph: {
    title: "Nembyggestyring - Forstå din byggeaftale inden du siger ja",
    description: "Upload dit tilbud og få det tjekket gratis på 2 minutter.",
    url: "https://www.nembyggestyring.dk",
    type: "website",
    siteName: "Nembyggestyring",
  },
  alternates: { canonical: "https://www.nembyggestyring.dk" },
  robots: { index: true, follow: true },
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="px-4 sm:px-6 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>

          <div className="hidden sm:flex flex-1 justify-center">
            <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <Link href="/" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1a5c38] text-white text-xs font-semibold shadow-sm transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Bygherre
              </Link>
              <Link href="/haandvaerker/sager" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white text-xs font-medium transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Håndværker
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/login" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Log ind</Link>
            <Link href="/opret/upload" className="text-xs sm:text-sm font-semibold bg-[#1a5c38] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-[#163f28] transition-colors whitespace-nowrap">
              Tjek tilbud gratis →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero — alt fokus på ét valg */}
        <section className="bg-[#f8faf9] px-4 sm:px-6 py-14 sm:py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100 shadow-sm mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Gratis at starte — ingen konto krævet
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
              Har du modtaget et tilbud<br className="hidden sm:block" /> fra en håndværker?
            </h1>
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto">
              Upload tilbuddet og få det tjekket på 2 minutter. Vi sørger for at du ved hvad du skriver under på.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#163f28] transition-colors text-base shadow-sm">
                Tjek dit tilbud gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-gray-200">
                Start et projekt
              </Link>
            </div>
            {/* Trust-signals */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
              {["Svar på 2 minutter", "Ingen binding", "Tjekkes mod AB-Forbruger"].map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Tre trin */}
        <section className="py-14 sm:py-20 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
              {[
                {
                  nr: "01",
                  titel: "Upload tilbuddet",
                  tekst: "Send tilbud, mail eller kontrakt. Vi læser det med det samme.",
                  ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
                },
                {
                  nr: "02",
                  titel: "Få screening",
                  tekst: "Vi tjekker aftalen mod AB-Forbruger og markerer hvad der mangler.",
                  ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                },
                {
                  nr: "03",
                  titel: "Forstå og handle",
                  tekst: "Du får konkrete spørgsmål du kan stille håndværkeren — eller booke en rådgiver.",
                  ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>,
                },
              ].map((t, i) => (
                <div key={t.nr} className="flex gap-4 sm:flex-col sm:gap-0 items-start">
                  <div className="flex-shrink-0 sm:mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#1a5c38]/8 flex items-center justify-center text-[#1a5c38]">
                      {t.ikon}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-300 tracking-widest mb-1">{t.nr}</p>
                    <h3 className="font-bold text-gray-900 mb-1.5">{t.titel}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{t.tekst}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:block absolute" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hvad vi tjekker — AB-Forbruger punkter */}
        <section className="py-14 sm:py-20 bg-[#f8faf9]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-[#1a5c38] uppercase tracking-widest">AB-Forbruger 2012</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-3">Vi tjekker det du ikke vidste du skulle spørge om</h2>
              <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                AB-Forbruger beskytter dig som bygherre — men kun hvis begge parter aftaler det. De fleste glemmer det.
              </p>
            </div>
            <div className="space-y-2 max-w-xl mx-auto mb-8">
              {[
                { paragraf: "§ 12", tekst: "Er start- og slutdato aftalt skriftligt?" },
                { paragraf: "§ 23", tekst: "Er procedure for ekstraarbejde beskrevet?" },
                { paragraf: "§ 25", tekst: "Er betalingsplanen koblet til dokumenteret fremdrift?" },
                { paragraf: "§ 38", tekst: "Er afleverings- og mangelprocedure beskrevet?" },
                { paragraf: "§ 58", tekst: "Er 1-års eftersyn nævnt i aftalen?" },
              ].map((p) => (
                <div key={p.paragraf} className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <span className="text-xs font-bold text-[#1a5c38] bg-[#f0f7f3] px-2 py-1 rounded-lg w-12 text-center flex-shrink-0">{p.paragraf}</span>
                  <span className="text-sm text-gray-700">{p.tekst}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/abforbruger" className="text-sm font-semibold text-[#1a5c38] hover:underline">Læs mere om AB-Forbruger →</Link>
            </div>
          </div>
        </section>

        {/* Funktioner — kompakt grid */}
        <section className="py-14 sm:py-20 bg-[#111c17] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Hele projektet samlet</span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2">Fra tilbud til aflevering</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { titel: "Tilbudstjek", tekst: "Screenet mod AB-Forbruger på 2 minutter" },
                { titel: "Digitalt projektrum", tekst: "Kontrakt, betalinger og kommunikation ét sted" },
                { titel: "Ekstraarbejde", tekst: "Digital tillægsaftale med godkendelse fra bygherre" },
                { titel: "Betalingsplan", tekst: "Koblet til dokumenteret fremdrift" },
                { titel: "Mangelregistrering", tekst: "Billeder og status sendt direkte til håndværkeren" },
                { titel: "Rådgiverbooking", tekst: "Book en byggesagkyndig ved middel eller høj risiko" },
              ].map((f) => (
                <div key={f.titel} className="bg-white/5 rounded-xl p-4 border border-white/8">
                  <p className="font-semibold text-white text-sm mb-1">{f.titel}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1a5c38] px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Tjek dit tilbud nu — det er gratis</h2>
            <p className="text-green-200 mb-8 text-sm sm:text-base leading-relaxed">
              Ingen konto. Ingen binding. Svar på 2 minutter.
            </p>
            <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#1a5c38] font-bold rounded-xl hover:bg-green-50 transition-colors text-base shadow-sm">
              Upload dit tilbud
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">© 2025 Nembyggestyring</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/det-gode-byggeprojekt" className="text-xs text-gray-400 hover:text-gray-600">Guides</Link>
            <Link href="/abforbruger" className="text-xs text-gray-400 hover:text-gray-600">AB-Forbruger</Link>
            <Link href="/tilkoeb" className="text-xs text-gray-400 hover:text-gray-600">Rådgivere</Link>
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
            <Link href="/haandvaerker/sager" className="text-xs text-gray-400 hover:text-gray-600">Håndværker</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
