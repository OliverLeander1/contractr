"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";
import { createClient } from "@/lib/supabase";

export default function BeskrivProjekt() {
  const router = useRouter();
  const [projekttype, setProjekttype] = useState("");
  const [adresse, setAdresse] = useState("");
  const [navn, setNavn] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [opstart, setOpstart] = useState("");
  const [slutdato, setSlutdato] = useState("");
  const [krav, setKrav] = useState("");
  const [beboet, setBeboet] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingTipIdx, setLoadingTipIdx] = useState(0);
  const [fejl, setFejl] = useState("");
  const [billeder, setBilleder] = useState<{ navn: string; data: string }[]>([]);

  useEffect(() => {
    const sessionAdresse = sessionStorage.getItem("screening_adresse") || "";
    const sessionNavn = sessionStorage.getItem("screening_navn") || "";
    const sessionKontakt = sessionStorage.getItem("screening_kontakt") || "";

    setProjekttype(sessionStorage.getItem("screening_projekttype") || "");
    setAdresse(sessionAdresse);
    setNavn(sessionNavn);
    setKontakt(sessionKontakt);

    // Hent profil og udfyld felter hvis de ikke allerede er sat fra sessionStorage
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profil } = await supabase
        .from("profiler")
        .select("navn, telefon, adresse")
        .eq("id", user.id)
        .single();
      if (!profil) return;
      if (!sessionNavn && profil.navn) setNavn(profil.navn);
      if (!sessionKontakt && profil.telefon) setKontakt(profil.telefon);
      if (!sessionAdresse && profil.adresse) setAdresse(profil.adresse);
    });
  }, []);

  const kanGenerere = beskrivelse.trim().length >= 20;

  const loadingTips = [
    { titel: "Aftalegrundlag", tekst: "Platformen genererer et struktureret udbudsdokument med alle væsentlige punkter, klar til at sende til håndværkeren." },
    { titel: "Ekstraarbejde som aftaleseddel", tekst: "Ekstraarbejde der ikke er beskrevet i aftalegrundlaget skal altid aftales skriftligt som en aftaleseddel inden arbejdet starter." },
    { titel: "Mangelregistrering", tekst: "Opdager du en fejl eller mangel? Du kan fotografere og registrere den direkte i platformen med beskrivelse og status." },
    { titel: "Digital underskrift", tekst: "Begge parter godkender aftalegrundlaget digitalt. Intet er bindende før begge har skrevet under." },
    { titel: "Betalingsplan", tekst: "Betalinger kobles til dokumenteret fremdrift. Du godkender hver milepæl inden betaling frigives." },
  ];

  async function genererUdbud() {
    if (!kanGenerere) return;
    setLoading(true);
    setLoadingPct(0);
    setLoadingTipIdx(0);
    setFejl("");

    // Animér loading bar og skift tips mens AI'en arbejder
    const startTime = Date.now();
    const duration = 12000; // 12 sek forventet ventetid
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(92, Math.round((elapsed / duration) * 92));
      setLoadingPct(pct);
      setLoadingTipIdx(i => (i + 1) % loadingTips.length);
    }, 4000);
    try {
      const res = await fetch("/api/udbud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projekttype, adresse, navn, kontakt, beskrivelse, opstart, slutdato, krav, beboet }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setFejl(data.error || "Noget gik galt. Prøv igen");
        setLoading(false);
        return;
      }
      clearInterval(interval);
      setLoadingPct(100);
      await new Promise(r => setTimeout(r, 400));
      sessionStorage.setItem("udbud_resultat", JSON.stringify({ ...data, billeder, opstart, slutdato }));
      router.push("/opret/udbud-resultat");
    } catch {
      clearInterval(interval);
      setFejl("Netværksfejl. Tjek din forbindelse og prøv igen.");
      setLoading(false);
    }
  }

  const placeholderTekst: Record<string, string> = {
    badevarelse: "F.eks. Badeværelset skal totalrenoveres. Eksisterende fliser og toilet fjernes. Vi ønsker walk-in bruser, dobbelt håndvask og gulvvarme. Badeværelset er ca. 8 m². Blyrør skal skiftes...",
    kokken: "F.eks. Køkkenet skal renoveres komplet. Eksisterende køkken nedrives. Vi ønsker nyt køkken med ø, skjult emhætte og nyt gulv. Køkkenet er ca. 14 m². Elinstallationer skal opdateres...",
    tag: "F.eks. Taget skal udskiftes pga. alder og utætheder. Ca. 120 m² eternittag ønskes erstattet med tegl. Inkl. nye tagrender og nedløbsrør. Undertaget skal efterses og evt. fornyes...",
    tilbygning: "F.eks. Vi ønsker en tilbygning på ca. 20 m² i forlængelse af stuen. Tilbygningen skal indeholde et ekstra værelse og en gang. Fundament, ydervægge, tag og vinduer inkluderet...",
    totalrenovering: "F.eks. Huset fra 1965 skal totalrenoveres. Ca. 120 m². Inkl. nyt køkken, 2 badeværelser, nyt el, nyt VVS, ny isolering og nye gulve i hele huset. Huset er ubeboet under arbejdet...",
    vinduer: "F.eks. 12 vinduer og 2 yderdøre skal udskiftes. Nuværende træ-vinduer er utætte og defekte. Ønsker energiglas (energiklasse A) i samme størrelser. Facade skal repareres efter montage...",
    maler: "F.eks. Hele husets indvendige vægge og lofter skal malerbehandles. Ca. 300 m² vægge og 150 m² loft. Enkelte rum har skader der skal spartles. Vindueskarm og fodpaneler medtages...",
    carport: "F.eks. Vi ønsker en carport på ca. 6x6 m med redskabsrum på 6x2 m. Træ-konstruktion med tagpap-tag. Fundament og afløb inkluderet. Placering ud mod skel kræver dispensation...",
    vaadrum: "F.eks. Eksisterende badeværelse på 5 m² ønskes renoveret som vådrum. Komplet med nye fliser, nyt bruseniche, toilet og håndvask. Membran og faldgulv. VVS og el inkluderet...",
    andet: "F.eks. Beskriv arbejdet så detaljeret som muligt — hvad skal laves, omfang, materialer du ønsker, og eventuelle særlige krav eller hensyn...",
  };

  const placeholder = placeholderTekst[projekttype] ?? placeholderTekst.andet;

  return (
    <FlowLayout aktivTrin={2}>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Udbudsdokument
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beskriv dit projekt</h1>
        <p className="text-gray-500">
          Vi genererer et professionelt udbudsdokument du kan sende til 2-3 håndværkere for at indhente sammenlignelige tilbud.
        </p>
      </div>

      {/* Projektbeskrivelse */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Hvad skal laves? <span className="text-red-400">*</span></h2>
        <p className="text-sm text-gray-400 mb-4">Beskriv så detaljeret som muligt - jo mere du skriver, jo bedre bliver dokumentet</p>
        <textarea
          rows={5}
          placeholder={placeholder}
          value={beskrivelse}
          onChange={(e) => setBeskrivelse(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-400">Minimum 20 tegn</span>
          <span className={`text-xs font-medium ${beskrivelse.length < 20 ? "text-gray-400" : "text-green-600"}`}>
            {beskrivelse.length} tegn
          </span>
        </div>
      </div>

      {/* Tidsramme */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Tidsramme</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ønsket opstart</label>
            <input
              type="date"
              value={opstart}
              onChange={(e) => setOpstart(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senest færdig</label>
            <input
              type="date"
              value={slutdato}
              onChange={(e) => setSlutdato(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Beboet */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Bor du hjemme under arbejdet?</h2>
        <p className="text-sm text-gray-400 mb-4">Påvirker adgangsforhold og arbejdstider</p>
        <div className="flex gap-3">
          {[
            { id: "ja", label: "Ja, vi bor hjemme" },
            { id: "nej", label: "Nej, boligen er tom" },
            { id: "delvis", label: "Delvist" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setBeboet(opt.id)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                beboet === opt.id
                  ? "border-primary bg-accent text-primary"
                  : "border-gray-100 text-gray-600 hover:border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Særlige krav */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-1">Særlige krav eller ønsker</h2>
        <p className="text-sm text-gray-400 mb-4">Materialer, adgangsforhold, allergier, budgetramme eller andet</p>
        <textarea
          rows={3}
          placeholder="F.eks. kun naturmaterialer, kranvogn nødvendig, maks budget 150.000 kr., parkering til rådighed på adressen..."
          value={krav}
          onChange={(e) => setKrav(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
        />
      </div>

      {/* Billedupload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-1">Billeder af eksisterende forhold</h2>
        <p className="text-sm text-gray-400 mb-4">Upload billeder af det nuværende rum eller problem. De sendes med til håndværkeren.</p>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-primary hover:bg-accent transition-all">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span className="text-sm text-gray-500">Klik for at vælge billeder</span>
          <span className="text-xs text-gray-400">JPG, PNG, WEBP - maks 5 billeder</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const filer = Array.from(e.target.files || []).slice(0, 5);
              Promise.all(filer.map(fil => new Promise<{ navn: string; data: string }>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ navn: fil.name, data: reader.result as string });
                reader.readAsDataURL(fil);
              }))).then(setBilleder);
            }}
          />
        </label>
        {billeder.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {billeder.map((b, i) => (
              <div key={i} className="relative group">
                <img src={b.data} alt={b.navn} className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                <button
                  onClick={() => setBilleder(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {fejl && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 text-sm text-red-700">
          {fejl}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ← Tilbage
        </button>
        <button
          onClick={genererUdbud}
          disabled={!kanGenerere || loading}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-3 ${
            kanGenerere && !loading
              ? "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              Genererer dokument…
            </>
          ) : (
            "Generér udbudsdokument →"
          )}
        </button>
      </div>
      {!kanGenerere && (
        <p className="text-center text-xs text-gray-400 mt-3">Beskriv projektet (min. 20 tegn) for at fortsætte</p>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-10 max-w-md w-full mx-4">
            {/* Ikon + titel */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#1e3a2a]/8 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Genererer dit udbudsdokument</h2>
              <p className="text-sm text-gray-400 mt-1">Det tager typisk 10–20 sekunder</p>
            </div>

            {/* Loading bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Behandler beskrivelse…</span>
                <span>{loadingPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1e3a2a] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${loadingPct}%` }}
                />
              </div>
            </div>

            {/* Roterende tip */}
            <div className="bg-[#f4f9f6] border border-[#dceae2] rounded-2xl p-5">
              <div>
                <p className="text-xs font-bold text-[#1e3a2a] uppercase tracking-widest mb-1">{loadingTips[loadingTipIdx].titel}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{loadingTips[loadingTipIdx].tekst}</p>
              </div>
              {/* Tip-indikatorer */}
              <div className="flex gap-1.5 justify-center mt-4">
                {loadingTips.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === loadingTipIdx ? "w-5 bg-[#1e3a2a]" : "w-1.5 bg-gray-300"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </FlowLayout>
  );
}
