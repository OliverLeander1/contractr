"use client";

import { use, useEffect, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";

interface Projektgrundlag {
  id: string;
  projekt_id: string;
  titel: string;
  fag: string | null;
  arbejdsomfang: string;
  eksisterende_forhold: string;
  materialer_kvalitet: string;
  tidsramme: string;
  adgangsforhold: string;
  dokumentationskrav: string;
  oevrige_forhold: string;
  status: "udkast" | "klar_til_invitation";
  oprettet_at: string;
  opdateret_at: string;
}

interface FormState {
  titel: string;
  fag: string;
  arbejdsomfang: string;
  eksisterende_forhold: string;
  materialer_kvalitet: string;
  tidsramme: string;
  adgangsforhold: string;
  dokumentationskrav: string;
  oevrige_forhold: string;
}

const TOM_FORM: FormState = {
  titel: "",
  fag: "",
  arbejdsomfang: "",
  eksisterende_forhold: "",
  materialer_kvalitet: "",
  tidsramme: "",
  adgangsforhold: "",
  dokumentationskrav: "",
  oevrige_forhold: "",
};

const UDFYLDELSES_FELTER: (keyof FormState)[] = [
  "titel", "fag", "arbejdsomfang", "eksisterende_forhold",
  "materialer_kvalitet", "tidsramme", "adgangsforhold",
  "dokumentationskrav", "oevrige_forhold",
];

const STATUS_LABEL: Record<Projektgrundlag["status"], string> = {
  udkast: "Under udarbejdelse",
  klar_til_invitation: "Klar til invitation",
};

const STATUS_KLASSE: Record<Projektgrundlag["status"], string> = {
  udkast: "bg-amber-100 text-amber-700",
  klar_til_invitation: "bg-green-100 text-green-700",
};

type Tilstand = "indlæser" | "login-krævet" | "ingen-adgang" | "fejl" | "klar";

function fmtDato(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
}

function formFraRække(g: Projektgrundlag): FormState {
  return {
    titel: g.titel,
    fag: g.fag ?? "",
    arbejdsomfang: g.arbejdsomfang,
    eksisterende_forhold: g.eksisterende_forhold,
    materialer_kvalitet: g.materialer_kvalitet,
    tidsramme: g.tidsramme,
    adgangsforhold: g.adgangsforhold,
    dokumentationskrav: g.dokumentationskrav,
    oevrige_forhold: g.oevrige_forhold,
  };
}

export default function ProjektgrundlagSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [tilstand, setTilstand] = useState<Tilstand>("indlæser");
  const [genindlæsning, setGenindlæsning] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [grundlag, setGrundlag] = useState<Projektgrundlag[]>([]);
  const [valgtId, setValgtId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(TOM_FORM);
  const [gemmer, setGemmer] = useState(false);
  const [formFejl, setFormFejl] = useState<string | null>(null);
  const [succesBesked, setSuccesBesked] = useState<string | null>(null);

  useEffect(() => {
    let annulleret = false;

    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!annulleret) setTilstand("login-krævet");
        return;
      }

      try {
        const res = await fetch(`/api/projekter/${id}/projektgrundlag`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.status === 401) { if (!annulleret) setTilstand("login-krævet"); return; }
        if (res.status === 403) { if (!annulleret) setTilstand("ingen-adgang"); return; }
        if (!res.ok) { if (!annulleret) setTilstand("fejl"); return; }

        const data = await res.json().catch(() => null);
        if (annulleret) return;

        setToken(session.access_token);
        setGrundlag(Array.isArray(data) ? data : []);
        setTilstand("klar");
      } catch {
        if (!annulleret) setTilstand("fejl");
      }
    })();

    return () => { annulleret = true; };
  }, [id, genindlæsning]);

  function prøvIgen() {
    setTilstand("indlæser");
    setGenindlæsning((n) => n + 1);
  }

  function nytProjektgrundlag() {
    setValgtId("ny");
    setForm(TOM_FORM);
    setFormFejl(null);
    setSuccesBesked(null);
  }

  function vælgGrundlag(g: Projektgrundlag) {
    setValgtId(g.id);
    setForm(formFraRække(g));
    setFormFejl(null);
    setSuccesBesked(null);
  }

  function opdaterFelt(felt: keyof FormState, værdi: string) {
    setForm((prev) => ({ ...prev, [felt]: værdi }));
  }

  async function gem() {
    if (!token) return;
    setGemmer(true);
    setFormFejl(null);

    const erNy = valgtId === "ny";
    const url = erNy ? `/api/projekter/${id}/projektgrundlag` : `/api/projektgrundlag/${valgtId}`;
    const method = erNy ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormFejl((data && typeof data.fejl === "string" && data.fejl) || "Kunne ikke gemme. Prøv igen.");
        return;
      }

      if (erNy) {
        setGrundlag((prev) => [data, ...prev]);
        setValgtId(data.id);
        setSuccesBesked("Projektgrundlag oprettet som udkast.");
      } else {
        setGrundlag((prev) => prev.map((g) => (g.id === data.id ? data : g)));
        setSuccesBesked("Ændringer gemt.");
      }
      setTimeout(() => setSuccesBesked(null), 3000);
    } catch {
      setFormFejl("Kunne ikke gemme. Prøv igen.");
    } finally {
      setGemmer(false);
    }
  }

  async function ændrStatus(nyStatus: Projektgrundlag["status"]) {
    if (!token || !valgtId || valgtId === "ny") return;
    setGemmer(true);
    setFormFejl(null);

    try {
      const res = await fetch(`/api/projektgrundlag/${valgtId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nyStatus }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormFejl((data && typeof data.fejl === "string" && data.fejl) || "Kunne ikke opdatere status.");
        return;
      }

      setGrundlag((prev) => prev.map((g) => (g.id === data.id ? data : g)));
      setSuccesBesked(
        nyStatus === "klar_til_invitation"
          ? "Markeret som klar til invitation."
          : "Sat tilbage til Under udarbejdelse."
      );
      setTimeout(() => setSuccesBesked(null), 3000);
    } catch {
      setFormFejl("Kunne ikke opdatere status.");
    } finally {
      setGemmer(false);
    }
  }

  const valgtRække = valgtId && valgtId !== "ny" ? grundlag.find((g) => g.id === valgtId) ?? null : null;
  const udfyldte = UDFYLDELSES_FELTER.filter((k) => form[k].trim().length > 0).length;
  const antalKlar = grundlag.filter((g) => g.status === "klar_til_invitation").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      {/* Topområde */}
      <div className="bg-[#f0f7f3] border-b border-[#1e3a2a]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-xl font-bold text-gray-900">Projektgrundlag</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Beskriv en afgrænset opgave, som senere kan sendes til flere entreprenører på samme grundlag.
          </p>

          {/* Procesvisning — kun trin 1 er funktionelt */}
          <div className="flex items-center gap-2 mt-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e3a2a] text-white">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              Projektgrundlag
            </span>
            <span className="w-4 h-px bg-[#1e3a2a]/20" />
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-gray-400 border border-gray-200">
              <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">2</span>
              Tilbud
            </span>
            <span className="w-4 h-px bg-[#1e3a2a]/20" />
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-gray-400 border border-gray-200">
              <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">3</span>
              Aftalegrundlag
            </span>
          </div>

          {tilstand === "klar" && (
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <span>{grundlag.length} projektgrundlag</span>
              <span>·</span>
              <span>{antalKlar} klar til invitation</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tilstand === "indlæser" && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-3.5 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {tilstand === "login-krævet" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="font-semibold text-gray-800 mb-2">Log ind for at se projektgrundlag</p>
            <a href="/login" className="text-sm text-[#1e3a2a] font-semibold hover:underline">Gå til login</a>
          </div>
        )}

        {tilstand === "ingen-adgang" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="font-semibold text-gray-800">Du har ikke adgang til dette projekt.</p>
          </div>
        )}

        {tilstand === "fejl" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="font-semibold text-gray-800 mb-2">Projektgrundlag kunne ikke hentes lige nu.</p>
            <button onClick={prøvIgen} className="text-sm text-[#1e3a2a] font-semibold hover:underline">
              Prøv igen
            </button>
          </div>
        )}

        {tilstand === "klar" && (
          <div className="grid md:grid-cols-[minmax(0,280px)_1fr] gap-6">
            {/* Venstre — liste */}
            <div className="space-y-3">
              <button
                onClick={nytProjektgrundlag}
                className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-[#1e3a2a]/30 rounded-xl py-3 text-sm font-semibold text-[#1e3a2a] hover:border-[#1e3a2a]/60 hover:bg-[#1e3a2a]/5 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nyt projektgrundlag
              </button>

              {grundlag.length === 0 && valgtId !== "ny" ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Opret dit første projektgrundlag</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Beskriv en afgrænset opgave, du senere kan sende til flere entreprenører.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {grundlag.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => vælgGrundlag(g)}
                      className={`w-full text-left bg-white rounded-xl border p-4 transition-all min-w-0 ${
                        valgtId === g.id ? "border-[#1e3a2a] shadow-sm" : "border-gray-100 hover:border-[#1e3a2a]/30"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 truncate">{g.titel || "Uden titel"}</p>
                      {g.fag && <p className="text-xs text-gray-400 truncate mt-0.5">{g.fag}</p>}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_KLASSE[g.status]}`}>
                          {STATUS_LABEL[g.status]}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{fmtDato(g.opdateret_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Højre — formular */}
            <div>
              {!valgtId ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
                  Vælg et projektgrundlag i listen, eller opret et nyt.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-6">
                  {valgtRække && (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_KLASSE[valgtRække.status]}`}>
                        {STATUS_LABEL[valgtRække.status]}
                      </span>
                      <span className="text-xs text-gray-400">Udfyldelsesgrad: {udfyldte}/{UDFYLDELSES_FELTER.length} felter</span>
                    </div>
                  )}
                  {!valgtRække && (
                    <span className="text-xs text-gray-400">Udfyldelsesgrad: {udfyldte}/{UDFYLDELSES_FELTER.length} felter</span>
                  )}

                  {/* Grundlæggende */}
                  <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Grundlæggende</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                      <input
                        type="text"
                        value={form.titel}
                        onChange={(e) => opdaterFelt("titel", e.target.value)}
                        maxLength={120}
                        placeholder="fx Malerarbejde"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fag (valgfrit)</label>
                      <input
                        type="text"
                        value={form.fag}
                        onChange={(e) => opdaterFelt("fag", e.target.value)}
                        maxLength={100}
                        placeholder="fx Maler, Tømrer, VVS"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Opgaven */}
                  <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Opgaven</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Arbejdsomfang</label>
                      <p className="text-xs text-gray-400 mb-1.5">Beskriv hvad entreprenøren skal levere og udføre.</p>
                      <textarea
                        value={form.arbejdsomfang}
                        onChange={(e) => opdaterFelt("arbejdsomfang", e.target.value)}
                        maxLength={10000}
                        rows={4}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eksisterende forhold</label>
                      <p className="text-xs text-gray-400 mb-1.5">Beskriv relevante forhold, som entreprenøren skal tage højde for.</p>
                      <textarea
                        value={form.eksisterende_forhold}
                        onChange={(e) => opdaterFelt("eksisterende_forhold", e.target.value)}
                        maxLength={10000}
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Materialer og kvalitet</label>
                      <p className="text-xs text-gray-400 mb-1.5">Angiv ønskede produkter, materialer eller kvalitetsniveauer, hvis de er kendt.</p>
                      <textarea
                        value={form.materialer_kvalitet}
                        onChange={(e) => opdaterFelt("materialer_kvalitet", e.target.value)}
                        maxLength={10000}
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                  </div>

                  {/* Praktiske forhold */}
                  <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Praktiske forhold</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tidsramme</label>
                      <textarea
                        value={form.tidsramme}
                        onChange={(e) => opdaterFelt("tidsramme", e.target.value)}
                        maxLength={10000}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adgangsforhold</label>
                      <textarea
                        value={form.adgangsforhold}
                        onChange={(e) => opdaterFelt("adgangsforhold", e.target.value)}
                        maxLength={10000}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dokumentationskrav</label>
                      <textarea
                        value={form.dokumentationskrav}
                        onChange={(e) => opdaterFelt("dokumentationskrav", e.target.value)}
                        maxLength={10000}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Øvrige forhold</label>
                      <textarea
                        value={form.oevrige_forhold}
                        onChange={(e) => opdaterFelt("oevrige_forhold", e.target.value)}
                        maxLength={10000}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-y"
                      />
                    </div>
                  </div>

                  {formFejl && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs text-red-700 font-medium">{formFejl}</p>
                    </div>
                  )}
                  {succesBesked && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-xs text-green-700 font-medium">{succesBesked}</p>
                    </div>
                  )}

                  {/* Handlinger */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={gem}
                      disabled={gemmer}
                      className="bg-[#1e3a2a] text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                    >
                      {gemmer ? "Gemmer..." : valgtId === "ny" ? "Gem udkast" : "Gem ændringer"}
                    </button>

                    {valgtRække && valgtRække.status === "udkast" && (
                      <button
                        onClick={() => ændrStatus("klar_til_invitation")}
                        disabled={gemmer}
                        className="border border-[#1e3a2a]/30 text-[#1e3a2a] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1e3a2a]/5 transition-colors text-sm disabled:opacity-50"
                      >
                        Markér som klar
                      </button>
                    )}
                    {valgtRække && valgtRække.status === "klar_til_invitation" && (
                      <button
                        onClick={() => ændrStatus("udkast")}
                        disabled={gemmer}
                        className="border border-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                      >
                        Sæt tilbage til Under udarbejdelse
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
