import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privatlivspolitik",
  description: "Læs hvordan Contractr behandler dine personlige oplysninger og data i henhold til GDPR.",
};

const sektioner = [
  {
    titel: "1. Dataansvarlig",
    indhold: `Contractr er dataansvarlig for behandlingen af de personoplysninger, vi modtager om dig. Du kan kontakte os på hej@contractr.dk.`,
  },
  {
    titel: "2. Hvilke oplysninger indsamler vi?",
    indhold: `Vi indsamler følgende typer af oplysninger:\n\n• Kontaktoplysninger (navn, e-mail, telefonnummer)\n• Oplysninger om dit byggeprojekt (adresse, beskrivelse, dokumenter du uploader)\n• Betalingsoplysninger (behandles via sikker tredjepart)\n• Tekniske data (IP-adresse, browsertype, besøgsdata via cookies)`,
  },
  {
    titel: "3. Formål med behandlingen",
    indhold: `Vi behandler dine oplysninger for at:\n\n• Levere vores platform og screene dine byggeaftaler\n• Sende dig notifikationer og opdateringer om dit projekt\n• Opfylde vores juridiske forpligtelser\n• Forbedre platformen baseret på anonymiseret brugsdata`,
  },
  {
    titel: "4. Retsgrundlag",
    indhold: `Vi behandler dine oplysninger på grundlag af:\n\n• Opfyldelse af kontrakt (GDPR art. 6, stk. 1, litra b) — når du bruger platformen\n• Samtykke (GDPR art. 6, stk. 1, litra a) — for marketing og ikke-nødvendige cookies\n• Legitim interesse (GDPR art. 6, stk. 1, litra f) — for sikkerhed og drift`,
  },
  {
    titel: "5. Opbevaring af data",
    indhold: `Dine projektdata opbevares så længe dit projekt er aktivt, og i op til 5 år efter afslutning af hensyn til eventuelle juridiske tvister (svarende til reklamationsperioden efter AB-Forbruger). Du kan til enhver tid anmode om sletning af dine data.`,
  },
  {
    titel: "6. Deling af oplysninger",
    indhold: `Vi deler kun dine oplysninger med:\n\n• Håndværkere og rådgivere du selv har inviteret til dit projekt\n• Tekniske leverandører der hjælper os med at drive platformen (databehandleraftaler er indgået)\n• Offentlige myndigheder hvis vi er retligt forpligtet hertil\n\nVi sælger aldrig dine oplysninger til tredjepart.`,
  },
  {
    titel: "7. Dine rettigheder",
    indhold: `Du har ret til at:\n\n• Få indsigt i hvilke oplysninger vi har om dig\n• Få berigtiget forkerte oplysninger\n• Få slettet dine oplysninger ("retten til at blive glemt")\n• Gøre indsigelse mod behandlingen\n• Modtage dine data i et maskinlæsbart format (dataportabilitet)\n• Klage til Datatilsynet (datatilsynet.dk)`,
  },
  {
    titel: "8. Cookies",
    indhold: `Vi anvender cookies til at huske dine præferencer og forbedre din oplevelse. Du kan til enhver tid ændre dine cookie-indstillinger via banneret på siden. Nødvendige cookies kan ikke fravælges da de er nødvendige for at platformen fungerer.`,
  },
  {
    titel: "9. Ændringer til denne politik",
    indhold: `Vi opdaterer løbende denne privatlivspolitik. Ved væsentlige ændringer giver vi dig besked via e-mail eller en synlig besked på platformen. Senest opdateret: juni 2025.`,
  },
];

export default function Privatliv() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Privatlivspolitik</h1>
          <p className="text-gray-500">Senest opdateret: juni 2025 · Vi respekterer dit privatliv og behandler dine data ansvarligt.</p>
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
          <h2 className="text-sm font-bold text-gray-900 mb-2">Spørgsmål om dine data?</h2>
          <p className="text-sm text-gray-600 mb-4">Kontakt os på <a href="mailto:hej@contractr.dk" className="text-primary font-medium hover:underline">hej@contractr.dk</a> — vi svarer inden for 2 arbejdsdage.</p>
          <Link href="/kontakt" className="inline-block text-sm font-semibold text-primary hover:underline">Gå til kontaktside →</Link>
        </div>
      </div>
    </div>
  );
}
