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
      <header className="px-6 py-5 border-b border-gray-100">
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

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100 mb-6">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Baseret på AB-Forbruger 2012
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Hele byggeprojektet<br />
              <span className="text-[#1a5c38]">samlet ét sted</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl">
              Contractr sørger for at tilbud, kontrakter, betalinger og kommunikation er samlet ét sted. Fra første henvendelse til aflevering.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#163f28] transition-colors text-base">
                Start dit projekt gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret/upload" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-gray-50 text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-base border border-gray-200">
                Få tjekket et tilbud
              </Link>
            </div>
          </div>
        </section>

        {/* Tre brugertyper */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10 text-center">Contractr er bygget til alle parter i et byggeprojekt</p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  ikon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  ),
                  label: "For dig der bygger",
                  titel: "Bygherre med eller uden byggeerfaring",
                  tekst: "Få styr på tilbud, kontrakt og betalingsplan. Et samlet projektrum dokumenterer alt undervejs, så du altid ved hvad der er aftalt.",
                  link: "/opret",
                  linkTekst: "Start projekt →",
                },
                {
                  ikon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  ),
                  label: "For dig der udfører",
                  titel: "Håndværker og entreprenørfirma",
                  tekst: "Modtag udbudsforespørgsler digitalt, send strukturerede tilbud tilbage og hold styr på alle dine sager i én portal. Klare aftaler og fuld dokumentation fra start.",
                  link: "/haandvaerker/sager",
                  linkTekst: "Se håndværkerportal →",
                },
                {
                  ikon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ),
                  label: "Har du allerede et tilbud?",
                  titel: "Få en hurtig gennemgang",
                  tekst: "Upload tilbud, ordrebekræftelse eller kontrakt. Vi screener det mod AB-Forbruger og viser dig konkret hvad du bør afklare inden du siger ja.",
                  link: "/opret/upload",
                  linkTekst: "Upload tilbud →",
                },
              ].map((k) => (
                <div key={k.titel} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-[#1a5c38] mb-5">
                    {k.ikon}
                  </div>
                  <span className="text-xs font-semibold text-[#1a5c38] uppercase tracking-wide">{k.label}</span>
                  <h3 className="font-bold text-gray-900 mt-1 mb-3 text-lg leading-snug">{k.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{k.tekst}</p>
                  <Link href={k.link} className="text-sm font-semibold text-[#1a5c38] hover:underline">{k.linkTekst}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sådan virker det */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Fra tilbud til aflevering i ét flow</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Et struktureret forløb der sikrer at alle parter er enige og at dokumentationen er i orden hele vejen.</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { nr: "01", titel: "Send i udbud", tekst: "Beskriv projektet og få et AI-genereret udbudsdokument med tilbudsliste. Del med 2–3 håndværkere via link." },
              { nr: "02", titel: "Modtag tilbud", tekst: "Håndværkerne udfylder priser direkte i din tilbudsliste og sender den tilbage. Du kan se hvad der er ændret." },
              { nr: "03", titel: "Godkend og aftal", tekst: "Screeningsrapport mod AB-Forbruger. Acceptér tilbuddet og projektrummet oprettes automatisk." },
              { nr: "04", titel: "Styr projektet", tekst: "Betalingsplan, ekstraarbejde, mangler og kommunikation er samlet ét sted og tilgængeligt for alle parter." },
            ].map((t) => (
              <div key={t.nr}>
                <div className="text-5xl font-black text-gray-100 mb-3 leading-none">{t.nr}</div>
                <h3 className="font-bold text-gray-900 mb-2">{t.titel}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid — mørk sektion */}
        <section className="bg-[#1a5c38] text-white">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-3">Alt hvad et byggeprojekt kræver</h2>
              <p className="text-green-200 max-w-xl mx-auto">Alle funktioner du har brug for i et byggeprojekt. Samlet i én platform, klar til brug fra dag ét.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { titel: "Udbudsdokument", tekst: "AI genererer et professionelt dokument med struktureret tilbudsliste på få minutter." },
                { titel: "Tilbudsgenlæsning", tekst: "Se præcis hvad håndværkeren har ændret i dokumentet sammenlignet med din version." },
                { titel: "AB-Forbruger tjek", tekst: "Automatisk screening af om aftalen dækker de vigtigste forbrugerbeskyttelsespunkter." },
                { titel: "Digitalt projektrum", tekst: "Kontrakt, betalingsplan, mangler og ekstraarbejde samlet ét sted for alle parter." },
                { titel: "Ekstraarbejde-sedler", tekst: "Digital tillægsaftale med godkendelse fra bygherre inden arbejdet sættes i gang." },
                { titel: "Mangelregistrering", tekst: "Registrér mangler med billeder og status — og send direkte til håndværkeren." },
              ].map((f) => (
                <div key={f.titel} className="bg-white/10 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h3 className="font-bold text-white">{f.titel}</h3>
                  </div>
                  <p className="text-sm text-green-100 leading-relaxed">{f.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AB-Forbruger sektion */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-[#1a5c38] uppercase tracking-widest">AB-Forbruger 2012</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Dine rettigheder, oversat til handling</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                AB-Forbruger er den officielle forbrugerbeskyttelse i private byggesager. Contractr oversætter paragrafterne til konkrete tjekpunkter og påmindelser, så du altid ved hvad der bør stå i din aftale.
              </p>
              <Link href="/abforbruger" className="text-sm font-semibold text-[#1a5c38] hover:underline">Læs om AB-Forbruger →</Link>
            </div>
            <div className="space-y-3">
              {[
                { paragraf: "§ 12", tekst: "Er start- og slutdato aftalt skriftligt?" },
                { paragraf: "§ 23", tekst: "Er procedure for ekstraarbejde beskrevet?" },
                { paragraf: "§ 25", tekst: "Er betalingsplanen koblet til dokumenteret fremdrift?" },
                { paragraf: "§ 38", tekst: "Er afleverings- og mangelprocedure beskrevet?" },
                { paragraf: "§ 58", tekst: "Er 1-års eftersyn nævnt i aftalen?" },
              ].map((p) => (
                <div key={p.paragraf} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <span className="text-xs font-bold text-[#1a5c38] bg-green-50 border border-green-100 px-2 py-1 rounded-lg w-12 text-center flex-shrink-0">{p.paragraf}</span>
                  <span className="text-sm text-gray-700">{p.tekst}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Klar til at komme i gang?</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Det er gratis at komme i gang. Du behøver ikke oprette en konto for at tjekke et tilbud eller sende et projekt i udbud.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/opret" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1a5c38] text-white font-bold rounded-xl hover:bg-[#163f28] transition-colors text-base">
                Start projekt gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/opret/upload" className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-gray-200">
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
