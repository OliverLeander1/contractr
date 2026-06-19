import Link from "next/link";

const bookinger = [
  { id: 1, tid: "I dag kl. 10:00", bygherre: "Camilla Jensen", type: "Aftaletjek", varighed: "45 min", projekt: "Indvendig renovering – Valby", status: "kommende" },
  { id: 2, tid: "I dag kl. 13:30", bygherre: "Henrik Møller", type: "Mangelgennemgang", varighed: "45 min", projekt: "Badeværelse – Frederiksberg", status: "kommende" },
  { id: 3, tid: "I morgen kl. 09:00", bygherre: "Lise Andersen", type: "Aftaletjek", varighed: "45 min", projekt: "Tagudskiftning – Rødovre", status: "kommende" },
  { id: 4, tid: "20. jun kl. 14:00", bygherre: "Poul Christensen", type: "Risikovurdering", varighed: "45 min", projekt: "Tilbygning – Hvidovre", status: "kommende" },
];

const projekter = [
  { id: 1, bygherre: "Camilla Jensen", titel: "Indvendig renovering – Valby", fase: "I gang", mangler: 1, risikoniveau: "middel" },
  { id: 2, bygherre: "Henrik Møller", titel: "Badeværelse – Frederiksberg", fase: "I gang", mangler: 0, risikoniveau: "lav" },
  { id: 3, bygherre: "Lise Andersen", titel: "Tagudskiftning – Rødovre", fase: "Screening", mangler: 0, risikoniveau: "høj" },
  { id: 4, bygherre: "Poul Christensen", titel: "Tilbygning – Hvidovre", fase: "Screening", mangler: 0, risikoniveau: "middel" },
];

const ugeplan = [
  { dag: "Man 16/6", slots: ["10:00 Camilla Jensen", "13:30 Henrik Møller"] },
  { dag: "Tir 17/6", slots: ["09:00 Lise Andersen"] },
  { dag: "Ons 18/6", slots: [] },
  { dag: "Tor 19/6", slots: ["14:00 Poul Christensen"] },
  { dag: "Fre 20/6", slots: [] },
];

export default function RaadgiverPortal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <span className="font-bold text-gray-900">Contractr</span>
              <span className="ml-2 text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded">Rådgiver</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">Oliver Leander · Safe-Con ApS</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">O</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">God morgen, Oliver</h1>
            <p className="text-sm text-gray-400 mt-1">4 bookinger denne uge · 1 åben mangelsag</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Rediger kalender
            </button>
            <button className="flex items-center gap-2 text-sm font-semibold bg-primary text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tilføj tilgængelighed
            </button>
          </div>
        </div>

        {/* Stat-kort */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Aktive projekter", value: "4", sub: "2 i gang · 2 screening", farve: "text-gray-900" },
            { label: "Bookinger i dag", value: "2", sub: "Næste: kl. 10:00", farve: "text-primary" },
            { label: "Åbne mangelsager", value: "1", sub: "Afventer tilbagemelding", farve: "text-red-600" },
            { label: "Afsluttet denne måned", value: "7", sub: "Gns. rating: 4.9 ★", farve: "text-green-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className={`text-3xl font-bold ${k.farve}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Ugekalender */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Ugekalender</h2>
              <div className="space-y-4">
                {ugeplan.map((dag) => (
                  <div key={dag.dag}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{dag.dag}</p>
                    {dag.slots.length === 0 ? (
                      <div className="h-9 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center">
                        <p className="text-xs text-gray-300">Ingen bookinger</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {dag.slots.map((slot) => (
                          <div key={slot} className="bg-accent border border-primary/20 rounded-xl px-3 py-2">
                            <p className="text-xs font-semibold text-primary">{slot}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bookinger + projekter */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Kommende møder</h2>
              <div className="space-y-3">
                {bookinger.map((b) => (
                  <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                      {b.bygherre.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.bygherre}</p>
                        <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full flex-shrink-0">{b.type}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{b.projekt}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">{b.tid} · {b.varighed}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href="/projekt/1" className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
                        Forbered
                      </Link>
                      <button className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                        Start møde
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Alle projekter</h2>
              <div className="space-y-3">
                {projekter.map((p) => (
                  <Link key={p.id} href={`/projekt/${p.id}`} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                        {p.bygherre[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{p.titel}</p>
                        <p className="text-xs text-gray-400">{p.bygherre} · {p.fase}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.mangler > 0 && (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{p.mangler} mangel</span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.risikoniveau === "høj" ? "bg-red-100 text-red-700" :
                        p.risikoniveau === "middel" ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {p.risikoniveau === "høj" ? "Høj risiko" : p.risikoniveau === "middel" ? "Middel" : "Lav risiko"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
