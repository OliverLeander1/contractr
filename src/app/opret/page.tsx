"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";
import { createClient } from "@/lib/supabase";

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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login?next=/opret");
    });
  }, [router]);
  const [adresse, setAdresse] = useState("");
  const [navn, setNavn] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [status, setStatus] = useState("tilbud");
  const inkluderABF = true; // AB-Forbruger er altid standard på platformen
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

  // Statiker-vurdering baseret på projekttype
  const statikerNiveau: Record<string, "høj" | "middel" | "lav" | null> = {
    tilbygning: "høj",
    tag: "middel",
    totalrenovering: "middel",
    badevarelse: "lav",
    kokken: "lav",
    vinduer: null,
    maler: null,
    andet: "lav",
  };
  const statikerRisiko = valgtType ? statikerNiveau[valgtType] ?? null : null;

  const statikerSpørgsmål: Record<string, string[]> = {
    tilbygning: ["Kræver fundament eller betonarbejde", "Kræver næsten altid bærende konstruktioner", "Kræver typisk byggetilladelse og ingeniørberegninger"],
    tag: ["Ændres tagkonstruktionen eller spærene?", "Etableres der tagetage til beboelse?"],
    totalrenovering: ["Fjernes der bærende vægge eller søjler?", "Ændres etageadskillelse eller dæk?"],
    badevarelse: ["Monteres der badekar, boblebad eller dampbad? (tung gulvlast)", "Er boligen i en etageejendom? (kræver vådrumsberegning)"],
    kokken: ["Fjernes der vægge for at åbne køkkenet?"],
    andet: ["Indebærer projektet fjernelse af vægge eller bærende konstruktioner?"],
  };

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

      {/* Statiker-vurdering */}
      {valgtType && statikerRisiko && (
        <div className={`rounded-2xl border-2 p-5 mb-5 ${statikerRisiko === "høj" ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${statikerRisiko === "høj" ? "bg-amber-100" : "bg-gray-100"}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={statikerRisiko === "høj" ? "#d97706" : "#6b7280"} strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm mb-1 ${statikerRisiko === "høj" ? "text-amber-800" : "text-gray-800"}`}>
                {statikerRisiko === "høj" ? "Dette projekt kræver sandsynligvis ingeniørberegninger" : "Tjek om der kræves statiker eller ingeniørberegninger"}
              </p>
              <div className="space-y-1 mb-3">
                {(statikerSpørgsmål[valgtType] ?? []).map((s, i) => (
                  <p key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="mt-0.5 flex-shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                    {s}
                  </p>
                ))}
              </div>
              <a href="/statiker" className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline ${statikerRisiko === "høj" ? "text-amber-700" : "text-[#1e3a2a]"}`}>
                Få gratis vurdering af en byggerådgiver →
              </a>
            </div>
          </div>
        </div>
      )}

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
          {([
            {
              id: "dialog",
              label: "Jeg skal have lavet et projekt og vil gerne have hjælp til aftalegrundlaget",
              ikon: "📋",
              info: "Vi hjælper dig med at beskrive projektet og udarbejde et aftalegrundlag du kan sende til din entreprenør. Entreprenøren kan herefter gennemgå det og tilføje pris og bemærkninger.",
            },
            {
              id: "tilbud",
              label: "Jeg har modtaget et tilbud og vil have det tjekket",
              ikon: "📄",
              info: "Upload tilbuddet du har modtaget. Vi gennemgår det og viser dig hvad du bør afklare, hvad der mangler, og hvilke spørgsmål du bør stille inden du siger ja.",
            },
            {
              id: "igang",
              label: "Arbejdet er allerede i gang",
              ikon: "🔨",
              info: "Pris og omfang er aftalt — vi sender dig direkte ind i projektrummet. Her kan du registrere ekstraarbejde, følge betalinger, notere mangler og have al dokumentation samlet ét sted.",
            },
          ] as const).map((s) => (
            <div key={s.id}>
              <button
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
              {status === s.id && (
                <div className="mt-2 mx-1 px-4 py-3 bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-xl flex items-start gap-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.info}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AB-Forbruger — altid inkluderet som standard, ingen valg */}
      <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-2xl px-5 py-4 mb-5 flex items-start gap-4">
        <div className="w-9 h-9 bg-[#1e3a2a] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm mb-1">AB-Forbruger 2012 er standard</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Alle projekter på platformen bruger AB-Forbruger 2012 som grundlag. Håndværkeren accepterer det ved at bruge platformen. Det betyder at ekstraarbejde skal aftales skriftligt, betaling kobles til fremdrift, og du har ret til afleveringsforretning.
          </p>
        </div>
      </div>

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
