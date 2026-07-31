"use client";

import { use, useEffect, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import { createClient } from "@/lib/supabase";

interface Kontrakt {
  haandvaerker_email: string | null;
  haandvaerker_navn: string | null;
  total_pris: number | null;
  startdato: string | null;
  slutdato: string | null;
  ab_forbruger: boolean | null;
}

interface Projekt {
  titel: string;
  projekttype: string | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
};

export default function AcceptTjek({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [projekt, setProjekt]   = useState<Projekt | null>(null);
  const [kontrakt, setKontrakt] = useState<Kontrakt | null>(null);
  const [indlæser, setIndlæser] = useState(true);
  const [kopieret, setKopieret] = useState(false);
  const [ekstraPunkter, setEkstraPunkter] = useState<string[]>([""]);

  useEffect(() => {
    const hent = async () => {
      const [{ data: p }, { data: k }] = await Promise.all([
        supabase.from("projekter").select("titel, projekttype").eq("id", id).maybeSingle(),
        supabase.from("kontrakter").select("haandvaerker_email, haandvaerker_navn, total_pris, startdato, slutdato, ab_forbruger").eq("projekt_id", id).order("oprettet_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setProjekt(p);
      setKontrakt(k);
      setIndlæser(false);
    };
    hent();
  }, [id]);

  function genererAcceptBesked(): string {
    const navn = kontrakt?.haandvaerker_navn ?? "Håndværker";
    const pris = kontrakt?.total_pris ? fmtKr(kontrakt.total_pris) : "aftalt pris";
    const start = fmtDato(kontrakt?.startdato ?? null) ?? "aftalt startdato";
    const slut = fmtDato(kontrakt?.slutdato ?? null) ?? "aftalt slutdato";
    const ab = kontrakt?.ab_forbruger;

    const ekstra = ekstraPunkter.filter(p => p.trim()).map(p => `- ${p.trim()}`).join("\n");

    return `Hej ${navn},

Jeg accepterer hermed opgaven på følgende vilkår:

- Pris: ${pris} (inkl. moms)
- Opstart: ${start}
- Aflevering: ${slut}
- AB-Forbruger 2012 indgår i aftalegrundlaget: ${ab ? "Ja" : "Afventer skriftlig bekræftelse"}
- Ekstraarbejde aftales skriftligt inden opstart
- Betaling sker i takt med dokumenteret fremdrift${ekstra ? "\n\n" + "Derudover er vi aftalt:\n" + ekstra : ""}

Venlig hilsen
${projekt?.titel ?? "Bygherre"}

---
Genereret via Nembyggestyring, digital tryghed for bygherren`;
  }

  async function kopier() {
    await navigator.clipboard.writeText(genererAcceptBesked());
    setKopieret(true);
    setTimeout(() => setKopieret(false), 2000);
  }

  // Tjekpunkter
  const tjekpunkter = [
    {
      ok: !!(kontrakt?.haandvaerker_navn || kontrakt?.haandvaerker_email),
      label: "Håndværker identificeret",
      ok_tekst: kontrakt?.haandvaerker_navn ?? kontrakt?.haandvaerker_email ?? "",
      mangler_tekst: "Ingen håndværker er tilknyttet projektet endnu",
      paragraf: null,
    },
    {
      ok: !!(kontrakt?.total_pris),
      label: "Fast pris aftalt",
      ok_tekst: kontrakt?.total_pris ? fmtKr(kontrakt.total_pris) : "",
      mangler_tekst: "Ingen pris er registreret i kontrakten. Afklar om prisen er fast eller overslag",
      paragraf: "§ 12",
    },
    {
      ok: !!(kontrakt?.startdato),
      label: "Startdato aftalt",
      ok_tekst: fmtDato(kontrakt?.startdato ?? null) ?? "",
      mangler_tekst: "Ingen startdato. AB-Forbruger § 12 anbefaler at start- og slutdato fremgår",
      paragraf: "§ 12",
    },
    {
      ok: !!(kontrakt?.slutdato),
      label: "Slutdato / afleveringsdato aftalt",
      ok_tekst: fmtDato(kontrakt?.slutdato ?? null) ?? "",
      mangler_tekst: "Ingen slutdato. Afklar hvornår arbejdet forventes afleveret",
      paragraf: "§ 12",
    },
    {
      ok: kontrakt?.ab_forbruger === true,
      label: "AB-Forbruger 2012 indgår i aftalegrundlaget",
      ok_tekst: "Ja, indgår i aftalegrundlaget",
      mangler_tekst: "AB-Forbruger er ikke bekræftet. Bed om at det indgår skriftligt i aftalen",
      paragraf: "§ 1",
    },
  ];

  const godkendtCount = tjekpunkter.filter(t => t.ok).length;
  const risiko = godkendtCount >= 4 ? "lav" : godkendtCount >= 2 ? "middel" : "høj";
  const risikoFarve = risiko === "lav" ? "bg-green-100 text-green-800" : risiko === "middel" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Accept-tjek</h1>
          <p className="text-sm text-gray-400 mt-1">
            Vi gennemgår de vigtigste punkter inden du accepterer. Accepter aldrig mundtligt. Brug beskedforslagen herunder.
          </p>
        </div>

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Risikovurdering */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Samlet vurdering</p>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${risikoFarve}`}>
                  {risiko === "lav" ? "Lav risiko" : risiko === "middel" ? "Middel risiko" : "Høj risiko"}
                </span>
              </div>
              <div className="flex gap-1 ml-auto">
                {tjekpunkter.map((t, i) => (
                  <div key={i} className={`w-6 h-2 rounded-full ${t.ok ? "bg-[#1e3a2a]" : "bg-red-300"}`} />
                ))}
              </div>
            </div>

            {/* Tjekpunkter */}
            <div className="space-y-3 mb-8">
              {tjekpunkter.map((t, i) => (
                <div key={i} className={`rounded-2xl border p-4 flex gap-4 ${t.ok ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${t.ok ? "bg-green-100" : "bg-red-100"}`}>
                    {t.ok ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                      {t.paragraf && (
                        <span className="text-[10px] font-bold bg-[#1e3a2a]/10 text-[#1e3a2a] px-1.5 py-0.5 rounded-full">{t.paragraf}</span>
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${t.ok ? "text-green-700" : "text-red-700"}`}>
                      {t.ok ? t.ok_tekst : t.mangler_tekst}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ekstra punkter */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Tilføj egne vilkår til acceptbeskeden</h2>
              <p className="text-xs text-gray-400 mb-4">F.eks. "Støjende arbejde kun på hverdage 8-17" eller "Daglig oprydning af byggepladsen"</p>
              <div className="space-y-2">
                {ekstraPunkter.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={p}
                      onChange={e => {
                        const ny = [...ekstraPunkter];
                        ny[i] = e.target.value;
                        setEkstraPunkter(ny);
                      }}
                      placeholder={`Vilkår ${i + 1}...`}
                      className="flex-1 text-sm border border-[#e0ddd6] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1e3a2a]"
                    />
                    {ekstraPunkter.length > 1 && (
                      <button onClick={() => setEkstraPunkter(ekstraPunkter.filter((_, j) => j !== i))}
                        className="text-gray-300 hover:text-red-400 transition-colors px-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setEkstraPunkter([...ekstraPunkter, ""])}
                  className="text-xs font-semibold text-[#1e3a2a] hover:underline">
                  + Tilføj punkt
                </button>
              </div>
            </div>

            {/* Acceptbesked */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">Klar acceptbesked</h2>
                <button onClick={kopier}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                    kopieret ? "bg-green-100 text-green-700" : "bg-[#1e3a2a] text-white hover:opacity-90"
                  }`}>
                  {kopieret ? "Kopieret!" : "Kopiér besked"}
                </button>
              </div>
              <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4 border border-gray-100">
                {genererAcceptBesked()}
              </pre>
            </div>

            <ABTip type="info" paragraf="AB-Forbruger § 1" titel="AB-Forbruger gælder kun ved skriftlig aftale"
              resumé="AB-Forbruger træder kun i kraft, hvis begge parter skriftligt aftaler at den er gældende."
              detaljer="Det er ikke nok at du som bygherre ønsker AB-Forbruger. Håndværkeren skal eksplicit acceptere det skriftligt. Brug acceptbeskeden herover til at gøre dette klart fra start." />
          </>
        )}
      </div>
    </div>
  );
}
