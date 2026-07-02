"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

const projekttyper = [
  { id: "badevarelse", label: "Badeværelse", ikon: "🚿" },
  { id: "kokken", label: "Køkken", ikon: "🍳" },
  { id: "tag", label: "Tag", ikon: "🏠" },
  { id: "tilbygning", label: "Tilbygning", ikon: "🏗️" },
  { id: "totalrenovering", label: "Totalrenovering", ikon: "🔨" },
  { id: "vinduer", label: "Vinduer & facade", ikon: "🪟" },
  { id: "maler", label: "Maler & gips", ikon: "🖌️" },
  { id: "andet", label: "Andet", ikon: "📋" },
];

interface DawaForslag {
  tekst: string;
  data?: { id: string };
}

export default function OpretProjekt() {
  const router = useRouter();
  const [valgtType, setValgtType] = useState("");
  const [adresse, setAdresse] = useState("");
  const [navn, setNavn] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [status, setStatus] = useState("tilbud");
  const [inkluderABF, setInkluderABF] = useState(true);
  const [forslag, setForslag] = useState<DawaForslag[]>([]);
  const [visForslag, setVisForslag] = useState(false);
  const adresseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (adresseRef.current && !adresseRef.current.contains(e.target as Node)) {
        setVisForslag(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (adresse.length < 3) { setForslag([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(adresse)}&type=adresse&per_side=6`);
        const data = await res.json();
        setForslag(data);
        setVisForslag(true);
      } catch { setForslag([]); }
    }, 200);
    return () => clearTimeout(timeout);
  }, [adresse]);

  const kanFortsætte = valgtType && adresse && navn;

  return (
    <FlowLayout aktivTrin={1}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fortæl os om dit projekt</h1>
        <p className="text-gray-500">Vi bruger oplysningerne til at tilpasse screeningen til dit specifikke projekt.</p>
      </div>

      {/* Projekttype */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Hvad handler projektet om?</h2>
        <p className="text-sm text-gray-400 mb-5">Vælg den type, der passer bedst</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {projekttyper.map((type) => (
            <button
              key={type.id}
              onClick={() => setValgtType(type.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                valgtType === type.id
                  ? "border-primary bg-accent"
                  : "border-gray-100 hover:border-gray-200 bg-gray-50"
              }`}
            >
              <span className="text-2xl">{type.ikon}</span>
              <span className={`text-xs font-semibold ${valgtType === type.id ? "text-primary" : "text-gray-600"}`}>
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-5">Projektdetaljer</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dit navn <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="F.eks. Anders Jensen"
                value={navn}
                onChange={(e) => setNavn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon eller e-mail
              </label>
              <input
                type="text"
                placeholder="F.eks. 28 12 34 56"
                value={kontakt}
                onChange={(e) => setKontakt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div ref={adresseRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="F.eks. Valby Langgade 85, 2500 Valby"
              value={adresse}
              onChange={(e) => { setAdresse(e.target.value); setVisForslag(true); }}
              onFocus={() => forslag.length > 0 && setVisForslag(true)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              autoComplete="off"
            />
            {visForslag && forslag.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {forslag.map((f, i) => (
                  <li
                    key={f.data?.id ?? i}
                    onMouseDown={() => { setAdresse(f.tekst); setVisForslag(false); setForslag([]); }}
                    className="px-4 py-3 text-sm text-gray-800 hover:bg-accent cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    {f.tekst}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Status på aftalen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-1">Hvor er du i processen?</h2>
        <p className="text-sm text-gray-400 mb-4">Det hjælper os med at give den rigtige vejledning</p>
        <div className="space-y-2">
          {[
            { id: "dialog", label: "Jeg leder efter håndværker og vil gerne sende projektet i udbud", ikon: "📢" },
            { id: "tilbud", label: "Jeg har modtaget et tilbud og overvejer at sige ja", ikon: "📄" },
            { id: "accepteret", label: "Jeg har accepteret, men arbejdet er ikke startet", ikon: "✅" },
            { id: "igang", label: "Arbejdet er i gang", ikon: "🔨" },
            { id: "problem", label: "Der er opstået et problem eller en tvist", ikon: "⚠️" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                status === s.id
                  ? "border-primary bg-accent"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <span className="text-lg">{s.ikon}</span>
              <span className={`text-sm font-medium ${status === s.id ? "text-primary" : "text-gray-700"}`}>
                {s.label}
              </span>
              {status === s.id && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AB-Forbruger valg — kun relevant når bygherre sender i udbud */}
      {status === "dialog" && (
        <div className={`rounded-2xl border-2 p-6 mb-5 transition-all ${inkluderABF ? "border-primary bg-accent" : "border-gray-200 bg-white"}`}>
          <div className="flex items-start gap-4">
            <button
              onClick={() => setInkluderABF(!inkluderABF)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${inkluderABF ? "bg-primary border-primary" : "border-gray-300"}`}
            >
              {inkluderABF && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm">Inkludér AB-Forbruger 2012 i udbuddet</p>
                <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">Anbefalet</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                AB-Forbruger er standardbetingelserne for private byggeaftaler i Danmark. De træder kun i kraft, hvis begge parter eksplicit aftaler det. Når du inkluderer det i udbuddet, accepterer entreprenøren vilkårene ved at indsende sit tilbud.
              </p>
              <div className="space-y-1.5">
                {[
                  "Ekstraarbejde skal aftales skriftligt inden opstart (§ 23)",
                  "Betaling kobles til dokumenteret fremdrift (§ 25–26)",
                  "Ret til afleveringsforretning ved arbejde over 50.000 kr. (§ 38)",
                  "1-års eftersyn ved arbejde over 500.000 kr. (§ 58)",
                ].map((punkt) => (
                  <div key={punkt} className="flex items-start gap-2 text-xs text-gray-500">
                    <svg className="mt-0.5 flex-shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {punkt}
                  </div>
                ))}
              </div>
              {!inkluderABF && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                  Uden AB-Forbruger er det op til aftalen selv at definere rettigheder og pligter. Du kan stadig bruge Contractr til kommunikation, betalinger og dokumentation.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (!kanFortsætte) return;
          sessionStorage.setItem("screening_projekttype", valgtType);
          sessionStorage.setItem("screening_adresse", adresse);
          sessionStorage.setItem("screening_navn", navn);
          sessionStorage.setItem("screening_kontakt", kontakt);
          sessionStorage.setItem("screening_abforbruger", inkluderABF ? "ja" : "nej");
          if (status === "dialog") router.push("/opret/beskriv");
          else router.push("/opret/tips");
        }}
        className={`w-full py-4 rounded-xl text-base font-bold transition-all ${
          kanFortsætte
            ? "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {status === "dialog" ? "Beskriv projektet →" : "Fortsæt til upload →"}
      </button>
      {!kanFortsætte && (
        <p className="text-center text-xs text-gray-400 mt-3">Vælg projekttype, angiv navn og adresse for at fortsætte</p>
      )}
    </FlowLayout>
  );
}
