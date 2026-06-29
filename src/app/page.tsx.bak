"use client";

import { useState } from "react";
import Link from "next/link";
import HvordanDetVirkerModal from "@/components/HvordanDetVirkerModal";
import InteraktivDemo from "@/components/InteraktivDemo";

export default function Home() {
  const [modalÅben, setModalÅben] = useState(false);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Contractr",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.contractr.dk",
    description: "AI-platform der screener byggeaftaler og kontrakter mod AB-Forbruger 2012 for private bygherrer i Danmark.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "DKK", description: "Gratis grundscreening" },
    inLanguage: "da",
    audience: { "@type": "Audience", audienceType: "Private bygherrer og boligejere i Danmark" },
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HvordanDetVirkerModal åben={modalÅben} luk={() => setModalÅben(false)} />

      {/* Navigation */}
      <nav className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">Contractr</span>
              <p className="text-[11px] text-gray-400 leading-none mt-0.5">Renover trygt – fra tilbud til betaling</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <button onClick={() => setModalÅben(true)} className="hover:text-gray-900 transition-colors">Sådan virker det</button>
            <Link href="/pakke" className="hover:text-gray-900 transition-colors">Priser</Link>
            <Link href="/tilkoeb" className="hover:text-gray-900 transition-colors">Rådgivere</Link>
            <Link href="/abforbruger" className="hover:text-gray-900 transition-colors">AB-Forbruger</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 font-medium transition-colors">
              Log ind
            </Link>
            <Link href="/opret" className="text-sm bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm">
              Opret byggeprojekt
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-24" id="saadan-virker-det">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Venstre: tekst */}
          <div>
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Tryghed før du siger ja
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight mb-6">
              Forstå din<br />
              byggeaftale,<br />
              <span className="text-primary">inden det er for sent</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
              Upload dit tilbud eller din kontrakt. Vores platform screener aftalen og viser dig præcist, hvad du skal afklare — før du forpligter dig.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/opret" className="bg-primary text-white px-7 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
                Tjek min byggeaftale gratis
              </Link>
              <button
                onClick={() => setModalÅben(true)}
                className="flex items-center gap-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                Se hvordan det virker
              </button>
              <Link href="/guide" className="flex items-center gap-2 text-sm font-medium text-[#1a5c38] hover:underline">
                Se fuld guide →
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-100">
              <div>
                <p className="text-2xl font-bold text-gray-900">2 min</p>
                <p className="text-xs text-gray-400 mt-0.5">Gennemsnitstid</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-xs text-gray-400 mt-0.5">Fortroligt</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div>
                <p className="text-2xl font-bold text-gray-900">Gratis</p>
                <p className="text-xs text-gray-400 mt-0.5">Grundscreening</p>
              </div>
            </div>
          </div>

          {/* Højre: mock-rapport kort */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Aftalescreening</p>
                  <h3 className="font-semibold text-gray-900">Badeværelse renovering · Tilbud</h3>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full">Middel risiko</span>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: "Pris og pristype", status: "ok", text: "Fast pris på 68.500 kr. inkl. moms" },
                  { label: "Betalingsplan", status: "advarsel", text: "50% forudbetaling kræves — afklar inden accept" },
                  { label: "Tidsplan", status: "advarsel", text: "Ingen slutdato aftalt i tilbuddet" },
                  { label: "AB-Forbruger", status: "fejl", text: "Ikke nævnt i aftalen — du er dårligere stillet" },
                  { label: "Ekstraarbejde", status: "ok", text: "Skriftlig aftale er krævet" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.status === "ok" ? "bg-green-100" :
                      item.status === "advarsel" ? "bg-yellow-100" : "bg-red-100"
                    }`}>
                      {item.status === "ok" && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                      {item.status === "advarsel" && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="3"><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      )}
                      {item.status === "fejl" && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Anbefalet næste skridt</p>
                <div className="bg-accent rounded-lg p-3">
                  <p className="text-xs text-accent-foreground">Afklar 2 punkter med håndværkeren inden accept. Vi har skrevet en besked du kan sende direkte.</p>
                </div>
              </div>
            </div>

            {/* Lille badge ved siden af */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-gray-200 shadow-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Rapport klar</p>
                <p className="text-xs text-gray-400">Analyseret på 47 sekunder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sådan virker det */}
      <section className="px-6 py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sådan virker det</h2>
            <p className="text-gray-500 max-w-md mx-auto">Fra usikkerhed til tryghed på få minutter</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Upload din aftale",
                desc: "Tilbud, kontrakt, ordrebekræftelse, mail eller screenshot — vi forstår det hele.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Vi screener aftalen",
                desc: "Platformen tjekker pris, tidsplan, betaling, ekstraarbejde og AB-Forbruger på sekunder.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Du får konkrete svar",
                desc: "En risikovurdering, spørgsmål du bør stille, og mulighed for at booke en rådgiver.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-accent-foreground mb-6">
                  {item.icon}
                </div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{item.step}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hvad vi tjekker */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hvad vi tjekker</h2>
            <p className="text-gray-500 max-w-md mx-auto">De punkter der oftest skaber problemer for private bygherrer</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Pris og pristype", desc: "Fast pris eller overslag? Hvad sker der ved overskridelse?" },
              { title: "Betalingsplan", desc: "Hvornår skal du betale, og er det koblet til fremdrift?" },
              { title: "Tidsplan", desc: "Er start og slutdato aftalt? Konsekvenser ved forsinkelse?" },
              { title: "AB-Forbruger", desc: "Er standardbetingelserne nævnt, eller mangler du beskyttelse?" },
              { title: "Ekstraarbejde", desc: "Skal ændringer aftales skriftligt? Hvad med prisen?" },
              { title: "Mangler og aflevering", desc: "Hvornår er arbejdet afleveret, og hvad er dine rettigheder?" },
            ].map((item) => (
              <div key={item.title} className="group p-6 rounded-2xl border border-gray-100 hover:border-primary/40 hover:shadow-md transition-all cursor-default">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-foreground">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interaktiv demo */}
      <InteraktivDemo />

      {/* CTA sektion */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto bg-primary rounded-3xl px-12 py-16 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Klar til at tjekke din aftale?</h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Upload dit tilbud og få svar på under 2 minutter. Gratis og fortroligt.
          </p>
          <Link href="/opret" className="inline-block bg-white text-primary px-10 py-4 rounded-xl text-base font-bold hover:opacity-95 transition-opacity shadow-lg">
            Kom i gang gratis
          </Link>
          <p className="text-white/50 text-sm mt-6">Ingen kreditkort · Ingen oprettelse krævet</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-medium text-gray-500">Contractr © 2025</span>
          </div>
          <div className="flex gap-8">
            <Link href="/privatliv" className="hover:text-gray-600 transition-colors">Privatlivspolitik</Link>
            <Link href="/vilkaar" className="hover:text-gray-600 transition-colors">Vilkår og betingelser</Link>
            <Link href="/kontakt" className="hover:text-gray-600 transition-colors">Kontakt</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
