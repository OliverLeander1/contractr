import { use, Suspense } from "react";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import Chat from "@/components/Chat";
import ProjektHeader from "@/components/ProjektHeader";

const milestones = [
  { id: 1, navn: "Kontrakt underskrevet", dato: "12. mar. 2025", status: "done" },
  { id: 2, navn: "Nedrivning", dato: "28. mar. 2025", status: "done" },
  { id: 3, navn: "Gipsvægge", dato: "30. apr. 2025", status: "active" },
  { id: 4, navn: "Malerarbejde", dato: "15. jun. 2025", status: "upcoming" },
  { id: 5, navn: "Aflevering", dato: "30. sep. 2025", status: "upcoming" },
];

const betalinger = [
  { navn: "Opstart og nedrivning", andel: "20 %", beløb: "20.000 kr.", status: "godkendt" },
  { navn: "Gipsvægge", andel: "25 %", beløb: "25.000 kr.", status: "godkendt" },
  { navn: "El og VVS", andel: "25 %", beløb: "25.000 kr.", status: "godkendt" },
  { navn: "Malerarbejde", andel: "30 %", beløb: "42.500 kr.", status: "afventer" },
];

const dokumenter = [
  { navn: "Kontrakt", type: "PDF", størrelse: "1,2 MB", dato: "12. mar. 2025" },
  { navn: "Aftaleseddel #3", type: "PDF", størrelse: "345 KB", dato: "30. apr. 2025" },
  { navn: "Tidsplan", type: "PDF", størrelse: "780 KB", dato: "15. mar. 2025" },
  { navn: "Tegninger", type: "ZIP", størrelse: "4,8 MB", dato: "12. mar. 2025" },
];

const aktiviteter = [
  { tekst: "Aftaleseddel #3 er klar til godkendelse", tid: "30. apr. 2025 kl. 10:32", type: "dokument" },
  { tekst: "Betaling for milepæl Gipsvægge er godkendt", tid: "28. apr. 2025 kl. 14:21", type: "betaling" },
  { tekst: "Rådgiverbesøg booket", tid: "24. apr. 2025 kl. 09:15", type: "rådgiver" },
  { tekst: "Tidsplan opdateret af entreprenøren", tid: "15. mar. 2025 kl. 11:00", type: "tidsplan" },
];

export default function ProjektOversigt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Projekt header */}
        <ProjektHeader />

        {/* Statuskort */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: "Projektstatus", value: "43 %", sub: "Af projektet udført", link: "Se detaljer", href: `/projekt/${id}/tidsplan`, color: "text-primary", icon: (
              <svg width="20" height="20" viewBox="0 0 36 36" className="text-primary">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray="43 57" strokeDashoffset="25" strokeLinecap="round"/>
              </svg>
            )},
            { label: "Næste milepæl", value: "Malerarbejde", sub: "15. juni 2025", link: "Se tidsplan", href: `/projekt/${id}/tidsplan`, color: "text-gray-900", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            )},
            { label: "Næste betaling", value: "42.500 kr.", sub: "Afventer godkendelse", link: "Se betalinger", href: `/projekt/${id}/betalinger`, color: "text-gray-900", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            )},
            { label: "Åbne aftalesedler", value: "2", sub: "Kræver godkendelse", link: "Se aftalesedler", href: `/projekt/${id}/dokumenter`, color: "text-amber-600", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            )},
            { label: "Åbne mangler", value: "1", sub: "Kræver opfølgning", link: "Se mangler", href: `/projekt/${id}/mangler`, color: "text-red-600", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )},
            { label: "Booket rådgiverbesøg", value: "28. maj 2025", sub: "Byggepladstilsyn", link: "Se aftale", href: `/tilkoeb/book/bekraeftelse`, color: "text-gray-900", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            )},
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-400 font-medium leading-snug">{item.label}</p>
                {item.icon}
              </div>
              <p className={`text-lg font-bold ${item.color} leading-tight mb-1`}>{item.value}</p>
              <p className="text-xs text-gray-400 mb-3">{item.sub}</p>
              <Link href={item.href} className="text-xs text-primary font-semibold hover:underline">{item.link} →</Link>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Venstre kolonne */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tidsplan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900">Tidsplan og milepæle</h2>
                <Link href={`/projekt/${id}/tidsplan`} className="text-xs text-primary font-semibold hover:underline">Se fuld tidsplan →</Link>
              </div>
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
                <div className="absolute top-4 left-4 h-0.5 bg-primary" style={{ width: "45%" }} />
                <div className="flex justify-between relative">
                  {milestones.map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-2 w-1/5">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${
                        m.status === "done" ? "bg-primary border-primary" :
                        m.status === "active" ? "bg-white border-primary" :
                        "bg-white border-gray-200"
                      }`}>
                        {m.status === "done" && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                        {m.status === "active" && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                        {m.status === "upcoming" && (
                          <span className="text-xs text-gray-400 font-medium">{m.id}</span>
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-semibold leading-tight ${m.status === "active" ? "text-primary" : m.status === "done" ? "text-gray-700" : "text-gray-400"}`}>
                          {m.navn}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{m.dato}</p>
                        {m.status === "active" && (
                          <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">I gang</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Betalingsmilepæle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Betalingsmilepæle</h2>
                <Link href={`/projekt/${id}/betalinger`} className="text-xs text-primary font-semibold hover:underline">Se alle betalinger →</Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs text-gray-400 font-medium pb-3">Milepæl</th>
                    <th className="text-xs text-gray-400 font-medium pb-3">Andel</th>
                    <th className="text-xs text-gray-400 font-medium pb-3">Beløb</th>
                    <th className="text-xs text-gray-400 font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {betalinger.map((b, i) => (
                    <tr key={i} className={`${b.status === "afventer" ? "bg-amber-50/50" : ""}`}>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-gray-900">{i + 1}. {b.navn}</p>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-500">{b.andel}</td>
                      <td className="py-3 pr-4 text-sm font-medium text-gray-900">{b.beløb}</td>
                      <td className="py-3">
                        {b.status === "godkendt" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            Godkendt
                          </span>
                        ) : (
                          <Link href={`/projekt/${id}/betalinger`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full hover:bg-amber-200 transition-colors">
                            Afventer godkendelse →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="pt-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="pt-3 text-sm text-gray-500">100 %</td>
                    <td className="pt-3 text-sm font-bold text-gray-900">112.500 kr.</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Dokumenter */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Dokumenter og historik</h2>
                <Link href={`/projekt/${id}/dokumenter`} className="text-xs text-primary font-semibold hover:underline">Se alle dokumenter →</Link>
              </div>
              <div className="space-y-2">
                {dokumenter.map((d) => (
                  <div key={d.navn} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.navn}</p>
                        <p className="text-xs text-gray-400">{d.type} · {d.størrelse} · {d.dato}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Aktivitetsfeed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Aktivitetsfeed</h2>
                <Link href={`/projekt/${id}/dokumenter`} className="text-xs text-primary font-semibold hover:underline">Se alle aktiviteter →</Link>
              </div>
              <div className="space-y-4">
                {aktiviteter.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {a.type === "dokument" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                      {a.type === "betaling" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>}
                      {a.type === "rådgiver" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                      {a.type === "tidsplan" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{a.tekst}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.tid}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Højre kolonne — sidebar */}
          <div className="space-y-5">

            {/* Næste skridt */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Næste skridt</h3>
              </div>
              <div className="bg-accent rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-accent-foreground mb-1">Godkend næste milepæl</p>
                <p className="text-xs text-accent-foreground/80 leading-relaxed">Malerarbejde er afsluttet og klar til din godkendelse. Når du godkender, frigives betalingen til håndværkeren.</p>
                <p className="text-lg font-bold text-primary mt-3">42.500 kr.</p>
                <p className="text-xs text-gray-400">Afventer din godkendelse</p>
              </div>
              <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity mb-2">
                Godkend milepæl
              </button>
              <button className="w-full border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Se grundlag
              </button>
            </div>

            {/* AB-Forbruger info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">AB-Forbruger</span>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Vidste du det?</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Du kan tilbageholde betaling for mangelfuldt arbejde, mens den ubestridte del betales. AB-Forbruger § 25 stk. 3.
              </p>
              <Link href="/abforbruger" className="text-xs text-primary font-semibold hover:underline">Læs mere om dine rettigheder →</Link>
            </div>

            {/* Rådgiver */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Har du brug for hjælp?</h3>
              <p className="text-xs text-gray-400 mb-4">Din rådgiver står klar til at hjælpe dig videre.</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">👨‍💼</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mikkel Sørensen</p>
                  <p className="text-xs text-gray-400">Byggerådgiver</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Send besked
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Ring
                </button>
              </div>
              <Link href="/tilkoeb" className="block text-center text-xs text-primary font-semibold mt-3 hover:underline">Se alle rådgivere →</Link>
            </div>

            {/* Projektstatus */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Projektstatus</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Projektet er i gang</p>
                    <p className="text-xs text-gray-400">Startede 12. marts 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Forventet afslutning</p>
                    <p className="text-xs text-gray-400">30. september 2025</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Suspense><Chat bruger="bygherre" /></Suspense>
    </div>
  );
}
