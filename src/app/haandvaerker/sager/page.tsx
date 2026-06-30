import Link from "next/link";

const sager = [
  {
    id: 1,
    titel: "Indvendig renovering - Valby",
    bygherre: "Camilla Jensen",
    adresse: "Valby Langgade 85, 2500 Valby",
    type: "Renovering",
    entreprisesum: "112.500 kr.",
    status: "igang",
    næsteMilepæl: "Gipsvægge",
    næsteBetaling: "28.125 kr.",
    ulæsteBeskeder: 2,
    åbneMangler: 1,
  },
  {
    id: 2,
    titel: "Nyt badeværelse - Frederiksberg",
    bygherre: "Henrik Møller",
    adresse: "Smallegade 22, 2000 Frederiksberg",
    type: "Badeværelse",
    entreprisesum: "68.500 kr.",
    status: "igang",
    næsteMilepæl: "Fliser og VVS",
    næsteBetaling: "17.125 kr.",
    ulæsteBeskeder: 0,
    åbneMangler: 0,
  },
  {
    id: 3,
    titel: "Tagudskiftning - Hellerup",
    bygherre: "Mette Lund",
    adresse: "Strandvejen 12, 2900 Hellerup",
    type: "Tag",
    entreprisesum: "245.000 kr.",
    status: "afsluttet",
    næsteMilepæl: null,
    næsteBetaling: null,
    ulæsteBeskeder: 0,
    åbneMangler: 0,
  },
];

export default function HaandvaerkerSager() {
  const aktive = sager.filter(s => s.status === "igang");
  const afsluttede = sager.filter(s => s.status === "afsluttet");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded">Håndværker</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/haandvaerker/profil" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
              Min profil & omtaler
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">T</div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mine sager</h1>
          <p className="text-sm text-gray-400 mt-1">Thomas Madsen · TM Byg ApS</p>
        </div>

        {/* Overblik */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">Aktive sager</p>
            <p className="text-3xl font-bold text-primary">{aktive.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">Ulæste beskeder</p>
            <p className="text-3xl font-bold text-gray-900">{sager.reduce((a, s) => a + s.ulæsteBeskeder, 0)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">Åbne mangler</p>
            <p className="text-3xl font-bold text-red-500">{sager.reduce((a, s) => a + s.åbneMangler, 0)}</p>
          </div>
        </div>

        {/* Aktive sager */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aktive sager</h2>
          <div className="space-y-3">
            {aktive.map((s) => (
              <Link key={s.id} href={`/haandvaerker/projekt/${s.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{s.titel}</h3>
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">I gang</span>
                      {s.ulæsteBeskeder > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{s.ulæsteBeskeder} ny</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{s.bygherre} · {s.adresse}</p>
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                      {s.næsteMilepæl && (
                        <span className="flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                          Næste: {s.næsteMilepæl}
                        </span>
                      )}
                      {s.næsteBetaling && (
                        <span className="flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                          Næste betaling: {s.næsteBetaling}
                        </span>
                      )}
                      {s.åbneMangler > 0 && (
                        <span className="flex items-center gap-1.5 text-red-500">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {s.åbneMangler} åben mangel
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{s.entreprisesum}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.type}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Afsluttede sager */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Afsluttede sager</h2>
          <div className="space-y-3">
            {afsluttede.map((s) => (
              <Link key={s.id} href={`/haandvaerker/projekt/${s.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-all opacity-70 hover:opacity-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{s.titel}</h3>
                      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Afsluttet</span>
                    </div>
                    <p className="text-sm text-gray-400">{s.bygherre} · {s.adresse}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{s.entreprisesum}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
