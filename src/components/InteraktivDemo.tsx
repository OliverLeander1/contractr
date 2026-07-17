"use client";

import { useState } from "react";
import Link from "next/link";

const bygherreTrin = [
  {
    titel: "Upload dit tilbud",
    beskrivelse: "Du har modtaget et tilbud fra en håndværker. Du uploader PDF'en direkte i Nembyggestyring - det tager under 30 sekunder.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Tilbud_badevarelse_TM_Byg.pdf</p>
            <p className="text-xs text-gray-400">2.4 MB · uploadet nu</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Klar</span>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p className="text-xs text-gray-400">Træk et nyt dokument hertil</p>
        </div>
        <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl">Analyser tilbud →</button>
      </div>
    ),
  },
  {
    titel: "AI screener aftalen",
    beskrivelse: "Platformen gennemgår automatisk alle klausuler og sammenligner med AB-Forbruger 2012. Det tager under 60 sekunder.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Analyserer tilbud...</p>
            <p className="text-xs text-gray-400">Badeværelse renovering · TM Byg ApS</p>
          </div>
        </div>
        <div className="space-y-2">
          {["AB-Forbruger reference", "Betalingsplan", "Tidsplan og slutdato", "Ekstraarbejde", "Mangelbestemmelser"].map((punkt, i) => (
            <div key={punkt} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${i < 3 ? "bg-green-100" : "bg-gray-200"}`}>
                {i < 3 && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span className="text-xs text-gray-600">{punkt}</span>
              {i >= 3 && <div className="ml-auto w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary/40 rounded-full animate-pulse" style={{width: "60%"}}/></div>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    titel: "Du får en klar risikorapport",
    beskrivelse: "Rapporten viser præcist hvad der mangler i aftalen - med grønt, gult og rødt på hvert punkt og konkrete ændringsforslag.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900">Din aftalerapport</p>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">Høj risiko</span>
        </div>
        <div className="space-y-2">
          {[
            { label: "AB-Forbruger er ikke nævnt", status: "fejl", farve: "red" },
            { label: "50% forudbetaling kræves", status: "advarsel", farve: "yellow" },
            { label: "Ingen slutdato aftalt", status: "advarsel", farve: "yellow" },
            { label: "Fast pris aftalt", status: "ok", farve: "green" },
            { label: "Skriftlig aftale om ekstraarbejde", status: "ok", farve: "green" },
          ].map((p) => (
            <div key={p.label} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${p.farve === "red" ? "bg-red-50 border-red-100" : p.farve === "yellow" ? "bg-yellow-50 border-yellow-100" : "bg-green-50 border-green-100"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${p.farve === "red" ? "bg-red-100" : p.farve === "yellow" ? "bg-yellow-100" : "bg-green-100"}`}>
                {p.farve === "green"
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : p.farve === "yellow"
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
              </div>
              <span className="text-xs text-gray-700">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    titel: "Send dine ændringsønsker",
    beskrivelse: "Vælg hvilke punkter du vil have ændret, og platformen bygger automatisk en professionel besked du kan sende direkte til håndværkeren.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Din besked til håndværkeren</p>
        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 leading-relaxed border border-gray-100">
          Hej,<br/><br/>
          Jeg har gennemgået dit tilbud og har følgende ændringsønsker:<br/><br/>
          1. <strong>AB-Forbruger:</strong> Jeg ønsker at AB-Forbruger 2012 tilføjes som grundlag.<br/>
          2. <strong>Betaling:</strong> Opdel i milepæle: 20% opstart, 40% halvvejs, 40% aflevering.<br/>
          3. <strong>Slutdato:</strong> Bindende slutdato med dagbod ved forsinkelse.<br/><br/>
          Kan du bekræfte at disse punkter kan tilpasses?
        </div>
        <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl">Send til Thomas, TM Byg →</button>
        <button className="w-full border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl text-xs">Kopiér besked</button>
      </div>
    ),
  },
  {
    titel: "Følg projektet hele vejen",
    beskrivelse: "Når I er enige underskrives kontrakten digitalt. Derefter har du fuldt overblik over tidsplan, økonomi, dokumenter og mangler - alt ét sted.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-primary px-5 py-3 flex items-center gap-2">
          <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <p className="text-sm font-semibold text-white">Badeværelse renovering</p>
          <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Aktiv</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            { label: "Budget", value: "68.500 kr.", ikon: "💰" },
            { label: "Fremdrift", value: "34%", ikon: "📊" },
            { label: "Slutdato", value: "14. aug.", ikon: "📅" },
            { label: "Mangler", value: "0 åbne", ikon: "✅" },
          ].map((k) => (
            <div key={k.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-base mb-1">{k.ikon}</p>
              <p className="text-sm font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-400">{k.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const HåndværkerTrin = [
  {
    titel: "Du modtager en invitation",
    beskrivelse: "Bygherren inviterer dig via din e-mail. Du opretter en gratis håndværkerkonto på under 2 minutter - ingen abonnement.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 mb-1">Du er inviteret!</p>
          <p className="text-sm text-gray-500">Camilla Jensen inviterer dig til projektet</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Projekt</span><span className="font-semibold text-gray-900">Indvendig renovering, Valby</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Din e-mail</span><span className="font-semibold text-gray-900">thomas@tmbyg.dk</span></div>
        </div>
        <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl">Acceptér og opret konto →</button>
      </div>
    ),
  },
  {
    titel: "Se projektets detaljer",
    beskrivelse: "Du får adgang til bygherrens projekt - tilbud, kontrakt, tidsplan og betalingsplan. Alt er samlet ét sted.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Indvendig renovering, Valby</p>
          <p className="text-xs text-gray-400">Bygherre: Camilla Jensen</p>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: "Kontraktsum", value: "68.500 kr. inkl. moms" },
            { label: "Opstart", value: "1. juli 2025" },
            { label: "Slutdato", value: "14. august 2025" },
            { label: "Status", value: "Afventer underskrift" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className="text-xs font-semibold text-gray-900">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    titel: "Modtag ændringsforslag",
    beskrivelse: "Hvis bygherren har ønsker til kontrakten ser du dem direkte i platformen. Du kan acceptere, afvise eller foreslå noget andet.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <p className="text-xs font-bold text-gray-900">Camilla Jensen har sendt ændringsønsker</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
          1. AB-Forbruger 2012 skal nævnes i aftalen.<br/>
          2. Betaling opdelt i milepæle.<br/>
          3. Bindende slutdato med dagbod.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-primary text-white text-xs font-semibold py-2.5 rounded-xl">Acceptér ændringer</button>
          <button className="border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-xl">Foreslå alternativ</button>
        </div>
      </div>
    ),
  },
  {
    titel: "Underskriv kontrakten digitalt",
    beskrivelse: "Når I er enige om betingelserne underskrives kontrakten digitalt af begge parter. Fuld juridisk gyldighed.",
    skærm: () => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="text-center mb-2">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <p className="font-bold text-gray-900">Kontrakt klar til underskrift</p>
          <p className="text-xs text-gray-400 mt-1">Begge parter skal underskrive</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
            <span className="text-xs font-semibold text-gray-700">Camilla Jensen</span>
            <span className="text-xs text-green-600 font-bold">✓ Underskrevet</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Thomas, TM Byg</span>
            <span className="text-xs text-gray-400">Afventer...</span>
          </div>
        </div>
        <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl">Underskriv nu →</button>
      </div>
    ),
  },
];

export default function InteraktivDemo() {
  const [aktivFane, setAktivFane] = useState<"bygherre" | "Håndværker">("bygherre");
  const [aktivtTrin, setAktivtTrin] = useState(0);

  const trin = aktivFane === "bygherre" ? bygherreTrin : HåndværkerTrin;
  const nuværendeTrin = trin[aktivtTrin];

  const skiftFane = (fane: "bygherre" | "Håndværker") => {
    setAktivFane(fane);
    setAktivtTrin(0);
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Interaktiv demo</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Se hvordan Nembyggestyring virker</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Klik dig igennem et rigtigt eksempel - som bygherre eller håndværker.</p>
        </div>

        {/* Fane-skifter */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1.5 gap-1 shadow-sm">
            <button
              onClick={() => skiftFane("bygherre")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${aktivFane === "bygherre" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              Jeg er bygherre
            </button>
            <button
              onClick={() => skiftFane("Håndværker")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${aktivFane === "Håndværker" ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              Jeg er håndværker
            </button>
          </div>
        </div>

        {/* Trin-indikatorer */}
        <div className="flex justify-center gap-2 mb-10">
          {trin.map((_, i) => (
            <button
              key={i}
              onClick={() => setAktivtTrin(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === aktivtTrin ? "w-8 bg-primary" : "w-3 bg-gray-300 hover:bg-gray-400"}`}
            />
          ))}
        </div>

        {/* Indhold */}
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          {/* Tekst */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              Trin {aktivtTrin + 1} af {trin.length}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">{nuværendeTrin.titel}</h3>
            <p className="text-gray-500 leading-relaxed mb-8">{nuværendeTrin.beskrivelse}</p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAktivtTrin(Math.max(0, aktivtTrin - 1))}
                disabled={aktivtTrin === 0}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Forrige
              </button>
              {aktivtTrin < trin.length - 1 ? (
                <button
                  onClick={() => setAktivtTrin(aktivtTrin + 1)}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Næste →
                </button>
              ) : (
                <Link
                  href="/opret"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Prøv selv gratis →
                </Link>
              )}
            </div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-1 scale-105" />
            <div className="relative">
              {nuværendeTrin.skærm()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
