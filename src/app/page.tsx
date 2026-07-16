import type { Metadata } from "next";
import Link from "next/link";
import { UploadAnimation, ScanAnimation, AdvisorAnimation, ProjectAnimation } from "@/components/BenefitAnimation";

export const metadata: Metadata = {
  title: "Nembyggestyring - Forstå din byggeaftale inden du siger ja",
  description: "Upload dit tilbud eller kontrakt og få det screenet gratis på 2 minutter mod AB-Forbruger 2012. Vi sørger for at du som privat bygherre forstår hvad du skriver under på, inden du siger ja til håndværkeren.",
  keywords: ["byggeaftale", "tilbud håndværker", "AB-Forbruger", "kontrakt screening", "bygherre", "renovering", "byggetilsyn", "håndværker kontrakt", "byggesagkyndig"],
  openGraph: {
    title: "Nembyggestyring - Forstå din byggeaftale inden du siger ja",
    description: "Gratis screening af dit tilbud mod AB-Forbruger 2012. Upload og få svar på 2 minutter.",
    url: "https://www.nembyggestyring.dk",
    type: "website",
    siteName: "Nembyggestyring",
  },
  alternates: { canonical: "https://www.nembyggestyring.dk" },
  robots: { index: true, follow: true },
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="px-4 sm:px-6 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>

          <div className="hidden sm:flex flex-1 justify-center">
            <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <Link href="/" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Bygherre
              </Link>
              <Link href="/haandvaerker/sager" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white text-xs font-medium transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Håndværker
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/login" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Log ind</Link>
            <Link href="/opret/upload" className="text-xs sm:text-sm font-semibold bg-[#4f46e5] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-[#4338ca] transition-colors whitespace-nowrap">
              Tjek tilbud gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-[#f8f7ff] px-4 sm:px-6 py-14 sm:py-20 md:py-28">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4f46e5]/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Gratis screening, ingen konto krævet
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
              Har du modtaget et tilbud<br className="hidden sm:block" /> fra en håndværker?
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto">
              Upload tilbuddet og få det screenet på 2 minutter, helt gratis. Vi tjekker det mod AB-Forbruger 2012 og fortæller dig præcist hvad du skal afklare inden du siger ja.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#4f46e5] text-white font-bold rounded-xl hover:bg-[#4338ca] transition-colors text-base shadow-md shadow-[#4f46e5]/20">
                Tjek dit tilbud gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-gray-200 shadow-sm">
                Opret din opgave
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
              {["Svar på 2 minutter", "Ingen konto krævet", "Tjekkes mod AB-Forbruger 2012"].map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Fordele med animerede ikoner */}
        <section className="bg-[#faf9ff] py-16 sm:py-24 border-b border-indigo-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-[#4f46e5] uppercase tracking-widest">Fordele</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Derfor bruger private bygherrer Nembyggestyring</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6">
              {[
                { anim: <UploadAnimation />, titel: "Send dit tilbud til os", tekst: "Tilbud, kontrakt eller mail. Vi læser det og tjekker det med det samme." },
                { anim: <ScanAnimation />, titel: "Screenet på 2 minutter", tekst: "Vi afdækker hvad der mangler i aftalen, konkret og forståeligt." },
                { anim: <AdvisorAnimation />, titel: "Rådgiver på ét klik", tekst: "Ved middel eller høj risiko kan du booke en byggesagkyndig direkte." },
                { anim: <ProjectAnimation />, titel: "Projektet samlet ét sted", tekst: "Fra tilbud til aflevering, med kontrakt, betalinger og kommunikation." },
              ].map((f) => (
                <div key={f.titel} className="bg-white rounded-2xl pt-6 pb-7 px-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center">
                  {f.anim}
                  <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug mt-3">{f.titel}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sådan virker det */}
        <section className="bg-[#1e1b4b] py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Sådan virker det</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Tre trin. To minutter. Ét klart svar.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col items-center text-center hover:bg-white/8 transition-colors">
                <div className="w-20 h-20 bg-[#4f46e5] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/30">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Trin 1</span>
                <h3 className="text-white font-bold text-lg mb-3">Upload dit tilbud</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Send tilbud, kontrakt, mail eller screenshot. Vi tager alle formater, hvad enten det er PDF, billede eller tekst.
                </p>
              </div>

              <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-7 flex flex-col items-center text-center hover:bg-amber-400/15 transition-colors">
                <div className="w-20 h-20 bg-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/30">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Trin 2</span>
                <h3 className="text-white font-bold text-lg mb-3">Vi screener aftalen</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Automatisk tjek mod AB-Forbruger 2012 med risikovurdering på hvert enkelt punkt i aftalen.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col items-center text-center hover:bg-white/8 transition-colors">
                <div className="w-20 h-20 bg-[#4f46e5] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/30">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Trin 3</span>
                <h3 className="text-white font-bold text-lg mb-3">Du handler trygt</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Du får konkrete spørgsmål du kan sende til håndværkeren, eller du kan booke en byggesagkyndig direkte fra rapporten.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-[#4f46e5] font-bold rounded-xl hover:bg-indigo-50 transition-colors text-base shadow-lg">
                Prøv det gratis nu
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* AB-Forbruger */}
        <section className="py-16 sm:py-24 bg-white relative overflow-hidden border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-10 sm:gap-20 items-center">
              <div>
                <span className="text-xs font-semibold text-[#4f46e5] uppercase tracking-widest">AB-Forbruger 2012</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-5">Det du ikke vidste du skulle spørge om</h2>
                <p className="text-base text-gray-600 leading-relaxed mb-4">
                  AB-Forbruger er standardvilkårene der beskytter private bygherrer i Danmark. De træder kun i kraft hvis begge parter eksplicit aftaler det, og de fleste husejere opdager det for sent.
                </p>
                <p className="text-base text-gray-600 leading-relaxed mb-7">
                  Nembyggestyring tjekker automatisk om din aftale dækker de kritiske paragraffer, og fortæller dig hvad du skal kræve af håndværkeren inden du skriver under.
                </p>
                <Link href="/abforbruger" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f46e5] hover:underline">
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
                  <div key={p.paragraf} className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border ${p.ok ? "bg-indigo-50 border-indigo-100" : "bg-amber-50 border-amber-100"}`}>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg w-12 text-center flex-shrink-0 ${p.ok ? "bg-white text-[#4f46e5] shadow-sm" : "bg-amber-100 text-amber-700"}`}>{p.paragraf}</span>
                    <span className="text-gray-700 text-sm flex-1">{p.tekst}</span>
                    {p.ok
                      ? <svg className="flex-shrink-0 text-indigo-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
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
        <section className="bg-[#f8f7ff] py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-[#4f46e5] uppercase tracking-widest">Hele projektet samlet</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-3">Fra første tilbud til 1-års eftersyn</h2>
              <p className="text-base text-gray-500 max-w-lg mx-auto">
                Nembyggestyring er ikke bare en screener. Det er et komplet digitalt projektrum med alle parter samlet på ét sted.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, titel: "Tilbudstjek", tekst: "Screenet mod AB-Forbruger på 2 minutter. Gratis at starte." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>, titel: "Digitalt projektrum", tekst: "Kontrakt, betalinger og kommunikation samlet ét sted." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, titel: "Ekstraarbejde-sedler", tekst: "Digital tillægsaftale med godkendelse fra bygherre inden opstart." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, titel: "Betalingsplan", tekst: "Koblet til dokumenteret fremdrift, ikke bare datoer." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, titel: "Mangelregistrering", tekst: "Billeder og status sendt direkte til håndværkeren." },
                { ikon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, titel: "Rådgiverbooking", tekst: "Book en byggesagkyndig ved middel eller høj risiko." },
              ].map((f) => (
                <div key={f.titel} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start">
                  <div className="w-10 h-10 bg-[#eef2ff] rounded-xl flex items-center justify-center flex-shrink-0">
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

        {/* SEO-tekst */}
        <section className="bg-white py-14 sm:py-16 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Digital tryghed for private bygherrer i Danmark</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Hvert år indgår tusindvis af danske boligejere aftaler med håndværkere og entreprenører uden at kende deres rettigheder. Manglende tidsplan, uklar betalingsplan og fraværende ekstraarbejde-procedure er de hyppigste årsager til konflikter. AB-Forbruger 2012 eksisterer præcis for at beskytte dig, men kun hvis du ved det og beder om det.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nembyggestyring giver private bygherrer adgang til den samme viden og de samme redskaber som professionelle byggesagkyndige bruger. Fra screening af tilbud og kontrakter til et komplet digitalt projektrum med betalingsplan, ekstraarbejde-sedler, mangelregistrering og afleveringsflow.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#4f46e5] px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full" />
            <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white rounded-full" />
          </div>
          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Tjek dit tilbud nu. Det er gratis.</h2>
            <p className="text-indigo-200 mb-8 text-base leading-relaxed">
              Ingen konto. Ingen binding. Svar på 2 minutter.
            </p>
            <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#4f46e5] font-bold rounded-xl hover:bg-indigo-50 transition-colors text-base shadow-lg">
              Upload dit tilbud
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">© 2025 Nembyggestyring</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/det-gode-byggeprojekt" className="text-xs text-gray-400 hover:text-gray-600">Guides</Link>
            <Link href="/abforbruger" className="text-xs text-gray-400 hover:text-gray-600">AB-Forbruger</Link>
            <Link href="/tilkoeb" className="text-xs text-gray-400 hover:text-gray-600">Rådgivere</Link>
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
            <Link href="/haandvaerker/sager" className="text-xs text-gray-400 hover:text-gray-600">Håndværker</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
