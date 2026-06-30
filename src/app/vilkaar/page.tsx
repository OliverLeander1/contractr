import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vilkår og betingelser",
  description: "Læs Contractrs vilkår og betingelser for brug af platformen.",
};

const sektioner = [
  {
    titel: "1. Om Contractr",
    indhold: `Contractr er en digital platform der hjælper private bygherrer med at forstå og gennemgå byggeaftaler, kontrakter og tilbud. Platformen er ikke en advokatydelse og erstatter ikke juridisk rådgivning.`,
  },
  {
    titel: "2. Accept af vilkår",
    indhold: `Ved at oprette en konto og bruge Contractr accepterer du disse vilkår. Hvis du ikke accepterer vilkårene, bedes du undlade at bruge platformen.`,
  },
  {
    titel: "3. Hvad Contractr tilbyder",
    indhold: `Contractr tilbyder:\n\n• AI-baseret screening af byggeaftaler og kontrakter mod AB-Forbruger 2012\n• Digitalt projektoverblik med tidsplan, dokumenter og betalingsplan\n• Kommunikation med håndværkere og rådgivere via platformen\n• Adgang til uafhængige byggerådgivere (særskilt aftale)\n\nAI-screeningen er vejledende og kan ikke garantere at alle fejl eller mangler i en aftale identificeres.`,
  },
  {
    titel: "4. Brugerens ansvar",
    indhold: `Som bruger er du ansvarlig for:\n\n• At de dokumenter du uploader er korrekte og lovlige at dele\n• At du har ret til at uploade de pågældende dokumenter\n• At holde dit login fortroligt\n• At angive korrekte oplysninger ved oprettelse`,
  },
  {
    titel: "5. Betaling og abonnement",
    indhold: `Grundscreeningen er gratis. Betalte pakker faktureres månedligt eller som engangsbetaling. Alle priser er inklusive moms. Ved opsigelse beholder du adgang til udgangen af den betalte periode. Tilbagebetaling ydes ikke for påbegyndte perioder.`,
  },
  {
    titel: "6. Intellektuel ejendomsret",
    indhold: `Alt indhold på Contractr - herunder tekst, design, kode og AI-genererede rapporter - tilhører Contractr. Du må ikke kopiere, videresælge eller distribuere indhold fra platformen uden skriftlig tilladelse.`,
  },
  {
    titel: "7. Ansvarsbegrænsning",
    indhold: `Contractr er ikke ansvarlig for:\n\n• Tab som følge af fejl i AI-screeningen\n• Juridiske konsekvenser af de aftaler du indgår med håndværkere\n• Nedetid eller tekniske fejl\n\nVores ansvar er i alle tilfælde begrænset til det beløb du har betalt til os i de seneste 12 måneder.`,
  },
  {
    titel: "8. Ændringer til vilkårene",
    indhold: `Vi kan ændre disse vilkår med 30 dages varsel. Du vil modtage besked via e-mail. Fortsat brug af platformen efter ikrafttrædelse anses som accept af de nye vilkår.`,
  },
  {
    titel: "9. Lovvalg og værneting",
    indhold: `Disse vilkår er underlagt dansk ret. Tvister afgøres ved danske domstole med Københavns Byret som værneting.`,
  },
];

export default function Vilkaar() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage til forsiden</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Vilkår og betingelser</h1>
          <p className="text-gray-500">Senest opdateret: juni 2025 · Gælder for alle brugere af Contractr-platformen.</p>
        </div>

        <div className="space-y-8">
          {sektioner.map((s) => (
            <div key={s.titel} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">{s.titel}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.indhold}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Spørgsmål til vilkårene?</h2>
          <p className="text-sm text-gray-600 mb-4">Kontakt os på <a href="mailto:hej@contractr.dk" className="text-primary font-medium hover:underline">hej@contractr.dk</a></p>
          <Link href="/kontakt" className="inline-block text-sm font-semibold text-primary hover:underline">Gå til kontaktside →</Link>
        </div>
      </div>
    </div>
  );
}
