"use client";

import { use, useEffect, useState, useCallback } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import BilledAnnotering from "@/components/BilledAnnotering";
import { createClient } from "@/lib/supabase";

interface Sedel {
  id: string;
  projekt_id: string;
  kontrakt_id?: string;
  oprettet_af: string;
  oprettet_af_navn: string | null;
  beskrivelse: string;
  status: "afventer_entreprenoer" | "afventer_bygherre" | "godkendt" | "afvist";
  haandvaerker_pris: number | null;
  haandvaerker_pris_type: "fast" | "medgaaet_tid" | null;
  haandvaerker_timepris: number | null;
  materiale_afregning: "inkluderet" | "dokumenteret_pris" | "dokumenteret_pris_med_tillaeg" | null;
  materiale_tillaeg_procent: number | null;
  haandvaerker_prisoverslag: number | null;
  haandvaerker_tidsdage: number | null;
  haandvaerker_besked: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_udfyldt_at: string | null;
  bygherre_godkendt_navn: string | null;
  bygherre_godkendt_at: string | null;
  haandvaerker_email: string | null;
  oprettet_at: string;
}

interface BilledeVisning {
  id: string;
  billedtekst: string | null;
  oprettet_at: string;
  url: string | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

const fmtTid = (iso: string) =>
  new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });

const materialeLabel: Record<string, string> = {
  inkluderet: "Materialer inkluderet i timeprisen",
  dokumenteret_pris: "Materialer til dokumenteret indkøbspris",
  dokumenteret_pris_med_tillaeg: "Materialer til dokumenteret indkøbspris + tillæg",
};

export default function EkstraarbejdeSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  interface Kontrakt {
    id: string;
    haandvaerker_email: string;
    haandvaerker_navn: string | null;
    haandvaerker_token: string | null;
    status: string;
  }

  const [userId, setUserId]         = useState<string | null>(null);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [sedler, setSedler]         = useState<Sedel[]>([]);
  const [kontrakter, setKontrakter] = useState<Kontrakt[]>([]);
  const [indlæser, setIndlæser]     = useState(true);
  const [visOpret, setVisOpret]     = useState(false);
  const [gemmer, setGemmer]         = useState(false);
  const [godkender, setGodkender]   = useState<string | null>(null);
  const [sessionsfejl, setSessionsfejl] = useState<string | null>(null);
  const [skrivFejl, setSkrivFejl] = useState<string | null>(null);

  // Opret-formular
  const [beskrivelse, setBeskrivelse]               = useState("");
  const [valgteHaandvaerker, setValgteHaandvaerker] = useState<Kontrakt | null>(null);
  const [annoteredesBilleder, setAnnoteredesBilleder] = useState<{ dataUrl: string; lokation: string }[]>([]);
  const [visAnnotering, setVisAnnotering]           = useState(false);
  const [uploadFejl, setUploadFejl]                 = useState<string | null>(null);

  // Billeder til visning på allerede oprettede sedler, hentet via
  // signerede læse-URLs — aldrig fra base64/den gamle billeder-kolonne.
  const [billedeVisning, setBilledeVisning] = useState<Record<string, BilledeVisning[]>>({});

  // Godkend-modal
  const [godkendSedel, setGodkendSedel] = useState<Sedel | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? null);
      const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
      setBrugerNavn(profil?.navn || user.email?.split("@")[0] || "Bygherre");
    });
  }, []);

  const hentData = useCallback(async () => {
    setIndlæser(true);
    setSessionsfejl(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSessionsfejl("Din session er udløbet. Log ind igen for at se aftalesedler.");
      setIndlæser(false);
      return;
    }

    const [kontraktRes, { data: e }] = await Promise.all([
      fetch(`/api/projekter/${id}/kontrakter`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then(r => {
        if (r.status === 401) { setSessionsfejl("Din session er udløbet. Log ind igen for at se aftalesedler."); return null; }
        if (r.status === 403) { setSessionsfejl("Du har ikke adgang til denne sag."); return null; }
        return r.json();
      }),
      supabase.from("ekstraarbejde").select("*").eq("projekt_id", id).order("oprettet_at", { ascending: false }),
    ]);

    if (kontraktRes === null) {
      setIndlæser(false);
      return;
    }
    if (!Array.isArray(kontraktRes)) {
      console.error("API fejl fra /kontrakter:", JSON.stringify(kontraktRes));
    }
    const godkendteKontrakter = (Array.isArray(kontraktRes) ? kontraktRes : []) as Kontrakt[];
    setKontrakter(godkendteKontrakter);
    if (godkendteKontrakter.length === 1) setValgteHaandvaerker(godkendteKontrakter[0]);
    const hentedeSedler = (e || []) as Sedel[];
    setSedler(hentedeSedler);
    setIndlæser(false);

    // Hent signerede visnings-URLs for hver sedel parallelt — billeder
    // vises aldrig via den gamle base64-kolonne eller en offentlig URL.
    await Promise.all(hentedeSedler.map(async (s) => {
      const billedRes = await fetch(`/api/ekstraarbejde/${s.id}/billeder`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!billedRes.ok) return;
      const billedData = await billedRes.json().catch(() => null);
      if (billedData?.billeder) {
        setBilledeVisning((prev) => ({ ...prev, [s.id]: billedData.billeder }));
      }
    }));
  }, [id]);

  useEffect(() => { hentData(); }, [hentData]);

  const erHaandvaerker = !!(userEmail && kontrakter.some(
    k => k.haandvaerker_email.toLowerCase() === userEmail.toLowerCase()
  ));

  // Den kontrakt som den indloggede håndværker er tilknyttet
  const minKontrakt = erHaandvaerker
    ? kontrakter.find(k => k.haandvaerker_email.toLowerCase() === userEmail!.toLowerCase()) ?? null
    : null;

  // Fælles hjælper til autentificerede /api/ekstraarbejde-kald — henter en
  // frisk session og sender den som Bearer-token, samme mønster som
  // aftale-siden bruger for kontraktkald.
  async function autentificeretFetch(
    url: string,
    init?: RequestInit
  ): Promise<{ res: Response } | { fejltype: "session" | "adgang" }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { fejltype: "session" };
    }
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${session.access_token}` },
    });
    if (res.status === 401) return { fejltype: "session" };
    if (res.status === 403) return { fejltype: "adgang" };
    return { res };
  }

  function skrivFejlTekst(fejltype: "session" | "adgang"): string {
    return fejltype === "session"
      ? "Din session er udløbet. Log ind igen for at fortsætte."
      : "Du har ikke adgang til denne handling.";
  }

  function dataUrlTilBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(",");
    const mime = /data:(.*?);base64/.exec(header)?.[1] || "image/jpeg";
    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
    return new Blob([array], { type: mime });
  }

  // Uploader de valgte, annoterede billeder direkte til den private
  // Storage-bucket via serverudstedte signed upload-URLs. Billed-bytes/
  // base64 sendes ALDRIG til vores egen Next.js-route.
  async function uploadBilleder(kontraktId: string): Promise<{ storage_path: string; billedtekst: string | null }[] | null> {
    if (annoteredesBilleder.length === 0) return [];

    const resultat = await autentificeretFetch("/api/ekstraarbejde/upload-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kontrakt_id: kontraktId, antal: annoteredesBilleder.length }),
    });
    if ("fejltype" in resultat) { setUploadFejl(skrivFejlTekst(resultat.fejltype)); return null; }
    const data = await resultat.res.json();
    if (data.error || !Array.isArray(data.uploads)) {
      setUploadFejl(data.error || "Kunne ikke forberede billedupload.");
      return null;
    }

    const referencer: { storage_path: string; billedtekst: string | null }[] = [];
    for (let i = 0; i < annoteredesBilleder.length; i++) {
      const { path, token } = data.uploads[i];
      const blob = dataUrlTilBlob(annoteredesBilleder[i].dataUrl);
      const { error: uploadFejlRes } = await supabase.storage
        .from("aftalesedler")
        .uploadToSignedUrl(path, token, blob, { contentType: "image/jpeg" });
      if (uploadFejlRes) {
        setUploadFejl("Et billede kunne ikke uploades. Prøv igen.");
        return null;
      }
      referencer.push({ storage_path: path, billedtekst: annoteredesBilleder[i].lokation.trim() || null });
    }
    return referencer;
  }

  async function opretSedel() {
    if (!beskrivelse.trim() || !userId || gemmer || !valgteHaandvaerker) return;
    setGemmer(true);
    setSkrivFejl(null);
    setUploadFejl(null);
    try {
      const billedeReferencer = await uploadBilleder(valgteHaandvaerker.id);
      if (billedeReferencer === null) return; // uploadFejl er allerede sat

      const resultat = await autentificeretFetch("/api/ekstraarbejde", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: valgteHaandvaerker.id,
          beskrivelse: beskrivelse.trim(),
          billeder: billedeReferencer.length > 0 ? billedeReferencer : null,
        }),
      });
      if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const data = await resultat.res.json();
      if (data.error) { setSkrivFejl(data.error); return; }
      setBeskrivelse("");
      setAnnoteredesBilleder([]);
      setVisOpret(false);
      hentData();
    } finally {
      setGemmer(false);
    }
  }

  async function godkendSedlen(sedel: Sedel) {
    if (!userId || godkender) return;
    setGodkender(sedel.id);
    setSkrivFejl(null);
    try {
      const resultat = await autentificeretFetch(`/api/ekstraarbejde/${sedel.id}/godkend`, {
        method: "POST",
      });
      if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const data = await resultat.res.json();
      if (data.error) { setSkrivFejl(data.error); return; }
      setGodkendSedel(null);
      hentData();
    } finally {
      setGodkender(null);
    }
  }

  async function afvisSedel(sedelId: string) {
    if (!userId) return;
    setSkrivFejl(null);
    const resultat = await autentificeretFetch(`/api/ekstraarbejde/${sedelId}/afvis`, {
      method: "POST",
    });
    if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
    const data = await resultat.res.json();
    if (data.error) { setSkrivFejl(data.error); return; }
    setSedler(p => p.map(s => s.id === sedelId ? { ...s, status: "afvist" } : s));
  }

  const godkendtTotal = sedler.filter(s => s.status === "godkendt").reduce((sum, s) => sum + (s.haandvaerker_pris || 0), 0);
  const afventerAntal = sedler.filter(s => s.status === "afventer_bygherre").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aftalesedler</h1>
            <p className="text-sm text-gray-400 mt-1">
              {afventerAntal > 0 ? `${afventerAntal} afventer din godkendelse · ` : ""}
              {godkendtTotal > 0 ? `${fmtKr(godkendtTotal)} godkendt i alt` : "Ingen aftalesedler endnu"}
            </p>
          </div>
          {!erHaandvaerker && kontrakter.length > 0 && (
            <button onClick={() => setVisOpret(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ny aftaleseddel
            </button>
          )}
        </div>

        {skrivFejl && (
          <p className="text-xs text-red-600 font-medium mb-5">{skrivFejl}</p>
        )}

        {/* Opret modal */}
        {visOpret && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="font-bold text-gray-900 mb-1">Ny aftaleseddel</h2>
              <p className="text-xs text-gray-400 mb-5">
                Beskriv arbejdet. Entreprenøren udfylder herefter pris og tidspåvirkning, og du godkender.
              </p>

              {/* Vælg modtager hvis flere entreprenører */}
              {kontrakter.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Send til</label>
                  <div className="space-y-2">
                    {kontrakter.map(k => (
                      <button key={k.id} onClick={() => setValgteHaandvaerker(k)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          valgteHaandvaerker?.id === k.id
                            ? "border-[#1e3a2a] bg-[#1e3a2a]/5 ring-1 ring-[#1e3a2a]/20"
                            : "border-gray-200 hover:border-gray-300"
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          valgteHaandvaerker?.id === k.id ? "bg-[#1e3a2a] text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          {(k.haandvaerker_navn || k.haandvaerker_email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{k.haandvaerker_navn ?? k.haandvaerker_email}</p>
                        </div>
                        {valgteHaandvaerker?.id === k.id && (
                          <svg className="ml-auto flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vis modtager hvis kun én */}
              {kontrakter.length === 1 && valgteHaandvaerker && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 mb-4">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className="text-xs text-gray-500">Sendes til</span>
                  <span className="text-xs font-semibold text-gray-800">{valgteHaandvaerker.haandvaerker_navn ?? valgteHaandvaerker.haandvaerker_email}</span>
                </div>
              )}

              {visAnnotering ? (
                <BilledAnnotering
                  onGem={dataUrl => {
                    setAnnoteredesBilleder(prev => [...prev, { dataUrl, lokation: "" }]);
                    setVisAnnotering(false);
                  }}
                  onAnnuller={() => setVisAnnotering(false)}
                />
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse af ekstraarbejdet</label>
                    <textarea rows={3} value={beskrivelse} onChange={e => setBeskrivelse(e.target.value)}
                      placeholder="Beskriv præcist hvad der ønskes lavet som ekstraarbejde. Jo mere detaljeret, jo bedre grundlag for prissætning..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none" />
                  </div>

                  {/* Annoterede billeder */}
                  {annoteredesBilleder.length > 0 && (
                    <div className="space-y-2">
                      {annoteredesBilleder.map((b, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="relative group flex-shrink-0">
                            <img src={b.dataUrl} alt={`Markering ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                            <button
                              onClick={() => setAnnoteredesBilleder(prev => prev.filter((_, j) => j !== i))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                              ×
                            </button>
                          </div>
                          <input
                            type="text"
                            value={b.lokation}
                            onChange={e => setAnnoteredesBilleder(prev => prev.map((x, j) => j === i ? { ...x, lokation: e.target.value } : x))}
                            placeholder="Lokation/beskrivelse (valgfri), fx Badeværelse, væg mod entré"
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setVisAnnotering(true)}
                    className="flex items-center gap-2 text-xs font-semibold text-[#1e3a2a] hover:underline w-fit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    {annoteredesBilleder.length > 0 ? "Tilføj endnu et billede med markering" : "Tilføj billede med markering (valgfrit)"}
                  </button>

                  {uploadFejl && (
                    <p className="text-xs text-red-600 font-medium">{uploadFejl}</p>
                  )}

                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    Jf. AB-Forbruger § 23 skal ekstraarbejde aftales skriftligt inden opstart. Entreprenøren modtager denne anmodning og skal bekræfte pris og tidspåvirkning, inden arbejdet kan gå i gang.
                  </p>
                </>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setVisOpret(false); setBeskrivelse(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Annuller
                </button>
                <button onClick={opretSedel} disabled={!beskrivelse.trim() || gemmer || !valgteHaandvaerker}
                  className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                  {gemmer ? "Sender..." : valgteHaandvaerker ? `Send til ${valgteHaandvaerker.haandvaerker_navn ?? "entreprenøren"}` : "Vælg modtager først"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Godkend-modal med digital underskrift */}
        {godkendSedel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 bg-[#1e3a2a]/10 rounded-xl flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Digital godkendelse</h2>
                  <p className="text-xs text-gray-400">Aftaleseddel #{sedler.indexOf(godkendSedel) + 1}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Arbejde</p>
                  <p className="text-sm text-gray-800">{godkendSedel.beskrivelse}</p>
                </div>
                {godkendSedel.haandvaerker_pris_type === "fast" ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Fast pris inkl. moms</p>
                      <p className="text-base font-bold text-gray-900">{godkendSedel.haandvaerker_pris !== null ? fmtKr(godkendSedel.haandvaerker_pris) : "—"}</p>
                    </div>
                    {godkendSedel.haandvaerker_tidsdage !== null && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Tidskonsekvens</p>
                        <p className="text-base font-bold text-gray-900">{godkendSedel.haandvaerker_tidsdage === 0 ? "Ingen tidsforlængelse" : `+${godkendSedel.haandvaerker_tidsdage} dage`}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Timepris inkl. moms</p>
                        <p className="text-base font-bold text-gray-900">{godkendSedel.haandvaerker_timepris !== null ? `${fmtKr(godkendSedel.haandvaerker_timepris)}/time` : "—"}</p>
                      </div>
                      {godkendSedel.haandvaerker_tidsdage !== null && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Tidskonsekvens</p>
                          <p className="text-base font-bold text-gray-900">{godkendSedel.haandvaerker_tidsdage === 0 ? "Ingen tidsforlængelse" : `+${godkendSedel.haandvaerker_tidsdage} dage`}</p>
                        </div>
                      )}
                    </div>
                    {godkendSedel.materiale_afregning && (
                      <p className="text-xs text-gray-500">
                        {materialeLabel[godkendSedel.materiale_afregning]}
                        {godkendSedel.materiale_afregning === "dokumenteret_pris_med_tillaeg" && godkendSedel.materiale_tillaeg_procent !== null ? ` (${godkendSedel.materiale_tillaeg_procent} %)` : ""}
                      </p>
                    )}
                    {godkendSedel.haandvaerker_prisoverslag !== null && (
                      <p className="text-xs text-gray-500">Prisoverslag: cirka {fmtKr(godkendSedel.haandvaerker_prisoverslag)}. Ikke en fast maksimal pris.</p>
                    )}
                  </div>
                )}
                {godkendSedel.haandvaerker_besked && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Note fra entreprenøren</p>
                    <p className="text-sm text-gray-600">{godkendSedel.haandvaerker_besked}</p>
                  </div>
                )}
              </div>

              <div className="bg-[#1e3a2a]/5 border border-[#1e3a2a]/10 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-[#1e3a2a] font-semibold mb-1">Din digitale underskrift</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ved at klikke "Godkend og underskriv" bekræfter du, <strong>{brugerNavn}</strong>, at du godkender ovenstående ekstraarbejde til den angivne pris og på de angivne vilkår. Din godkendelse logges med tidsstempel.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setGodkendSedel(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Gå tilbage
                </button>
                <button onClick={() => godkendSedlen(godkendSedel)} disabled={!!godkender}
                  className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Godkend og underskriv
                </button>
              </div>
            </div>
          </div>
        )}

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : sessionsfejl ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
            <p className="text-sm text-gray-500">{sessionsfejl}</p>
          </div>
        ) : kontrakter.length === 0 && !erHaandvaerker ? (
          <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-2">Ingen godkendt kontrakt på projektet</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Aftalesedler til ekstraarbejde kan kun oprettes, når der er et godkendt aftalegrundlag med en entreprenør på projektet. Invitér en entreprenør og få kontrakten godkendt af begge parter først.
            </p>
          </div>
        ) : sedler.length === 0 ? (
          <div className="space-y-4 mb-6">
            {/* Hvad er en aftaleseddel */}
            <div className="bg-[#111c17] rounded-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 23</p>
                    <h2 className="text-base font-bold text-white leading-snug">Hvad er en aftaleseddel?</h2>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-5">
                  Undervejs i et byggeprojekt opstår der næsten altid arbejde der ikke var med i den oprindelige kontrakt. Det kan være et ekstra stik, en ændret flisetype eller et hul i væggen der ikke stod på tegningen.
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  En aftaleseddel er den skriftlige aftale der sikrer at I er enige om hvad ekstraarbejdet indeholder, hvad det koster og om det påvirker tidsplanen, inden arbejdet går i gang. Det beskytter begge parter og forebygger uenigheder om regningen bagefter.
                </p>
              </div>

              {/* Tre trin */}
              <div className="grid grid-cols-3 border-t border-white/10">
                {[
                  {
                    num: "1",
                    titel: "Du beskriver",
                    tekst: "Skriv hvad du ønsker lavet. Vær præcis, jo mere detaljeret, jo bedre grundlag for prissætning.",
                    ikon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    ),
                  },
                  {
                    num: "2",
                    titel: "Entreprenøren prissætter",
                    tekst: "Håndværkeren modtager anmodningen, udfylder pris og eventuel tidspåvirkning.",
                    ikon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    ),
                  },
                  {
                    num: "3",
                    titel: "I underskriver digitalt",
                    tekst: "Du godkender prisen. Begge parter er bundet af aftalen og underskriften logges med tidsstempel.",
                    ikon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ),
                  },
                ].map((trin, i) => (
                  <div key={i} className={`px-4 py-4 ${i < 2 ? "border-r border-white/10" : ""}`}>
                    <div className="w-7 h-7 rounded-lg bg-[#1a5c38] flex items-center justify-center mb-3 text-white">
                      {trin.ikon}
                    </div>
                    <p className="text-xs font-bold text-white mb-1">{trin.titel}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{trin.tekst}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opfordring */}
            <div className="bg-[#f0f7f3] rounded-2xl border border-[#1a5c38]/10 px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#1a5c38]/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-sm text-[#1a5c38] leading-relaxed">
                <strong>Ingen aftalesedler endnu.</strong> Brug knappen øverst til højre hvis der opstår ekstraarbejde undervejs i projektet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {sedler.map((s, i) => (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                s.status === "afventer_bygherre" ? "border-amber-200" : "border-gray-100"
              }`}>
                {/* Header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400">Aftaleseddel #{sedler.length - i}</span>
                        <StatusBadge status={s.status} />
                        <span className="text-xs text-gray-300 ml-auto">{fmtDato(s.oprettet_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{s.beskrivelse}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {s.oprettet_af_navn && (
                          <p className="text-xs text-gray-400">Oprettet af {s.oprettet_af_navn}</p>
                        )}
                        {s.haandvaerker_email && (
                          <p className="text-xs text-gray-400">
                            · Til: <span className="font-medium text-gray-600">
                              {kontrakter.find(k => k.haandvaerker_email === s.haandvaerker_email)?.haandvaerker_navn ?? s.haandvaerker_email}
                            </span>
                          </p>
                        )}
                      </div>
                      {billedeVisning[s.id] && billedeVisning[s.id].length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-3">
                          {billedeVisning[s.id].map((b) => (
                            b.url && (
                              <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" title={b.billedtekst || undefined}>
                                <img src={b.url} alt={b.billedtekst || "Billede"}
                                  className="w-24 h-24 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in" />
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entreprenørens svar */}
                {(s.status === "afventer_bygherre" || s.status === "godkendt") && s.haandvaerker_pris_type && (
                  <div className="mx-5 mb-4 bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Entreprenørens tilbud</p>
                    {s.haandvaerker_pris_type === "fast" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Fast pris inkl. moms</p>
                          <p className="text-xl font-bold text-gray-900">{s.haandvaerker_pris !== null ? fmtKr(s.haandvaerker_pris) : "—"}</p>
                        </div>
                        {s.haandvaerker_tidsdage !== null && (
                          <div>
                            <p className="text-xs text-gray-400">Tidskonsekvens</p>
                            <p className="text-xl font-bold text-gray-900">{s.haandvaerker_tidsdage === 0 ? "Ingen tidsforlængelse" : `+${s.haandvaerker_tidsdage} dage`}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Timepris inkl. moms</p>
                            <p className="text-xl font-bold text-gray-900">{s.haandvaerker_timepris !== null ? `${fmtKr(s.haandvaerker_timepris)}/time` : "—"}</p>
                          </div>
                          {s.haandvaerker_tidsdage !== null && (
                            <div>
                              <p className="text-xs text-gray-400">Tidskonsekvens</p>
                              <p className="text-xl font-bold text-gray-900">{s.haandvaerker_tidsdage === 0 ? "Ingen tidsforlængelse" : `+${s.haandvaerker_tidsdage} dage`}</p>
                            </div>
                          )}
                        </div>
                        {s.materiale_afregning && (
                          <p className="text-sm text-gray-500">
                            {materialeLabel[s.materiale_afregning]}
                            {s.materiale_afregning === "dokumenteret_pris_med_tillaeg" && s.materiale_tillaeg_procent !== null ? ` (${s.materiale_tillaeg_procent} %)` : ""}
                          </p>
                        )}
                        {s.haandvaerker_prisoverslag !== null && (
                          <p className="text-sm text-gray-500">Prisoverslag: cirka {fmtKr(s.haandvaerker_prisoverslag)}. Ikke en fast maksimal pris.</p>
                        )}
                      </div>
                    )}
                    {s.haandvaerker_besked && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200 leading-relaxed">&ldquo;{s.haandvaerker_besked}&rdquo;</p>
                    )}
                    {s.haandvaerker_navn && s.haandvaerker_udfyldt_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Udfyldt af {s.haandvaerker_navn} · {fmtDato(s.haandvaerker_udfyldt_at)} kl. {fmtTid(s.haandvaerker_udfyldt_at)}
                      </p>
                    )}
                  </div>
                )}

                {/* Begge underskrifter når godkendt */}
                {s.status === "godkendt" && s.bygherre_godkendt_at && (
                  <div className="mx-5 mb-4">
                    <div className="border border-green-100 bg-green-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Digitalt underskrevet</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-green-600/70 mb-0.5">Bygherre</p>
                          <p className="text-sm font-semibold text-green-800">{s.bygherre_godkendt_navn || "Bygherre"}</p>
                          <p className="text-xs text-green-600/60">{fmtDato(s.bygherre_godkendt_at)} · {fmtTid(s.bygherre_godkendt_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600/70 mb-0.5">Entreprenør</p>
                          <p className="text-sm font-semibold text-green-800">{s.haandvaerker_navn || "Entreprenør"}</p>
                          <p className="text-xs text-green-600/60">{s.haandvaerker_udfyldt_at ? `${fmtDato(s.haandvaerker_udfyldt_at)} · ${fmtTid(s.haandvaerker_udfyldt_at)}` : "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Afventer svar fra entreprenør */}
                {s.status === "afventer_entreprenoer" && (
                  <div className="mx-5 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-700">Afventer at entreprenøren udfylder pris og tidspåvirkning.</p>
                  </div>
                )}

                {/* Bygherre godkender */}
                {s.status === "afventer_bygherre" && !erHaandvaerker && (
                  <div className="flex gap-2 px-5 pb-5">
                    <button onClick={() => afvisSedel(s.id)}
                      className="flex-1 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                      Afvis
                    </button>
                    <button onClick={() => setGodkendSedel(s)}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-[#1e3a2a] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Godkend og underskriv
                    </button>
                  </div>
                )}
              </div>
            ))}

            {godkendtTotal > 0 && (
              <div className="bg-gray-50 rounded-xl px-5 py-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Samlet godkendt ekstraarbejde</span>
                <span className="text-sm font-bold text-[#1e3a2a]">{fmtKr(godkendtTotal)}</span>
              </div>
            )}
          </div>
        )}

        <ABTip type="advarsel" paragraf="AB-Forbruger § 23"
          titel="Ekstraarbejde skal aftales skriftligt inden opstart"
          resumé="Mundtlige aftaler om ekstraarbejde er svære at bevise og anerkendes sjældent ved tvist."
          detaljer="Jf. AB-Forbruger § 23 skal ekstraarbejde aftales skriftligt og prissættes på forhånd. Brug aftalesedlerne her, de udgør din juridiske dokumentation." />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Sedel["status"] }) {
  const map = {
    afventer_entreprenoer: { label: "Afventer pris fra entreprenør", cls: "bg-amber-100 text-amber-700" },
    afventer_bygherre:     { label: "Klar til din godkendelse", cls: "bg-blue-100 text-blue-700" },
    godkendt:              { label: "Godkendt · digitalt underskrevet", cls: "bg-green-100 text-green-700" },
    afvist:                { label: "Afvist", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}
