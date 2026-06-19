import Link from "next/link";

const notifikationer = [
  {
    id: 1,
    type: "betaling",
    titel: "Betaling klar til godkendelse",
    tekst: "Thomas Madsen har markeret 'Malerarbejde afsluttet' som færdigt. Godkend og betal 28.125 kr.",
    tid: "For 10 minutter siden",
    ulæst: true,
    link: "/projekt/1/betalinger",
    linkTekst: "Godkend betaling",
  },
  {
    id: 2,
    type: "mangel",
    titel: "Håndværker har svaret på din mangel",
    tekst: "Thomas Madsen har svaret på manglen 'Skæve fliser i badeværelse'. Han bestrider manglen.",
    tid: "For 2 timer siden",
    ulæst: true,
    link: "/projekt/1/mangler",
    linkTekst: "Se svaret",
  },
  {
    id: 3,
    type: "besked",
    titel: "Ny besked fra Thomas Madsen",
    tekst: "\"Hej Camilla, jeg er i gang med malerarbejdet. Forventer at være klar fredag.\"",
    tid: "I dag kl. 09:14",
    ulæst: false,
    link: "/projekt/1?chat=1",
    linkTekst: "Åbn chat",
  },
  {
    id: 4,
    type: "abforbruger",
    titel: "AB-Forbruger påmindelse: Betalingsfrist",
    tekst: "Fakturaen for 'Malerarbejde afsluttet' er modtaget i dag. Jf. AB-Forbruger § 25 er betaling rettidig senest om 15 arbejdsdage.",
    tid: "I dag kl. 08:00",
    ulæst: false,
    link: "/abforbruger",
    linkTekst: "Læs § 25",
  },
  {
    id: 5,
    type: "dokument",
    titel: "Nyt dokument uploaded",
    tekst: "Thomas Madsen har uploaded 'Billeder – malerarbejde dag 3' til projektet.",
    tid: "I går kl. 16:42",
    ulæst: false,
    link: "/projekt/1/dokumenter",
    linkTekst: "Se dokumenter",
  },
  {
    id: 6,
    type: "tidsplan",
    titel: "Milepæl markeret færdig",
    tekst: "Thomas Madsen har markeret 'Gipsvægge' som afsluttet. Næste milepæl: Malerarbejde (15. jun. 2025).",
    tid: "2. maj 2025",
    ulæst: false,
    link: "/projekt/1/tidsplan",
    linkTekst: "Se tidsplan",
  },
];

const typeIkon = (type: string) => {
  switch (type) {
    case "betaling": return { path: "M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm0 5h20", bg: "bg-green-100", farve: "#16a34a" };
    case "mangel": return { path: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", bg: "bg-red-100", farve: "#dc2626" };
    case "besked": return { path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", bg: "bg-blue-100", farve: "#3b82f6" };
    case "abforbruger": return { path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", bg: "bg-primary/10", farve: "#1a5c38" };
    case "dokument": return { path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6", bg: "bg-gray-100", farve: "#6b7280" };
    case "tidsplan": return { path: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", bg: "bg-amber-100", farve: "#d97706" };
    default: return { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", bg: "bg-gray-100", farve: "#6b7280" };
  }
};

export default function Notifikationer() {
  const ulæste = notifikationer.filter(n => n.ulæst).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/projekt/1" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tilbage til projekt
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="font-bold text-gray-900">Contractr</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikationer</h1>
            {ulæste > 0 && <p className="text-sm text-gray-400 mt-1">{ulæste} ulæste</p>}
          </div>
          <button className="text-sm font-medium text-primary hover:underline">Markér alle som læst</button>
        </div>

        <div className="space-y-3">
          {notifikationer.map((n) => {
            const ikon = typeIkon(n.type);
            return (
              <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${n.ulæst ? "border-primary/20" : "border-gray-100"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ikon.bg}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ikon.farve} strokeWidth="2">
                      <path d={ikon.path}/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold ${n.ulæst ? "text-gray-900" : "text-gray-700"}`}>{n.titel}</p>
                      {n.ulæst && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{n.tekst}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{n.tid}</span>
                      <Link href={n.link} className="text-xs font-semibold text-primary hover:underline">
                        {n.linkTekst} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
