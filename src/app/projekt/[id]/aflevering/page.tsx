"use client";

import { use, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import Link from "next/link";

const mangelListe = [
  { id: 1, punkt: "Gipsvægge og overflader", status: "ok" },
  { id: 2, punkt: "Malerarbejde - vægge og lofter", status: "ok" },
  { id: 3, punkt: "Gulvafslutninger", status: "mangel", note: "Overgangen mellem parket og fliser er ikke tætnet" },
  { id: 4, punkt: "El og afbrydere", status: "ok" },
  { id: 5, punkt: "VVS og afløb", status: "ok" },
  { id: 6, punkt: "Rengøring og oprydning", status: "advarsel", note: "Byggeskrammel er ikke fjernet fra kælder" },
];

export default function Aflevering({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trin, setTrin] = useState<"gennemgang" | "protokol" | "underskrift" | "bekraeftet">("gennemgang");
  const [mangler, setMangler] = useState(mangelListe);
  const [underskrevet, setUnderskrevet] = useState(false);
  const [nyMangel, setNyMangel] = useState("");

  const åbneMangler = mangler.filter(m => m.status === "mangel" || m.status === "advarsel");

  const tilføjMangel = () => {
    if (!nyMangel.trim()) return;
    setMangler([...mangler, { id: mangler.length + 1, punkt: nyMangel, status: "mangel", note: "" }]);
    setNyMangel("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Afleveringsforretning</h1>
          <p className="text-sm text-gray-400 mt-1">Indvendig renovering, Valby · AB-Forbruger § 37-38</p>
        </div>

        {/* Trin-indikator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: "gennemgang", label: "Gennemgang" },
            { key: "protokol", label: "Protokol" },
            { key: "underskrift", label: "Underskrift" },
            { key: "bekraeftet", label: "Afleveret" },
          ].map((t, i, arr) => {
            const trinRækkefølge = ["gennemgang", "protokol", "underskrift", "bekraeftet"];
            const erFærdig = trinRækkefølge.indexOf(trin) > i;
            const erAktiv = trin === t.key;
            return (
              <div key={t.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${i < arr.length - 1 ? "flex-1" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    erFærdig ? "bg-primary text-white" :
                    erAktiv ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {erFærdig ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${erAktiv ? "text-primary" : "text-gray-400"}`}>{t.label}</span>
                  {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${erFærdig ? "bg-primary" : "bg-gray-200"}`} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* TRIN 1: Gennemgang */}
        {trin === "gennemgang" && (
          <div className="space-y-5">
            <ABTip
              paragraf="AB-Forbruger § 37"
              titel="Arbejdet er ikke afleveret endnu"
              resumé="Arbejdet betragtes ikke som afleveret, hvis der er væsentlige mangler, og du påberåber dig disse senest 10 arbejdsdage efter meddelelsen om, at arbejdet er udført."
              detaljer="Gennemgå arbejdet grundigt nu. Alle mangler du påpeger noteres i afleveringsprotokollen - uanset om håndværkeren er enig eller ej."
              type="info"
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Gennemgå arbejdet punkt for punkt</h2>
              <p className="text-sm text-gray-400 mb-5">Markér status på hvert punkt. Tilføj egne punkter hvis nødvendigt.</p>
              <div className="space-y-3">
                {mangler.map((m) => (
                  <div key={m.id} className={`flex items-start gap-3 p-4 rounded-xl border ${
                    m.status === "mangel" ? "border-red-100 bg-red-50/50" :
                    m.status === "advarsel" ? "border-amber-100 bg-amber-50/50" :
                    "border-gray-100"
                  }`}>
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                      {["ok", "advarsel", "mangel"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setMangler(mangler.map(x => x.id === m.id ? { ...x, status: s } : x))}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            m.status === s
                              ? s === "ok" ? "border-green-500 bg-green-500" :
                                s === "advarsel" ? "border-amber-500 bg-amber-500" :
                                "border-red-500 bg-red-500"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          {m.status === s && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{m.punkt}</p>
                      {m.note && <p className="text-xs text-gray-500 mt-0.5">{m.note}</p>}
                    </div>
                    <div className="flex-shrink-0">
                      {m.status === "ok" && <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">OK</span>}
                      {m.status === "advarsel" && <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Bemærkning</span>}
                      {m.status === "mangel" && <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Mangel</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={nyMangel}
                  onChange={e => setNyMangel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && tilføjMangel()}
                  placeholder="Tilføj et punkt til gennemgangen..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all"
                />
                <button onClick={tilføjMangel} className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Tilføj
                </button>
              </div>
            </div>

            <button
              onClick={() => setTrin("protokol")}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Fortsæt til afleveringsprotokol →
            </button>
          </div>
        )}

        {/* TRIN 2: Protokol */}
        {trin === "protokol" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Afleveringsprotokol</h2>
                <span className="text-xs text-gray-400">Genereret {new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400 mb-1">Bygherre</p><p className="font-medium text-gray-900">Camilla Jensen</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Entreprenør</p><p className="font-medium text-gray-900">Thomas Madsen, TM Byg ApS</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Projekt</p><p className="font-medium text-gray-900">Indvendig renovering, Valby</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Afleveringsdato</p><p className="font-medium text-gray-900">{new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}</p></div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Påpegede mangler og bemærkninger</p>
                  {åbneMangler.length === 0 ? (
                    <p className="text-green-700 font-medium">Ingen mangler påpeget - arbejdet godkendes uden forbehold.</p>
                  ) : (
                    <div className="space-y-2">
                      {åbneMangler.map((m, i) => (
                        <div key={m.id} className="flex items-start gap-2">
                          <span className="text-gray-400 flex-shrink-0">{i + 1}.</span>
                          <div>
                            <p className="font-medium text-gray-900">{m.punkt}</p>
                            {m.note && <p className="text-gray-500 text-xs mt-0.5">{m.note}</p>}
                            <span className={`text-xs font-semibold ${m.status === "mangel" ? "text-red-600" : "text-amber-600"}`}>
                              {m.status === "mangel" ? "Kræver udbedring" : "Bemærkning"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ovenstående mangler noteres jf. AB-Forbruger § 38, stk. 3. Entreprenøren har pligt og ret til at afhjælpe mangler inden rimelig tid jf. § 43. Forbrugeren kan tilbageholde et beløb svarende til manglernes udbedring jf. § 25, stk. 3.
                  </p>
                </div>
              </div>
            </div>

            {åbneMangler.length > 0 && (
              <ABTip
                paragraf="AB-Forbruger § 25, stk. 3 & § 43"
                titel={`Du kan tilbageholde betaling for ${åbneMangler.length} ${åbneMangler.length === 1 ? "mangel" : "mangler"}`}
                resumé="Du har ret til at tilbageholde et beløb svarende til manglernes udbedring, indtil de er rettet. Håndværkeren har pligt til at udbedre inden rimelig tid."
                detaljer="Tilbageholdelsen skal stå i rimeligt forhold til manglen. Dokumentationen i afleveringsprotokollen udgør dit juridiske grundlag."
                type="advarsel"
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => setTrin("gennemgang")} className="flex-1 border border-gray-200 text-gray-600 font-medium py-4 rounded-xl hover:bg-gray-50 transition-colors">
                ← Tilbage
              </button>
              <button onClick={() => setTrin("underskrift")} className="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity">
                Fortsæt til underskrift →
              </button>
            </div>
          </div>
        )}

        {/* TRIN 3: Underskrift */}
        {trin === "underskrift" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Underskriv afleveringsprotokollen</h2>

              <div className="space-y-4 mb-6">
                <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">C</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Camilla Jensen</p>
                      <p className="text-xs text-gray-400">Bygherre</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Afventer</span>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">T</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Thomas Madsen</p>
                      <p className="text-xs text-gray-400">TM Byg ApS</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Afventer</span>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={underskrevet}
                  onChange={e => setUnderskrevet(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary mt-0.5 flex-shrink-0 cursor-pointer"
                />
                <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                  Jeg bekræfter, at ovenstående afleveringsprotokol er korrekt og afspejler gennemgangen af arbejdet den {new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}. Eventuelle mangler er noteret og skal udbedres af entreprenøren inden rimelig tid jf. AB-Forbruger § 43.
                </p>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setTrin("protokol")} className="flex-1 border border-gray-200 text-gray-600 font-medium py-4 rounded-xl hover:bg-gray-50 transition-colors">
                ← Tilbage
              </button>
              <button
                onClick={() => underskrevet && setTrin("bekraeftet")}
                className={`flex-1 font-bold py-4 rounded-xl transition-all ${underskrevet ? "bg-primary text-white hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                Underskriv og afslut →
              </button>
            </div>
          </div>
        )}

        {/* TRIN 4: Bekræftet */}
        {trin === "bekraeftet" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Afleveringsprotokol underskrevet</h2>
              <p className="text-sm text-gray-500 mb-6">Arbejdet er formelt afleveret {new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}. Du har nu 5 års reklamationsret på skjulte mangler.</p>

              {åbneMangler.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-6">
                  <p className="text-sm font-semibold text-amber-800 mb-1">{åbneMangler.length} {åbneMangler.length === 1 ? "mangel" : "mangler"} skal udbedres</p>
                  <p className="text-sm text-amber-700">Håndværkeren er varslet og har pligt til at udbedre inden rimelig tid. Du kan følge op under &quot;Mangler&quot;.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Afleveringsdato</p>
                  <p className="font-bold text-gray-900">{new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">1-årseftersyn senest</p>
                  <p className="font-bold text-gray-900">{new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}</p>
                </div>
              </div>

              {/* Data-garanti */}
              <div className="bg-[#1a5c38]/5 border border-[#1a5c38]/10 rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2" className="mt-0.5 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <div>
                    <p className="text-sm font-semibold text-[#1a5c38] mb-1">Dine data er gemt for altid</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Alle dokumenter, kontrakter, beskeder og betalinger i dette projekt er permanent tilgængelige i dit projektrum. Du har reklamationsret i 5 år, og vi sender dig en påmindelse inden 1-årsfristen udløber.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ABTip
              paragraf="AB-Forbruger § 58"
              titel="Husk 1-årseftersyn"
              resumé="For arbejder under 500.000 kr. kan du kræve 1-årseftersyn, hvis du meddeler det inden 1 år efter afleveringen. Platformen minder dig om det i god tid."
              detaljer="Eftersynet giver dig mulighed for at påpege mangler, der er opstået det første år. Håndværkeren indkalder med 10-30 arbejdsdages varsel."
              type="info"
            />

            <div className="flex gap-3">
              <Link href={`/projekt/${id}/mangler`} className="flex-1 text-center border border-gray-200 text-gray-600 font-medium py-4 rounded-xl hover:bg-gray-50 transition-colors">
                Se mangler
              </Link>
              <Link href={`/projekt/${id}`} className="flex-1 text-center bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity">
                Tilbage til projekt →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
