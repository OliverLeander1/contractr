"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SimpleNav from "@/components/SimpleNav";
import { createClient } from "@/lib/supabase";

const FAGS = [
  "Hovedentreprenør", "Totalentreprenør", "Tømrer", "Murer", "VVS", "Elektriker",
  "Maler", "Gulvlægger", "Blikkenslager", "Snedker", "Smed", "Kloakmester", "Facademontør", "Andet",
];

interface Profil {
  navn: string | null;
  virksomhed: string | null;
  cvr: string | null;
  telefon: string | null;
  email: string | null;
  fag: string | null;
  postnummer: string | null;
  by: string | null;
  tilgaengelig: boolean;
  standby: boolean;
  oprettet_at: string | null;
}

export default function HaandvaerkerProfil() {
  const [profil, setProfil]           = useState<Profil | null>(null);
  const [indlæser, setIndlæser]       = useState(true);
  const [redigerer, setRedigerer]     = useState(false);
  const [nytNavn, setNytNavn]         = useState("");
  const [nyVirksomhed, setNyVirksomhed] = useState("");
  const [nytCvr, setNytCvr]           = useState("");
  const [nytTelefon, setNytTelefon]   = useState("");
  const [nytFag, setNytFag]           = useState("");
  const [nytPostnummer, setNytPostnummer] = useState("");
  const [nytBy, setNytBy]             = useState("");
  const [tilgaengelig, setTilgaengelig] = useState(true);
  const [standby, setStandby]         = useState(false);
  const [gemmer, setGemmer]           = useState(false);
  const [gemtBesked, setGemtBesked]   = useState(false);
  const [visSlet, setVisSlet]         = useState(false);
  const [sletNavn, setSletNavn]       = useState("");
  const [sletBekræft, setSletBekræft] = useState("");
  const [sletter, setSletter]         = useState(false);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIndlæser(false); return; }

      const { data } = await supabase
        .from("profiler")
        .select("navn, virksomhed, cvr, telefon, email, fag, postnummer, by, tilgaengelig, standby, oprettet_at")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfil(data);
        setNytNavn(data.navn || "");
        setNyVirksomhed(data.virksomhed || "");
        setNytCvr(data.cvr || "");
        setNytTelefon(data.telefon || "");
        setNytFag(data.fag || "");
        setNytPostnummer(data.postnummer || "");
        setNytBy(data.by || "");
        setTilgaengelig(data.tilgaengelig ?? true);
        setStandby(data.standby ?? false);
      } else {
        setProfil({ navn: null, virksomhed: null, cvr: null, telefon: null, email: user.email || null, fag: null, postnummer: null, by: null, tilgaengelig: true, standby: false, oprettet_at: null });
      }
      setIndlæser(false);
    };
    hent();
  }, []);

  const gemProfil = async () => {
    setGemmer(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiler")
      .upsert({
        id: user.id,
        navn: nytNavn.trim() || null,
        virksomhed: nyVirksomhed.trim() || null,
        cvr: nytCvr.trim() || null,
        telefon: nytTelefon.trim() || null,
        fag: nytFag || null,
        postnummer: nytPostnummer.trim() || null,
        by: nytBy.trim() || null,
        tilgaengelig,
        standby,
      }, { onConflict: "id" })
      .select()
      .single();

    if (data) setProfil(prev => ({ ...prev!, ...data }));
    setGemmer(false);
    setRedigerer(false);
    setGemtBesked(true);
    setTimeout(() => setGemtBesked(false), 3000);
  };

  type Synlighed = "synlig" | "travlt" | "skjult";

  const sætSynlighed = async (valg: Synlighed) => {
    const nyTilgaengelig = valg !== "skjult";
    const nyStandby      = valg === "travlt";
    setTilgaengelig(nyTilgaengelig);
    setStandby(nyStandby);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiler").update({ tilgaengelig: nyTilgaengelig, standby: nyStandby }).eq("id", user.id);
    setProfil(prev => prev ? { ...prev, tilgaengelig: nyTilgaengelig, standby: nyStandby } : prev);
  };

  const aktivSynlighed: Synlighed = !tilgaengelig ? "skjult" : standby ? "travlt" : "synlig";

  if (indlæser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1e3a2a] rounded-full animate-spin" />
    </div>
  );

  const initial = profil?.navn ? profil.navn[0].toUpperCase() : "?";
  const oprettetAar = profil?.oprettet_at
    ? new Date(profil.oprettet_at).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNav tilbage="/haandvaerker/sager" tilbageLabel="Mine sager" />

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Markedsplads-synlighed */}
        <div className={`rounded-2xl border p-5 mb-5 transition-colors ${aktivSynlighed === "synlig" ? "bg-[#f0f7f3] border-green-200" : aktivSynlighed === "travlt" ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
          <p className={`font-semibold text-sm mb-0.5 ${aktivSynlighed === "synlig" ? "text-[#1e3a2a]" : aktivSynlighed === "travlt" ? "text-amber-700" : "text-gray-600"}`}>
            {aktivSynlighed === "synlig" && "Du er synlig på markedspladsen"}
            {aktivSynlighed === "travlt" && "Du er synlig, men markeret som travlt"}
            {aktivSynlighed === "skjult" && "Du er skjult fra markedspladsen"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {aktivSynlighed === "synlig" && "Bygherrer kan finde dig og invitere dig direkte til projekter."}
            {aktivSynlighed === "travlt" && "Du vises stadig i oversigten, men med et 'Travlt'-mærke. Bygherrer ved at du har begrænset kapacitet."}
            {aktivSynlighed === "skjult" && "Du er ikke synlig for bygherrer. Slå synlighed til igen, når du har kapacitet."}
          </p>
          <div className="flex gap-2">
            {(["synlig", "travlt", "skjult"] as const).map(valg => (
              <button
                key={valg}
                onClick={() => sætSynlighed(valg)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  aktivSynlighed === valg
                    ? valg === "synlig" ? "bg-[#1e3a2a] text-white border-[#1e3a2a]"
                    : valg === "travlt" ? "bg-amber-500 text-white border-amber-500"
                    : "bg-gray-500 text-white border-gray-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {valg === "synlig" ? "Synlig" : valg === "travlt" ? "Travlt" : "Skjult"}
              </button>
            ))}
          </div>
        </div>

        {/* Profilkort */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-2xl flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{profil?.navn || "Navn ikke angivet"}</h1>
              {(profil?.virksomhed || profil?.cvr) && (
                <p className="text-gray-500 text-sm">
                  {profil.virksomhed || ""}
                  {profil.cvr ? ` · CVR ${profil.cvr}` : ""}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {profil?.fag && (
                  <span className="text-xs bg-[#1e3a2a]/10 text-[#1e3a2a] px-2.5 py-1 rounded-full font-medium">{profil.fag}</span>
                )}
                {(profil?.postnummer || profil?.by) && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                    {profil.postnummer ? `${profil.postnummer} ` : ""}{profil.by}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500 mt-3">
                {profil?.telefon && (
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {profil.telefon}
                  </span>
                )}
                {profil?.email && (
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {profil.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Medlem siden {oprettetAar}
                </span>
              </div>
            </div>
            <button
              onClick={() => setRedigerer(!redigerer)}
              className="text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              {redigerer ? "Annuller" : "Rediger profil"}
            </button>
          </div>

          {redigerer && (
            <div className="border-t border-gray-100 pt-5 mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Navn</label>
                  <input type="text" value={nytNavn} onChange={e => setNytNavn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Virksomhed</label>
                  <input type="text" value={nyVirksomhed} onChange={e => setNyVirksomhed(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR</label>
                  <input type="text" value={nytCvr} onChange={e => setNytCvr(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                  <input type="tel" value={nytTelefon} onChange={e => setNytTelefon(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fagområde</label>
                <select value={nytFag} onChange={e => setNytFag(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all bg-white">
                  <option value="">Vælg fagområde...</option>
                  {FAGS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Postnummer</label>
                  <input type="text" placeholder="F.eks. 2100" value={nytPostnummer} onChange={e => setNytPostnummer(e.target.value)} maxLength={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">By</label>
                  <input type="text" placeholder="F.eks. København Ø" value={nytBy} onChange={e => setNytBy(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
              </div>
              <button onClick={gemProfil} disabled={gemmer} className="bg-[#1e3a2a] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
                {gemmer ? "Gemmer..." : "Gem profil"}
              </button>
            </div>
          )}

          {gemtBesked && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-xs text-green-700 font-medium">Profil gemt.</p>
            </div>
          )}
        </div>

        {/* Omtaler */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Omtaler fra bygherrer</h2>
          <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">Ingen omtaler endnu</p>
            <p className="text-xs text-gray-400">Omtaler fra bygherrer vises her efterhånden som projekter afsluttes.</p>
          </div>
        </div>

        {/* Link til markedspladsen */}
        <Link href="/haandvaerkere" className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 hover:border-[#1e3a2a]/30 transition-colors">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Se din profil på markedspladsen</p>
            <p className="text-xs text-gray-400 mt-0.5">Sådan ser bygherrer din profil</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>

        {/* Slet konto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Slet konto</h2>
          <p className="text-sm text-gray-400 mb-4">Din profil, dine sager og alle tilknyttede data slettes permanent.</p>
          {!visSlet ? (
            <button onClick={() => setVisSlet(true)} className="text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              Slet min konto
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-red-600">Dette kan ikke fortrydes. Bekræft ved at skrive dit navn og derefter "slet bruger".</p>
              <input
                type="text"
                placeholder={profil?.navn || "Dit navn"}
                value={sletNavn}
                onChange={e => setSletNavn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-300"
              />
              <input
                type="text"
                placeholder='slet bruger'
                value={sletBekræft}
                onChange={e => setSletBekræft(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-300"
              />
              <div className="flex gap-2">
                <button onClick={() => { setVisSlet(false); setSletNavn(""); setSletBekræft(""); }} className="flex-1 text-sm font-medium border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Annuller
                </button>
                <button
                  disabled={sletter || sletNavn.trim().toLowerCase() !== (profil?.navn || "").trim().toLowerCase() || sletBekræft.trim().toLowerCase() !== "slet bruger"}
                  onClick={async () => {
                    setSletter(true);
                    const res = await fetch("/api/bruger/slet", { method: "DELETE" });
                    if (res.ok) { window.location.href = "/"; }
                    else { setSletter(false); }
                  }}
                  className="flex-1 text-sm font-bold bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sletter ? "Sletter..." : "Slet min konto"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
