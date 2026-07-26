import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For entreprenører | Nembyggestyring",
  description: "Klare aftaler, ingen forgæves kørsel og hurtigere betaling. Sådan virker Nembyggestyring for dig som entreprenør.",
};

const fordele = [
  {
    ikon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    titel: "Klart aftalegrundlag fra dag ét",
    tekst: "Bygherre har beskrevet projektet og godkendt vilkårene inden du inviteres. Du ved præcist hvad du går ind til. Ingen løse mundtlige aftaler.",
  },
  {
    ikon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    titel: "Ekstraarbejde aftales og godkendes digitalt",
    tekst: "Tillægsaftaler oprettes i systemet og godkendes af bygherre inden du starter. Ingen diskussion bagefter om hvem der bestilte hvad. Det hele er dokumenteret.",
  },
  {
    ikon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    titel: "Betaling koblet til fremdrift",
    tekst: "Du markerer en milepæl som udført. Bygherre godkender. Betalingen frigives. Ingen rykkere, ingen ventetid, ingen diskussioner om hvad der er leveret.",
  },
  {
    ikon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    titel: "Ingen forgæves kørsel",
    tekst: "Du kan se om forudsætningerne er opfyldt inden du møder op. Er gipset ikke monteret, kører maleren ikke ud. Det sparer alle parter tid og penge.",
  },
  {
    ikon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    titel: "Ét sted for al kommunikation",
    tekst: "Dokumenter, billeder, beskeder og godkendelser samlet ét sted. Ingen jagt på mails og SMS'er, og bygherre slipper for at spille mellemmand.",
  },
  {
    ikon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titel: "Dokumentation der holder",
    tekst: "Alle aftaler og godkendelser logges med tidsstempel. Din rygrad hvis der opstår uenighed om hvad der er leveret, hvornår og til hvilken pris.",
  },
];

export default function EntreprenoerSide() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">

      {/* Header */}
      <header className="px-4 sm:px-6 py-4 bg-[#f5f3ee] border-b border-[#e0ddd6]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="logo">nembyggestyring</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors hidden sm:block">
              For bygherren
            </Link>
            <Link href="/login" className="text-sm font-semibold text-[#1e3a2a] border border-[#1e3a2a]/30 px-4 py-2 rounded-lg hover:bg-[#1e3a2a]/5 transition-colors">
              Log ind
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-flex items-center gap-2 bg-[#1e3a2a]/8 text-[#1e3a2a] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 bg-[#1e3a2a] rounded-full" />
                  For entreprenører og håndværkere
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold text-[#111816] leading-[1.08] tracking-tight mb-5">
                  Færre konflikter.<br />Hurtigere betaling.<br />
                  <span className="text-[#1e3a2a]">Mere tid til at bygge.</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
                  Når bygherre bruger Nembyggestyring, slipper du for løse mundtlige aftaler, uklarhed om ekstraarbejde og diskussioner om betaling. Alt er skriftligt, dokumenteret og godkendt af begge parter.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/haandvaerker/opret-konto" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1e3a2a] text-white font-bold rounded-xl hover:bg-[#162d20] transition-colors text-base shadow-sm">
                    Opret profil som entreprenør
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                  <Link href="/haandvaerker/sager" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-[#e0ddd6]">
                    Log ind
                  </Link>
                </div>
                <p className="text-xs text-gray-400 mt-4">Ingen konto kræves for at gennemse et aftalegrundlag du er inviteret til.</p>
              </div>

              {/* Højre: citat/social proof */}
              <div className="hidden md:flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-sm">TM</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Thomas Madsen</p>
                      <p className="text-xs text-gray-400">TM Byg · Glostrup</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "Jeg har haft for mange sager hvor ekstraarbejde endte i diskussion. Nu er det aftalt og godkendt skriftligt inden vi starter. Det er simpelt og det virker."
                  </p>
                </div>

                <div className="bg-[#1e3a2a] rounded-2xl p-6">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Typisk fordel</p>
                  <div className="space-y-3">
                    {[
                      { label: "Tid brugt på at rydde op efter misforståelser", fra: "Timer", til: "Minutter" },
                      { label: "Ventetid på betaling efter aflevering", fra: "Op til 30 dage", til: "1-3 dage" },
                      { label: "Forgæves kørsel pga. uklare forudsætninger", fra: "Hyppigt", til: "Sjældent" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-3">
                        <p className="text-white/70 text-xs leading-snug flex-1">{r.label}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-red-300 line-through">{r.fra}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          <span className="text-xs text-green-300 font-semibold">{r.til}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fordele */}
        <section className="bg-white py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Hvad du får</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Platformen arbejder for dig</h2>
              <p className="text-base text-gray-500 mt-2 max-w-lg">Du behøver ikke gøre noget anderledes. Bygherre inviterer dig, og du har adgang til et struktureret projektrum fra dag ét.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {fordele.map((f) => (
                <div key={f.titel} className="bg-[#f5f3ee] rounded-2xl p-6 border border-[#e0ddd6]">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1e3a2a] mb-4 border border-[#e0ddd6]">
                    {f.ikon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sådan fungerer det for dig */}
        <section className="bg-[#f5f3ee] py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Sådan virker det</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Fra invitation til aflevering</h2>
            </div>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                {
                  nr: "1",
                  titel: "Du modtager en invitation",
                  tekst: "Bygherre sender dig et link. Du åbner det uden at skulle oprette en konto.",
                },
                {
                  nr: "2",
                  titel: "Du gennemser aftalegrundlaget",
                  tekst: "Se hvad der er aftalt, foreslå ændringer og godkend når I er enige.",
                },
                {
                  nr: "3",
                  titel: "Projektet kører i systemet",
                  tekst: "Ekstraarbejde, tidsplan og kommunikation samlet ét sted. Begge parter kan følge med.",
                },
                {
                  nr: "4",
                  titel: "Betaling frigives ved godkendelse",
                  tekst: "Markér arbejdet som udført. Bygherre godkender. Pengene er på vej.",
                },
              ].map((s) => (
                <div key={s.nr} className="bg-white rounded-2xl p-6 border border-[#e0ddd6]">
                  <span className="text-4xl font-bold text-[#1e3a2a]/15 leading-none block mb-4">{s.nr}</span>
                  <h3 className="font-bold text-gray-900 mb-2 text-base">{s.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AB-Forbruger for entreprenøren */}
        <section className="bg-white py-14 sm:py-20 px-4 sm:px-6 border-t border-[#e0ddd6]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 bg-[#e5ede7] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">AB-Forbruger 2012 som standard</h2>
            <p className="text-base text-gray-500 leading-relaxed mb-4 max-w-xl mx-auto">
              Alle projekter på platformen bruger AB-Forbruger 2012 som aftalegrundlag. Det er standardvilkårene der regulerer forholdet mellem bygherre og entreprenør, og det giver klarhed for begge parter, og det giver tryghed for dig.
            </p>
            <p className="text-base text-gray-500 leading-relaxed max-w-xl mx-auto">
              Ekstraarbejde aftales skriftligt inden opstart. Betaling kobles til dokumenteret fremdrift. Aflevering sker ved en formel afleveringsforretning. Det er de samme vilkår som professionelle byggesager. Nu tilgængeligt for private projekter.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1e3a2a] px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 leading-tight">Klar til at prøve?</h2>
            <p className="text-green-200/70 mb-8 text-base leading-relaxed">
              Opret en profil gratis. Næste gang bygherre inviterer dig, er du klar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/haandvaerker/opret-konto" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#1e3a2a] font-bold rounded-xl hover:bg-[#f5f3ee] transition-colors text-base shadow-lg">
                Opret profil som entreprenør
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base">
                Læs om platformen for bygherren
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#e0ddd6] bg-[#f5f3ee] px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">2025 Nembyggestyring</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">For bygherren</Link>
            <Link href="/abforbruger" className="text-xs text-gray-400 hover:text-gray-600">AB-Forbruger</Link>
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
