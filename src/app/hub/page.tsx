import Link from "next/link";

const sektioner = [
  {
    titel: "Marketing",
    farve: "bg-blue-50 border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    sider: [
      { navn: "Forside", url: "/", beskrivelse: "Landingpage for nye besøgende" },
    ],
  },
  {
    titel: "Onboarding",
    farve: "bg-purple-50 border-purple-100",
    badge: "bg-purple-100 text-purple-700",
    sider: [
      { navn: "Login / Opret konto", url: "/login", beskrivelse: "Ny bruger opretter konto" },
      { navn: "Vælg pakke", url: "/pakke", beskrivelse: "Lille / mellem / stort projekt" },
      { navn: "Opret projekt", url: "/opret", beskrivelse: "Udfyld projektdetaljer" },
      { navn: "Upload dokument", url: "/opret/upload", beskrivelse: "Upload tilbud eller kontrakt" },
      { navn: "AI-screening", url: "/opret/screening", beskrivelse: "Platformen screener aftalen" },
      { navn: "Rapport", url: "/opret/rapport", beskrivelse: "Risikovurdering og næste skridt" },
      { navn: "Inviter håndværker", url: "/projekt/1/inviter", beskrivelse: "Send invitation til entreprenør" },
    ],
  },
  {
    titel: "Bygherre: projekt",
    farve: "bg-green-50 border-green-100",
    badge: "bg-green-100 text-green-700",
    sider: [
      { navn: "Projektoverblik", url: "/projekt/1", beskrivelse: "Hovedskærm med status og aktivitet" },
      { navn: "Tidsplan", url: "/projekt/1/tidsplan", beskrivelse: "Milepæle og fremdrift" },
      { navn: "Kontrakt", url: "/projekt/1/kontrakt", beskrivelse: "AB-Forbruger kontrakt og underskrifter" },
      { navn: "Økonomi", url: "/projekt/1/betalinger", beskrivelse: "Betalingsrater og godkendelse" },
      { navn: "Dokumenter", url: "/projekt/1/dokumenter", beskrivelse: "Upload og del filer" },
      { navn: "Mangler", url: "/projekt/1/mangler", beskrivelse: "Registrér fejl og send mangelbrev" },
      { navn: "Afleveringsforretning", url: "/projekt/1/aflevering", beskrivelse: "Formel aflevering med protokol og underskrift (AB § 37-38)" },
      { navn: "Notifikationer", url: "/notifikationer", beskrivelse: "Beskeder, betalinger, mangler og AB-Forbruger påmindelser" },
      { navn: "Min konto", url: "/konto", beskrivelse: "Profil, pakke og kontoindstillinger" },
    ],
  },
  {
    titel: "Tilkøb og rådgivning",
    farve: "bg-amber-50 border-amber-100",
    badge: "bg-amber-100 text-amber-700",
    sider: [
      { navn: "Dine rettigheder (AB-Forbruger)", url: "/abforbruger", beskrivelse: "Paragraffer i plain dansk om betaling, mangler og forsinkelse" },
      { navn: "Tilkøb oversigt", url: "/tilkoeb", beskrivelse: "Alle rådgiverydelser" },
      { navn: "Book rådgiver", url: "/tilkoeb/book", beskrivelse: "Vælg ydelse og tidspunkt" },
      { navn: "Bookingbekræftelse", url: "/tilkoeb/book/bekraeftelse", beskrivelse: "Kvittering og næste skridt" },
    ],
  },
  {
    titel: "Håndværker",
    farve: "bg-orange-50 border-orange-100",
    badge: "bg-orange-100 text-orange-700",
    sider: [
      { navn: "Accepter invitation", url: "/haandvaerker/accepter", beskrivelse: "Håndværker modtager og accepterer invitation" },
      { navn: "Mine sager", url: "/haandvaerker/sager", beskrivelse: "Oversigt over alle tilknyttede projekter" },
      { navn: "Håndværker: projektoverblik", url: "/haandvaerker/projekt/1", beskrivelse: "Tidsplan, betaling, upload, chat og mangler" },
      { navn: "Håndværker: kontrakt", url: "/haandvaerker/projekt/1/kontrakt", beskrivelse: "Gennemgå og underskriv digitalt" },
      { navn: "Min profil & omtaler", url: "/haandvaerker/profil", beskrivelse: "Ratings, omtaler og specialer" },
    ],
  },
  {
    titel: "Rådgiverportal",
    farve: "bg-gray-50 border-gray-200",
    badge: "bg-gray-200 text-gray-600",
    sider: [
      { navn: "Rådgiverportal", url: "/raadgiver", beskrivelse: "Kalender, bookinger, projektoverblik og mangelsager" },
    ],
  },
];

export default function Hub() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contractr - sideoverblik</h1>
        </div>
        <p className="text-sm text-gray-400 mb-10 ml-13">Klik på en side for at åbne den. Brug til at navigere rundt i platformen.</p>

        <div className="space-y-8">
          {sektioner.map((s) => (
            <div key={s.titel}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>{s.titel}</span>
              </div>
              <div className={`rounded-2xl border ${s.farve} p-4 grid sm:grid-cols-2 gap-2`}>
                {s.sider.map((side) => (
                  <Link
                    key={side.url}
                    href={side.url}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{side.navn}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{side.beskrivelse}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 ml-3">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-gray-300">
          Contractr prototype · Kun til intern visning
        </div>
      </div>
    </div>
  );
}
