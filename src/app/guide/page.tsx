"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function useInView(threshold = 0.15) {
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

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Guide() {
  const [aktivFane, setAktivFane] = useState<"bygherre" | "haandvaerker">("bygherre");

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}} className="text-white text-lg">contractr</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">← Tilbage</Link>
          <Link href="/opret" className="bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors">Kom i gang gratis</Link>
        </div>
      </nav>

      {/* HERO - mørk */}
      <section className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* Baggrund cirkel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1a5c38]/20 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-white/10 text-white/50 text-xs font-medium px-4 py-2 rounded-full mb-10 tracking-widest uppercase">
            {aktivFane === "bygherre" ? "Vær med til at styre projektet" : "Sådan virker Contractr"}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-[1.2] tracking-tight">
            {aktivFane === "bygherre" ? (
              <>Styr på projektet<br /><span className="text-[#4ade80]">fra aftale til aflevering</span></>
            ) : (
              <>Professionel ramme<br /><span className="text-[#4ade80]">om hvert eneste projekt</span></>
            )}
          </h1>

          <p className="text-xl text-white/50 max-w-xl mx-auto mb-14 leading-relaxed">
            {aktivFane === "bygherre"
              ? "Uanset om du renoverer badeværelset eller bygger tilbygning - Contractr giver dig overblik, tryghed og stærke kort på hånden."
              : "Undgå misforståelser, mundtlige aftaler og tvister. Contractr giver dig en professionel platform du inviterer kunden ind i - gratis for dig."}
          </p>

          {/* Fane */}
          <div className="flex justify-center mb-16">
            <div className="flex bg-white/10 backdrop-blur rounded-2xl p-1.5 gap-1">
              <button
                onClick={() => setAktivFane("bygherre")}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${aktivFane === "bygherre" ? "bg-white text-gray-900" : "text-white/60 hover:text-white"}`}
              >
                Jeg er bygherre
              </button>
              <button
                onClick={() => setAktivFane("haandvaerker")}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${aktivFane === "haandvaerker" ? "bg-white text-gray-900" : "text-white/60 hover:text-white"}`}
              >
                Jeg er håndværker
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden max-w-lg mx-auto">
            {(aktivFane === "bygherre"
              ? [
                  { tal: "2 min", label: "Gennemsnitstid" },
                  { tal: "100%", label: "Fortroligt" },
                  { tal: "Gratis", label: "Grundscreening" },
                ]
              : [
                  { tal: "Gratis", label: "Altid for håndværker" },
                  { tal: "100%", label: "Skriftligt dokumenteret" },
                  { tal: "0 kr.", label: "Ingen binding" },
                ]
            ).map((s) => (
              <div key={s.label} className="bg-gray-950 py-6 text-center">
                <p className="text-2xl font-bold text-white mb-1">{s.tal}</p>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-white/20 text-sm mt-12 tracking-widest">SCROLL ↓</p>
        </div>
      </section>

      {aktivFane === "bygherre" ? <BygherreGuide /> : <HaandvaerkerGuide />}

      {/* CTA */}
      <section className="min-h-screen bg-[#1a5c38] flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <Reveal className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-green-300/60 text-sm font-medium uppercase tracking-widest mb-6">Klar til at starte?</p>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Upload dit første tilbud.<br />Det er gratis.
          </h2>
          <p className="text-xl text-white/60 mb-12 leading-relaxed">
            Ingen konto nødvendig. Ingen binding. Bare upload og få svar på under 2 minutter.
          </p>
          <Link href="/opret" className="inline-block bg-white text-[#1a5c38] font-bold text-lg px-12 py-5 rounded-2xl hover:scale-105 transition-transform shadow-2xl">
            Tjek min byggeaftale gratis →
          </Link>
        </Reveal>
      </section>

    </div>
  );
}

function BygherreGuide() {
  return (
    <div>

      {/* Trin 1 - lys */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-white">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <p className="text-xs font-bold text-[#1a5c38] uppercase tracking-[0.2em] mb-6">Trin 01</p>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">Upload dit tilbud</h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-10">
                Du har fået et tilbud. Du ved ikke om det er fair. Upload PDF'en - vi finder det du ikke ved du skal kigge efter.
              </p>
              <div className="space-y-4">
                {["PDF, Word eller billede", "Krypteret og fortroligt", "Analyseret på under 60 sekunder"].map((p, i) => (
                  <Reveal key={p} delay={0.1 * i}>
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-[#1a5c38] rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-gray-600">{p}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-[#1a5c38]/10 rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Tilbud_TM_Byg_badevarelse.pdf</p>
                  <p className="text-xs text-gray-400">2.4 MB</p>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Klar</span>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center mb-6 hover:border-[#1a5c38]/30 transition-colors">
                <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-sm text-gray-400 mb-1">Træk dit tilbud hertil</p>
                <p className="text-xs text-gray-300">eller klik for at vælge fil</p>
              </div>
              <button className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl text-sm hover:bg-gray-800 transition-colors">Analyser tilbud →</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trin 2 - mørk */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-gray-950">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <Reveal delay={0.1} className="order-2 md:order-1">
            <div className="rounded-3xl overflow-hidden border border-white/10">
              <div className="bg-gray-900 px-6 py-4 border-b border-white/10">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">AI Aftalescreening · AB-Forbruger 2012</p>
              </div>
              <div className="bg-gray-900 p-6 space-y-3">
                {[
                  { label: "Pris og pristype", status: "ok", tekst: "Fast pris på 68.500 kr. inkl. moms" },
                  { label: "Betalingsplan", status: "advarsel", tekst: "50% forudbetaling - risiko for tab" },
                  { label: "Tidsplan og slutdato", status: "advarsel", tekst: "Ingen slutdato aftalt" },
                  { label: "AB-Forbruger 2012", status: "fejl", tekst: "Ikke nævnt - du er dårligere stillet" },
                  { label: "Ekstraarbejde", status: "ok", tekst: "Skriftlig aftale er krævet" },
                ].map((p, i) => (
                  <Reveal key={p.label} delay={0.08 * i}>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${p.status === "ok" ? "bg-green-950/40 border-green-800/30" : p.status === "advarsel" ? "bg-yellow-950/40 border-yellow-800/30" : "bg-red-950/40 border-red-800/30"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${p.status === "ok" ? "bg-green-800" : p.status === "advarsel" ? "bg-yellow-800" : "bg-red-800"}`}>
                        {p.status === "ok"
                          ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : p.status === "advarsel"
                          ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fde047" strokeWidth="3"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{p.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{p.tekst}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="order-1 md:order-2">
            <Reveal>
              <p className="text-xs font-bold text-[#4ade80] uppercase tracking-[0.2em] mb-6">Trin 02</p>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">Vi finder præcist hvad der mangler</h2>
              <p className="text-xl text-white/40 leading-relaxed mb-10">
                AI'en gennemgår hvert eneste punkt og sammenligner med AB-Forbruger 2012. Du får grønt, gult og rødt - på almindeligt dansk.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm font-bold text-white mb-2">Vidste du?</p>
                <p className="text-sm text-white/50 leading-relaxed">De fleste private bygherrer opdager først fejlene når skaden er sket. AB-Forbruger giver stærke rettigheder - men kun hvis det er aftalt fra start.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trin 3 - lys */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <p className="text-xs font-bold text-[#1a5c38] uppercase tracking-[0.2em] mb-6">Trin 03</p>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">Send dine krav til håndværkeren</h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-10">
                Platformen skriver automatisk en professionel besked. Du sender den direkte - og håndværkeren svarer i platformen.
              </p>
              <div className="space-y-4">
                {[
                  "Juridisk korrekt dansk",
                  "Send direkte eller kopiér",
                  "Alt er skriftligt dokumenteret",
                ].map((p, i) => (
                  <Reveal key={p} delay={0.1 * i}>
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-[#1a5c38] rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-gray-600">{p}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Til: Thomas Jensen, TM Byg ApS</p>
                  <p className="text-xs text-gray-400">thomas@tmbyg.dk</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-700 leading-relaxed border border-gray-100">
                <p className="mb-3">Hej Thomas,</p>
                <p className="mb-3">Jeg har gennemgået dit tilbud og har følgende ændringsønsker:</p>
                <ol className="space-y-2">
                  <li><strong>AB-Forbruger 2012</strong> skal tilføjes som grundlag for aftalen.</li>
                  <li><strong>Betaling</strong> ønskes i milepæle: 20% opstart, 40% halvvejs, 40% aflevering.</li>
                  <li><strong>Bindende slutdato</strong> med dagbod ved forsinkelse.</li>
                </ol>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gray-900 text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-gray-800 transition-colors">Send til Thomas →</button>
                <button className="border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Kopiér</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trin 4 - mørk */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-gray-950">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <Reveal delay={0.1} className="order-2 md:order-1">
            <div className="rounded-3xl overflow-hidden border border-white/10">
              <div className="bg-[#1a5c38] px-6 py-5 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Badeværelse renovering</p>
                  <p className="text-xs text-white/50">TM Byg ApS · Aktiv</p>
                </div>
                <span className="ml-auto text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">Aktiv</span>
              </div>
              <div className="bg-gray-900 p-6">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Kontraktsum", value: "68.500 kr." },
                    { label: "Fremdrift", value: "34%" },
                    { label: "Slutdato", value: "14. aug." },
                    { label: "Åbne mangler", value: "0" },
                  ].map((k) => (
                    <div key={k.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <p className="text-lg font-bold text-white">{k.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{k.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {["Tidsplan", "Dokumenter", "Betalinger", "Mangler"].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/8 transition-colors">
                      <span className="text-sm text-white/60">{item}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
          <div className="order-1 md:order-2">
            <Reveal>
              <p className="text-xs font-bold text-[#4ade80] uppercase tracking-[0.2em] mb-6">Trin 04</p>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">Fuldt overblik hele vejen</h2>
              <p className="text-xl text-white/40 leading-relaxed mb-10">
                Kontrakt underskrives digitalt. Derefter følger du tidsplan, økonomi, dokumenter og aflevering - alt samlet ét sted.
              </p>
              <div className="space-y-3">
                {[
                  { titel: "Digital underskrift", tekst: "Fuld juridisk gyldighed" },
                  { titel: "Betalingsoverblik", tekst: "Se hvornår og hvad der er betalt" },
                  { titel: "Mangelregistrering", tekst: "Dokumentér fejl med billeder" },
                ].map((f, i) => (
                  <Reveal key={f.titel} delay={0.1 * i}>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-8 h-8 bg-[#1a5c38]/40 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{f.titel}</p>
                        <p className="text-xs text-white/40 mt-0.5">{f.tekst}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

    </div>
  );
}

function HaandvaerkerGuide() {
  return (
    <div>

      {/* Trin 1 */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-white">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <p className="text-xs font-bold text-[#1a5c38] uppercase tracking-[0.2em] mb-6">Trin 01</p>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">Gratis for håndværkere</h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-10">
                Bygherren inviterer dig. Du opretter konto på 2 minutter. Det koster dig ingenting - platformen betales af bygherren.
              </p>
              <div className="space-y-4">
                {[
                  { titel: "Altid gratis", tekst: "Bygherren betaler - du bruger platformen uden beregning" },
                  { titel: "Ingen binding", tekst: "Acceptér kun de projekter du vil" },
                  { titel: "Professionelt image", tekst: "Vis at du arbejder struktureret og transparent" },
                ].map((f, i) => (
                  <Reveal key={f.titel} delay={0.1 * i}>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-6 h-6 bg-[#1a5c38] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{f.titel}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{f.tekst}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="w-14 h-14 bg-[#1a5c38]/10 rounded-2xl flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">Du er inviteret</p>
                  <p className="text-sm text-gray-400 mt-1">Camilla Jensen · Indvendig renovering - Valby</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {[
                    { label: "Projekt", value: "Indvendig renovering - Valby" },
                    { label: "Kontraktsum", value: "68.500 kr." },
                    { label: "Din e-mail", value: "thomas@tmbyg.dk" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-xs text-gray-400">{r.label}</span>
                      <span className="text-xs font-semibold text-gray-900">{r.value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full bg-gray-900 text-white font-semibold py-4 rounded-xl text-sm">Acceptér og opret konto →</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trin 2 - mørk */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-gray-950">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <Reveal delay={0.1} className="order-2 md:order-1">
            <div className="rounded-3xl overflow-hidden border border-white/10">
              <div className="bg-gray-900 px-6 py-4 border-b border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Ændringsønsker fra bygherren</p>
              </div>
              <div className="bg-gray-900 p-6 space-y-4">
                <div className="bg-yellow-950/40 border border-yellow-800/30 rounded-2xl p-5 text-sm text-white/70 leading-relaxed">
                  <p className="font-semibold text-white mb-3">Camilla Jensen ønsker:</p>
                  <ol className="space-y-2">
                    <li>1. AB-Forbruger 2012 som grundlag</li>
                    <li>2. Betaling opdelt i milepæle</li>
                    <li>3. Bindende slutdato med dagbod</li>
                  </ol>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-[#1a5c38] text-white font-semibold py-3.5 rounded-xl text-sm">Acceptér alle</button>
                  <button className="bg-white/10 text-white font-semibold py-3.5 rounded-xl text-sm border border-white/10">Foreslå alternativ</button>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Din fordel</p>
                  <p className="text-sm text-white/50">Alle ændringer er skriftlige og datostemplede. Du er beskyttet mod mundtlige aftaler der aldrig blev aftalt.</p>
                </div>
              </div>
            </div>
          </Reveal>
          <div className="order-1 md:order-2">
            <Reveal>
              <p className="text-xs font-bold text-[#4ade80] uppercase tracking-[0.2em] mb-6">Trin 02</p>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">Forhandl direkte i platformen</h2>
              <p className="text-xl text-white/40 leading-relaxed">
                Bygherren sender ændringsønsker. Du accepterer, afviser eller foreslår noget andet - alt er skriftligt dokumenteret og juridisk gyldigt.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trin 3 - lys */}
      <section className="min-h-screen flex items-center px-6 md:px-20 py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <p className="text-xs font-bold text-[#1a5c38] uppercase tracking-[0.2em] mb-6">Trin 03</p>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">Underskriv og kør professionelt</h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-10">
                Digital underskrift med fuld juridisk gyldighed. Begge parter har overblik over tidsplan, betalinger og aflevering.
              </p>
              <div className="space-y-4">
                {[
                  { titel: "Betalingsoverblik", tekst: "Begge parter ser hvornår betalinger falder" },
                  { titel: "Dokumenteret aflevering", tekst: "Registrér mangler digitalt med billeder" },
                  { titel: "Styrket omdømme", tekst: "Professionel tilgang giver bedre anbefalinger" },
                ].map((f, i) => (
                  <Reveal key={f.titel} delay={0.1 * i}>
                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-6 h-6 bg-[#1a5c38] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{f.titel}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{f.tekst}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
              <p className="text-sm font-bold text-gray-900">Kontrakt klar til underskrift</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Camilla Jensen</p>
                    <p className="text-xs text-gray-400">Bygherre</p>
                  </div>
                  <span className="text-sm text-green-600 font-bold">✓ Underskrevet</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Thomas, TM Byg</p>
                    <p className="text-xs text-gray-400">Håndværker</p>
                  </div>
                  <span className="text-sm text-amber-500 font-bold">Afventer</span>
                </div>
              </div>
              <button className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl text-sm hover:bg-gray-800 transition-colors">Underskriv kontrakten →</button>
              <p className="text-xs text-gray-300 text-center">Fuld juridisk gyldighed · Gemmes automatisk</p>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
