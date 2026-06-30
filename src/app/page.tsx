import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contractr — Tjek din byggeaftale før du siger ja",
  description: "Upload dit tilbud og få det screenet mod AB-Forbruger på under 2 minutter. Gratis første screening.",
  robots: "index, follow",
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm tracking-wide">Contractr</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/opret" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Kom i gang
            </Link>
            <Link
              href="/opret"
              className="bg-[#1a5c38] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#154d2f] transition-colors"
            >
              Tjek dit tilbud →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Gratis første screening
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
          Forstå dit byggetilbud<br className="hidden sm:block" />
          <span className="text-[#1a5c38]"> inden du siger ja</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Upload dit tilbud og få det tjekket mod AB-Forbruger på under 2 minutter. Vi finder hvad der mangler — før det koster dig penge.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/opret"
            className="w-full sm:w-auto bg-[#1a5c38] text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-[#154d2f] transition-colors shadow-lg shadow-green-900/20"
          >
            Tjek dit tilbud gratis →
          </Link>
          <Link
            href="/opret"
            className="w-full sm:w-auto border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl text-base hover:bg-gray-50 transition-colors"
          >
            Lav et udbudsdokument
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Ingen konto nødvendig · Resultat på 60 sekunder</p>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[
            { tal: "AB-Forbruger", label: "tjekkes automatisk" },
            { tal: "6 punkter", label: "screenes i hvert tilbud" },
            { tal: "< 2 min", label: "til din rapport er klar" },
          ].map((item) => (
            <div key={item.tal}>
              <div className="text-xl font-bold text-gray-900">{item.tal}</div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kerneproblemet */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Håndværkeren kender spillereglerne. Du gør ikke.
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              Håndværkeren har lavet hundredevis af tilbud. Du har måske ét. AB-Forbruger er til for at beskytte dig — men de fleste bygherrer har aldrig hørt om den.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Contractr læser dit tilbud og fortæller dig præcis hvad der mangler, hvad du bør spørge om, og om du er beskyttet.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { ikon: "✗", tekst: "Ingen fast pris — kun et overslag", farve: "text-red-500 bg-red-50" },
              { ikon: "✗", tekst: "Ingen tidsplan med start og slut", farve: "text-red-500 bg-red-50" },
              { ikon: "✗", tekst: "Betalingen er ikke koblet til fremdrift", farve: "text-red-500 bg-red-50" },
              { ikon: "✓", tekst: "AB-Forbruger er nævnt som grundlag", farve: "text-green-600 bg-green-50" },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${item.farve.split(" ")[1]}`}>
                <span className={`font-bold text-sm ${item.farve.split(" ")[0]}`}>{item.ikon}</span>
                <span className="text-sm text-gray-700">{item.tekst}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sådan virker det */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Tre trin. To minutter.</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                nr: "1",
                titel: "Beskriv dit projekt",
                tekst: "Vælg projekttype og angiv adressen. Tager 30 sekunder.",
                ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
              },
              {
                nr: "2",
                titel: "Upload dit tilbud",
                tekst: "Kopier teksten fra tilbuddet ind — eller upload PDF.",
                ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
              },
              {
                nr: "3",
                titel: "Få din rapport",
                tekst: "Se præcis hvad der mangler og hvad du bør spørge om.",
                ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
              },
            ].map((trin) => (
              <div key={trin.nr} className="text-center">
                <div className="w-12 h-12 bg-[#1a5c38] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                  {trin.ikon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{trin.titel}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{trin.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hvad screener vi */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Vi tjekker det der tæller</h2>
        <p className="text-gray-500 text-center mb-12">Baseret på AB-Forbruger 2012 — standarden alle forbrugere har ret til</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { titel: "Fast pris eller overslag?", tekst: "Er prisen bindende, eller kan håndværkeren fakturere mere?" },
            { titel: "Tidsplan med start og slut", tekst: "Hvornår begynder arbejdet, og hvornår er det færdigt?" },
            { titel: "Betalingsplan", tekst: "Er betaling koblet til konkret fremdrift — ikke bare datoer?" },
            { titel: "Ekstraarbejde-procedure", tekst: "Skal tillæg aftales skriftligt, inden de udføres?" },
            { titel: "AB-Forbruger nævnt", tekst: "Er du dækket af forbrugerreglerne, eller er de fraveget?" },
            { titel: "Afleveringsforretning", tekst: "Er der aftalt en formel aflevering og mangelgennemgang?" },
          ].map((punkt) => (
            <div key={punkt.titel} className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-0.5">{punkt.titel}</div>
                <div className="text-sm text-gray-500">{punkt.tekst}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a5c38] px-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Klar til at tjekke dit tilbud?</h2>
          <p className="text-green-200 mb-8 leading-relaxed">
            Det tager to minutter og er gratis. Du behøver ikke oprette en konto.
          </p>
          <Link
            href="/opret"
            className="inline-block bg-white text-[#1a5c38] font-bold px-8 py-4 rounded-xl text-base hover:bg-green-50 transition-colors shadow-lg"
          >
            Kom i gang gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1a5c38] rounded-md flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Contractr</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <Link href="/privatliv" className="hover:text-gray-600 transition-colors">Privatlivspolitik</Link>
            <Link href="/abforbruger" className="hover:text-gray-600 transition-colors">Om AB-Forbruger</Link>
            <Link href="/kontakt" className="hover:text-gray-600 transition-colors">Kontakt</Link>
          </div>
          <span className="text-xs text-gray-400">© 2025 Contractr</span>
        </div>
      </footer>
    </div>
  );
}
