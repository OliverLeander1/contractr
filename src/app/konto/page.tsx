"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Bruger {
  navn: string;
  email: string;
  brugerType?: string;
  loginDato?: string;
}

interface Projekt {
  adresse?: string;
  projekttype?: string;
  total?: number;
  accepteretDato?: string;
  haandvaerkerNavn?: string;
  haandvaerkerFirma?: string;
}

const projekttypeLabels: Record<string, string> = {
  badevarelse: "Badeværelse",
  kokken: "Køkken",
  tag: "Tag",
  tilbygning: "Tilbygning",
  totalrenovering: "Totalrenovering",
  vinduer: "Vinduer og facade",
  maler: "Maler og gips",
  carport: "Carport og garage",
  vaadrum: "Vådrum",
  andet: "Generel renovering",
};

function fmtKr(n: number) {
  return n.toLocaleString("da-DK") + " kr.";
}

export default function MinSide() {
  const [bruger, setBruger] = useState<Bruger | null>(null);
  const [projekt, setProjekt] = useState<Projekt | null>(null);
  const [pakkeKobt, setPakkeKobt] = useState(false);
  const [redigerer, setRedigerer] = useState(false);
  const [nytNavn, setNytNavn] = useState("");
  const [nyEmail, setNyEmail] = useState("");
  const [nyTelefon, setNyTelefon] = useState("");
  const [gemtBesked, setGemtBesked] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [mangler, setMangler] = useState(0);

  useEffect(() => {
    try {
      const rawBruger = localStorage.getItem("contractr_user");
      if (rawBruger) {
        const b = JSON.parse(rawBruger);
        setBruger(b);
        setNytNavn(b.navn || "");
        setNyEmail(b.email || "");
        setNyTelefon(b.telefon || "");
        setNotifEmail(b.notifEmail !== false);
        setNotifPush(b.notifPush === true);
      }

      const rawProjekt = localStorage.getItem("contractr_projekt");
      if (rawProjekt) {
        const p = JSON.parse(rawProjekt);
        setProjekt(p);
        // Byg bruger fra projektdata hvis ingen bruger-login endnu
        if (!rawBruger && p.navn) {
          setBruger({ navn: p.navn, email: p.kontakt || "" });
          setNytNavn(p.navn);
          setNyEmail(p.kontakt || "");
        }
      }

      const rawPakke = localStorage.getItem("contractr_pakke_kobt");
      if (rawPakke) setPakkeKobt(true);

      const rawMangler = localStorage.getItem("contractr_mangler");
      if (rawMangler) {
        const m = JSON.parse(rawMangler);
        if (Array.isArray(m)) setMangler(m.filter((x: { status: string }) => x.status === "aaben").length);
      }
    } catch { /* ignore */ }
  }, []);

  const gemProfil = () => {
    const opdateret = {
      ...(bruger || {}),
      navn: nytNavn.trim(),
      email: nyEmail.trim(),
      telefon: nyTelefon.trim(),
      notifEmail,
      notifPush,
    };
    localStorage.setItem("contractr_user", JSON.stringify(opdateret));

    // Synk med projektdata
    const rawProjekt = localStorage.getItem("contractr_projekt");
    if (rawProjekt) {
      try {
        const p = JSON.parse(rawProjekt);
        p.navn = opdateret.navn;
        p.kontakt = opdateret.email;
        localStorage.setItem("contractr_projekt", JSON.stringify(p));
      } catch { /* ignore */ }
    }

    setBruger(opdateret as Bruger);
    setRedigerer(false);
    setGemtBesked(true);
    setTimeout(() => setGemtBesked(false), 3000);
  };

  const downloadData = () => {
    const data = {
      bruger: bruger,
      projekt: projekt,
      mangler: localStorage.getItem("contractr_mangler"),
      ekstraarbejde: localStorage.getItem("contractr_ekstraarbejde"),
      eksporteretDato: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nembyggestyring-mine-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sletKonto = () => {
    if (!confirm("Er du sikker? Dette sletter alle dine data i browseren. Handlingen kan ikke fortrydes.")) return;
    localStorage.removeItem("contractr_user");
    localStorage.removeItem("contractr_projekt");
    localStorage.removeItem("contractr_mangler");
    localStorage.removeItem("contractr_ekstraarbejde");
    localStorage.removeItem("contractr_betalinger_godkendt");
    localStorage.removeItem("contractr_pakke_kobt");
    sessionStorage.clear();
    window.location.href = "/";
  };

  const initialer = bruger?.navn
    ? bruger.navn.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const harData = bruger || projekt;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/hub" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Mine projekter
          </Link>
          <div className="flex items-center gap-2.5">
            <span style={{ fontFamily: "var(--font-logo)", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a5c38" }}>nembyggestyring</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">Log ud</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {!harData && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen kontodata fundet</p>
            <p className="text-sm text-gray-400 mb-6">Log ind eller opret en konto for at se din profil og dine projekter.</p>
            <Link href="/login" className="inline-block bg-[#1a5c38] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Log ind
            </Link>
          </div>
        )}

        {harData && (
          <>
            {/* Profil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a5c38]/10 flex items-center justify-center text-[#1a5c38] font-bold text-xl flex-shrink-0">
                    {initialer}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{bruger?.navn || "Ikke angivet"}</h1>
                    <p className="text-sm text-gray-400">{bruger?.email || "Ingen e-mail"}</p>
                    {(bruger as Bruger & { telefon?: string })?.telefon && (
                      <p className="text-sm text-gray-400">{(bruger as Bruger & { telefon?: string }).telefon}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setRedigerer(!redigerer)}
                  className="text-sm font-semibold text-[#1a5c38] hover:underline flex-shrink-0"
                >
                  {redigerer ? "Annuller" : "Redigér"}
                </button>
              </div>

              {redigerer && (
                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Navn</label>
                    <input
                      type="text"
                      value={nytNavn}
                      onChange={e => setNytNavn(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                    <input
                      type="email"
                      value={nyEmail}
                      onChange={e => setNyEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon (valgfrit)</label>
                    <input
                      type="tel"
                      value={nyTelefon}
                      onChange={e => setNyTelefon(e.target.value)}
                      placeholder="f.eks. 12 34 56 78"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                    />
                  </div>
                  <button
                    onClick={gemProfil}
                    className="bg-[#1a5c38] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    Gem oplysninger
                  </button>
                </div>
              )}

              {gemtBesked && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-xs text-green-700 font-medium">Dine oplysninger er gemt.</p>
                </div>
              )}
            </div>

            {/* Mine projekter */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Mine projekter</h2>
                <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-[#1a5c38] hover:underline">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nyt projekt
                </Link>
              </div>

              {projekt ? (
                <Link href="/projekt/1" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1a5c38]/30 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0f7f3] flex items-center justify-center text-xl flex-shrink-0">
                      {projekt.projekttype === "badevarelse" ? "🚿" :
                       projekt.projekttype === "kokken" ? "🍳" :
                       projekt.projekttype === "tag" ? "🏠" :
                       projekt.projekttype === "tilbygning" ? "🏗️" : "🔨"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1a5c38] transition-colors">
                        {projekt.adresse || projekttypeLabels[projekt.projekttype || ""] || "Byggeprojekt"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {projekt.accepteretDato ? `Accepteret ${new Date(projekt.accepteretDato).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}` : "Under forberedelse"}
                        {projekt.total ? ` · ${fmtKr(projekt.total)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {mangler > 0 && (
                      <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{mangler} åbne mangler</span>
                    )}
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Aktivt</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
              ) : (
                <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-400 mb-3">Du har ingen projekter endnu.</p>
                  <Link href="/opret/upload" className="inline-block text-sm font-semibold text-[#1a5c38] hover:underline">
                    Tjek dit første tilbud gratis
                  </Link>
                </div>
              )}
            </div>

            {/* Pakke og adgang */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Din adgang</h2>
                <Link href="/pakke" className="text-sm font-semibold text-[#1a5c38] hover:underline">Udvid adgang</Link>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pakkeKobt ? "bg-[#1a5c38]" : "bg-gray-200"}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{pakkeKobt ? "Projektrum" : "Gratis adgang"}</p>
                    <p className="text-xs text-gray-500">{pakkeKobt ? "Fuld adgang til alle funktioner" : "Screening og grundlæggende overblik"}</p>
                  </div>
                </div>
                {!pakkeKobt && (
                  <Link href="/pakke" className="text-xs font-bold text-[#1a5c38] bg-[#1a5c38]/10 px-3 py-1.5 rounded-full hover:bg-[#1a5c38]/20 transition-colors">
                    Opgrader
                  </Link>
                )}
                {pakkeKobt && (
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">Aktiv</span>
                )}
              </div>

              {!pakkeKobt && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { navn: "Projektrum", pris: "499 kr.", href: "/pakke/lille" },
                    { navn: "Med AI-tjek", pris: "999 kr.", href: "/pakke/mellem" },
                    { navn: "Med byggerådgiver", pris: "2.495 kr.", href: "/pakke/stort" },
                  ].map(p => (
                    <Link key={p.navn} href={p.href} className="flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-[#1a5c38]/30 hover:bg-[#1a5c38]/5 transition-all group text-center">
                      <p className="text-xs font-semibold text-gray-700 group-hover:text-[#1a5c38] transition-colors">{p.navn}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.pris}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notifikationer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Notifikationer</h2>
              <div className="space-y-4">
                {[
                  { label: "E-mail notifikationer", desc: "Modtag opdateringer og påmindelser på e-mail", key: "email" as const, value: notifEmail, set: setNotifEmail },
                  { label: "Push-notifikationer", desc: "Modtag notifikationer i browseren", key: "push" as const, value: notifPush, set: setNotifPush },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? "bg-[#1a5c38]" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={gemProfil}
                className="mt-5 text-sm font-semibold text-[#1a5c38] hover:underline"
              >
                Gem indstillinger
              </button>
            </div>

            {/* Kontoindstillinger */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Kontoindstillinger</h2>
              <div className="space-y-1">
                <button
                  onClick={downloadData}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Download mine data</span>
                    <p className="text-xs text-gray-400">Eksporter alle dine projektdata som JSON</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>

                <Link href="/notifikationer" className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">AB-Forbruger notifikationer</span>
                    <p className="text-xs text-gray-400">Automatiske påmindelser baseret på din tidsplan</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>

                <button
                  onClick={sletKonto}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-red-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-red-600">Slet alle mine data</span>
                    <p className="text-xs text-red-400">Fjerner al data fra din browser. Kan ikke fortrydes.</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
