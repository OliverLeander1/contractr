"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";
import DokumentRenderer from "@/components/DokumentRenderer";

interface Aendring {
  id: string;
  felt: string;
  gammel_vaerdi: string;
  ny_vaerdi: string;
  forfatter: string;
  forfatter_navn: string | null;
  kommentar: string | null;
  status: "afventer" | "accepteret" | "afvist";
  oprettet_at: string;
}

interface TidsplanFase {
  navn: string;
  startdato: string;
  slutdato: string;
}

interface Tidsplan {
  type: "faser" | "ingen_tidsplan";
  faser?: TidsplanFase[];
  godkendt_af_bygherre: boolean;
  godkendt_at?: string | null;
  indsendt_at?: string;
}

interface Kontrakt {
  id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  vilkaar: string | null;
  startdato: string | null;
  slutdato: string | null;
  haandvaerker_token: string;
  haandvaerker_email: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  status: string;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  kontraktaendringer: Aendring[];
  tidsplan: Tidsplan | null;
  tilbud_dokument_url: string | null;
  tilbud_dokument_navn: string | null;
  besigtigelse_dato: string | null;
  besigtigelse_bekraeftet: boolean | null;
  forudsaetninger: string | null;
  forudsaetninger_sendt_at: string | null;
  forudsaetninger_godkendt: boolean | null;
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " kr.";

const feltLabels: Record<string, string> = {
  titel: "Projekttitel",
  beskrivelse: "Arbejdets omfang",
  total_pris: "Entreprisesum",
  vilkaar: "Vilkår",
  startdato: "Startdato",
  slutdato: "Slutdato",
};

export default function Forhandling({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [kontrakt, setKontrakt] = useState<Kontrakt | null | "loading">("loading");
  const [redigererFelt, setRedigererFelt] = useState<string | null>(null);
  const [feltVaerdi, setFeltVaerdi] = useState("");
  const [inviterEmail, setInviterEmail] = useState("");
  const [inviterCvr, setInviterCvr] = useState("");
  const [cvrData, setCvrData] = useState<{ navn: string; adresse: string } | null>(null);
  const [cvrFejl, setCvrFejl] = useState("");
  const [cvrSoeger, setCvrSoeger] = useState(false);
  const [visInviter, setVisInviter] = useState(false);
  const [kopieret, setKopieret] = useState(false);
  const [sender, setSender] = useState(false);
  const [godkender, setGodkender] = useState(false);
  const [godkendFejl, setGodkendFejl] = useState("");
  const [gemmer, setGemmer] = useState(false);
  const [redigererBetalingsplan, setRedigererBetalingsplan] = useState(false);
  const [betalingsplanRækker, setBetalingsplanRækker] = useState<{milepæl: string; andel: string}[]>([]);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [godkenderTidsplan, setGodkenderTidsplan] = useState(false);
  const [godkenderForudsaetninger, setGodkenderForudsaetninger] = useState(false);
  const [alleKontrakter, setAlleKontrakter] = useState<{ id: string; titel: string | null; status: string; oprettet_at: string }[]>([]);
  const [opretter, setOpretter] = useState(false);

  const hentKontrakt = useCallback(async (kontraktId?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const url = kontraktId
      ? `/api/kontrakt?projekt_id=${id}&bygherre_id=${user.id}&kontrakt_id=${kontraktId}`
      : `/api/kontrakt?projekt_id=${id}&bygherre_id=${user.id}`;
    const r = await fetch(url);
    const d = await r.json();
    if (!d.error) setKontrakt(d);
    else setKontrakt(null);

    const alleR = await fetch(`/api/projekter/${id}/kontrakter`);
    const alleD = await alleR.json();
    if (Array.isArray(alleD)) setAlleKontrakter(alleD);

    const { data: profil } = await supabase
      .from("profiler").select("navn").eq("id", user.id).single();
    setBrugerNavn(profil?.navn || user.email?.split("@")[0] || "Bygherre");
  }, [id]);

  useEffect(() => { hentKontrakt(); }, [hentKontrakt]);

  const invitationslink = kontrakt && typeof kontrakt === "object"
    ? `${typeof window !== "undefined" ? window.location.origin : "https://nembyggestyring.dk"}/kontrakt/${kontrakt.haandvaerker_token}`
    : "";

  async function kopierLink() {
    await navigator.clipboard.writeText(invitationslink);
    setKopieret(true);
    setTimeout(() => setKopieret(false), 2500);
  }

  async function gemBetalingsplan() {
    if (!kontrakt || typeof kontrakt !== "object") return;
    const gyldige = betalingsplanRækker.filter(r => r.milepæl.trim() && r.andel.trim());
    setGemmer(true);
    try {
      const r = await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, betalingsplan: gyldige }),
      });
      const data = await r.json();
      if (!data.error) setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
    } finally {
      setGemmer(false);
      setRedigererBetalingsplan(false);
    }
  }

  async function gemFeltOpdatering(felt: string) {
    if (!kontrakt || typeof kontrakt !== "object") return;
    setGemmer(true);
    try {
      const r = await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: kontrakt.id,
          [felt]: felt === "total_pris" ? parseFloat(feltVaerdi) : feltVaerdi,
          // startdato/slutdato sendes som ISO-streng direkte
        }),
      });
      const data = await r.json();
      if (!data.error) {
        setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
      }
    } finally {
      setGemmer(false);
      setRedigererFelt(null);
    }
  }

  async function slaaCvrOp() {
    const nr = inviterCvr.replace(/\s/g, "");
    if (nr.length !== 8) return;
    setCvrSoeger(true);
    setCvrFejl("");
    setCvrData(null);
    try {
      const r = await fetch(`/api/cvr?nr=${nr}`);
      const d = await r.json();
      if (d.error) { setCvrFejl("CVR-nummer ikke fundet"); }
      else { setCvrData({ navn: d.navn, adresse: d.adresse }); }
    } catch {
      setCvrFejl("Kunne ikke hente CVR-data");
    } finally {
      setCvrSoeger(false);
    }
  }

  async function sendInvitation() {
    if (!kontrakt || typeof kontrakt !== "object" || !inviterEmail.trim()) return;
    setSender(true);
    try {
      // Gem håndværkerinfo + email på kontrakten
      await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: kontrakt.id,
          haandvaerker_email: inviterEmail.trim(),
          ...(cvrData ? { haandvaerker_firma: cvrData.navn } : {}),
          ...(inviterCvr.replace(/\s/g, "").length === 8 ? { haandvaerker_cvr: inviterCvr.replace(/\s/g, "") } : {}),
        }),
      });

      // Send e-mail til håndværker
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: inviterEmail.trim(),
          link: invitationslink,
          firma: cvrData?.navn || null,
          projekttitel: kontrakt.titel || null,
        }),
      });

      setKontrakt(prev => prev && typeof prev === "object"
        ? { ...prev, haandvaerker_email: inviterEmail.trim(), haandvaerker_firma: cvrData?.navn || prev.haandvaerker_firma, status: "inviteret" }
        : prev);
      setVisInviter(false);
      setInviterCvr("");
      setCvrData(null);
    } finally {
      setSender(false);
    }
  }

  async function opretNyKontrakt() {
    if (opretter) return;
    setOpretter(true);
    try {
      const r = await fetch(`/api/projekter/${id}/kontrakter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const d = await r.json();
      if (!d.error) {
        setKontrakt({ ...d });
        const alleR = await fetch(`/api/projekter/${id}/kontrakter`);
        const alleD = await alleR.json();
        if (Array.isArray(alleD)) setAlleKontrakter(alleD);
      }
    } finally {
      setOpretter(false);
    }
  }

  async function godkendTidsplan() {
    if (!kontrakt || typeof kontrakt !== "object" || godkenderTidsplan) return;
    setGodkenderTidsplan(true);
    try {
      const r = await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, godkend_tidsplan: true }),
      });
      const data = await r.json();
      if (!data.error) setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, tidsplan: data.tidsplan } : prev);
    } finally {
      setGodkenderTidsplan(false);
    }
  }

  async function godkendForudsaetninger() {
    if (!kontrakt || typeof kontrakt !== "object" || godkenderForudsaetninger) return;
    setGodkenderForudsaetninger(true);
    try {
      const r = await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, godkend_forudsaetninger: true }),
      });
      const data = await r.json();
      if (!data.error) setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, forudsaetninger_godkendt: true } : prev);
    } finally {
      setGodkenderForudsaetninger(false);
    }
  }

  async function sletTilbudsDokument() {
    if (!kontrakt || typeof kontrakt !== "object") return;
    await fetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/tilbud-slet`, { method: "DELETE" });
    setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, tilbud_dokument_url: null, tilbud_dokument_navn: null } : prev);
  }

  async function besvarForslag(aendring_id: string, status: "accepteret" | "afvist") {
    if (!kontrakt || typeof kontrakt !== "object") return;
    const r = await fetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/forslag`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aendring_id, status }),
    });
    const data = await r.json();
    if (!data.error) {
      await hentKontrakt();
    }
  }

  async function godkendKontrakt() {
    if (!kontrakt || typeof kontrakt !== "object") return;
    setGodkendFejl("");
    setGodkender(true);
    try {
      const r = await fetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/godkend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forfatter: "bygherre" }),
      });
      const data = await r.json();
      if (data.error) {
        setGodkendFejl(data.error);
      } else {
        setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
      }
    } finally {
      setGodkender(false);
    }
  }

  if (kontrakt === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!kontrakt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-500">Kunne ikke hente kontraktdata.</p>
        </div>
      </div>
    );
  }

  const afventerForslag = kontrakt.kontraktaendringer.filter(a => a.status === "afventer");
  const accepteredeAendringer = kontrakt.kontraktaendringer.filter(a => a.status === "accepteret").length;
  const revision = accepteredeAendringer + 1;
  const erBeggeGodkendt = kontrakt.status === "begge_godkendt";
  const bygherreGodkendt = !!kontrakt.bygherre_godkendt_at;
  const haandvaerkerGodkendt = !!kontrakt.haandvaerker_godkendt_at;

  const statusTekst: Record<string, string> = {
    udkast: "Udkast",
    inviteret: "Invitation sendt",
    forhandling: "Under forhandling",
    bygherre_godkendt: "Du har godkendt",
    haandvaerker_godkendt: "Håndværker har godkendt",
    begge_godkendt: "Begge har godkendt",
  };

  const statusFarve: Record<string, string> = {
    udkast: "bg-gray-100 text-gray-600",
    inviteret: "bg-blue-100 text-blue-700",
    forhandling: "bg-amber-100 text-amber-700",
    bygherre_godkendt: "bg-blue-100 text-blue-700",
    haandvaerker_godkendt: "bg-green-100 text-green-700",
    begge_godkendt: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusFarve[kontrakt.status] || "bg-gray-100 text-gray-600"}`}>
                {statusTekst[kontrakt.status] || kontrakt.status}
              </span>
              {afventerForslag.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  {afventerForslag.length} forslag afventer svar
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Aftalegrundlag</h1>
            <p className="text-sm text-gray-500 mt-1">
              {kontrakt.titel || "Kontraktudkast"} · <span className="font-medium text-gray-700">Rev. {revision}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => router.push("/opret")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Opret ny sag
            </button>
            {!erBeggeGodkendt && (
              <button
                onClick={() => setVisInviter(true)}
                className="flex items-center gap-2 bg-[#1e3a2a] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Inviter håndværker
              </button>
            )}
          </div>
        </div>

        {/* Liste over alle kontrakter — vises kun hvis der er mere end 1 */}
        {alleKontrakter.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {alleKontrakter.map(k => (
              <button
                key={k.id}
                onClick={() => hentKontrakt(k.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  typeof kontrakt === "object" && kontrakt?.id === k.id
                    ? "bg-[#1e3a2a] text-white border-[#1e3a2a]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a2a]/40"
                }`}
              >
                {k.titel || "Aftalegrundlag"} · {statusTekst[k.status] || k.status}
              </button>
            ))}
          </div>
        )}

        {/* Invitation-modal */}
        {visInviter && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="font-bold text-gray-900 mb-1">Inviter håndværker</h2>
              <p className="text-sm text-gray-400 mb-5">Håndværkeren modtager et direkte link til forhandlingsrummet. Ingen konto krævet for at se og kommentere.</p>

              {/* CVR-opslag */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR-nummer (valgfrit)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviterCvr}
                    onChange={e => { setInviterCvr(e.target.value); setCvrData(null); setCvrFejl(""); }}
                    onBlur={slaaCvrOp}
                    placeholder="12345678"
                    maxLength={8}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                  />
                  <button
                    type="button"
                    onClick={slaaCvrOp}
                    disabled={cvrSoeger || inviterCvr.replace(/\s/g, "").length !== 8}
                    className="px-4 py-3 text-sm font-semibold text-[#1e3a2a] border border-[#1e3a2a]/20 bg-[#1e3a2a]/5 hover:bg-[#1e3a2a]/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cvrSoeger ? "..." : "Slå op"}
                  </button>
                </div>
                {cvrData && (
                  <div className="mt-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm font-semibold text-green-900">{cvrData.navn}</p>
                    {cvrData.adresse && <p className="text-xs text-green-700 mt-0.5">{cvrData.adresse}</p>}
                  </div>
                )}
                {cvrFejl && <p className="mt-1.5 text-xs text-red-600">{cvrFejl}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Håndværkerens e-mail</label>
                <input
                  type="email"
                  value={inviterEmail}
                  onChange={e => setInviterEmail(e.target.value)}
                  placeholder="thomas@tmbyg.dk"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-2">Eller kopiér link og send det selv</p>
                <div className="flex gap-2">
                  <input readOnly value={invitationslink} className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-500 truncate" />
                  <button
                    onClick={kopierLink}
                    className="flex-shrink-0 text-xs font-semibold text-[#1e3a2a] border border-[#1e3a2a]/20 bg-[#1e3a2a]/5 hover:bg-[#1e3a2a]/10 px-3 py-2 rounded-lg transition-colors"
                  >
                    {kopieret ? "Kopieret ✓" : "Kopiér"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setVisInviter(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
                  Luk
                </button>
                <button
                  onClick={sendInvitation}
                  disabled={sender || !inviterEmail.trim()}
                  className="flex-1 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                >
                  {sender ? "Sender..." : "Send invitation"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">

          {/* Kontraktindhold */}
          <div className="lg:col-span-2 space-y-4">

            {/* Projekttitel */}
            {(["titel", "total_pris", "startdato", "slutdato", "vilkaar"] as const).map((felt) => {
              const vaerdi = felt === "total_pris"
                ? (kontrakt.total_pris ? fmtKr(kontrakt.total_pris) : null)
                : (felt === "startdato" || felt === "slutdato")
                ? (kontrakt[felt] ? new Date(kontrakt[felt]!).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" }) : null)
                : kontrakt[felt as keyof Kontrakt] as string | null;

              const afventendeFeltForslag = kontrakt.kontraktaendringer.filter(
                a => a.felt === felt && a.status === "afventer"
              );
              const erAktiv = redigererFelt === felt;
              const harForslag = afventendeFeltForslag.length > 0;
              const erLaast = felt === "vilkaar";
              // total_pris: bygherre kan ikke redigere efter invitation (contractor udfylder)
              // startdato/slutdato: bygherre kan redigere indtil begge godkender
              // titel: bygherre kan redigere indtil contractor godkender
              const erRedigerbar = !erBeggeGodkendt && !erAktiv && !erLaast && (
                felt === "total_pris"
                  ? !kontrakt.haandvaerker_email
                  : !haandvaerkerGodkendt
              );

              return (
                <div key={felt} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${harForslag ? "border-amber-200" : "border-gray-100"}`}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{feltLabels[felt]}</p>
                        {erLaast && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e3a2a] bg-[#1e3a2a]/8 px-1.5 py-0.5 rounded">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Låst · AB-Forbruger 2012
                          </span>
                        )}
                      </div>
                      {erRedigerbar && (
                        <button
                          onClick={() => {
                            setRedigererFelt(felt);
                            setFeltVaerdi(vaerdi ? String(vaerdi).replace(" kr.", "").replace(/\./g, "").replace(",", ".") : "");
                          }}
                          className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors"
                        >
                          Rediger
                        </button>
                      )}
                    </div>
                    {erAktiv ? (
                      <div>
                        {felt === "total_pris" ? (
                          <input type="number" value={feltVaerdi} onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        ) : (felt === "startdato" || felt === "slutdato") ? (
                          <input type="date" value={feltVaerdi} onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        ) : (
                          <textarea rows={3} value={feltVaerdi} onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none" />
                        )}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setRedigererFelt(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                          <button onClick={() => gemFeltOpdatering(felt)} disabled={gemmer} className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400">
                            {gemmer ? "Gemmer..." : "Gem"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {vaerdi || (
                          <span className="text-gray-400 italic">
                            {felt === "total_pris"
                              ? "Udfyldes af entreprenøren"
                              : felt === "startdato" || felt === "slutdato"
                              ? "Afventer afklaring med entreprenøren"
                              : "Ikke udfyldt"}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {afventendeFeltForslag.map(a => (
                    <div key={a.id} className="border-t border-amber-100 bg-amber-50 px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                          {a.forfatter_navn || "Håndværker"} foreslår
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(a.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Original</p>
                          <p className="text-sm text-gray-500 line-through leading-relaxed">{a.gammel_vaerdi || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">Forslag</p>
                          <p className="text-sm text-green-800 font-medium leading-relaxed">{a.ny_vaerdi}</p>
                        </div>
                      </div>
                      {a.kommentar && <p className="text-xs text-amber-700 italic mb-3">&ldquo;{a.kommentar}&rdquo;</p>}
                      <div className="flex gap-2">
                        <button onClick={() => besvarForslag(a.id, "accepteret")} className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Acceptér ændring</button>
                        <button onClick={() => besvarForslag(a.id, "afvist")} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Afvis</button>
                      </div>
                    </div>
                  ))}
                  {kontrakt.kontraktaendringer.filter(a => a.felt === felt && a.status !== "afventer").map(a => (
                    <div key={a.id} className="border-t border-gray-100 px-5 py-2.5 flex items-center gap-2 bg-gray-50">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${a.status === "accepteret" ? "bg-green-100" : "bg-red-100"}`}>
                        {a.status === "accepteret"
                          ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      </div>
                      <p className="text-xs text-gray-400">Forslag fra {a.forfatter_navn || a.forfatter} {a.status === "accepteret" ? "accepteret" : "afvist"}</p>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Arbejdets omfang — vises som professionelt dokument */}
            {(() => {
              const beskrivelse = kontrakt.beskrivelse;
              const erAktiv = redigererFelt === "beskrivelse";
              const afventende = kontrakt.kontraktaendringer.filter(a => a.felt === "beskrivelse" && a.status === "afventer");

              // Splitter i header og body til redigering
              const linjer = (beskrivelse || "").split("\n");
              const bodyStart = linjer.findIndex(l => /^\d+\.\s+[A-ZÆØÅ]/.test(l.trim()) && l.trim().length > 3);
              const beskrivelseBody = bodyStart === -1 ? (beskrivelse || "") : linjer.slice(bodyStart).join("\n");
              const beskrivelseHeader = bodyStart === -1 ? "" : linjer.slice(0, bodyStart).join("\n");

              return (
                <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${afventende.length > 0 ? "border-amber-200" : "border-gray-100"}`}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Arbejdets omfang</p>
                      {!erBeggeGodkendt && !erAktiv && !kontrakt.haandvaerker_email && (
                        <button
                          onClick={() => { setRedigererFelt("beskrivelse"); setFeltVaerdi(beskrivelseBody); }}
                          className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors"
                        >
                          Rediger
                        </button>
                      )}
                    </div>

                    {erAktiv ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
                          Du redigerer indholdet fra og med afsnit 1. Overskrift og bygherre-oplysninger opdateres ikke her.
                        </p>
                        <textarea
                          rows={Math.max(20, beskrivelseBody.split("\n").length + 2)}
                          value={feltVaerdi}
                          onChange={e => setFeltVaerdi(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 leading-relaxed focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setRedigererFelt(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                          <button
                            onClick={async () => {
                              const nyBeskrivelse = beskrivelseHeader ? beskrivelseHeader + "\n" + feltVaerdi : feltVaerdi;
                              setGemmer(true);
                              try {
                                const r = await fetch("/api/kontrakt", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ kontrakt_id: kontrakt.id, beskrivelse: nyBeskrivelse }),
                                });
                                const data = await r.json();
                                if (!data.error) setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
                              } finally {
                                setGemmer(false);
                                setRedigererFelt(null);
                              }
                            }}
                            disabled={gemmer}
                            className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {gemmer ? "Gemmer..." : "Gem"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <DokumentRenderer
                        tekst={beskrivelse || undefined}
                        titel={kontrakt.titel || undefined}
                        bygherreNavn={brugerNavn}
                        totalPris={kontrakt.total_pris}
                        startdato={kontrakt.startdato}
                        slutdato={kontrakt.slutdato}
                        betalingsplan={kontrakt.betalingsplan}
                        forudsaetninger={kontrakt.forudsaetninger}
                        tidsplan={kontrakt.tidsplan}
                        vilkaar={kontrakt.vilkaar}
                        haandvaerkerNavn={kontrakt.haandvaerker_navn}
                        haandvaerkerFirma={kontrakt.haandvaerker_firma}
                      />
                    )}
                  </div>

                  {afventende.map(a => (
                    <div key={a.id} className="border-t border-amber-100 bg-amber-50 px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                          {a.forfatter_navn || "Håndværker"} foreslår ændring
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => besvarForslag(a.id, "accepteret")} className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Acceptér ændring</button>
                        <button onClick={() => besvarForslag(a.id, "afvist")} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Afvis</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Forudsætninger fra entreprenøren — vises i kontrakten som forslag */}
            {kontrakt.forudsaetninger_sendt_at && (
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!kontrakt.forudsaetninger_godkendt ? "border-amber-200" : "border-gray-100"}`}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Forudsætninger</p>
                    {kontrakt.forudsaetninger_godkendt && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Godkendt</span>
                    )}
                  </div>
                  {kontrakt.forudsaetninger_godkendt ? (
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{kontrakt.forudsaetninger}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Afventer din godkendelse herunder</p>
                  )}
                </div>

                {!kontrakt.forudsaetninger_godkendt && !erBeggeGodkendt && (
                  <div className="border-t border-amber-100 bg-amber-50 px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                        {kontrakt.haandvaerker_navn || "Entreprenøren"} har tilføjet forudsætninger
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">{kontrakt.forudsaetninger}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={godkendForudsaetninger}
                        disabled={godkenderForudsaetninger}
                        className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {godkenderForudsaetninger ? "Godkender..." : "Acceptér og tilføj til aftalen"}
                      </button>
                      <button
                        onClick={async () => {
                          if (!kontrakt || typeof kontrakt !== "object") return;
                          await fetch("/api/kontrakt", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ kontrakt_id: kontrakt.id, afvis_forudsaetninger: true }),
                          });
                          setKontrakt(prev => prev && typeof prev === "object"
                            ? { ...prev, forudsaetninger: null, forudsaetninger_sendt_at: null, forudsaetninger_godkendt: null }
                            : prev);
                        }}
                        className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Afvis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Betalingsplan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Betalingsplan</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0
                        ? "Milepælsplan jf. AB-Forbruger § 26"
                        : "Betaling ved aflevering jf. AB-Forbruger § 25"}
                    </p>
                  </div>
                  {!erBeggeGodkendt && !redigererBetalingsplan && !kontrakt.haandvaerker_email && (
                    <button
                      onClick={() => {
                        setBetalingsplanRækker(
                          kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0
                            ? [...kontrakt.betalingsplan]
                            : [{ milepæl: "", andel: "" }]
                        );
                        setRedigererBetalingsplan(true);
                      }}
                      className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors flex-shrink-0"
                    >
                      {kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0 ? "Rediger" : "Aftal milepælsplan"}
                    </button>
                  )}
                </div>

                {redigererBetalingsplan ? (
                  <div>
                    <div className="space-y-2 mb-3">
                      {betalingsplanRækker.map((r, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            placeholder="Milepæl (fx Opstart)"
                            value={r.milepæl}
                            onChange={e => {
                              const ny = [...betalingsplanRækker];
                              ny[i] = { ...ny[i], milepæl: e.target.value };
                              setBetalingsplanRækker(ny);
                            }}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                          />
                          <input
                            placeholder="%"
                            value={r.andel}
                            onChange={e => {
                              const ny = [...betalingsplanRækker];
                              ny[i] = { ...ny[i], andel: e.target.value };
                              setBetalingsplanRækker(ny);
                            }}
                            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                          />
                          <button
                            onClick={() => setBetalingsplanRækker(prev => prev.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-400 transition-colors p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setBetalingsplanRækker(prev => [...prev, { milepæl: "", andel: "" }])}
                      className="text-xs text-[#1e3a2a] font-semibold hover:underline mb-4 block"
                    >
                      + Tilføj milepæl
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setRedigererBetalingsplan(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                      <button onClick={gemBetalingsplan} disabled={gemmer} className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400">
                        {gemmer ? "Gemmer..." : "Gem"}
                      </button>
                    </div>
                  </div>
                ) : kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0 ? (
                  <div className="space-y-1">
                    {kontrakt.betalingsplan.map((b, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <p className="text-sm text-gray-700">{b.milepæl}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {b.andel}
                          {kontrakt.total_pris && !isNaN(parseFloat(b.andel))
                            ? ` · ${fmtKr(kontrakt.total_pris * (parseFloat(b.andel) / 100))}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Betaling ved aflevering</p>
                      <p className="text-xs text-gray-400 mt-0.5">Standardvilkår jf. § 25. Klik &ldquo;Aftal milepælsplan&rdquo; for at oprette en alternativ betalingsplan</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Tidsplan */}
            {(() => {
              const tp = kontrakt.tidsplan;
              const fmtDatoKort = (iso: string) =>
                new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

              if (!tp) {
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aftalte datoer</p>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">AB-Forbruger § 12</span>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Afventer bekræftelse fra entreprenøren</p>
                        <p className="text-xs text-gray-400 mt-0.5">Entreprenøren skal bekræfte eller foreslå andre start- og slutdatoer</p>
                      </div>
                    </div>
                  </div>
                );
              }

              const godkendt = tp.godkendt_af_bygherre;

              // Tjek om entreprenøren har foreslået andre datoer end bygherre ønskede
              const fase = tp.faser?.[0];
              const entStartdato = fase?.startdato ?? null;
              const entSlutdato = fase?.slutdato ?? null;
              const bygStartdato = kontrakt.startdato;
              const bygSlutdato = kontrakt.slutdato;
              const startAendret = entStartdato && bygStartdato && entStartdato !== bygStartdato;
              const slutAendret = entSlutdato && bygSlutdato && entSlutdato !== bygSlutdato;
              const harAendringer = startAendret || slutAendret;
              const harBemaerkning = fase?.navn && fase.navn !== "Aftalt periode" && fase.navn !== "Foreslået af entreprenør";

              return (
                <div className={`rounded-2xl overflow-hidden border shadow-sm ${godkendt ? "border-green-100" : harAendringer ? "border-[#1e3a2a]/30" : "border-amber-200"}`}>
                  {/* Header */}
                  <div className="px-5 py-4 flex items-center justify-between bg-[#111c17]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 12</p>
                        <p className="text-sm font-bold text-white">
                          {tp.type === "ingen_tidsplan"
                            ? "Ingen fast dato — entreprenøren fraviger § 12"
                            : harAendringer
                              ? "Entreprenøren foreslår andre datoer"
                              : "Datoer bekræftet af entreprenøren"}
                        </p>
                      </div>
                    </div>
                    {godkendt ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/20">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Godkendt
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
                        Afventer din godkendelse
                      </span>
                    )}
                  </div>

                  <div className="bg-white px-5 py-4">
                    {tp.type === "ingen_tidsplan" ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                        <p className="text-xs font-bold text-amber-800 mb-1">Fravigelse af AB-Forbruger § 12</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Entreprenøren ønsker at arbejde uden en aftalt afleveringsdato. Godkend kun hvis I har aftalt dette.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {/* Startdato */}
                        <div className={`rounded-xl px-4 py-3 border ${startAendret && !godkendt ? "bg-[#f0f7f3] border-[#1e3a2a]/20" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opstart</p>
                            {startAendret && !godkendt && (
                              <span className="text-[10px] font-bold text-[#1e3a2a] bg-[#1e3a2a]/10 px-2 py-0.5 rounded-full">Ændret</span>
                            )}
                          </div>
                          {startAendret && !godkendt ? (
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 line-through">{bygStartdato ? fmtDatoKort(bygStartdato) : "—"}</span>
                                <span className="text-xs text-gray-400">Din ønskede dato</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#1e3a2a]">{entStartdato ? fmtDatoKort(entStartdato) : "—"}</span>
                                <span className="text-xs font-semibold text-[#1e3a2a]/70">Entreprenørens forslag</span>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-sm font-bold mt-1 ${godkendt ? "text-green-700" : "text-gray-900"}`}>
                              {entStartdato ? fmtDatoKort(entStartdato) : (bygStartdato ? fmtDatoKort(bygStartdato) : "—")}
                            </p>
                          )}
                        </div>

                        {/* Slutdato / aflevering */}
                        <div className={`rounded-xl px-4 py-3 border ${slutAendret && !godkendt ? "bg-[#f0f7f3] border-[#1e3a2a]/20" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aflevering</p>
                            {slutAendret && !godkendt && (
                              <span className="text-[10px] font-bold text-[#1e3a2a] bg-[#1e3a2a]/10 px-2 py-0.5 rounded-full">Ændret</span>
                            )}
                          </div>
                          {slutAendret && !godkendt ? (
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 line-through">{bygSlutdato ? fmtDatoKort(bygSlutdato) : "—"}</span>
                                <span className="text-xs text-gray-400">Din ønskede dato</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#1e3a2a]">{entSlutdato ? fmtDatoKort(entSlutdato) : "—"}</span>
                                <span className="text-xs font-semibold text-[#1e3a2a]/70">Entreprenørens forslag</span>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-sm font-bold mt-1 ${godkendt ? "text-green-700" : "text-gray-900"}`}>
                              {entSlutdato ? fmtDatoKort(entSlutdato) : (bygSlutdato ? fmtDatoKort(bygSlutdato) : "—")}
                            </p>
                          )}
                        </div>

                        {/* Bemærkning fra entreprenøren */}
                        {harBemaerkning && !godkendt && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Bemærkning fra entreprenøren</p>
                            <p className="text-sm text-blue-900 leading-relaxed">{fase!.navn}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!godkendt && !erBeggeGodkendt && (
                      <button
                        onClick={godkendTidsplan}
                        disabled={godkenderTidsplan}
                        className="w-full py-2.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {godkenderTidsplan ? (
                          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Godkender...</>
                        ) : harAendringer ? (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Godkend entreprenørens datoer</>
                        ) : (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Godkend datoerne</>
                        )}
                      </button>
                    )}

                    {godkendt && tp.godkendt_at && (
                      <p className="text-xs text-green-600 text-center">
                        Godkendt {new Date(tp.godkendt_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Godkendelsesstatus</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bygherreGodkendt ? "bg-green-100" : "bg-gray-100"}`}>
                    {bygherreGodkendt
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{brugerNavn || "Bygherre"}</p>
                    <p className="text-xs text-gray-400">{bygherreGodkendt ? "Godkendt" : "Afventer din godkendelse"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${haandvaerkerGodkendt ? "bg-green-100" : "bg-gray-100"}`}>
                    {haandvaerkerGodkendt
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{kontrakt.haandvaerker_navn || "Håndværker"}</p>
                    <p className="text-xs text-gray-400">
                      {haandvaerkerGodkendt
                        ? "Godkendt"
                        : kontrakt.haandvaerker_email
                        ? `Inviteret · ${kontrakt.haandvaerker_email}`
                        : "Ikke inviteret endnu"}
                    </p>
                  </div>
                </div>
              </div>

              {erBeggeGodkendt ? (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm font-bold text-gray-900">Kontrakt underskrevet</p>
                  <p className="text-xs text-gray-400 mt-1">Begge parter har godkendt</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={godkendKontrakt}
                    disabled={godkender || bygherreGodkendt || !haandvaerkerGodkendt}
                    className={`w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      bygherreGodkendt
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : !haandvaerkerGodkendt
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#1e3a2a] text-white hover:opacity-90"
                    }`}
                  >
                    {godkender ? "Godkender..." : bygherreGodkendt ? "Du har accepteret" : !haandvaerkerGodkendt ? "Afventer tilbud fra entreprenøren" : "Acceptér tilbud og indgå aftale"}
                  </button>
                  {godkendFejl && (
                    <p className="mt-2 text-xs text-red-600 text-center leading-snug">{godkendFejl}</p>
                  )}
                </>
              )}
            </div>

            {/* Tilbudsdokument fra entreprenor */}
            {kontrakt.tilbud_dokument_url && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Tilbud fra entreprenoren</h3>
                <div className="flex items-center justify-between bg-[#f5f3ee] rounded-xl px-4 py-3 border border-gray-200 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2" className="flex-shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <a href={kontrakt.tilbud_dokument_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#1e3a2a] truncate hover:underline">
                      {kontrakt.tilbud_dokument_navn || "Tilbudsdokument"}
                    </a>
                  </div>
                  <a href={kontrakt.tilbud_dokument_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#1e3a2a] ml-3 hover:underline flex-shrink-0">
                    Abn
                  </a>
                </div>
                <button
                  onClick={sletTilbudsDokument}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Slet dokument (GDPR)
                </button>
              </div>
            )}

            {/* Status-banner hvis haandvaerker har sendt tilbud men bygherre ikke godkendt endnu */}
            {haandvaerkerGodkendt && !bygherreGodkendt && !erBeggeGodkendt && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Tilbud modtaget</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      {kontrakt.haandvaerker_navn || "Entreprenoren"} har sendt sit tilbud. Gennemse det og godkend kontrakten nedenfor naar du er klar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AB-Forbruger */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#1e3a2a] text-white text-[10px] font-bold px-2 py-0.5 rounded">AB-Forbruger</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Alle ændringer i kontrakten dokumenteres med tidsstempel og forfatter. Det er din juridiske dokumentation hvis der opstår uenighed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
