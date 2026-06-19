"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Guide() {
  const [aktivFane, setAktivFane] = useState<"bygherre" | "haandvaerker">("bygherre");

  return (
    <div className="bg-white min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}} className="text-gray-900">contractr</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage</Link>
            <Link href="/opret" className="bg-[#1a5c38] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">Kom i gang gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#1a5c38]/10 text-[#1a5c38] text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            Sådan virker Contractr
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Tryghed fra<br />
            <span className="text-[#1a5c38]">tilbud til nøgler</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Contractr beskytter dig gennem hele byggeprocessen — fra du modtager det første tilbud, til arbejdet er afleveret og godkendt.
          </p>

          {/* Fane-vælger */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-2xl p-1.5 gap-1">
              <button
                onClick={() => setAktivFane("bygherre")}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${aktivFane === "bygherre" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Jeg er bygherre
              </button>
              <button
                onClick={() => setAktivFane("haandvaerker")}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${aktivFane === "haandvaerker" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Jeg er håndværker
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-16">Scroll ned for at se hvordan platformen virker ↓</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { tal: "2 min", label: "Gennemsnitstid for screening" },
              { tal: "100%", label: "Fortrolig behandling" },
              { tal: "Gratis", label: "Grundscreening" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900 mb-1">{s.tal}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {aktivFane === "bygherre" ? <BygherreGuide /> : <HaandvaerkerGuide />}

      {/* CTA */}
      <section className="min-h-[60vh] flex items-center justify-center px-6 bg-[#1a5c38]">
        <AnimSection>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Klar til at komme i gang?</h2>
            <p className="text-xl text-white/70 mb-10">Upload dit første tilbud gratis — ingen konto nødvendig.</p>
            <Link href="/opret" className="inline-block bg-white text-[#1a5c38] font-bold text-lg px-10 py-5 rounded-2xl hover:opacity-90 transition-opacity shadow-xl">
              Tjek min byggeaftale gratis →
            </Link>
          </div>
        </AnimSection>
      </section>

    </div>
  );
}

function BygherreGuide() {
  return (
    <div>

      {/* Trin 1 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection>
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 1</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Upload dit tilbud — vi klarer resten</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Du har fået et tilbud fra en håndværker. Du ved ikke om prisen er fair, om betalingsplanen er rimelig, eller om der mangler noget vigtigt. Upload PDF'en og få svar på under 2 minutter.</p>
            <div className="space-y-3">
              {["Understøtter PDF, Word og billeder", "Krypteret og 100% fortroligt", "Analyseret på under 60 sekunder"].map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#1a5c38]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-gray-600 text-sm">{p}</span>
                </div>
              ))}
            </div>
          </AnimSection>
          <AnimSection>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1a5c38]/10 rounded-xl flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Tilbud_TM_Byg_badevarelse.pdf</p>
                    <p className="text-xs text-gray-400">2.4 MB · klar til analyse</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Klar</span>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <svg className="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p className="text-sm text-gray-400">Træk dit tilbud hertil</p>
                  <p className="text-xs text-gray-300 mt-1">eller klik for at vælge fil</p>
                </div>
                <button className="w-full bg-[#1a5c38] text-white text-sm font-semibold py-3.5 rounded-xl">Analyser tilbud →</button>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* Trin 2 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection className="order-2 md:order-1">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">AI screener mod AB-Forbruger 2012</p>
              <div className="space-y-3">
                {[
                  { label: "Pris og pristype", status: "ok", tekst: "Fast pris på 68.500 kr. inkl. moms" },
                  { label: "Betalingsplan", status: "advarsel", tekst: "50% forudbetaling — afklar inden accept" },
                  { label: "Tidsplan", status: "advarsel", tekst: "Ingen slutdato aftalt i tilbuddet" },
                  { label: "AB-Forbruger", status: "fejl", tekst: "Ikke nævnt i aftalen — du er dårligere stillet" },
                  { label: "Ekstraarbejde", status: "ok", tekst: "Skriftlig aftale er krævet" },
                ].map((p) => (
                  <div key={p.label} className={`flex items-start gap-3 p-3.5 rounded-xl border ${p.status === "ok" ? "bg-green-50 border-green-100" : p.status === "advarsel" ? "bg-yellow-50 border-yellow-100" : "bg-red-50 border-red-100"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${p.status === "ok" ? "bg-green-200" : p.status === "advarsel" ? "bg-yellow-200" : "bg-red-200"}`}>
                      {p.status === "ok" ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      : p.status === "advarsel" ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.tekst}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimSection>
          <AnimSection className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 2</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Vi finder præcist hvad der mangler</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">AI'en sammenligner dit tilbud med AB-Forbruger 2012 — den standard der beskytter dig som forbruger. Hvert punkt vurderes og forklares på almindeligt dansk.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-amber-900 mb-1">Vidste du?</p>
              <p className="text-sm text-amber-700">De fleste private bygherrer opdager først fejlene i kontrakten når skaden er sket. AB-Forbruger giver dig stærke rettigheder — men kun hvis det er aftalt.</p>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* Trin 3 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection>
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 3</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Send dine krav direkte til håndværkeren</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Platformen skriver automatisk en professionel besked med dine ændringsønsker. Du sender den direkte — og håndværkeren svarer i platformen.</p>
            <div className="space-y-3">
              {[
                "Færdigskrevet besked på juridisk korrekt dansk",
                "Send direkte eller kopiér til din e-mail",
                "Håndværkeren svarer i platformen",
              ].map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#1a5c38]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="text-gray-600 text-sm">{p}</span>
                </div>
              ))}
            </div>
          </AnimSection>
          <AnimSection>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Din besked til TM Byg</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
                  <p className="mb-3">Hej Thomas,</p>
                  <p className="mb-3">Jeg har gennemgået dit tilbud og har følgende ændringsønsker inden vi kan gå videre:</p>
                  <ol className="space-y-2 text-sm">
                    <li><strong>AB-Forbruger 2012</strong> skal tilføjes som grundlag for aftalen.</li>
                    <li><strong>Betalingen</strong> ønskes opdelt: 20% opstart, 40% halvvejs, 40% aflevering.</li>
                    <li><strong>Bindende slutdato</strong> med dagbod ved forsinkelse.</li>
                  </ol>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-[#1a5c38] text-white text-sm font-semibold py-3 rounded-xl">Send til Thomas →</button>
                  <button className="border border-gray-200 text-gray-600 text-sm py-3 rounded-xl">Kopiér</button>
                </div>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* Trin 4 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection className="order-2 md:order-1">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-[#1a5c38] rounded-2xl px-5 py-4 mb-5 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Badeværelse renovering</p>
                  <p className="text-xs text-white/60">TM Byg ApS · Aktiv</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Kontraktsum", value: "68.500 kr.", farve: "bg-gray-50" },
                  { label: "Fremdrift", value: "34%", farve: "bg-green-50" },
                  { label: "Slutdato", value: "14. aug.", farve: "bg-gray-50" },
                  { label: "Åbne mangler", value: "0", farve: "bg-green-50" },
                ].map((k) => (
                  <div key={k.label} className={`${k.farve} rounded-xl p-4`}>
                    <p className="text-lg font-bold text-gray-900">{k.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {["Tidsplan", "Dokumenter", "Betalinger", "Mangler"].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700">{item}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                ))}
              </div>
            </div>
          </AnimSection>
          <AnimSection className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 4</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Følg projektet hele vejen til aflevering</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Når kontrakten er underskrevet digitalt, har du fuldt overblik over tidsplan, økonomi, dokumenter og eventuelle mangler — alt samlet ét sted.</p>
            <div className="space-y-4">
              {[
                { titel: "Digital underskrift", tekst: "Fuld juridisk gyldighed for begge parter" },
                { titel: "Betalingsoverblik", tekst: "Se hvornår du skal betale og hvad der er betalt" },
                { titel: "Mangelregistrering", tekst: "Dokumentér fejl og mangler med billeder" },
              ].map((f) => (
                <div key={f.titel} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-[#1a5c38]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{f.titel}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{f.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

    </div>
  );
}

function HaandvaerkerGuide() {
  return (
    <div>

      {/* Trin 1 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection>
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 1</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Modtag en invitation fra bygherren</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Bygherren inviterer dig direkte via din e-mail. Du opretter en gratis håndværkerkonto på under 2 minutter — ingen abonnement, ingen binding.</p>
            <div className="space-y-4">
              {[
                { titel: "Gratis for håndværkere", tekst: "Det er altid bygherren der betaler for platformen" },
                { titel: "Ingen binding", tekst: "Du bestemmer selv om du vil acceptere projekter" },
                { titel: "Professionelt image", tekst: "Vis bygherren at du arbejder struktureret og transparent" },
              ].map((f) => (
                <div key={f.titel} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-[#1a5c38]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{f.titel}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{f.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>
          <AnimSection>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="w-12 h-12 bg-[#1a5c38]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">Du er inviteret!</p>
                  <p className="text-sm text-gray-400 mt-1">Camilla Jensen inviterer dig til projektet</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {[
                    { label: "Bygherre", value: "Camilla Jensen" },
                    { label: "Projekt", value: "Indvendig renovering – Valby" },
                    { label: "Kontraktsum", value: "68.500 kr." },
                    { label: "Din e-mail", value: "thomas@tmbyg.dk" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-xs text-gray-400">{r.label}</span>
                      <span className="text-xs font-semibold text-gray-900">{r.value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full bg-[#1a5c38] text-white text-sm font-semibold py-3.5 rounded-xl">Acceptér og opret konto →</button>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* Trin 2 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection className="order-2 md:order-1">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Ændringsønsker fra bygherren</p>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-5 text-sm text-amber-900 leading-relaxed">
                <p className="font-semibold mb-2">Camilla Jensen skriver:</p>
                <ol className="space-y-1.5">
                  <li>1. AB-Forbruger 2012 skal tilføjes som grundlag.</li>
                  <li>2. Betaling opdelt i milepæle.</li>
                  <li>3. Bindende slutdato med dagbod ved forsinkelse.</li>
                </ol>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-[#1a5c38] text-white text-sm font-semibold py-3 rounded-xl">Acceptér alle</button>
                <button className="border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl">Foreslå alternativ</button>
              </div>
            </div>
          </AnimSection>
          <AnimSection className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 2</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Forhandl kontrakten direkte i platformen</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Bygherren kan sende ændringsønsker direkte i platformen. Du accepterer, afviser eller foreslår noget andet — alt er dokumenteret og juridisk gyldigt.</p>
            <div className="bg-[#1a5c38]/5 border border-[#1a5c38]/20 rounded-2xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-1">Fordel for dig som håndværker</p>
              <p className="text-sm text-gray-600">Alle ændringer er skriftlige og datostemplede. Du er beskyttet mod misforståelser og mundtlige aftaler der aldrig blev aftalt.</p>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* Trin 3 */}
      <section className="min-h-screen flex items-center px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <AnimSection>
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">Trin 3</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Underskriv og kør projektet professionelt</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Kontrakten underskrives digitalt af begge parter. Derefter har I begge fuldt overblik — tidsplan, betalinger og aflevering er struktureret og transparent.</p>
            <div className="space-y-4">
              {[
                { titel: "Betalingsoverblik", tekst: "Begge parter kan se hvornår betalinger falder" },
                { titel: "Dokumenteret aflevering", tekst: "Gennemgå arbejdet digitalt og registrér mangler" },
                { titel: "Styrket troværdighed", tekst: "Vis professionel tilgang — byg et stærkere omdømme" },
              ].map((f) => (
                <div key={f.titel} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-[#1a5c38]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{f.titel}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{f.tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimSection>
          <AnimSection>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-sm font-bold text-gray-900">Kontrakt klar til underskrift</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 bg-green-50 rounded-xl border border-green-100">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Camilla Jensen</p>
                      <p className="text-xs text-gray-400">Bygherre</p>
                    </div>
                    <span className="text-xs text-green-600 font-bold">✓ Underskrevet</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Thomas, TM Byg</p>
                      <p className="text-xs text-gray-400">Håndværker</p>
                    </div>
                    <span className="text-xs text-amber-600 font-bold">Afventer</span>
                  </div>
                </div>
                <button className="w-full bg-[#1a5c38] text-white text-sm font-semibold py-3.5 rounded-xl">Underskriv kontrakten →</button>
                <p className="text-xs text-gray-400 text-center">Fuld juridisk gyldighed · Gemmes automatisk</p>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

    </div>
  );
}
