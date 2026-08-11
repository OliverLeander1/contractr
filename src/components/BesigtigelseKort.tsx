"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  fmtBesigtigelseDatoLang,
  fmtBesigtigelseDatoKort,
  fmtTidspunkt,
  fmtTidsinterval,
  fmtVarighed,
  erBesigtigelsePasseret,
  hentEffektivDatoTid,
  getBesigtigelseHistorikLabel,
  VARIGHED_OPTIONS,
  VARIGHED_DEFAULT,
  TIDSPUNKT_OPTIONS,
} from "@/lib/besigtigelse";

interface BesigtigelseTidspunkt {
  id: string;
  dato: string;
  tidspunkt: string;
  sortering: number;
}

interface BesigtigelseRunde {
  id: string;
  dato: string | null;
  tidspunkt: string | null;
  varighed_minutter: number | null;
  valgt_tidspunkt_id: string | null;
  kommentar_bygherre: string | null;
  kommentar_haandvaerker: string | null;
  status: string;
  foreslaaet_af: string;
  oprettet_at: string;
  tidspunkter: BesigtigelseTidspunkt[];
}

interface Besigtigelse extends BesigtigelseRunde {
  historik?: BesigtigelseRunde[];
}

interface Props {
  kontraktId: string;
  projektId: string;
  rolle: "bygherre" | "haandvaerker";
  legacyBesigtigelseDato?: string | null;
  legacyBesigtigelseTid?: string | null;
  legacyBesigtigelseBekraeftet?: boolean | null;
}

interface TidForslag {
  dato: string;
  tidspunkt: string;
}

// Rent præsentationslag: farvetone + ikon for statusblokken. Genbruger samme
// amber/blå/grøn/rød-konvention som allerede findes i getBesigtigelseStatusUI
// (dashboard) og aftale-sidens handlingsbokse — ingen ny statuslogik, kun en
// lokal visuel oversættelse af den eksisterende status/rolle-tilstand.
type StatusTone = "amber" | "blue" | "green" | "red" | "gray";

const TONE_KLASSER: Record<StatusTone, { boks: string; ikon: string; titel: string }> = {
  amber: { boks: "bg-amber-50 border border-amber-100", ikon: "text-amber-600", titel: "text-amber-900" },
  blue:  { boks: "bg-blue-50 border border-blue-100",   ikon: "text-blue-600",  titel: "text-blue-900" },
  green: { boks: "bg-green-50 border border-green-100", ikon: "text-green-600", titel: "text-green-900" },
  red:   { boks: "bg-red-50 border border-red-100",     ikon: "text-red-500",   titel: "text-red-900" },
  gray:  { boks: "bg-gray-50 border border-gray-100",   ikon: "text-gray-400",  titel: "text-gray-600" },
};

function StatusIkon({ tone }: { tone: StatusTone }) {
  const klasse = `w-4 h-4 flex-shrink-0 ${TONE_KLASSER[tone].ikon}`;
  if (tone === "green") {
    return (
      <svg className={klasse} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (tone === "red") {
    return (
      <svg className={klasse} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return (
    <svg className={klasse} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

async function hentToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function autentificeretFetch(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

// Fælles GET-hentning + parsing, genbrugt ved første indlæsning og efter enhver
// skrivehandling. Sikrer at "historik" og "tidspunkter" altid er med —
// skrive-endpointernes eget svar indeholder kun den skrevne runde.
async function hentBesigtigelseData(
  kontraktId: string,
  token: string,
): Promise<{ ok: true; data: Besigtigelse | null } | { ok: false; error: string }> {
  const res = await autentificeretFetch(`/api/besigtigelse?kontrakt_id=${kontraktId}`, token);
  const d = await res.json().catch(() => null);
  if (res.ok) return { ok: true, data: d };
  return { ok: false, error: typeof d?.error === "string" ? d.error : "Kunne ikke hente besigtigelse." };
}

// Delt formular til 1-3 alternative tidspunkter + varighed + kommentar.
// Bruges både til førstegangsforslag (entreprenør) og til "Ingen af tiderne
// passer"-modforslag (modparten) — samme regler, samme UI, ingen duplikeret logik.
function TidspunktFormular({
  tider,
  setTider,
  varighed,
  setVarighed,
  kommentar,
  setKommentar,
  kommentarPlaceholder,
  onAnnuller,
  onSend,
  sender,
  sendLabel,
}: {
  tider: TidForslag[];
  setTider: (t: TidForslag[]) => void;
  varighed: number;
  setVarighed: (v: number) => void;
  kommentar: string;
  setKommentar: (k: string) => void;
  kommentarPlaceholder: string;
  onAnnuller: () => void;
  onSend: () => void;
  sender: boolean;
  sendLabel: string;
}) {
  const idagIso = new Date().toISOString().slice(0, 10);
  const kanTilfoeje = tider.length < 3;
  const gyldig = tider.length >= 1 && tider.every((t) => t.dato && t.tidspunkt);

  function opdaterTid(index: number, felt: "dato" | "tidspunkt", værdi: string) {
    setTider(tider.map((t, i) => (i === index ? { ...t, [felt]: værdi } : t)));
  }
  function tilføjMulighed() {
    if (tider.length >= 3) return;
    setTider([...tider, { dato: "", tidspunkt: "" }]);
  }
  function fjernMulighed(index: number) {
    setTider(tider.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {tider.map((t, i) => (
          // Hver mulighed er ét selvstændigt, letvægts tonet felt (baggrund uden
          // ekstra kant), så det opleves som én tydelig blok uden at stable en
          // ny kant oven i inputfelternes egne kanter.
          <div key={i} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500">
                Mulighed {i + 1} {i === 0 && <span className="text-red-400">*</span>}
              </p>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => fjernMulighed(i)}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  Fjern
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={t.dato}
                min={idagIso}
                onChange={(e) => opdaterTid(i, "dato", e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
              <select
                value={t.tidspunkt}
                onChange={(e) => opdaterTid(i, "tidspunkt", e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              >
                <option value="">Vælg tid</option>
                {TIDSPUNKT_OPTIONS.map((tid) => (
                  <option key={tid} value={tid}>{tid}</option>
                ))}
              </select>
            </div>
            {t.dato && t.tidspunkt && (
              <p className="text-xs text-gray-400 mt-1.5">{fmtTidsinterval(t.tidspunkt, varighed)}</p>
            )}
          </div>
        ))}
      </div>

      {kanTilfoeje && (
        <button
          type="button"
          onClick={tilføjMulighed}
          className="text-xs font-semibold text-[#1e3a2a] hover:underline"
        >
          + Tilføj tidspunkt
        </button>
      )}

      {/* Varighed og kommentar vejer visuelt mindre end selve tidsforslagene ovenfor */}
      <div className="flex items-center gap-2 pt-1">
        <label className="text-xs font-medium text-gray-500 flex-shrink-0">Varighed</label>
        <select
          value={varighed}
          onChange={(e) => setVarighed(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
        >
          {VARIGHED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea
        rows={2}
        value={kommentar}
        onChange={(e) => setKommentar(e.target.value)}
        placeholder={kommentarPlaceholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none transition-all"
      />

      <div className="flex gap-2 pt-1">
        <button
          onClick={onAnnuller}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          Annuller
        </button>
        <button
          onClick={onSend}
          disabled={sender || !gyldig}
          className="flex-1 py-2.5 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {sender ? "Sender..." : sendLabel}
        </button>
      </div>
    </div>
  );
}

export default function BesigtigelseKort({
  kontraktId,
  rolle,
  legacyBesigtigelseDato,
  legacyBesigtigelseTid,
  legacyBesigtigelseBekraeftet,
}: Props) {
  const [besigtigelse, setBesigtigelse] = useState<Besigtigelse | null>(null);
  const [indlæser, setIndlæser] = useState(true);
  const [sessionFejl, setSessionFejl] = useState(false);
  const [getSucceeded, setGetSucceeded] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  // Opret-formular (entreprenørens førstegangsforslag / genåbning)
  const [visForum, setVisForum] = useState(false);
  const [tider, setTider] = useState<TidForslag[]>([{ dato: "", tidspunkt: "" }]);
  const [varighed, setVarighed] = useState(VARIGHED_DEFAULT);
  const [kommentar, setKommentar] = useState("");
  const [sender, setSender] = useState(false);

  // Svar — accept/modforslag/afvis
  const [valgtTidspunktId, setValgtTidspunktId] = useState<string | null>(null);
  const [svarKommentar, setSvarKommentar] = useState("");
  const [svarer, setSvarer] = useState(false);
  const [visNyForslagForm, setVisNyForslagForm] = useState(false);
  const [nyeTider, setNyeTider] = useState<TidForslag[]>([{ dato: "", tidspunkt: "" }]);
  const [nyVarighed, setNyVarighed] = useState(VARIGHED_DEFAULT);

  // Nulstil svar-relateret state når den aktuelle runde skifter. Justeres
  // under render (React-anbefalet mønster for at nulstille state ved en
  // ændret afhængighed) i stedet for i en useEffect, for at undgå en
  // ekstra kaskaderende render.
  const [svarStateForRundeId, setSvarStateForRundeId] = useState<string | null>(null);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      const token = await hentToken();
      if (!token) {
        if (aktiv) { setSessionFejl(true); setIndlæser(false); }
        return;
      }
      try {
        const res = await hentBesigtigelseData(kontraktId, token);
        if (!aktiv) return;
        if (res.ok) {
          setGetSucceeded(true);
          setBesigtigelse(res.data);
        } else {
          setFejl(res.error);
        }
      } catch {
        if (aktiv) setFejl("Der opstod en netværksfejl. Prøv igen.");
      } finally {
        if (aktiv) setIndlæser(false);
      }
    })();
    return () => { aktiv = false; };
  }, [kontraktId]);

  // Nulstil svar-relateret state når den aktuelle runde skifter (render-time
  // state-justering, jf. kommentar ved useState-deklarationen ovenfor).
  // Begge sider normaliseres til "id eller null", ellers ville undefined
  // (besigtigelse === null) aldrig blive lig svarStateForRundeIds null og
  // udløse en uendelig render-loop.
  const aktuelRundeId = besigtigelse?.id ?? null;
  if (aktuelRundeId !== svarStateForRundeId) {
    setSvarStateForRundeId(aktuelRundeId);
    setValgtTidspunktId(null);
    setSvarKommentar("");
    setVisNyForslagForm(false);
    setNyeTider([{ dato: "", tidspunkt: "" }]);
    setNyVarighed(VARIGHED_DEFAULT);
  }

  async function genopfrisk(token: string) {
    const res = await hentBesigtigelseData(kontraktId, token);
    if (res.ok) { setGetSucceeded(true); setBesigtigelse(res.data); }
    else setFejl(res.error);
  }

  async function send() {
    if (tider.length === 0 || tider.some((t) => !t.dato || !t.tidspunkt)) return;
    setFejl(null);
    setSender(true);
    try {
      const token = await hentToken();
      if (!token) { setFejl("Din session er udløbet. Log ind igen."); return; }

      const res = await autentificeretFetch("/api/besigtigelse", token, {
        method: "POST",
        body: JSON.stringify({
          kontrakt_id: kontraktId,
          tidspunkter: tider,
          varighed_minutter: varighed,
          kommentar,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFejl(typeof data?.error === "string" ? data.error : "Kunne ikke oprette besigtigelse.");
        return;
      }
      await genopfrisk(token);
      setVisForum(false);
      setTider([{ dato: "", tidspunkt: "" }]);
      setVarighed(VARIGHED_DEFAULT);
      setKommentar("");
    } catch {
      setFejl("Der opstod en netværksfejl. Prøv igen.");
    } finally {
      setSender(false);
    }
  }

  async function sendModforslag() {
    if (!besigtigelse) return;
    if (nyeTider.length === 0 || nyeTider.some((t) => !t.dato || !t.tidspunkt)) return;
    setFejl(null);
    setSvarer(true);
    try {
      const token = await hentToken();
      if (!token) { setFejl("Din session er udløbet. Log ind igen."); return; }

      const res = await autentificeretFetch("/api/besigtigelse", token, {
        method: "PATCH",
        body: JSON.stringify({
          id: besigtigelse.id,
          action: "counter",
          tidspunkter: nyeTider,
          varighed_minutter: nyVarighed,
          kommentar: svarKommentar || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFejl(typeof data?.error === "string" ? data.error : "Kunne ikke sende modforslag.");
        return;
      }
      await genopfrisk(token);
    } catch {
      setFejl("Der opstod en netværksfejl. Prøv igen.");
    } finally {
      setSvarer(false);
    }
  }

  async function accepterValgt() {
    if (!besigtigelse || !valgtTidspunktId) return;
    setFejl(null);
    setSvarer(true);
    try {
      const token = await hentToken();
      if (!token) { setFejl("Din session er udløbet. Log ind igen."); return; }

      const res = await autentificeretFetch("/api/besigtigelse", token, {
        method: "PATCH",
        body: JSON.stringify({
          id: besigtigelse.id,
          action: "accept",
          valgt_tidspunkt_id: valgtTidspunktId,
          kommentar: svarKommentar || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFejl(typeof data?.error === "string" ? data.error : "Kunne ikke godkende tidspunktet.");
        return;
      }
      await genopfrisk(token);
    } catch {
      setFejl("Der opstod en netværksfejl. Prøv igen.");
    } finally {
      setSvarer(false);
    }
  }

  async function afvisRunde() {
    if (!besigtigelse) return;
    setFejl(null);
    setSvarer(true);
    try {
      const token = await hentToken();
      if (!token) { setFejl("Din session er udløbet. Log ind igen."); return; }

      const res = await autentificeretFetch("/api/besigtigelse", token, {
        method: "PATCH",
        body: JSON.stringify({
          id: besigtigelse.id,
          action: "reject",
          kommentar: svarKommentar || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFejl(typeof data?.error === "string" ? data.error : "Kunne ikke afvise besigtigelsen.");
        return;
      }
      await genopfrisk(token);
    } catch {
      setFejl("Der opstod en netværksfejl. Prøv igen.");
    } finally {
      setSvarer(false);
    }
  }

  const tidspunkter = besigtigelse?.tidspunkter ?? [];
  const effektiv = besigtigelse ? hentEffektivDatoTid(besigtigelse) : null;

  // Tidspunkt passeret i Europe/Copenhagen — beregnes kun én gang pr. render
  const erPasseret =
    besigtigelse?.status === "godkendt" && effektiv
      ? erBesigtigelsePasseret(effektiv.dato, effektiv.tidspunkt)
      : false;

  // Forslagsstiller afventer svar — ingen handlinger
  const erForslagsstillerAfventer =
    besigtigelse?.status === "foreslaaet" && besigtigelse.foreslaaet_af === rolle;

  // Modparten kan svare
  const kanSvare =
    besigtigelse?.status === "foreslaaet" && besigtigelse.foreslaaet_af !== rolle;

  // Legacy-fallback: GET lykkedes med null, og legacy-flaget (fra kontrakter-tabellen,
  // fra før besigtigelse-tabellen overhovedet fandtes) er sat
  const erLegacyFallback =
    getSucceeded && besigtigelse === null && !!legacyBesigtigelseBekraeftet;

  // Ny anmodning kan startes — kun af entreprenøren, og kun når:
  // — ingen eksisterende selvstændig runde, eller
  // — eksisterende er afvist, eller
  // — eksisterende er godkendt og tidspunkt er passeret
  // Bygherren må aldrig starte en besigtigelsesanmodning (produktbeslutning).
  const kanOpretteNy =
    getSucceeded &&
    rolle === "haandvaerker" &&
    (
      !besigtigelse ||
      besigtigelse.status === "afvist" ||
      erPasseret
    ) &&
    !erLegacyFallback;

  const afventerTekst =
    rolle === "haandvaerker" ? "Afventer bygherrens svar" : "Afventer entreprenørens svar";
  const modpartNavn = besigtigelse?.foreslaaet_af === "haandvaerker" ? "Entreprenøren" : "Bygherren";

  // Ren præsentation: hvilken farvetone og overskrift statusblokken øverst i
  // kortet skal have. Udledes direkte af de eksisterende, uændrede tilstande
  // ovenfor — ingen ny statuslogik.
  let statusTone: StatusTone = "gray";
  let statusTitel = "";
  if (besigtigelse) {
    if (besigtigelse.status === "godkendt") {
      statusTone = erPasseret ? "gray" : "green";
      statusTitel = erPasseret ? "Tidspunkt passeret" : "Besigtigelse aftalt";
    } else if (besigtigelse.status === "afvist") {
      statusTone = "red";
      statusTitel = "Besigtigelsen er afvist";
    } else if (erForslagsstillerAfventer) {
      statusTone = "blue";
      statusTitel = afventerTekst;
    } else if (kanSvare) {
      statusTone = "amber";
      statusTitel = tidspunkter.length > 0
        ? `${modpartNavn} foreslår ${tidspunkter.length} ${tidspunkter.length === 1 ? "tid" : "tider"}`
        : `${modpartNavn} har foreslået en tid`;
    }
  }
  const tone = TONE_KLASSER[statusTone];

  if (indlæser) return null;

  if (sessionFejl) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <p className="text-sm text-red-600">Du skal være logget ind for at se besigtigelse.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a2a]/8 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900 text-sm">Besigtigelse</h2>
        </div>
        {kanOpretteNy && !visForum && (
          <button
            onClick={() => { setFejl(null); setVisForum(true); }}
            className="text-xs font-semibold text-[#1e3a2a] hover:underline"
          >
            {erPasseret ? "Anmod om ny besigtigelse" : besigtigelse?.status === "afvist" ? "Foreslå ny dato" : "Anmod om besigtigelse"}
          </button>
        )}
      </div>

      {fejl && (
        <p className="text-xs text-red-600 font-medium mb-3">{fejl}</p>
      )}

      {/* Eksisterende besigtigelse */}
      {besigtigelse && !visForum && (
        <div className="space-y-3">
          {/* Samlet statusblok: status, tider/dato og varighed hører visuelt sammen ét sted */}
          <div className={`rounded-xl p-4 ${tone.boks}`}>
            <div className="flex items-center gap-2 mb-2">
              <StatusIkon tone={statusTone} />
              <p className={`text-sm font-bold ${tone.titel}`}>{statusTitel}</p>
            </div>

            {besigtigelse.status === "godkendt" && effektiv ? (
              <>
                <p className="text-base font-semibold text-gray-900">{fmtBesigtigelseDatoLang(effektiv.dato)}</p>
                {effektiv.tidspunkt && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {fmtTidsinterval(effektiv.tidspunkt, besigtigelse.varighed_minutter)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Foreslået af {besigtigelse.foreslaaet_af === "bygherre" ? "bygherre" : "entreprenøren"}
                </p>
              </>
            ) : besigtigelse.status === "afvist" ? null : (
              <>
                {(erForslagsstillerAfventer || kanSvare) && (
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    {erForslagsstillerAfventer
                      ? `Du har foreslået ${tidspunkter.length || 1} ${(tidspunkter.length || 1) === 1 ? "tid" : "tider"}`
                      : "Vælg en af de foreslåede tider"}
                  </p>
                )}
                {tidspunkter.length > 0 ? (
                  <div className="space-y-1">
                    {tidspunkter.map((t) => (
                      <p key={t.id} className="text-sm text-gray-800">
                        {fmtBesigtigelseDatoKort(t.dato)} · {fmtTidsinterval(t.tidspunkt, besigtigelse.varighed_minutter)}
                      </p>
                    ))}
                  </div>
                ) : effektiv ? (
                  <p className="text-sm text-gray-800">
                    {fmtBesigtigelseDatoLang(effektiv.dato)}
                    {effektiv.tidspunkt ? ` kl. ${fmtTidspunkt(effektiv.tidspunkt)}` : ""}
                  </p>
                ) : null}
                {fmtVarighed(besigtigelse.varighed_minutter) && (
                  <p className="text-xs text-gray-400 mt-2">Varighed · {fmtVarighed(besigtigelse.varighed_minutter)}</p>
                )}
              </>
            )}

            {erPasseret && besigtigelse.status === "godkendt" && (
              <p className="text-xs text-gray-400 mt-2">Det aftalte tidspunkt er passeret.</p>
            )}
          </div>

          {/* Kommentarer */}
          {(besigtigelse.kommentar_bygherre || besigtigelse.kommentar_haandvaerker) && (
            <div className="space-y-2">
              {besigtigelse.kommentar_bygherre && (
                <div className="bg-[#f5f3ee] rounded-xl px-4 py-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Bygherre</p>
                  <p className="text-sm text-gray-700">{besigtigelse.kommentar_bygherre}</p>
                </div>
              )}
              {besigtigelse.kommentar_haandvaerker && (
                <div className="bg-[#f5f3ee] rounded-xl px-4 py-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Entreprenør</p>
                  <p className="text-sm text-gray-700">{besigtigelse.kommentar_haandvaerker}</p>
                </div>
              )}
            </div>
          )}

          {/* Modpartens svarmuligheder — lige under statusblokken, samme visuelle enhed */}
          {kanSvare && !visNyForslagForm && (
            <div className="space-y-3">
              {tidspunkter.length > 0 && (
                <div className="space-y-2">
                  {tidspunkter.map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
                        valgtTidspunktId === t.id ? "border-[#1e3a2a] bg-[#1e3a2a]/5" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="valgt-tidspunkt"
                        checked={valgtTidspunktId === t.id}
                        onChange={() => setValgtTidspunktId(t.id)}
                        className="accent-[#1e3a2a] w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-900">
                        {fmtBesigtigelseDatoLang(t.dato)} · {fmtTidsinterval(t.tidspunkt, besigtigelse.varighed_minutter)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <textarea
                rows={2}
                placeholder="Tilføj en kommentar (valgfrit)"
                value={svarKommentar}
                onChange={(e) => setSvarKommentar(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none transition-all"
              />

              <div className="space-y-2">
                {tidspunkter.length > 0 && (
                  <button
                    onClick={accepterValgt}
                    disabled={svarer || !valgtTidspunktId}
                    className="w-full py-2.5 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {svarer ? "Gemmer..." : "Godkend valgt tidspunkt"}
                  </button>
                )}
                <button
                  onClick={() => setVisNyForslagForm(true)}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Ingen af tiderne passer
                </button>
                <button
                  onClick={afvisRunde}
                  disabled={svarer}
                  className="w-full py-1 text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Afvis besigtigelse
                </button>
              </div>
            </div>
          )}

          {kanSvare && visNyForslagForm && (
            <TidspunktFormular
              tider={nyeTider}
              setTider={setNyeTider}
              varighed={nyVarighed}
              setVarighed={setNyVarighed}
              kommentar={svarKommentar}
              setKommentar={setSvarKommentar}
              kommentarPlaceholder="F.eks. hvorfor de foreslåede tider ikke passer..."
              onAnnuller={() => setVisNyForslagForm(false)}
              onSend={sendModforslag}
              sender={svarer}
              sendLabel="Send forslag"
            />
          )}

          {/* Tidligere forslag — sammenklappet som standard, konkurrerer ikke med den aktuelle handling */}
          {besigtigelse.historik && besigtigelse.historik.length > 0 && (
            <details className="group border-t border-gray-100 pt-3">
              <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Tidligere forslag ({besigtigelse.historik.length})
                </span>
                <svg
                  className="w-3.5 h-3.5 text-gray-400 transition-transform group-open:rotate-180"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="space-y-2 mt-3">
                {besigtigelse.historik.map((h) => {
                  const hTider = h.tidspunkter ?? [];
                  const hEffektiv = hentEffektivDatoTid(h);
                  return (
                    <div key={h.id} className="bg-[#f5f3ee] rounded-xl px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p className="text-xs font-semibold text-gray-500">
                          {h.foreslaaet_af === "bygherre" ? "Bygherre" : "Entreprenøren"} · {fmtBesigtigelseDatoKort(h.oprettet_at.slice(0, 10))}
                        </p>
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0 text-right">
                          {getBesigtigelseHistorikLabel(h.status)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {hTider.length > 0 ? (
                          hTider.map((t) => (
                            <p
                              key={t.id}
                              className={`text-sm ${h.status === "godkendt" && h.valgt_tidspunkt_id === t.id ? "text-gray-900 font-semibold" : "text-gray-600"}`}
                            >
                              {fmtBesigtigelseDatoLang(t.dato)} · {fmtTidsinterval(t.tidspunkt, h.varighed_minutter)}
                              {h.status === "godkendt" && h.valgt_tidspunkt_id === t.id ? " — valgt" : ""}
                            </p>
                          ))
                        ) : hEffektiv ? (
                          <p className="text-sm text-gray-600">
                            {fmtBesigtigelseDatoLang(hEffektiv.dato)}
                            {hEffektiv.tidspunkt ? ` kl. ${fmtTidspunkt(hEffektiv.tidspunkt)}` : ""}
                          </p>
                        ) : null}
                      </div>
                      {fmtVarighed(h.varighed_minutter) && (
                        <p className="text-xs text-gray-400 mt-1">Varighed: {fmtVarighed(h.varighed_minutter)}</p>
                      )}
                      {(h.kommentar_bygherre || h.kommentar_haandvaerker) && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          &ldquo;{h.kommentar_bygherre || h.kommentar_haandvaerker}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Legacy-fallback — read-only overgangsvisning når GET returnerede null og legacy-flag er sat */}
      {erLegacyFallback && !visForum && (
        <div className={`rounded-xl p-4 ${rolle === "haandvaerker" ? TONE_KLASSER.blue.boks : TONE_KLASSER.amber.boks}`}>
          <p className={`text-sm font-bold mb-2 ${rolle === "haandvaerker" ? TONE_KLASSER.blue.titel : TONE_KLASSER.amber.titel}`}>
            {rolle === "haandvaerker" ? "Afventer bygherre" : "Besigtigelsesanmodning modtaget"}
          </p>
          <p className="text-sm text-gray-800">
            {legacyBesigtigelseDato ? fmtBesigtigelseDatoLang(legacyBesigtigelseDato) : "Dato ikke angivet"}
          </p>
          {legacyBesigtigelseTid && (
            <p className="text-sm text-gray-600 mt-0.5">Kl. {legacyBesigtigelseTid.slice(0, 5)}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {rolle === "haandvaerker"
              ? "Besigtigelsesanmodningen er sendt og afventer bygherrens svar."
              : "Denne anmodning blev oprettet i det tidligere besigtigelsesflow. Ændringer til tidspunktet skal aftales direkte med entreprenøren."}
          </p>
        </div>
      )}

      {/* Opret-formular — ny anmodning eller genåbning efter afvisning */}
      {visForum && (
        <TidspunktFormular
          tider={tider}
          setTider={setTider}
          varighed={varighed}
          setVarighed={setVarighed}
          kommentar={kommentar}
          setKommentar={setKommentar}
          kommentarPlaceholder="F.eks. hvad du gerne vil se nærmere på, hvad der skal til for at give pris..."
          onAnnuller={() => { setVisForum(false); setFejl(null); }}
          onSend={send}
          sender={sender}
          sendLabel="Send forslag"
        />
      )}

      {/* Ingen besigtigelse endnu og formular ikke vist — kun når GET lykkedes, ingen legacy-anmodning */}
      {getSucceeded && !besigtigelse && !visForum && !erLegacyFallback && (
        <p className="text-sm text-gray-400">
          {rolle === "bygherre"
            ? "Entreprenøren har endnu ikke anmodet om besigtigelse."
            : "Du kan anmode om at besigtige opgaven inden du afgiver pris."}
        </p>
      )}
    </div>
  );
}
