import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Book en rådgiver – Professionel byggesagshjælp",
  description: "Book en uafhængig byggerådgiver direkte fra Contractr. Få hjælp til kontraktgennemgang, tilbudsvurdering, byggetilsyn og juridisk rådgivning.",
  keywords: ["byggerådgiver", "byggesagkyndig", "kontraktgennemgang", "tilbudsvurdering", "byggetilsyn"],
  openGraph: {
    title: "Book en rådgiver – Professionel byggesagshjælp",
    description: "Book en uafhængig byggerådgiver. Hjælp til kontrakt, tilbud, byggetilsyn og juridisk rådgivning.",
    url: "https://www.contractr.dk/tilkoeb",
  },
  alternates: { canonical: "https://www.contractr.dk/tilkoeb" },
};

const ydelser = [
  {
    id: "ai-tilbud",
    titel: "Er tilbuddet fair?",
    beskrivelse: "Vores AI gennemgår tilbuddet og fortæller dig om prisen er rimelig, om der mangler noget, og hvilke forbehold håndværkeren har taget — på almindeligt dansk.",
    pris: "995 kr.",
    detalje: "Svar inden for 24 timer",
    ikon: "search",
    popular: false,
  },
  {
    id: "raadgiver-online",
    titel: "Tal med en rådgiver",
    beskrivelse: "90 minutters online møde med en uvildig byggerådgiver der har forberedt sig på dit projekt. Få svar på alt fra tilbud og kontrakt til materialer og proces.",
    pris: "1.495 kr.",
    detalje: "Online video, 90 min. inkl. forberedelse",
    ikon: "video",
    popular: false,
  },
  {
    id: "tilsyn",
    titel: "Hold øje med arbejdet for mig",
    beskrivelse: "En rådgiver stikker hovedet forbi undervejs og sikrer at materialer, udførelse og fremdrift er som aftalt — uden at du behøver at vide hvad du skal kigge efter.",
    pris: "Fra 2.495 kr.",
    detalje: "Fysisk tilsyn + notat",
    ikon: "eye",
    popular: false,
  },
  {
    id: "mangel",
    titel: "Håndværkeren vil ikke rette fejlene",
    beskrivelse: "En rådgiver dokumenterer manglerne, vurderer dem fagligt og hjælper dig med at tilbageholde betaling lovligt — og give håndværkeren et konkret afhjælpningskrav.",
    pris: "Fra 1.995 kr.",
    detalje: "Rapport + mangelbrev",
    ikon: "alert",
    popular: true,
  },
  {
    id: "aflevering",
    titel: "Er arbejdet gjort ordentligt?",
    beskrivelse: "En rådgiver kommer ud og gennemgår det udførte arbejde før du betaler den sidste rate. Du får en skriftlig rapport med eventuelle mangler og dit juridiske grundlag.",
    pris: "Fra 2.995 kr.",
    detalje: "Fysisk besøg + rapport",
    ikon: "check",
    popular: false,
  },
  {
    id: "tilladelse",
    titel: "Skal jeg have tilladelse?",
    beskrivelse: "Vi gennemgår dit projekt og afklarer om du har brug for byggetilladelse, anmeldelse eller ingeniørbistand — inden arbejdet går i gang og det bliver dyrt at rette.",
    pris: "1.495 kr.",
    detalje: "Skriftlig afklaring",
    ikon: "license",
    popular: false,
  },
];

const ikoner: Record<string, React.ReactElement> = {
  search: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  video: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  eye: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  alert: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  license: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
};

export default function Tilkoeb() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-lg" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
          <Link href="/projekt/1" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage til projekt</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Tilkøb og rådgivning</h1>
          <p className="text-gray-500 max-w-lg mx-auto">Køb ekstra hjælp, når du har brug for det i dit byggeprojekt. Uvildigt og uafhængigt — vi arbejder kun for dig.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {ydelser.map((y) => (
            <div key={y.id} className={`bg-white rounded-2xl border shadow-sm p-6 relative ${y.popular ? "border-primary/40" : "border-gray-100"}`}>
              {y.popular && (
                <span className="absolute -top-3 left-5 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">Populær</span>
              )}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  {ikoner[y.ikon]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{y.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{y.beskrivelse}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{y.pris}</p>
                      <p className="text-xs text-gray-400">{y.detalje}</p>
                    </div>
                    <Link
                      href={`/tilkoeb/book?ydelse=${y.id}`}
                      className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Book nu
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-4 gap-6 text-center">
            {[
              { ikon: "🛡️", titel: "Uvildig og uafhængig", tekst: "Vi arbejder kun for dig" },
              { ikon: "⚡", titel: "Hurtig levering", tekst: "Typisk 1–3 hverdage" },
              { ikon: "📋", titel: "Ingen binding", tekst: "Køb kun det du har brug for" },
              { ikon: "💬", titel: "Spørg os", tekst: "Hvis du er i tvivl" },
            ].map((i) => (
              <div key={i.titel}>
                <p className="text-2xl mb-2">{i.ikon}</p>
                <p className="text-sm font-semibold text-gray-900">{i.titel}</p>
                <p className="text-xs text-gray-400 mt-0.5">{i.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
