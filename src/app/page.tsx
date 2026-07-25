import type { Metadata } from "next";
import Link from "next/link";
import { UploadAnimation, ScanAnimation, AdvisorAnimation, ProjectAnimation } from "@/components/BenefitAnimation";

export const metadata: Metadata = {
  title: "Nembyggestyring - Hele byggeprojektet samlet ét sted",
  description: "Opret dit byggeprojekt, inviter entreprenøren og styr hele sagen digitalt. Med tilbudstjek, kontrakt, ekstraarbejde og betalingsplan samlet ét sted.",
  keywords: ["byggesag", "byggeprojekt", "tilbud håndværker", "AB-Forbruger", "kontrakt screening", "bygherre", "renovering", "projektstyring", "byggesagkyndig"],
  openGraph: {
    title: "Nembyggestyring - Hele byggeprojektet samlet ét sted",
    description: "Opret dit byggeprojekt, inviter entreprenøren og styr hele sagen digitalt.",
    url: "https://www.nembyggestyring.dk",
    type: "website",
    siteName: "Nembyggestyring",
  },
  alternates: { canonical: "https://www.nembyggestyring.dk" },
  robots: { index: true, follow: true },
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">

      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sticky top-0 bg-[#f5f3ee]/95 backdrop-blur z-50 border-b border-[#e0ddd6]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>

          <div className="hidden sm:flex flex-1 justify-center">
            <div className="inline-flex items-center bg-white/70 rounded-xl p-1 gap-1 border border-[#e0ddd6]">
              <Link href="/" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1e3a2a] text-white text-xs font-semibold shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Bygherre
              </Link>
              <Link href="/haandvaerker/sager" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white text-xs font-medium transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Entreprenør
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/login" className="text-sm font-semibold text-[#1e3a2a] border border-[#1e3a2a]/30 px-4 py-2 rounded-lg hover:bg-[#1e3a2a]/5 transition-colors whitespace-nowrap">
              Log ind
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

              {/* Venstre: Tekst */}
              <div>
                <span className="inline-flex items-center gap-2 bg-[#1e3a2a]/8 text-[#1e3a2a] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 bg-[#1e3a2a] rounded-full animate-pulse" />
                  Hele byggesagen samlet ét sted
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold text-[#111816] leading-[1.08] tracking-tight mb-5">
                  Styr hele<br />byggeprojektet.<br />
                  <span className="text-[#1e3a2a]">Fra start til aflevering.</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-md">
                  Opret dit projekt, beskriv hvad du vil bygge, og inviter entreprenøren direkte. Alt — kontrakt, aftaler, ekstraarbejde og betalinger — samlet ét sted.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1e3a2a] text-white font-bold rounded-xl hover:bg-[#162d20] transition-colors text-base shadow-sm">
                    Opret dit projekt gratis
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                  <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-[#e0ddd6]">
                    Tjek dit tilbud
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                  {["Ingen konto krævet for at starte", "Gratis tilbudstjek", "AB-Forbruger 2012 som standard"].map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Højre: Projekt-mockup */}
              <div className="relative hidden md:block">
                <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-xl overflow-hidden max-w-sm ml-auto">
                  {/* Mockup header */}
                  <div className="px-5 pt-5 pb-4 border-b border-[#f0ede8]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Aktivt projekt</p>
                        <p className="font-bold text-gray-900">Badeværelsesrenovering</p>
                        <p className="text-xs text-gray-400 mt-0.5">Elmevej 12, 2500 Valby</p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">I gang</span>
                    </div>
                  </div>
                  {/* Status-punkter */}
                  <div className="px-5 py-4 space-y-2.5">
                    {[
                      { tekst: "Kontrakt godkendt af begge parter", ok: true },
                      { tekst: "Betalingsplan koblet til fremdrift", ok: true },
                      { tekst: "Ekstraarbejde aftalt skriftligt", ok: true },
                      { tekst: "Afleveringsforretning", ok: false, afventer: true },
                    ].map((p) => (
                      <div key={p.tekst} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${p.ok ? "bg-[#e5ede7]" : "bg-gray-50 border border-gray-100"}`}>
                        {p.ok
                          ? <svg className="flex-shrink-0 text-[#1e3a2a]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg className="flex-shrink-0 text-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                        }
                        <span className={`text-xs leading-snug ${p.ok ? "text-[#1e3a2a] font-medium" : "text-gray-400"}`}>{p.tekst}</span>
                        {p.afventer && <span className="ml-auto text-[10px] text-gray-400 font-medium">Afventer</span>}
                      </div>
                    ))}
                  </div>
                  {/* Næste handling */}
                  <div className="mx-5 mb-5 bg-[#1e3a2a] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-green-100 font-medium leading-snug">Næste: Book afleveringsforretning med entreprenøren</p>
                    <svg className="flex-shrink-0 text-green-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </div>
                <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-[#1e3a2a]/6 rounded-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Tre platformfordele */}
        <section className="bg-[#1e3a2a] py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
              {[
                {
                  ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                  titel: "Opret projektet med det samme",
                  tekst: "Beskriv dit projekt, og vi genererer et professionelt udbudsdokument. Send det til entreprenøren og kom i gang.",
                },
                {
                  ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
                  titel: "Alt samlet i ét projektrum",
                  tekst: "Kontrakt, betalingsplan, ekstraarbejde, billeder og kommunikation. Ingen jagt på mails og SMS'er.",
                },
                {
                  ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                  titel: "Juridisk rygrad uden juridisk jargon",
                  tekst: "AB-Forbruger 2012 er standard på alle projekter. Vi tjekker tilbuddene og viser præcist hvad du skal afklare.",
                },
              ].map((s) => (
                <div key={s.titel} className="flex gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-green-200 flex-shrink-0 mt-0.5">
                    {s.ikon}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base mb-1">{s.titel}</p>
                    <p className="text-sm text-green-200/70 leading-relaxed">{s.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sådan virker det */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 sm:mb-16">
              <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Sådan virker det</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Fra idé til igangsat projekt på få minutter.</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  nr: "1",
                  titel: "Beskriv dit projekt",
                  tekst: "Fortæl hvad du vil bygge. Vi stiller de rigtige spørgsmål og laver et professionelt udbudsdokument klar til at sende.",
                  ikon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                },
                {
                  nr: "2",
                  titel: "Inviter entreprenøren",
                  tekst: "Send et link direkte til din entreprenør. De kan gennemse aftalegrundlaget, foreslå ændringer og godkende — ingen konto kræves.",
                  ikon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                },
                {
                  nr: "3",
                  titel: "Styr projektet sammen",
                  tekst: "Ekstraarbejde aftales digitalt, betalinger kobles til fremdrift, og alt dokumenteres undervejs. Færre konflikter, mere overblik.",
                  ikon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
                },
              ].map((s) => (
                <div key={s.nr} className="group">
                  <div className="flex items-start gap-5">
                    <span className="text-6xl sm:text-7xl font-bold text-[#1e3a2a]/10 leading-none select-none -mt-2">{s.nr}</span>
                    <div className="pt-2">
                      <div className="w-10 h-10 bg-[#e5ede7] rounded-xl flex items-center justify-center text-[#1e3a2a] mb-4">
                        {s.ikon}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{s.titel}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.tekst}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-3">
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1e3a2a] text-white font-bold rounded-xl hover:bg-[#162d20] transition-colors text-base shadow-sm">
                Opret dit projekt nu
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-[#e0ddd6]">
                Eller tjek et tilbud gratis
              </Link>
            </div>
          </div>
        </section>

        {/* Fordele med animerede ikoner */}
        <section className="bg-[#f5f3ee] py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Platformen</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Fra første udkast til 1-års eftersyn</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6">
              {[
                { anim: <UploadAnimation />, titel: "Udbudsdokument på få minutter", tekst: "Beskriv projektet og få et professionelt dokument klar til at sende." },
                { anim: <ScanAnimation />, titel: "Tilbudstjek mod AB-Forbruger", tekst: "Vi gennemgår aftalen og viser præcist hvad du skal afklare." },
                { anim: <AdvisorAnimation />, titel: "Rådgiver ved behov", tekst: "Book en byggesagkyndig direkte når sagen kræver professionel hjælp." },
                { anim: <ProjectAnimation />, titel: "Projektet samlet ét sted", tekst: "Kontrakt, betalinger, ekstraarbejde og kommunikation fra dag ét." },
              ].map((f) => (
                <div key={f.titel} className="bg-white rounded-2xl pt-6 pb-7 px-5 hover:shadow-md transition-shadow border border-[#e0ddd6] flex flex-col items-center text-center">
                  {f.anim}
                  <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug mt-3">{f.titel}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AB-Forbruger */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-10 sm:gap-20 items-center">
              <div>
                <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">AB-Forbruger 2012</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-5">Det du ikke vidste du skulle spørge om</h2>
                <p className="text-base text-gray-600 leading-relaxed mb-4">
                  AB-Forbruger er standardvilkårene der beskytter private bygherrer i Danmark. De træder kun i kraft hvis begge parter eksplicit aftaler det, og de fleste husejere opdager det for sent.
                </p>
                <p className="text-base text-gray-600 leading-relaxed mb-7">
                  Nembyggestyring tjekker automatisk om din aftale dækker de kritiske paragraffer, og fortæller dig hvad du skal kræve af håndværkeren inden du skriver under.
                </p>
                <Link href="/abforbruger" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e3a2a] hover:underline">
                  Læs om AB-Forbruger 2012
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
              <div className="space-y-2.5">
                {[
                  { paragraf: "§ 12", tekst: "Er start- og slutdato aftalt skriftligt?", ok: true },
                  { paragraf: "§ 23", tekst: "Er procedure for ekstraarbejde beskrevet?", ok: false },
                  { paragraf: "§ 25", tekst: "Er betalingsplanen koblet til dokumenteret fremdrift?", ok: true },
                  { paragraf: "§ 38", tekst: "Er afleverings- og mangelprocedure beskrevet?", ok: false },
                  { paragraf: "§ 58", tekst: "Er 1-års eftersyn nævnt i aftalen?", ok: false },
                ].map((p) => (
                  <div key={p.paragraf} className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border ${p.ok ? "bg-[#e5ede7] border-[#1e3a2a]/10" : "bg-amber-50 border-amber-100"}`}>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg w-12 text-center flex-shrink-0 ${p.ok ? "bg-white text-[#1e3a2a] shadow-sm" : "bg-amber-100 text-amber-700"}`}>{p.paragraf}</span>
                    <span className="text-gray-700 text-sm flex-1">{p.tekst}</span>
                    {p.ok
                      ? <svg className="flex-shrink-0 text-[#1e3a2a]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg className="flex-shrink-0 text-amber-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                    }
                  </div>
                ))}
                <p className="text-xs text-gray-400 text-center pt-1">Eksempel på screening-output</p>
              </div>
            </div>
          </div>
        </section>

        {/* Funktioner */}
        <section className="bg-[#f5f3ee] py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="mb-10">
              <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Hele projektet samlet</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-2">Fra første tilbud til 1-års eftersyn</h2>
              <p className="text-base text-gray-500 max-w-lg">
                Nembyggestyring er ikke bare en screener. Det er et digitalt projektrum hvor kontrakt, betalinger, dokumenter og kommunikation samles ét sted.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, titel: "Tilbudstjek", tekst: "Screenet mod AB-Forbruger på 2 minutter. Gratis at starte." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>, titel: "Digitalt projektrum", tekst: "Kontrakt, betalinger og kommunikation samlet ét sted." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, titel: "Ekstraarbejde-sedler", tekst: "Digital tillægsaftale med godkendelse fra bygherre inden opstart." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, titel: "Betalingsplan", tekst: "Koblet til dokumenteret fremdrift, ikke bare datoer." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, titel: "Mangelregistrering", tekst: "Billeder og status sendt direkte til håndværkeren." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, titel: "Rådgiverbooking", tekst: "Book en byggesagkyndig ved middel eller høj risiko." },
              ].map((f) => (
                <div key={f.titel} className="bg-white rounded-2xl p-6 border border-[#e0ddd6] hover:shadow-md transition-shadow flex gap-4 items-start">
                  <div className="w-10 h-10 bg-[#e5ede7] rounded-xl flex items-center justify-center flex-shrink-0">
                    {f.ikon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">{f.titel}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Entreprenør-sektion */}
        <section className="bg-white py-16 sm:py-24 border-t border-[#e0ddd6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div>
                <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">For entreprenøren</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-5">Færre misforståelser. Hurtigere betaling.</h2>
                <p className="text-base text-gray-600 leading-relaxed mb-5">
                  Når bygherre inviterer dig ind på platformen, er alt det grundlæggende på plads fra start. Ingen uklarhed om hvad der er aftalt, ingen forgæves kørsel, og ekstraarbejde dokumenteres digitalt inden du starter.
                </p>
                <p className="text-base text-gray-600 leading-relaxed mb-7">
                  Betaling kobles til dokumenteret fremdrift. Når du markerer en milepæl som udført og bygherre godkender, frigives betalingen. Ingen rykkere, ingen ventetid.
                </p>
                <Link href="/haandvaerker/sager" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e3a2a] hover:underline">
                  Læs mere om platformen for entreprenører
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  {
                    ikon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                    titel: "Klart aftalegrundlag fra dag ét",
                    tekst: "Bygherre har allerede beskrevet projektet og godkendt vilkårene. Du ved præcist hvad du går ind til.",
                  },
                  {
                    ikon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                    titel: "Ekstraarbejde aftales digitalt",
                    tekst: "Tillægsaftaler godkendes skriftligt inden opstart. Ingen tvister bagefter om hvem der bestilte hvad.",
                  },
                  {
                    ikon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
                    titel: "Betaling koblet til fremdrift",
                    tekst: "Du markerer milepæle som udført, bygherre godkender, og betalingen frigives. Ingen unødige forsinkelser.",
                  },
                  {
                    ikon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                    titel: "Ingen forgæves kørsel",
                    tekst: "Du kan se om forudsætningerne er opfyldt inden du møder op. Tømreren er klar inden du starter.",
                  },
                ].map((f) => (
                  <div key={f.titel} className="flex gap-4 bg-[#f5f3ee] rounded-2xl p-4 border border-[#e0ddd6]">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-[#e0ddd6]">
                      {f.ikon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{f.titel}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1e3a2a] px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 leading-tight">Klar til at komme i gang?</h2>
            <p className="text-green-200/70 mb-8 text-base leading-relaxed">
              Opret projektet gratis. Inviter entreprenøren. Styr det hele ét sted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#1e3a2a] font-bold rounded-xl hover:bg-[#f5f3ee] transition-colors text-base shadow-lg">
                Opret dit projekt
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base">
                Tjek et tilbud gratis
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#e0ddd6] bg-[#f5f3ee] px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">2025 Nembyggestyring</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/det-gode-byggeprojekt" className="text-xs text-gray-400 hover:text-gray-600">Guides</Link>
            <Link href="/abforbruger" className="text-xs text-gray-400 hover:text-gray-600">AB-Forbruger</Link>
            <Link href="/tilkoeb" className="text-xs text-gray-400 hover:text-gray-600">Rådgivere</Link>
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
            <Link href="/haandvaerker/sager" className="text-xs text-gray-400 hover:text-gray-600">Entreprenør</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
