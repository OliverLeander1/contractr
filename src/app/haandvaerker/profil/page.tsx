import Link from "next/link";

const omtaler = [
  {
    bygherre: "Camilla Jensen",
    projekt: "Indvendig renovering - Valby",
    dato: "Oktober 2024",
    rating: 5,
    tekst: "Thomas og hans team leverede et flot stykke arbejde til tiden og inden for budgettet. Meget professionel kommunikation og altid ærlig omkring hvad der skulle til. Kan varmt anbefales.",
  },
  {
    bygherre: "Mette Lund",
    projekt: "Tagudskiftning - Hellerup",
    dato: "Juni 2024",
    rating: 5,
    tekst: "Meget tilfreds. Arbejdet blev udført hurtigt og pænt, og Thomas holdt os løbende orienteret. Ingen overraskelser på regningen.",
  },
  {
    bygherre: "Peter Holm",
    projekt: "Køkken - Østerport",
    dato: "Marts 2024",
    rating: 4,
    tekst: "Godt håndværk og god kommunikation. Tog lidt længere tid end planlagt, men Thomas var ærlig om årsagen og løste det professionelt.",
  },
];

function Stjerner({ antal }: { antal: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= antal ? "#1a5c38" : "none"} stroke="#1a5c38" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

const gennemsnit = (omtaler.reduce((a, o) => a + o.rating, 0) / omtaler.length).toFixed(1);

export default function HaandvaerkerProfil() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/haandvaerker/sager" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Mine sager
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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">T</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Thomas Madsen</h1>
              <p className="text-gray-500 mb-3">TM Byg ApS · CVR 12345678</p>
              <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Tømrer & murerarbejde
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Glostrup og omegn
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Medlem siden 2024
                </span>
              </div>
            </div>
            <button className="text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
              Rediger profil
            </button>
          </div>
        </div>

        {/* Rating overblik */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Dine omtaler</h2>
          <div className="flex items-center gap-8 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{gennemsnit}</p>
              <Stjerner antal={5} />
              <p className="text-xs text-gray-400 mt-1">{omtaler.length} omtaler</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const antal = omtaler.filter(o => o.rating === s).length;
                const pct = Math.round((antal / omtaler.length) * 100);
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4">{s}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-6">{antal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Omtaler */}
          <div className="space-y-5">
            {omtaler.map((o, i) => (
              <div key={i} className="pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                      {o.bygherre[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{o.bygherre}</p>
                      <p className="text-xs text-gray-400">{o.projekt}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Stjerner antal={o.rating} />
                    <p className="text-xs text-gray-400 mt-1">{o.dato}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-12">{o.tekst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Færdigheder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Specialer</h2>
          <div className="flex flex-wrap gap-2">
            {["Tømrerarbejde", "Gipsvægge", "Maling", "Badeværelse", "Køkken", "Tag", "Lettere el-arbejde", "Flisearbejde"].map((s) => (
              <span key={s} className="bg-accent text-primary text-xs font-semibold px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
