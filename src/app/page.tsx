import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contractr - Hele byggeprojektet samlet ét sted",
  description: "Contractr samler tilbud, kontrakter, betalingsplan og kommunikation i ét digitalt projektrum. For bygherren der vil have styr på det og håndværkeren der vil arbejde professionelt.",
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 300, letterSpacing: "2px" }} className="text-gray-900 text-lg">
              contractr
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-8">
            <Link href="/opret/upload" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Tjek tilbud</Link>
            <Link href="/opret" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Send i udbud</Link>
            <Link href="/haandvaerker/sager" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Håndværker</Link>
          </nav>
          <Link href="/opret" className="text-sm font-semibold bg-[#1a5c38] text-white px-5 py-2.5 rounded-lg hover:bg-[#163f28] transition-colors">
            Kom i gang gratis →
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero — split layout */}
        <section className="relative overflow-hidden bg-[#f8faf9]">
          {/* Subtil baggrundsgradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1a5c38]/4 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 py-20 relative">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Tekst */}
              <div>
                <span className="inline-flex items-center gap-2 bg-white text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100 shadow-sm mb-7">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Baseret på AB-Forbruger 2012
                </span>
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-6">
                  Hele bygge&shy;projektet<br />
                  <span className="text-[#1a5c38]">samlet ét sted</span>
                </h1>
                <p className="text-lg text-gray-500 leading-relaxed mb-9 max-w-lg">
                  Contractr sørger for at tilbud, kontrakter, betalinger og kommunikation er dokumenteret og tilgængeligt for alle parter.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#163f28] transition-colors text-base shadow-sm">
                    Start dit projekt gratis
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                  <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-gray-200">
                    Få tjekket et tilbud
                  </Link>
                </div>
                {/* Tillids-signaler */}
                <div className="flex items-center gap-6 text-xs text-gray-400">
                  {["Gratis at starte", "Ingen konto krævet", "AB-Forbruger indbygget"].map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Produkt-mockup */}
              <div className="hidden lg:block relative">
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  {/* Mockup header bar */}
                  <div className="bg-[#1a5c38] px-5 py-3.5 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                    </div>
                    <span className="text-xs text-white/60 font-mono ml-1">contractr.dk/projekt</span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Projekt-header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Aktivt projekt</p>
                        <h3 className="font-bold text-gray-900 text-base">Badeværelsesrenovering</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Valby, 2500 · Hansen VVS</p>
                      </div>
                      <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">Afventer accept</span>
                    </div>

                    {/* Beløb */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Tilbudssum inkl. moms</p>
                      <p className="text-3xl font-bold text-gray-900">87.500 <span className="text-base font-semibold text-gray-400">kr.</span></p>
                    </div>

                    {/* AB-Forbruger screening */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-600">AB-Forbruger screening</p>
                        <span className="text-xs font-bold text-amber-600">4 / 6 punkter OK</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[true, true, true, true, false, false].map((ok, i) => (
                          <div key={i} className={`flex-1 h-2 rounded-full ${ok ? "bg-[#1a5c38]" : "bg-amber-300"}`} />
                        ))}
                      </div>
                    </div>

                    {/* Handlingsliste */}
                    <div className="space-y-2">
                      {[
                        { tekst: "Tidsplan mangler i aftalen (§ 12)", type: "advarsel" },
                        { tekst: "Betalingsplan koblet til fremdrift", type: "ok" },
                        { tekst: "Ekstraarbejde-procedure uklart (§ 23)", type: "advarsel" },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border text-xs ${
                          item.type === "ok"
                            ? "bg-green-50 border-green-100 text-green-800"
                            : "bg-amber-50 border-amber-100 text-amber-800"
                        }`}>
                          {item.type === "ok"
                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          }
                          {item.tekst}
                        </div>
                      ))}
                    </div>

                    {/* CTA i mockup */}
                    <div className="flex gap-2 pt-1">
                      <div className="flex-1 bg-[#1a5c38] text-white text-xs font-semibold py-2.5 rounded-lg text-center">Acceptér tilbud</div>
                      <div className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-lg text-center">Send kommentar</div>
                    </div>
                  </div>
                </div>
                {/* Flydende badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">AB-Forbruger indbygget</p>
                    <p className="text-xs text-gray-400">Tjekpunkter screenet automatisk</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Tre brugertyper */}
        <section className="border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10 text-center">Bygget til alle parter i et byggeprojekt</p>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  ikon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  ),
                  label: "For dig der bygger",
                  titel: "Bygherre",
                  tekst: "Tilbud, kontrakt og betalingsplan samlet ét sted. Du ved altid hvad der er aftalt.",
                  link: "/opret",
                  linkTekst: "Start projekt →",
                  accent: "bg-[#1a5c38]/5 text-[#1a5c38]",
                },
                {
                  ikon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  ),
                  label: "For dig der udfører",
                  titel: "Håndværker og entreprenør",
                  tekst: "Modtag forespørgsler digitalt, send strukturerede tilbud tilbage og hold styr på alle sager.",
                  link: "/haandvaerker/sager",
                  linkTekst: "Se håndværkerportal →",
                  accent: "bg-blue-50 text-blue-700",
                },
                {
                  ikon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  ),
                  label: "Har du allerede et tilbud?",
                  titel: "Tjek tilbuddet nu",
                  tekst: "Upload kontrakt eller tilbud. Vi screener det mod AB-Forbruger og viser hvad du bør afklare.",
                  link: "/opret/upload",
                  linkTekst: "Upload tilbud →",
                  accent: "bg-amber-50 text-amber-700",
                },
              ].map((k) => (
                <div key={k.titel} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group">
                  <div className={`w-11 h-11 ${k.accent} rounded-xl flex items-center justify-center mb-5`}>
                    {k.ikon}
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k.label}</span>
                  <h3 className="font-bold text-gray-900 mt-1.5 mb-3 text-lg leading-snug">{k.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{k.tekst}</p>
                  <Link href={k.link} className="text-sm font-semibold text-[#1a5c38] hover:underline group-hover:underline">{k.linkTekst}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sådan virker det */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-[#1a5c38] uppercase tracking-widest">Sådan virker det</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">Fire trin. Alle parter samlet.</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Al dokumentation på plads fra start til aflevering.</p>
            </div>
            <div className="grid sm:grid-cols-4 gap-6 relative">
              <div className="hidden sm:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-gray-100 z-0" />
              {[
                {
                  nr: "01",
                  titel: "Send i udbud",
                  tekst: "Beskriv projektet og få et AI-genereret udbudsdokument. Del med håndværkere via link.",
                  ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
                  bg: "bg-[#1a5c38]",
                },
                {
                  nr: "02",
                  titel: "Modtag tilbud",
                  tekst: "Håndværkeren udfylder priser i din tilbudsliste og sender den tilbage.",
                  ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
                  bg: "bg-blue-600",
                },
                {
                  nr: "03",
                  titel: "Godkend og aftal",
                  tekst: "Automatisk AB-Forbruger-screening. Acceptér tilbuddet og projektrummet oprettes.",
                  ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                  bg: "bg-amber-500",
                },
                {
                  nr: "04",
                  titel: "Styr projektet",
                  tekst: "Betalingsplan, ekstraarbejde, mangler og kommunikation samlet ét sted.",
                  ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
                  bg: "bg-purple-600",
                },
              ].map((t) => (
                <div key={t.nr} className="relative z-10 flex flex-col items-center text-center">
                  <div className={`${t.bg} rounded-2xl flex items-center justify-center mb-5 shadow-md text-white`} style={{width:"4rem",height:"4rem"}}>
                    {t.ikon}
                  </div>
                  <span className="text-xs font-bold text-gray-300 mb-1 tracking-widest">{t.nr}</span>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">{t.titel}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features grid — mørk sektion */}
        <section className="bg-[#111c17] text-white">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Funktioner</span>
              <h2 className="text-3xl font-bold mt-2 mb-3">Alt hvad et byggeprojekt kræver</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Samlet i én platform, klar til brug fra dag ét.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { titel: "Udbudsdokument", tekst: "AI genererer et professionelt dokument med struktureret tilbudsliste på få minutter.", ikon: "✦" },
                { titel: "Tilbudsgenlæsning", tekst: "Se præcis hvad håndværkeren har ændret sammenlignet med din version.", ikon: "⇄" },
                { titel: "AB-Forbruger tjek", tekst: "Automatisk screening af om aftalen dækker de vigtigste forbrugerbeskyttelsespunkter.", ikon: "⊕" },
                { titel: "Digitalt projektrum", tekst: "Kontrakt, betalingsplan, mangler og ekstraarbejde samlet ét sted for alle parter.", ikon: "◻" },
                { titel: "Ekstraarbejde-sedler", tekst: "Digital tillægsaftale med godkendelse fra bygherre inden arbejdet sættes i gang.", ikon: "+" },
                { titel: "Mangelregistrering", tekst: "Registrér mangler med billeder og status og send direkte til håndværkeren.", ikon: "◎" },
              ].map((f) => (
                <div key={f.titel} className="bg-white/5 hover:bg-white/8 rounded-2xl p-6 border border-white/8 transition-colors group">
                  <div className="text-green-400 text-xl mb-4 font-light">{f.ikon}</div>
                  <h3 className="font-bold text-white mb-2">{f.titel}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AB-Forbruger sektion */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid sm:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold text-[#1a5c38] uppercase tracking-widest">AB-Forbruger 2012</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Dine rettigheder, oversat til handling</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                AB-Forbruger er den officielle forbrugerbeskyttelse i private byggesager. Contractr oversætter paragrafterne til konkrete tjekpunkter, så du ved hvad der bør stå i din aftale.
              </p>
              <Link href="/abforbruger" className="text-sm font-semibold text-[#1a5c38] hover:underline">Læs om AB-Forbruger →</Link>
            </div>
            <div className="space-y-2.5">
              {[
                { paragraf: "§ 12", tekst: "Er start- og slutdato aftalt skriftligt?" },
                { paragraf: "§ 23", tekst: "Er procedure for ekstraarbejde beskrevet?" },
                { paragraf: "§ 25", tekst: "Er betalingsplanen koblet til dokumenteret fremdrift?" },
                { paragraf: "§ 38", tekst: "Er afleverings- og mangelprocedure beskrevet?" },
                { paragraf: "§ 58", tekst: "Er 1-års eftersyn nævnt i aftalen?" },
              ].map((p) => (
                <div key={p.paragraf} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100 hover:border-green-100 hover:bg-green-50/40 transition-colors">
                  <span className="text-xs font-bold text-[#1a5c38] bg-white border border-green-100 shadow-sm px-2 py-1 rounded-lg w-12 text-center flex-shrink-0">{p.paragraf}</span>
                  <span className="text-sm text-gray-700">{p.tekst}</span>
                  <svg className="ml-auto text-gray-300 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1a5c38]">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Klar til at komme i gang?</h2>
            <p className="text-green-200 mb-10 leading-relaxed text-lg">
              Det er gratis. Du behøver ikke oprette en konto for at tjekke et tilbud eller sende et projekt i udbud.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#1a5c38] font-bold rounded-xl hover:bg-green-50 transition-colors text-base shadow-sm">
                Start projekt gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret/upload" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base border border-white/20">
                Få tjekket et tilbud
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1a5c38] rounded flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-xs text-gray-400">© 2025 Contractr</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
            <Link href="/abforbruger" className="text-xs text-gray-400 hover:text-gray-600">AB-Forbruger</Link>
            <Link href="/haandvaerker/sager" className="text-xs text-gray-400 hover:text-gray-600">Håndværker login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
