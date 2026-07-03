"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FlowLayout from "@/components/FlowLayout";

interface Punkt {
  id: string;
  kategori: string;
  status: "ok" | "advarsel" | "fejl";
  titel: string;
  forklaring: string;
  anbefaling: string | null;
  forslag: string | null;
}

interface Resultat {
  samletRisiko: "lav" | "middel" | "høj";
  resumé: string;
  punkter: Punkt[];
}

const FALLBACK: Resultat = {
  samletRisiko: "middel",
  resumé: "Aftalen indeholder nogle uklare punkter der bør afklares inden accept.",
  punkter: [
    { id: "ab", kategori: "AB-Forbruger", status: "fejl", titel: "AB-Forbruger er ikke nævnt", forklaring: "Aftalen nævner ikke AB-Forbruger. Det betyder du ikke automatisk er beskyttet af disse standardbetingelser.", anbefaling: "Afklar skriftligt om AB-Forbruger skal gælde.", forslag: "Jeg ønsker at AB-Forbruger 2012 tilføjes som grundlag for aftalen." },
    { id: "betaling", kategori: "Betalingsplan", status: "advarsel", titel: "50% forudbetaling kræves", forklaring: "Tilbuddet kræver 50% betaling ved opstart. AB-Forbruger anbefaler betaling koblet til fremdrift.", anbefaling: "Spørg om betalingen kan fordeles i milepæle.", forslag: "Jeg ønsker betalingen opdelt: 20% opstart, 40% halvvejs, 40% aflevering." },
    { id: "tidsplan", kategori: "Tidsplan", status: "advarsel", titel: "Ingen slutdato aftalt", forklaring: "Tilbuddet angiver en startdato men ingen bindende slutdato.", anbefaling: "Aftal en konkret slutdato og hvad der sker ved forsinkelse.", forslag: "Jeg ønsker en bindende slutdato samt dagbod ved forsinkelse jf. AB-Forbruger § 31." },
    { id: "pris", kategori: "Pris", status: "ok", titel: "Fast pris aftalt", forklaring: "Tilbuddet angiver en fast pris inkl. moms. Det beskytter dig mod uventede prisstigninger.", anbefaling: null, forslag: null },
  ],
};

const statusFarve = (status: string) => {
  if (status === "ok") return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "OK" };
  if (status === "advarsel") return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-100", label: "Afklar" };
  return { bg: "bg-red-100", text: "text-red-700", border: "border-red-100", label: "Vigtigt" };
};

const statusIkon = (status: string) => {
  if (status === "ok") return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;
  if (status === "advarsel") return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
};

export default function Rapport() {
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [markerede, setMarkerede] = useState<Set<string>>(new Set());
  const [sendtModal, setSendtModal] = useState(false);
  const [kopieret, setKopieret] = useState(false);
  const [haandvaerkerEmail, setHaandvaerkerEmail] = useState("");

  useEffect(() => {
    const gemt = sessionStorage.getItem("screening_resultat");
    if (gemt) {
      try {
        setResultat(JSON.parse(gemt));
      } catch {
        setResultat(FALLBACK);
      }
    } else {
      setResultat(FALLBACK);
    }
  }, []);

  if (!resultat) {
    return (
      <FlowLayout aktivTrin={4}>
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </FlowLayout>
    );
  }

  const fejlAntal = resultat.punkter.filter(p => p.status === "fejl").length;
  const advarsler = resultat.punkter.filter(p => p.status === "advarsel").length;
  const okAntal = resultat.punkter.filter(p => p.status === "ok").length;

  const risikoFarve = {
    høj: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", label: "Høj risiko" },
    middel: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", label: "Middel risiko" },
    lav: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "Lav risiko" },
  }[resultat.samletRisiko];

  const toggleMarkeret = (id: string) => {
    setMarkerede(prev => {
      const ny = new Set(prev);
      ny.has(id) ? ny.delete(id) : ny.add(id);
      return ny;
    });
  };

  const markerAlle = () => {
    setMarkerede(new Set(resultat.punkter.filter(p => p.status !== "ok" && p.forslag).map(p => p.id)));
  };

  const markeretePunkter = resultat.punkter.filter(p => markerede.has(p.id));

  const genererBesked = () => {
    const linjer = markeretePunkter.map((p, i) => `${i + 1}. ${p.kategori}: ${p.forslag}`).join("\n");
    return `Hej,\n\nJeg har gennemgået dit tilbud og har følgende ændringsønsker, inden vi kan gå videre:\n\n${linjer}\n\nKan du bekræfte at disse punkter kan tilpasses i et revideret tilbud/kontrakt?\n\nMed venlig hilsen`;
  };

  const kopier = () => {
    navigator.clipboard.writeText(genererBesked());
    setKopieret(true);
    setTimeout(() => setKopieret(false), 2000);
  };

  return (
    <FlowLayout aktivTrin={4}>
      {sendtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setSendtModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
          <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 text-center">Besked klar til afsendelse</h3>
            <p className="text-sm text-gray-500 mb-5 text-center">Beskeden er kopieret. Send den til håndværkeren via e-mail eller SMS.</p>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Håndværkerens e-mail (valgfrit)</label>
              <input
                type="email"
                placeholder="f.eks. thomas@tmbyg.dk"
                value={haandvaerkerEmail}
                onChange={e => setHaandvaerkerEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              {haandvaerkerEmail && (
                <a
                  href={`mailto:${haandvaerkerEmail}?subject=${encodeURIComponent("Ændringsønsker til tilbud")}&body=${encodeURIComponent(genererBesked())}`}
                  className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Åbn i e-mailprogram
                </a>
              )}
              <button
                onClick={() => { kopier(); }}
                className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {kopieret ? "Kopieret! ✓" : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopiér besked til udklipsholder</>}
              </button>
              <button onClick={() => setSendtModal(false)} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">Luk</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Din aftalerapport</h1>
            <p className="text-gray-500 text-sm">{resultat.resumé}</p>
          </div>
          <span className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full border ${risikoFarve.bg} ${risikoFarve.text} ${risikoFarve.border}`}>
            {risikoFarve.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Skal afklares", antal: fejlAntal + advarsler, farve: "text-red-600", bg: "bg-red-50" },
            { label: "Ser fint ud", antal: okAntal, farve: "text-green-600", bg: "bg-green-50" },
            { label: "Punkter screenet", antal: resultat.punkter.length, farve: "text-gray-900", bg: "bg-gray-50" },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${item.farve}`}>{item.antal}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Gennemgang af aftalen</h2>
          <button onClick={markerAlle} className="text-xs font-semibold text-primary hover:underline">Markér alle kritiske →</button>
        </div>
        <p className="text-xs text-gray-400">Markér de punkter du vil sende som forslag til håndværkeren</p>

        {resultat.punkter.map(punkt => {
          const farve = statusFarve(punkt.status);
          const erMarkeret = markerede.has(punkt.id);
          const kanMarkeres = punkt.status !== "ok" && punkt.forslag;
          return (
            <div key={punkt.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${erMarkeret ? "border-primary ring-2 ring-primary/20" : farve.border}`}>
              <div className="flex items-start gap-3">
                {kanMarkeres ? (
                  <button
                    onClick={() => toggleMarkeret(punkt.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${erMarkeret ? "bg-primary border-primary" : "border-gray-300 hover:border-primary"}`}
                  >
                    {erMarkeret && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                ) : <div className="w-5 flex-shrink-0"/>}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${farve.bg} ${farve.text}`}>
                  {statusIkon(punkt.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${farve.bg} ${farve.text}`}>{farve.label}</span>
                    <span className="text-xs text-gray-400">{punkt.kategori}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{punkt.titel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{punkt.forklaring}</p>
                  {punkt.anbefaling && (
                    <div className="bg-accent rounded-xl p-3 mb-2">
                      <p className="text-xs font-semibold text-accent-foreground mb-0.5">Anbefaling</p>
                      <p className="text-xs text-accent-foreground/80 leading-relaxed">{punkt.anbefaling}</p>
                    </div>
                  )}
                  {erMarkeret && punkt.forslag && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2">
                      <p className="text-xs font-semibold text-primary mb-0.5">Dit forslag til håndværkeren</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{punkt.forslag}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {markerede.size > 0 && (
        <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">{markerede.size}</div>
            <h2 className="font-semibold text-gray-900">Forslag klar til afsendelse</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{genererBesked()}</pre>
          </div>
          <div className="flex gap-2">
            <button onClick={kopier} className="flex items-center gap-2 text-xs font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              {kopieret ? "Kopieret! ✓" : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopiér</>}
            </button>
            <button onClick={() => { kopier(); setSendtModal(true); }} className="flex-1 bg-primary text-white font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send forslag til håndværkeren
            </button>
          </div>
        </div>
      )}

      {/* Hvad får du ved at gå videre */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-1">Hvad er forskellen på gratis og betalt?</h3>
        <p className="text-xs text-gray-400 mb-5">Du har nu set den gratis screening. Her er hvad du går glip af uden projektrum.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              titel: "Gratis screening",
              pris: "Du er her",
              prisfarge: "text-gray-400",
              items: [
                { ok: true, tekst: "Risikovurdering" },
                { ok: true, tekst: "Liste over mangler" },
                { ok: true, tekst: "Spørgsmål til håndværker" },
                { ok: true, tekst: "Kopiérbar besked" },
                { ok: false, tekst: "Gemmes ikke" },
                { ok: false, tekst: "Ingen PDF" },
                { ok: false, tekst: "Ingen kontrakt" },
                { ok: false, tekst: "Ingen chat" },
              ],
            },
            {
              titel: "Projektrum",
              pris: "499 kr.",
              prisfarge: "text-[#1a5c38] font-bold",
              highlight: true,
              items: [
                { ok: true, tekst: "Alt fra screening" },
                { ok: true, tekst: "PDF du kan dele" },
                { ok: true, tekst: "Kontrakt og tidsplan" },
                { ok: true, tekst: "Betalingsplan" },
                { ok: true, tekst: "Chat med håndværker" },
                { ok: true, tekst: "Dokumentarkiv" },
                { ok: true, tekst: "Gemmes permanent" },
                { ok: true, tekst: "AB-Forbruger notif." },
              ],
            },
            {
              titel: "Rådgivergennemgang",
              pris: "Fra 1.495 kr.",
              prisfarge: "text-gray-700",
              items: [
                { ok: true, tekst: "Alt fra projektrum" },
                { ok: true, tekst: "Fagperson læser aftalen" },
                { ok: true, tekst: "Professionel vurdering" },
                { ok: true, tekst: "Skriftlig anbefaling" },
                { ok: true, tekst: "Juridisk rygrad" },
              ],
            },
          ].map((kolonne) => (
            <div key={kolonne.titel} className={`rounded-xl p-4 ${kolonne.highlight ? "bg-[#1a5c38] text-white" : "bg-gray-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${kolonne.highlight ? "text-white/60" : "text-gray-400"}`}>{kolonne.titel}</p>
              <p className={`text-base font-bold mb-4 ${kolonne.highlight ? "text-white" : kolonne.prisfarge}`}>{kolonne.pris}</p>
              <div className="space-y-2">
                {kolonne.items.map((item) => (
                  <div key={item.tekst} className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.ok ? (kolonne.highlight ? "white" : "#1a5c38") : "#d1d5db"} strokeWidth={item.ok ? "3" : "2"} className="flex-shrink-0 mt-0.5">
                      {item.ok ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18"/>}
                    </svg>
                    <span className={`text-xs leading-relaxed ${kolonne.highlight ? "text-white/90" : item.ok ? "text-gray-700" : "text-gray-300"}`}>{item.tekst}</span>
                  </div>
                ))}
              </div>
              {kolonne.highlight && (
                <a href="/pakke" className="mt-4 block text-center bg-white text-[#1a5c38] text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Opret projektrum
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Næste skridt: opret projektrum */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="bg-[#111c17] px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Næste skridt</p>
            <h3 className="text-white font-bold text-lg">Opret dit projektrum</h3>
            <p className="text-white/60 text-sm mt-1">Kontrakt, tidsplan, betalinger, chat og dokumenter samlet ét sted. Data gemmes for altid.</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-white/40 text-xs mb-0.5">Engangspris</p>
            <p className="text-white text-3xl font-bold">499 <span className="text-lg font-medium opacity-60">kr.</span></p>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Ingen abonnement
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Data gemmes permanent
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              30 dages garanti
            </span>
          </div>
          <Link href="/pakke" className="flex-shrink-0 bg-[#1a5c38] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#163f28] transition-colors">
            Opret projektrum →
          </Link>
        </div>
      </div>

      {/* Rådgiver */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1a5c38]/10 flex items-center justify-center flex-shrink-0 text-[#1a5c38]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Vil du have en fagmand til at se på det?</h3>
            <p className="text-sm text-gray-500 mb-3">En byggesagkyndig gennemgår aftalen og giver dig en professionel vurdering. Fra 1.495 kr.</p>
            <Link href="/tilkoeb" className="inline-block bg-[#1a5c38] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#163f28] transition-colors">
              Book rådgivergennemgang
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Gem som PDF
        </button>
        <Link href="/opret/upload" className="flex-1 text-center py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
          Tjek et nyt tilbud →
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Contractr giver ikke juridisk rådgivning. Rapporten er vejledende og erstatter ikke professionel rådgivning ved tvivl eller tvist.
      </p>
    </FlowLayout>
  );
}
