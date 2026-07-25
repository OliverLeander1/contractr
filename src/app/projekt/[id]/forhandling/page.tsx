"use client";

import { use, useEffect, useState, useCallback } from "react";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";

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

interface Kontrakt {
  id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  vilkaar: string | null;
  haandvaerker_token: string;
  haandvaerker_email: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  status: string;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  kontraktaendringer: Aendring[];
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0 }) + " kr.";

const feltLabels: Record<string, string> = {
  titel: "Projekttitel",
  beskrivelse: "Arbejdets omfang",
  total_pris: "Entreprisesum",
  vilkaar: "Vilkår",
};

export default function Forhandling({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [kontrakt, setKontrakt] = useState<Kontrakt | null | "loading">("loading");
  const [redigererFelt, setRedigererFelt] = useState<string | null>(null);
  const [feltVaerdi, setFeltVaerdi] = useState("");
  const [inviterEmail, setInviterEmail] = useState("");
  const [visInviter, setVisInviter] = useState(false);
  const [kopieret, setKopieret] = useState(false);
  const [sender, setSender] = useState(false);
  const [godkender, setGodkender] = useState(false);
  const [gemmer, setGemmer] = useState(false);
  const [brugerNavn, setBrugerNavn] = useState("");

  const hentKontrakt = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const r = await fetch(`/api/kontrakt?projekt_id=${id}&bygherre_id=${user.id}`);
    const d = await r.json();
    if (!d.error) setKontrakt(d);
    else setKontrakt(null);

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

  async function sendInvitation() {
    if (!kontrakt || typeof kontrakt !== "object" || !inviterEmail.trim()) return;
    setSender(true);
    try {
      await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: kontrakt.id,
          haandvaerker_email: inviterEmail.trim(),
        }),
      });
      setKontrakt(prev => prev && typeof prev === "object"
        ? { ...prev, haandvaerker_email: inviterEmail.trim(), status: "inviteret" }
        : prev);
      setVisInviter(false);
    } finally {
      setSender(false);
    }
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
    setGodkender(true);
    try {
      const r = await fetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/godkend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forfatter: "bygherre" }),
      });
      const data = await r.json();
      if (!data.error) {
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
        <div className="flex items-start justify-between mb-6 gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">Forhandlingsrum</h1>
            <p className="text-sm text-gray-500 mt-1">
              {kontrakt.titel || "Kontraktudkast"} · Byg ind kontraktvilkår med håndværkeren her
            </p>
          </div>
          <button
            onClick={() => setVisInviter(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-[#1e3a2a] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Inviter håndværker
          </button>
        </div>

        {/* Invitation-modal */}
        {visInviter && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="font-bold text-gray-900 mb-1">Inviter håndværker</h2>
              <p className="text-sm text-gray-400 mb-5">Håndværkeren modtager et direkte link til forhandlingsrummet. Ingen konto krævet for at se og kommentere.</p>

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

            {(["titel", "beskrivelse", "total_pris", "vilkaar"] as const).map((felt) => {
              const vaerdi = felt === "total_pris"
                ? (kontrakt.total_pris ? fmtKr(kontrakt.total_pris) : null)
                : kontrakt[felt];

              const afventendeFeltForslag = kontrakt.kontraktaendringer.filter(
                a => a.felt === felt && a.status === "afventer"
              );
              const erAktiv = redigererFelt === felt;
              const harForslag = afventendeFeltForslag.length > 0;

              return (
                <div key={felt} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${harForslag ? "border-amber-200" : "border-gray-100"}`}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{feltLabels[felt]}</p>
                      {!erBeggeGodkendt && !erAktiv && (
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
                          <input
                            type="number"
                            value={feltVaerdi}
                            onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                          />
                        ) : (
                          <textarea
                            rows={felt === "beskrivelse" ? 5 : 3}
                            value={feltVaerdi}
                            onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                          />
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
                        {vaerdi || <span className="text-gray-400 italic">Ikke udfyldt — klik Rediger for at tilføje</span>}
                      </p>
                    )}
                  </div>

                  {/* Forslag fra håndværker */}
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
                      {a.kommentar && (
                        <p className="text-xs text-amber-700 italic mb-3">&ldquo;{a.kommentar}&rdquo;</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => besvarForslag(a.id, "accepteret")}
                          className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          Acceptér ændring
                        </button>
                        <button
                          onClick={() => besvarForslag(a.id, "afvist")}
                          className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Afvis
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Historik */}
                  {kontrakt.kontraktaendringer.filter(a => a.felt === felt && a.status !== "afventer").map(a => (
                    <div key={a.id} className="border-t border-gray-100 px-5 py-2.5 flex items-center gap-2 bg-gray-50">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${a.status === "accepteret" ? "bg-green-100" : "bg-red-100"}`}>
                        {a.status === "accepteret"
                          ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        }
                      </div>
                      <p className="text-xs text-gray-400">
                        Forslag fra {a.forfatter_navn || a.forfatter} {a.status === "accepteret" ? "accepteret" : "afvist"}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
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
                <button
                  onClick={godkendKontrakt}
                  disabled={godkender || bygherreGodkendt}
                  className={`w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    bygherreGodkendt
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#1e3a2a] text-white hover:opacity-90"
                  }`}
                >
                  {godkender ? "Godkender..." : bygherreGodkendt ? "Du har godkendt" : "Godkend kontrakten"}
                </button>
              )}
            </div>

            {/* Invitationslink */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Håndværkerlink</h3>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">Send dette link direkte til håndværkeren. Ingen login krævet for at se og foreslå ændringer.</p>
              <div className="flex gap-2">
                <input readOnly value={invitationslink} className="flex-1 text-xs border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 truncate" />
                <button
                  onClick={kopierLink}
                  className="flex-shrink-0 text-xs font-semibold text-[#1e3a2a] border border-[#1e3a2a]/20 bg-[#1e3a2a]/5 hover:bg-[#1e3a2a]/10 px-3 py-2 rounded-lg transition-colors"
                >
                  {kopieret ? "✓" : "Kopiér"}
                </button>
              </div>
            </div>

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
