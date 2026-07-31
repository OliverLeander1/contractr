"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import DokumentRenderer from "@/components/DokumentRenderer";

function ManuelPris({ token, onGemt }: { token: string; onGemt: (pris: number) => void }) {
  const [prisInput, setPrisInput] = useState("");
  const [gemmer, setGemmer] = useState(false);
  const [vis, setVis] = useState(false);

  // Formatér heltalsdel med punktum som tusindtalsseparator, bevar komma+decimaler
  function formatMedPunktum(raw: string): string {
    // Opdel på komma
    const [heltals, decimaler] = raw.split(",");
    // Fjern eksisterende punktummer fra heltalsdelen, tilføj ny formatering
    const renHeltals = heltals.replace(/\./g, "");
    const formateret = renHeltals.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decimaler !== undefined ? formateret + "," + decimaler : formateret;
  }

  function handlePrisInput(raw: string) {
    // Tillad kun tal, ét komma og punktum
    const renset = raw.replace(/[^0-9.,]/g, "");
    // Max ét komma
    const dele = renset.split(",");
    const normaliseret = dele.length > 2 ? dele[0] + "," + dele.slice(1).join("") : renset;
    setPrisInput(formatMedPunktum(normaliseret));
  }

  // Konvertér dansk format (1.234,56) til tal
  function parseDanskPris(s: string): number | null {
    const normaliseret = s.replace(/\./g, "").replace(",", ".");
    const tal = parseFloat(normaliseret);
    return isNaN(tal) ? null : tal;
  }

  async function gem() {
    const pris = parseDanskPris(prisInput);
    if (!pris || pris <= 0) return;
    setGemmer(true);
    const res = await fetch(`/api/kontrakt/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_pris: pris }),
    });
    if (res.ok) onGemt(pris);
    setGemmer(false);
  }

  if (!vis) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button onClick={() => setVis(true)} className="flex items-center gap-2 text-sm font-semibold text-[#1a5c38] hover:underline">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Intet dokument — indtast pris manuelt
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Manuel prisindtastning</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={prisInput}
            onChange={e => handlePrisInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && gem()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#1e3a2a] pr-20"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kr. inkl. moms</span>
        </div>
        <button
          onClick={gem}
          disabled={gemmer || !prisInput.trim()}
          className="px-4 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {gemmer ? "..." : "Gem"}
        </button>
        <button onClick={() => { setVis(false); setPrisInput(""); }} className="px-3 py-3 border border-gray-200 rounded-xl text-gray-500 text-sm hover:bg-gray-50">
          ✕
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">Brug punktum til tusindtal og komma til decimaler. Fx: 125.000 eller 87.500,50</p>
    </div>
  );
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
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  haandvaerker_email: string | null;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  status: string;
  tidsplan: Tidsplan | null;
  tilbud_dokument_url: string | null;
  tilbud_dokument_navn: string | null;
  besigtigelse_dato: string | null;
  besigtigelse_tid: string | null;
  besigtigelse_bekraeftet: boolean | null;
  forudsaetninger: string | null;
  forudsaetninger_sendt_at: string | null;
  forudsaetninger_godkendt: boolean | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

const fmtDatoKort = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

export default function HaandvaerkerAftaleSide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [kontrakt, setKontrakt] = useState<Kontrakt | null>(null);
  const [indlæser, setIndlæser] = useState(true);
  const [fejl, setFejl]         = useState<string | null>(null);
  const [godkender, setGodkender] = useState(false);
  const [godkendt, setGodkendt]   = useState(false);

  const [visNavnModal, setVisNavnModal] = useState(false);
  const [navn, setNavn]   = useState("");
  const [firma, setFirma] = useState("");
  const [godkendFejl, setGodkendFejl] = useState("");

  // Besigtigelse
  const [besigtigelseDato, setBesigtigelseDato] = useState("");
  const [besigtigelseTid, setBesigtigelseTid] = useState("");
  const [gemmerBesigtigelse, setGemmerBesigtigelse] = useState(false);

  // Forudsætninger
  const [forudsaetningerTekst, setForudsaetningerTekst] = useState("");
  const [redigererForudsaetninger, setRedigererForudsaetninger] = useState(false);
  const [gemmerForudsaetninger, setGemmerForudsaetninger] = useState(false);
  const [springetOver, setSpringetOver] = useState(false);

  // Tilbudsdokument upload
  const [uploader, setUploader] = useState(false);
  const [uploadFejl, setUploadFejl] = useState<string | null>(null);
  const [foreslaaetPris, setForeslaaetPris] = useState<number | null>(null);
  const [prisGodkendt, setPrisGodkendt] = useState(false);
  const [sletter, setSletter] = useState(false);

  // Auth
  const [loggetInd, setLoggetInd] = useState(false);
  const [brugerEmail, setBrugerEmail] = useState<string | null>(null);

  // Magic link flow
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [senderMagicLink, setSenderMagicLink] = useState(false);
  const [magicLinkSendt, setMagicLinkSendt] = useState(false);
  const [magicLinkFejl, setMagicLinkFejl] = useState<string | null>(null);

  // Startdato / slutdato

  const [visTidsplanEditor, setVisTidsplanEditor] = useState(false);
  const [datoValg, setDatoValg] = useState<"godkend" | "revider" | "ingen">("godkend");
  const [revStartdato, setRevStartdato] = useState("");
  const [revSlutdato, setRevSlutdato] = useState("");
  const [revBemaerkning, setRevBemaerkning] = useState("");
  const [gemmerTidsplan, setGemmerTidsplan] = useState(false);
  const [tidsplanGemt, setTidsplanGemt] = useState(false);

  useEffect(() => {
    const hent = async () => {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const [res, { data: { user } }] = await Promise.all([
        fetch(`/api/kontrakt/${token}`),
        supabase.auth.getUser(),
      ]);
      if (user) {
        setLoggetInd(true);
        setBrugerEmail(user.email ?? null);
        // Hent navn og firma fra brugerens profil
        const { data: profil } = await supabase.from("profiler").select("navn, firma").eq("id", user.id).single();
        if (profil?.navn) setNavn(profil.navn);
        if (profil?.firma) setFirma(profil.firma);
        if (!profil?.navn && user.user_metadata?.navn) setNavn(user.user_metadata.navn);
        if (!profil?.firma && user.user_metadata?.firma) setFirma(user.user_metadata.firma);
      }
      if (!res.ok) { setFejl("Aftalegrundlaget blev ikke fundet. Tjek at linket er korrekt."); setIndlæser(false); return; }
      const data = await res.json();
      setKontrakt(data);
      // Brug evt. allerede gemt navn/firma på kontrakten som fallback
      if (data.haandvaerker_navn) setNavn(prev => prev || data.haandvaerker_navn);
      if (data.haandvaerker_firma) setFirma(prev => prev || data.haandvaerker_firma);
      if (data.haandvaerker_email) setMagicLinkEmail(data.haandvaerker_email);
      if (data.haandvaerker_godkendt_at) setGodkendt(true);
      if (data.tidsplan) setTidsplanGemt(true);
      if (data.besigtigelse_dato) setBesigtigelseDato(data.besigtigelse_dato);
      if (data.besigtigelse_tid) setBesigtigelseTid(data.besigtigelse_tid);
      if (data.forudsaetninger) setForudsaetningerTekst(data.forudsaetninger);
      if (data.forudsaetninger_godkendt || !data.forudsaetninger) setSpringetOver(false);
      setIndlæser(false);
    };
    hent();
  }, [token]);

  async function godkend() {
    if (godkender) return;
    if (!navn.trim()) { setGodkendFejl("Skriv dit fulde navn inden du sender."); return; }
    setGodkendFejl("");
    setGodkender(true);
    const res = await fetch(`/api/kontrakt/${token}/godkend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forfatter: "haandvaerker", haandvaerker_navn: navn.trim(), haandvaerker_firma: firma.trim() || null }),
    });
    if (res.ok) {
      setGodkendt(true);
      setVisNavnModal(false);
      setKontrakt(prev => prev ? { ...prev, haandvaerker_godkendt_at: new Date().toISOString(), haandvaerker_navn: navn.trim() } : prev);
    } else {
      const body = await res.json().catch(() => ({}));
      setGodkendFejl(body.error === "Entreprisesum skal være udfyldt inden godkendelse"
        ? "Du skal udfylde entreprisesummen inden du sender tilbuddet."
        : body.error || "Noget gik galt. Prøv igen.");
    }
    setGodkender(false);
  }

  async function gemTidsplan() {
    if (gemmerTidsplan) return;
    if (datoValg === "revider" && (!revStartdato || !revSlutdato)) return;
    setGemmerTidsplan(true);

    let payload: Tidsplan;
    if (datoValg === "ingen") {
      payload = { type: "ingen_tidsplan", godkendt_af_bygherre: false };
    } else if (datoValg === "godkend") {
      payload = {
        type: "faser",
        faser: [{ navn: revBemaerkning.trim() || "Aftalt periode", startdato: kontrakt!.startdato ?? revStartdato, slutdato: kontrakt!.slutdato ?? revSlutdato }],
        godkendt_af_bygherre: false,
      };
    } else {
      payload = {
        type: "faser",
        faser: [{ navn: revBemaerkning.trim() || "Foreslået af entreprenør", startdato: revStartdato, slutdato: revSlutdato }],
        godkendt_af_bygherre: false,
      };
    }

    const res = await fetch(`/api/kontrakt/${token}/tidsplan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tidsplan: payload }),
    });
    if (res.ok) {
      const data = await res.json();
      setKontrakt(data);
      setTidsplanGemt(true);
      setVisTidsplanEditor(false);
    }
    setGemmerTidsplan(false);
  }

  async function sendForudsaetninger() {
    if (gemmerForudsaetninger) return;
    setGemmerForudsaetninger(true);
    const res = await fetch(`/api/kontrakt/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        forudsaetninger: forudsaetningerTekst.trim(),
        forudsaetninger_sendt_at: new Date().toISOString(),
        forudsaetninger_godkendt: false,
      }),
    });
    const data = await res.json();
    setKontrakt(prev => prev ? { ...prev, ...data } : prev);
    setRedigererForudsaetninger(false);
    setGemmerForudsaetninger(false);
  }

  async function sendMagicLink() {
    if (!magicLinkEmail.trim() || senderMagicLink) return;
    setMagicLinkFejl(null);
    setSenderMagicLink(true);
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/kontrakt/${token}/aftale`)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: magicLinkEmail.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    if (error) {
      setMagicLinkFejl("Noget gik galt. Prøv igen eller kontakt os.");
    } else {
      setMagicLinkSendt(true);
    }
    setSenderMagicLink(false);
  }

  async function gemBesigtigelse(bekraeftet: boolean, dato: string, tid: string) {
    setGemmerBesigtigelse(true);
    await fetch(`/api/kontrakt/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ besigtigelse_bekraeftet: bekraeftet, besigtigelse_dato: dato || null, besigtigelse_tid: tid || null }),
    });
    setKontrakt(prev => prev ? { ...prev, besigtigelse_bekraeftet: bekraeftet, besigtigelse_dato: dato || null, besigtigelse_tid: tid || null } : prev);
    setGemmerBesigtigelse(false);
  }

  async function uploadTilbud(fil: File) {
    setUploader(true);
    setUploadFejl(null);
    setForeslaaetPris(null);
    setPrisGodkendt(false);
    const fd = new FormData();
    fd.append("fil", fil);
    const res = await fetch(`/api/kontrakt/${token}/tilbud-upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setUploadFejl(data.error || "Upload fejlede");
    } else {
      setKontrakt(prev => prev ? {
        ...prev,
        tilbud_dokument_url: data.dokumentUrl,
        tilbud_dokument_navn: data.filNavn,
      } : prev);
      if (data.udtrukketPris) setForeslaaetPris(data.udtrukketPris);
    }
    setUploader(false);
  }

  async function godkendPris(pris: number) {
    await fetch(`/api/kontrakt/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_pris: pris }),
    });
    setKontrakt(prev => prev ? { ...prev, total_pris: pris } : prev);
    setForeslaaetPris(null);
    setPrisGodkendt(true);
  }

  async function sletTilbudsDokument() {
    setSletter(true);
    await fetch(`/api/kontrakt/${token}/tilbud-slet`, { method: "DELETE" });
    setKontrakt(prev => prev ? { ...prev, tilbud_dokument_url: null, tilbud_dokument_navn: null } : prev);
    setForeslaaetPris(null);
    setPrisGodkendt(false);
    setSletter(false);
  }

  if (indlæser) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
    </div>
  );

  if (fejl || !kontrakt) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="font-bold text-gray-900 mb-2">Siden blev ikke fundet</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{fejl ?? "Linket er ugyldigt eller udløbet."}</p>
        <Link href="/" className="inline-block mt-6 text-sm font-semibold text-[#1e3a2a] hover:underline">← Gå til forsiden</Link>
      </div>
    </div>
  );

  const beggeGodkendt = !!(kontrakt.bygherre_godkendt_at && kontrakt.haandvaerker_godkendt_at);
  const harAdgang = loggetInd && brugerEmail != null &&
    (kontrakt.haandvaerker_email == null || brugerEmail.toLowerCase() === kontrakt.haandvaerker_email.toLowerCase());
  const tidsplan = kontrakt.tidsplan;
  const tidsplanGodkendt = tidsplan?.godkendt_af_bygherre === true;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1e3a2a] rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "2px" }} className="text-sm sm:text-base text-gray-900">nembyggestyring</span>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/haandvaerker/sager" className="hidden sm:block text-sm text-gray-500 hover:text-[#1e3a2a] transition-colors flex-shrink-0">← Mine sager</Link>
            <span className="text-xs bg-[#1e3a2a]/10 text-[#1e3a2a] font-semibold px-2.5 sm:px-3 py-1 rounded-full truncate">Aftalegrundlag</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Status-banner */}
        {beggeGodkendt ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="font-bold text-green-800">Aftalegrundlaget er godkendt af begge parter</p>
              <p className="text-sm text-green-700/70 mt-0.5">Aftalen er juridisk bindende. Begge parters godkendelse er logget med tidsstempel.</p>
            </div>
          </div>
        ) : godkendt ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="font-bold text-blue-800">Dit tilbud er sendt til bygherre</p>
              <p className="text-sm text-blue-700/70 mt-0.5">Bygherre gennemser nu tilbuddet og vender tilbage med en beslutning.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-amber-800">Afventer din gennemgang</p>
              <p className="text-sm text-amber-700/70 mt-0.5">Gennemgå aftalegrundlaget og udfyld tidsplan inden du godkender.</p>
            </div>
          </div>
        )}

        {/* Aftalegrundlag — samme dokumentlayout som ved oprettelse */}
        <div className="mb-5">
          {(kontrakt.beskrivelse || kontrakt.total_pris || kontrakt.startdato || kontrakt.slutdato) ? (
            <DokumentRenderer
              tekst={kontrakt.beskrivelse || undefined}
              titel={kontrakt.titel || undefined}
              totalPris={kontrakt.total_pris}
              startdato={kontrakt.startdato}
              slutdato={kontrakt.slutdato}
              betalingsplan={kontrakt.betalingsplan as { milepæl: string; andel: string }[] | null}
              forudsaetninger={kontrakt.forudsaetninger}
              tidsplan={kontrakt.tidsplan}
              vilkaar={kontrakt.vilkaar}
              haandvaerkerNavn={kontrakt.haandvaerker_navn}
              haandvaerkerFirma={kontrakt.haandvaerker_firma}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <p className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest mb-1">Aftalegrundlag</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{kontrakt.titel ?? "Byggeprojekt"}</h1>
              {kontrakt.total_pris && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <p className="text-sm text-gray-500">Entreprisesum</p>
                  <p className="text-sm font-bold text-gray-900">{fmtKr(kontrakt.total_pris)} inkl. moms</p>
                </div>
              )}
              {kontrakt.startdato && (
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <p className="text-sm text-gray-500">Opstart</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDato(kontrakt.startdato)}</p>
                </div>
              )}
              {kontrakt.slutdato && (
                <div className="flex justify-between items-center py-2.5">
                  <p className="text-sm text-gray-500">Aflevering</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDato(kontrakt.slutdato)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Login-gate: magic link-flow */}
        {!godkendt && !harAdgang && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">

            {/* Forkert konto-advarsel */}
            {loggetInd && brugerEmail && (
              <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-3">
                <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Du er logget ind som <strong>{brugerEmail}</strong>. Dette link er sendt til <strong>{kontrakt.haandvaerker_email}</strong> — log ind med den rette konto for at redigere.
                </p>
              </div>
            )}

            <div className="p-6">
              {magicLinkSendt ? (
                /* Sendt-tilstand */
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                      <path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-1">Link sendt</p>
                  <p className="text-sm text-gray-500 leading-relaxed mb-1">
                    Tjek din indbakke på <strong>{magicLinkEmail}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mb-5">Klik på linket i mailen — du er inde på sekunder. Tjek også spam.</p>
                  <button
                    onClick={() => { setMagicLinkSendt(false); setMagicLinkFejl(null); }}
                    className="text-xs font-semibold text-[#1e3a2a] hover:underline"
                  >
                    Send igen eller ret e-mail
                  </button>
                </div>
              ) : (
                /* Magic link-formular */
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-[#1e3a2a]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Log ind for at svare på aftalegrundlaget</p>
                      <p className="text-xs text-gray-400 mt-0.5">Skriv din e-mail, så sender vi dig et adgangslink. Hvis det er første gang, oprettes din gratis konto automatisk.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Din e-mail</label>
                      <input
                        type="email"
                        value={magicLinkEmail}
                        onChange={e => setMagicLinkEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMagicLink()}
                        placeholder="din@email.dk"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 bg-gray-50"
                      />
                      {kontrakt.haandvaerker_email && magicLinkEmail.toLowerCase() !== kontrakt.haandvaerker_email.toLowerCase() && magicLinkEmail.length > 3 && (
                        <p className="text-xs text-amber-600 font-medium mt-1.5 px-1">
                          Linket er sendt til {kontrakt.haandvaerker_email} — brug den email for at få adgang til denne sag.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={sendMagicLink}
                      disabled={senderMagicLink || !magicLinkEmail.trim()}
                      className="w-full py-3.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {senderMagicLink ? (
                        <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sender...</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send mig et adgangslink</>
                      )}
                    </button>

                    {magicLinkFejl && (
                      <p className="text-xs text-red-600 font-medium px-1">{magicLinkFejl}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 font-medium">eller</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <a
                    href={`/login?next=${encodeURIComponent(`/kontrakt/${token}/aftale`)}`}
                    className="block w-full py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all text-center"
                  >
                    Log ind med adgangskode
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {/* Besigtigelse */}
        {!godkendt && harAdgang && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-[#1e3a2a]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Besigtigelse</p>
                <p className="text-xs text-gray-400">Aftal dato og tidspunkt inden du giver pris</p>
              </div>
            </div>

            {kontrakt.besigtigelse_bekraeftet ? (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-800">Besigtigelse aftalt</p>
                      {(kontrakt.besigtigelse_dato || kontrakt.besigtigelse_tid) && (
                        <p className="text-xs text-green-700 mt-0.5">
                          {kontrakt.besigtigelse_dato && new Date(kontrakt.besigtigelse_dato).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })}
                          {kontrakt.besigtigelse_tid && <span className="ml-2 font-semibold">kl. {kontrakt.besigtigelse_tid}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => gemBesigtigelse(false, "", "")} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">Fortryd</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dato-felt */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dato</label>
                  <input
                    type="date"
                    value={besigtigelseDato}
                    onChange={e => setBesigtigelseDato(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold text-gray-800 focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 bg-gray-50"
                  />
                  {besigtigelseDato && (
                    <p className="text-xs text-[#1e3a2a] font-semibold mt-1.5 px-1">
                      {new Date(besigtigelseDato).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Tidsvalg */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tidspunkt (valgfrit)</label>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                    {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map(tid => (
                      <button
                        key={tid}
                        onClick={() => setBesigtigelseTid(prev => prev === tid ? "" : tid)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          besigtigelseTid === tid
                            ? "bg-[#1e3a2a] text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tid}
                      </button>
                    ))}
                  </div>
                  {besigtigelseTid && (
                    <p className="text-xs text-[#1e3a2a] font-semibold mt-2 px-1">Valgt tidspunkt: kl. {besigtigelseTid}</p>
                  )}
                </div>

                <button
                  onClick={() => gemBesigtigelse(true, besigtigelseDato, besigtigelseTid)}
                  disabled={gemmerBesigtigelse || !besigtigelseDato}
                  className="w-full py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {gemmerBesigtigelse ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Gemmer...</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Bekræft besigtigelse</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Forudsætninger */}
        {!godkendt && harAdgang && (() => {
          const sendt = !!kontrakt.forudsaetninger_sendt_at;
          const godkendtAfBygherre = kontrakt.forudsaetninger_godkendt === true;
          if (springetOver) return null;
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-[#1e3a2a]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Forudsætninger</p>
                  <p className="text-xs text-gray-400">Skriv hvad bygherre skal sørge for inden arbejdet starter</p>
                </div>
              </div>

              {godkendtAfBygherre ? (
                <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <div>
                    <p className="text-sm font-semibold text-green-800 mb-1">Bygherre har godkendt forudsætningerne</p>
                    <p className="text-xs text-green-700/80 whitespace-pre-wrap leading-relaxed">{kontrakt.forudsaetninger}</p>
                  </div>
                </div>
              ) : sendt && !redigererForudsaetninger ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-amber-800 mb-1">Afventer bygherrens godkendelse</p>
                    <p className="text-xs text-amber-700/80 whitespace-pre-wrap leading-relaxed">{kontrakt.forudsaetninger}</p>
                  </div>
                  <button
                    onClick={() => setRedigererForudsaetninger(true)}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Ret forudsætninger
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={forudsaetningerTekst}
                    onChange={e => setForudsaetningerTekst(e.target.value)}
                    placeholder={"Fx: Rummet skal være ryddet for møbler og inventar inden opstart. Gulvvarme skal være slukket mindst 48 timer før."}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={sendForudsaetninger}
                      disabled={gemmerForudsaetninger || !forudsaetningerTekst.trim()}
                      className="flex-1 py-2.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
                    >
                      {gemmerForudsaetninger ? "Sender..." : "Send forudsætninger til bygherre"}
                    </button>
                    <button
                      onClick={() => setSpringetOver(true)}
                      className="px-4 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Spring over
                    </button>
                  </div>
                  {redigererForudsaetninger && (
                    <button
                      onClick={() => setRedigererForudsaetninger(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Annuller redigering
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tilbudsdokument */}
        {!godkendt && harAdgang && (() => {
          const forudsLast = !!(kontrakt.forudsaetninger_sendt_at && !kontrakt.forudsaetninger_godkendt && !springetOver);
          return (
          <div className={`bg-white rounded-2xl border shadow-sm p-6 mb-5 ${forudsLast ? "border-gray-100 opacity-50 pointer-events-none" : "border-gray-100"}`}>
            {forudsLast && (
              <div className="mb-3 flex items-center gap-2 text-xs text-amber-700 font-semibold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Afventer bygherrens godkendelse af forudsætninger
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#1e3a2a]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Upload dit tilbud</p>
                <p className="text-xs text-gray-400">Upload dit tilbud som PDF eller Word. Vi forsøger at finde prisen automatisk.</p>
              </div>
            </div>

            {kontrakt.tilbud_dokument_url ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#f5f3ee] rounded-xl px-4 py-3 border border-gray-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2" className="flex-shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <a href={kontrakt.tilbud_dokument_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#1e3a2a] truncate hover:underline">
                      {kontrakt.tilbud_dokument_navn || "Tilbudsdokument"}
                    </a>
                  </div>
                  <button
                    onClick={sletTilbudsDokument}
                    disabled={sletter}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 ml-3 disabled:opacity-40"
                  >
                    {sletter ? "Sletter..." : "Slet"}
                  </button>
                </div>

                {foreslaaetPris && !prisGodkendt && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
                    <p className="text-xs font-bold text-amber-800 mb-1">Fundet pris i dokumentet</p>
                    <p className="text-2xl font-bold text-amber-900 mb-3">
                      {new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(foreslaaetPris)}
                    </p>
                    <p className="text-xs text-amber-700 mb-3">Er dette den korrekte entreprisesum fra tilbuddet?</p>
                    <div className="flex gap-2">
                      <button onClick={() => godkendPris(foreslaaetPris)}
                        className="flex-1 py-2 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-amber-800 transition-colors">
                        Ja, brug denne pris
                      </button>
                      <button onClick={() => setForeslaaetPris(null)}
                        className="flex-1 py-2 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors">
                        Nej, jeg retter selv
                      </button>
                    </div>
                  </div>
                )}

                {prisGodkendt && (
                  <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Entreprisesum gemt fra tilbudsdokumentet
                  </div>
                )}
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors ${uploader ? "border-[#1e3a2a]/30 bg-[#1e3a2a]/5" : "border-gray-200 hover:border-[#1e3a2a]/40 hover:bg-[#1e3a2a]/3"}`}>
                {uploader ? (
                  <>
                    <div className="w-6 h-6 border-2 border-[#1e3a2a]/30 border-t-[#1e3a2a] rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Behandler dokument og finder pris...</p>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Upload tilbud</p>
                      <p className="text-xs text-gray-400 mt-0.5">PDF eller Word (.docx), maks 10 MB</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={uploader}
                  onChange={e => {
                    const fil = e.target.files?.[0];
                    if (fil) uploadTilbud(fil);
                    e.target.value = "";
                  }}
                />
              </label>
            )}

            {uploadFejl && (
              <p className="mt-3 text-xs text-red-600 font-medium">{uploadFejl}</p>
            )}

            {/* Manuel prisindtastning — alternativ til dokument */}
            {!kontrakt.tilbud_dokument_url && !kontrakt.total_pris && (
              <ManuelPris
                token={token}
                onGemt={(pris) => setKontrakt(prev => prev ? { ...prev, total_pris: pris } : prev)}
              />
            )}

            {kontrakt.total_pris && !kontrakt.tilbud_dokument_url && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Entreprisesum gemt: {new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(kontrakt.total_pris)} inkl. moms
                <button onClick={() => setKontrakt(prev => prev ? { ...prev, total_pris: null } : prev)} className="ml-2 text-xs text-gray-400 hover:text-gray-600 font-normal">Ret</button>
              </div>
            )}
          </div>
          );
        })()}

        {/* ─── TIDSPLAN ─── */}
        <div className="mb-5">
          {tidsplan && !visTidsplanEditor ? (
            /* Bekræftet tidspunkt */
            <div className="bg-[#111c17] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 12</p>
                    <p className="text-base font-bold text-white">
                      {tidsplan.type === "ingen_tidsplan" ? "Ingen fast tidsplan aftalt" : "Tidspunkt bekræftet"}
                    </p>
                  </div>
                </div>
                {tidsplanGodkendt ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/20">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Godkendt af bygherre
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/20">
                    Afventer bygherrens godkendelse
                  </span>
                )}
              </div>

              <div className="px-6 pb-6">
                {tidsplan.type === "ingen_tidsplan" ? (
                  <div className="bg-white/5 rounded-xl px-5 py-4 border border-white/10">
                    <p className="text-sm text-white/70 leading-relaxed">
                      Parterne har aftalt at arbejdet udføres uden en fast tidsplan. Dette udgør en eksplicit fravigelse af AB-Forbruger § 12.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl px-5 py-4 border border-white/10">
                    {tidsplan.faser?.[0] && (
                      <>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Opstart</p>
                            <p className="text-sm font-semibold text-white">{tidsplan.faser[0].startdato ? fmtDatoKort(tidsplan.faser[0].startdato) : "—"}</p>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-30"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Aflevering</p>
                            <p className="text-sm font-semibold text-white">{tidsplan.faser[0].slutdato ? fmtDatoKort(tidsplan.faser[0].slutdato) : "—"}</p>
                          </div>
                        </div>
                        {tidsplan.faser[0].navn && tidsplan.faser[0].navn !== "Aftalt periode" && (
                          <p className="text-xs text-white/50 mt-3 leading-relaxed">{tidsplan.faser[0].navn}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {!godkendt && harAdgang && (
                <div className="px-6 pb-5">
                  <button
                    onClick={() => { setVisTidsplanEditor(true); setTidsplanGemt(false); }}
                    className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
                  >
                    Ret tidspunkt
                  </button>
                </div>
              )}
            </div>
          ) : (visTidsplanEditor || !tidsplan) && harAdgang ? (
            /* Tidsplan-editor — forenklet */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-[#111c17] px-6 py-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 12</p>
                    <p className="text-base font-bold text-white">Bekræft tidspunkt for arbejdet</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mt-2">
                  Bygherre ønsker opstart{kontrakt.startdato && <span className="text-white/80 font-semibold"> {fmtDatoKort(kontrakt.startdato)}</span>} og aflevering{kontrakt.slutdato && <span className="text-white/80 font-semibold"> {fmtDatoKort(kontrakt.slutdato)}</span>}. Bekræft eller foreslå andre datoer.
                </p>
              </div>

              <div className="p-6 space-y-3">
                {/* Valg */}
                <button
                  onClick={() => setDatoValg("godkend")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${datoValg === "godkend" ? "border-[#1a5c38] bg-[#f0f7f3]" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${datoValg === "godkend" ? "border-[#1a5c38]" : "border-gray-300"}`}>
                    {datoValg === "godkend" && <div className="w-2.5 h-2.5 rounded-full bg-[#1a5c38]" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${datoValg === "godkend" ? "text-[#1a5c38]" : "text-gray-700"}`}>Datoerne passer</p>
                    <p className="text-xs text-gray-400 mt-0.5">Jeg kan overholde bygherrens ønskede tidspunkt</p>
                  </div>
                </button>

                <button
                  onClick={() => setDatoValg("revider")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${datoValg === "revider" ? "border-[#1a5c38] bg-[#f0f7f3]" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${datoValg === "revider" ? "border-[#1a5c38]" : "border-gray-300"}`}>
                    {datoValg === "revider" && <div className="w-2.5 h-2.5 rounded-full bg-[#1a5c38]" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${datoValg === "revider" ? "text-[#1a5c38]" : "text-gray-700"}`}>Jeg foreslår andre datoer</p>
                    <p className="text-xs text-gray-400 mt-0.5">Jeg har brug for at justere tidspunktet</p>
                  </div>
                </button>

                <button
                  onClick={() => setDatoValg("ingen")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${datoValg === "ingen" ? "border-amber-400 bg-amber-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${datoValg === "ingen" ? "border-amber-500" : "border-gray-300"}`}>
                    {datoValg === "ingen" && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${datoValg === "ingen" ? "text-amber-700" : "text-gray-700"}`}>Ingen fast dato for aflevering</p>
                    <p className="text-xs text-gray-400 mt-0.5">Eksplicit fravigelse af AB-Forbruger § 12</p>
                  </div>
                </button>

                {datoValg === "revider" && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Opstart</label>
                        <input
                          type="date"
                          value={revStartdato}
                          onChange={e => setRevStartdato(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Aflevering</label>
                        <input
                          type="date"
                          value={revSlutdato}
                          min={revStartdato || undefined}
                          onChange={e => setRevSlutdato(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Bemærkning til bygherre (valgfrit)</label>
                      <textarea
                        rows={2}
                        placeholder="Fx: Grundet igangværende projekt kan vi tidligst starte 2 uger senere."
                        value={revBemaerkning}
                        onChange={e => setRevBemaerkning(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1e3a2a]"
                      />
                    </div>
                  </div>
                )}

                {datoValg === "ingen" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Bygherre modtager dette til godkendelse. Begge parter er bevidste om at AB-Forbruger § 12 fraviges.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {visTidsplanEditor && (
                    <button onClick={() => { setVisTidsplanEditor(false); setTidsplanGemt(true); }}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">
                      Annuller
                    </button>
                  )}
                  <button
                    onClick={gemTidsplan}
                    disabled={gemmerTidsplan || (datoValg === "revider" && (!revStartdato || !revSlutdato))}
                    className="flex-1 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {gemmerTidsplan ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Gemmer...</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Send til bygherre</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Godkendelsesstatus */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-sm font-bold text-gray-900 mb-4">Godkendelsesstatus</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${kontrakt.bygherre_godkendt_at ? "bg-green-100" : "bg-gray-100"}`}>
                {kontrakt.bygherre_godkendt_at
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Bygherre</p>
                <p className="text-xs text-gray-400">{kontrakt.bygherre_godkendt_at ? `Godkendt ${fmtDato(kontrakt.bygherre_godkendt_at)}` : "Afventer"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${kontrakt.haandvaerker_godkendt_at ? "bg-green-100" : "bg-gray-100"}`}>
                {kontrakt.haandvaerker_godkendt_at
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{kontrakt.haandvaerker_navn ?? "Entreprenør"}</p>
                <p className="text-xs text-gray-400">{kontrakt.haandvaerker_godkendt_at ? `Godkendt ${fmtDato(kontrakt.haandvaerker_godkendt_at)}` : "Afventer din godkendelse"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Send til bygherre-knap */}
        {!godkendt && harAdgang && (
          <button onClick={() => setVisNavnModal(true)}
            className="w-full py-4 bg-[#1e3a2a] text-white font-bold text-base rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Bekræft og send tilbud til bygherre
          </button>
        )}

        {!godkendt && harAdgang && (
          <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
            Har du spørgsmål til aftalegrundlaget? Kontakt bygherren direkte inden du godkender.
          </p>
        )}

        {godkendt && (
          <div className="mt-6 bg-[#1e3a2a] rounded-2xl p-6 text-center">
            <p className="text-green-200/60 text-xs uppercase tracking-widest mb-2">Næste skridt</p>
            {loggetInd ? (
              <>
                <h3 className="text-white font-bold text-lg mb-2">Gå til dit projektrum</h3>
                <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
                  Følg tidsplan, aftalesedler og mangler direkte fra dit projektrum.
                </p>
                <a href="/haandvaerker/sager"
                  className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#f5f3ee] transition-colors">
                  Mine sager →
                </a>
              </>
            ) : (
              <>
                <h3 className="text-white font-bold text-lg mb-2">Opret en gratis konto som entreprenør</h3>
                <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
                  Med en konto kan du modtage aftalesedler, følge betalingsplan og tidsplan og koordinere direkte med bygherren.
                </p>
                <a href={`/haandvaerker/opret-konto?email=${encodeURIComponent(kontrakt?.haandvaerker_email ?? "")}&navn=${encodeURIComponent(kontrakt?.haandvaerker_navn ?? "")}`}
                  className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#f5f3ee] transition-colors">
                  Opret gratis konto →
                </a>
              </>
            )}
          </div>
        )}

        {beggeGodkendt && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">Aftalen er bindende for begge parter</p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
              Begge parter har underskrevet digitalt. Dokumentationen er gemt og kan fremvises ved eventuel tvist.
            </p>
          </div>
        )}
      </div>

      {/* Navn-modal */}
      {visNavnModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#1e3a2a]/10 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Send tilbud til bygherre</h2>
                <p className="text-xs text-gray-400">Bekræft oplysningerne og send</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dit fulde navn</label>
                <input type="text" value={navn} onChange={e => { setNavn(e.target.value); setGodkendFejl(""); }}
                  placeholder="Fornavn Efternavn"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Firma</label>
                <input type="text" value={firma} onChange={e => setFirma(e.target.value)}
                  placeholder="Firma ApS"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
              </div>
            </div>

            <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-gray-600 leading-relaxed">
                Bygherre modtager en e-mail og kan se tilbuddet under &ldquo;Aftaler&rdquo; i deres projektrum. Handlingen logges med navn og tidsstempel.
              </p>
            </div>

            {godkendFejl && (
              <p className="text-xs text-red-600 font-medium mb-3">{godkendFejl}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setVisNavnModal(false); setGodkendFejl(""); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                Annuller
              </button>
              <button onClick={godkend} disabled={godkender}
                className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                {godkender ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sender...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send tilbud</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
