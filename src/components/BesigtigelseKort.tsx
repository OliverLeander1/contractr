"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Besigtigelse {
  id: string;
  dato: string;
  tidspunkt: string | null;
  kommentar_bygherre: string | null;
  kommentar_haandvaerker: string | null;
  status: string;
  foreslaaet_af: string;
}

interface Props {
  kontraktId: string;
  projektId: string;
  rolle: "bygherre" | "haandvaerker";
  legacyBesigtigelseDato?: string | null;
  legacyBesigtigelseTid?: string | null;
  legacyBesigtigelseBekraeftet?: boolean | null;
}

const fmtDato = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
  const [visForum, setVisForum] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  // Opret-form
  const [dato, setDato] = useState("");
  const [tidspunkt, setTidspunkt] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [sender, setSender] = useState(false);

  // Svar-form
  const [svarKommentar, setSvarKommentar] = useState("");
  const [nyDato, setNyDato] = useState("");
  const [nyTidspunkt, setNyTidspunkt] = useState("");
  const [visNyDato, setVisNyDato] = useState(false);
  const [svarer, setSvarer] = useState(false);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      const token = await hentToken();
      if (!token) {
        if (aktiv) { setSessionFejl(true); setIndlæser(false); }
        return;
      }
      try {
        const res = await autentificeretFetch(
          `/api/besigtigelse?kontrakt_id=${kontraktId}`,
          token,
        );
        if (!aktiv) return;
        if (res.ok) {
          const d = await res.json();
          setGetSucceeded(true);
          setBesigtigelse(d);
        } else {
          const d = await res.json().catch(() => null);
          setFejl(typeof d?.error === "string" ? d.error : "Kunne ikke hente besigtigelse.");
        }
      } catch {
        if (aktiv) setFejl("Der opstod en netværksfejl. Prøv igen.");
      } finally {
        if (aktiv) setIndlæser(false);
      }
    })();
    return () => { aktiv = false; };
  }, [kontraktId]);

  async function opret() {
    if (!dato) return;
    setFejl(null);
    setSender(true);
    try {
      const token = await hentToken();
      if (!token) { setFejl("Din session er udløbet. Log ind igen."); return; }

      const res = await autentificeretFetch("/api/besigtigelse", token, {
        method: "POST",
        body: JSON.stringify({ kontrakt_id: kontraktId, dato, tidspunkt, kommentar }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFejl(typeof data?.error === "string" ? data.error : "Kunne ikke oprette besigtigelse.");
        return;
      }
      setBesigtigelse(data);
      setVisForum(false);
      setDato("");
      setTidspunkt("");
      setKommentar("");
    } catch {
      setFejl("Der opstod en netværksfejl. Prøv igen.");
    } finally {
      setSender(false);
    }
  }

  async function svar(action: "accept" | "counter") {
    if (!besigtigelse) return;
    if (action === "counter" && !nyDato) return;
    setFejl(null);
    setSvarer(true);
    try {
      const token = await hentToken();
      if (!token) { setFejl("Din session er udløbet. Log ind igen."); return; }

      const body: Record<string, unknown> = {
        id: besigtigelse.id,
        action,
        kommentar: svarKommentar || undefined,
      };
      if (action === "counter") {
        body.ny_dato = nyDato;
        body.ny_tidspunkt = nyTidspunkt || null;
      }

      const res = await autentificeretFetch("/api/besigtigelse", token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFejl(typeof data?.error === "string" ? data.error : "Kunne ikke sende svar.");
        return;
      }
      setBesigtigelse(data);
      setSvarKommentar("");
      setVisNyDato(false);
      setNyDato("");
      setNyTidspunkt("");
    } catch {
      setFejl("Der opstod en netværksfejl. Prøv igen.");
    } finally {
      setSvarer(false);
    }
  }

  const statusUI: Record<string, { label: string; klasse: string }> = {
    foreslaaet: { label: "Afventer godkendelse", klasse: "bg-amber-100 text-amber-700" },
    godkendt:   { label: "Bekræftet",            klasse: "bg-green-100 text-green-700" },
    afvist:     { label: "Afvist",               klasse: "bg-red-100 text-red-700" },
  };

  // Forslagsstiller afventer svar — ingen handlinger
  const erForslagsstillerAfventer =
    besigtigelse?.status === "foreslaaet" && besigtigelse.foreslaaet_af === rolle;

  // Modparten kan svare
  const kanSvare =
    besigtigelse?.status === "foreslaaet" && besigtigelse.foreslaaet_af !== rolle;

  // Legacy-fallback: GET lykkedes med null, og legacy-flaget er sat
  const erLegacyFallback =
    getSucceeded && besigtigelse === null && !!legacyBesigtigelseBekraeftet;

  // Ny anmodning kan startes når GET lykkedes, ingen selvstændig række og ingen legacy-anmodning
  const kanOpretteNy =
    getSucceeded &&
    (!besigtigelse || besigtigelse.status === "afvist") &&
    !erLegacyFallback;

  const afventerTekst =
    rolle === "haandvaerker" ? "Afventer bygherrens svar." : "Afventer entreprenørens svar.";

  if (indlæser) return null;

  if (sessionFejl) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <p className="text-sm text-red-600">Du skal være logget ind for at se besigtigelse.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
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
        {/* Knap: kun modparten kan foreslå ny dato; forslagsstiller under afventning ser ingen knap */}
        {kanSvare && !visForum && (
          <button
            onClick={() => { setFejl(null); setVisForum(false); }}
            className="text-xs font-semibold text-[#1e3a2a] hover:underline"
          >
            Foreslå ny dato
          </button>
        )}
        {kanOpretteNy && !visForum && (
          <button
            onClick={() => { setFejl(null); setVisForum(true); }}
            className="text-xs font-semibold text-[#1e3a2a] hover:underline"
          >
            {besigtigelse?.status === "afvist" ? "Foreslå ny dato" : "Anmod om besigtigelse"}
          </button>
        )}
      </div>

      {fejl && (
        <p className="text-xs text-red-600 font-medium mb-3">{fejl}</p>
      )}

      {/* Eksisterende besigtigelse */}
      {besigtigelse && !visForum && (
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{fmtDato(besigtigelse.dato)}</p>
              {besigtigelse.tidspunkt && (
                <p className="text-xs text-gray-500 mt-0.5">Kl. {besigtigelse.tidspunkt.slice(0, 5)}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Foreslået af {besigtigelse.foreslaaet_af === "bygherre" ? "bygherre" : "entreprenøren"}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusUI[besigtigelse.status]?.klasse || "bg-gray-100 text-gray-600"}`}>
              {statusUI[besigtigelse.status]?.label || besigtigelse.status}
            </span>
          </div>

          {/* Kommentarer */}
          {(besigtigelse.kommentar_bygherre || besigtigelse.kommentar_haandvaerker) && (
            <div className="space-y-2 mb-4">
              {besigtigelse.kommentar_bygherre && (
                <div className="bg-[#f5f3ee] rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bygherre</p>
                  <p className="text-sm text-gray-700">{besigtigelse.kommentar_bygherre}</p>
                </div>
              )}
              {besigtigelse.kommentar_haandvaerker && (
                <div className="bg-[#f5f3ee] rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Entreprenør</p>
                  <p className="text-sm text-gray-700">{besigtigelse.kommentar_haandvaerker}</p>
                </div>
              )}
            </div>
          )}

          {/* Forslagsstiller afventer — ingen handlinger */}
          {erForslagsstillerAfventer && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400">{afventerTekst}</p>
            </div>
          )}

          {/* Modpartens svarmuligheder */}
          {kanSvare && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Dit svar</p>
              <textarea
                rows={2}
                placeholder="Tilføj en kommentar (valgfrit)"
                value={svarKommentar}
                onChange={e => setSvarKommentar(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none transition-all mb-3"
              />

              {!visNyDato ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => svar("accept")}
                    disabled={svarer}
                    className="flex-1 py-2.5 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {svarer ? "Gemmer..." : "Bekræft dato"}
                  </button>
                  <button
                    onClick={() => setVisNyDato(true)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Foreslå anden dato
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Ny dato</label>
                      <input type="date" value={nyDato} onChange={e => setNyDato(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Tidspunkt (valgfrit)</label>
                      <input type="time" value={nyTidspunkt} onChange={e => setNyTidspunkt(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setVisNyDato(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                      Annuller
                    </button>
                    <button onClick={() => svar("counter")} disabled={svarer || !nyDato}
                      className="flex-1 py-2.5 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                      {svarer ? "Sender..." : "Send forslag"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legacy-fallback — read-only overgangsvisning når GET returnerede null og legacy-flag er sat */}
      {erLegacyFallback && !visForum && (
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {legacyBesigtigelseDato ? fmtDato(legacyBesigtigelseDato) : "Dato ikke angivet"}
              </p>
              {legacyBesigtigelseTid && (
                <p className="text-xs text-gray-500 mt-0.5">Kl. {legacyBesigtigelseTid.slice(0, 5)}</p>
              )}
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 bg-amber-100 text-amber-700">
              Afventer bygherre
            </span>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">Besigtigelsesanmodningen er sendt og afventer bygherrens svar.</p>
          </div>
        </div>
      )}

      {/* Opret-formular — ny anmodning eller genåbning efter afvisning */}
      {visForum && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dato <span className="text-red-400">*</span></label>
              <input type="date" value={dato} onChange={e => setDato(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tidspunkt (valgfrit)</label>
              <input type="time" value={tidspunkt} onChange={e => setTidspunkt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kommentar (valgfrit)</label>
            <textarea rows={3} value={kommentar} onChange={e => setKommentar(e.target.value)}
              placeholder={rolle === "bygherre"
                ? "F.eks. adgangsforhold, vejarbejde foran huset, hvornår du er hjemme..."
                : "F.eks. hvad du gerne vil se nærmere på, hvad der skal til for at give pris..."}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none transition-all" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setVisForum(false); setFejl(null); }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Annuller
            </button>
            <button onClick={opret} disabled={sender || !dato}
              className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {sender ? "Sender..." : "Send besigtigelsesanmodning"}
            </button>
          </div>
        </div>
      )}

      {/* Ingen besigtigelse endnu og formular ikke vist — kun når GET lykkedes, ingen legacy-anmodning */}
      {getSucceeded && !besigtigelse && !visForum && !erLegacyFallback && (
        <p className="text-sm text-gray-400">
          {rolle === "bygherre"
            ? "Entreprenøren kan anmode om at besigtige opgaven inden pris afgives."
            : "Du kan anmode om at besigtige opgaven inden du afgiver pris."}
        </p>
      )}
    </div>
  );
}
