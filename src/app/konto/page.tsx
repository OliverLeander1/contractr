import Link from "next/link";

const projekter = [
  { id: 1, titel: "Indvendig renovering, Valby", status: "I gang", oprettet: "12. mar. 2025", entreprisesum: "112.500 kr." },
];

export default function Konto() {
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
            <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Profilkort */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">C</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Camilla Jensen</h1>
              <p className="text-gray-500 text-sm mb-3">camilla.jensen@email.dk · Oprettet mar. 2025</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Valby Langgade 85, 2500 Valby
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/></svg>
                  +45 20 12 34 56
                </span>
              </div>
            </div>
            <button className="text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
              Rediger
            </button>
          </div>
        </div>

        {/* Pakke */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Din pakke</h2>
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Mellem</span>
                <span className="text-sm text-gray-500">999 kr. · Betalt 12. mar. 2025</span>
              </div>
            </div>
            <Link href="/pakke" className="text-sm font-semibold text-primary hover:underline">
              Opgradér →
            </Link>
          </div>
        </div>

        {/* Mine projekter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Mine projekter</h2>
            <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nyt projekt
            </Link>
          </div>
          <div className="space-y-3">
            {projekter.map((p) => (
              <Link key={p.id} href={`/projekt/${p.id}`} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group">
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{p.titel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Oprettet {p.oprettet} · {p.entreprisesum}</p>
                </div>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex-shrink-0">{p.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Konto-indstillinger */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Kontoindstillinger</h2>
          <div className="space-y-1">
            {[
              { label: "Skift adgangskode", ikon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
              { label: "Notifikationsindstillinger", ikon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" },
              { label: "Download mine data", ikon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" },
              { label: "Slet konto", ikon: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", danger: true },
            ].map((item) => (
              <button key={item.label} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors group ${item.danger ? "mt-2" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.danger ? "bg-red-50" : "bg-gray-100 group-hover:bg-gray-200"} transition-colors`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.danger ? "#dc2626" : "currentColor"} strokeWidth="2" className={item.danger ? "" : "text-gray-500"}>
                    <path d={item.ikon}/>
                  </svg>
                </div>
                <span className={`text-sm font-medium ${item.danger ? "text-red-600" : "text-gray-700"}`}>{item.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto text-gray-300">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">Log ud</button>
        </div>
      </div>
    </div>
  );
}
