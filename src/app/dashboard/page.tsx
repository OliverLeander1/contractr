"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Projekt {
  id: string;
  projekttype: string;
  adresse?: string;
  status: string;
  pakke_betalt?: boolean;
  oprettet_at: string;
}

interface Aftale {
  id: string;
  projekt_id: string;
  titel: string | null;
  status: string;
  haandvaerker_navn: string | null;
  haandvaerker_email: string | null;
  oprettet_at: string;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
}

const projekttypeLabels: Record<string, string> = {
  badevarelse: "Badeværelse", kokken: "Køkken", tag: "Tag",
  tilbygning: "Tilbygning", totalrenovering: "Totalrenovering",
  vinduer: "Vinduer og facade", maler: "Maler og gips",
  carport: "Carport og garage", vaadrum: "Vådrum", andet: "Generel renovering",
};

const statusLabel: Record<string, string> = {
  dialog: "Søger håndværker", "ingen-tilbud": "I dialog",
  tilbud: "Tilbud modtaget", accepteret: "Accepteret",
  igang: "I gang", problem: "Tvist", afsluttet: "Afsluttet",
};

const statusFarve: Record<string, string> = {
  igang: "bg-green-100 text-green-700 border-green-200",
  problem: "bg-red-100 text-red-700 border-red-200",
  afsluttet: "bg-gray-100 text-gray-500 border-gray-200",
  tilbud: "bg-amber-100 text-amber-700 border-amber-200",
  accepteret: "bg-blue-100 text-blue-700 border-blue-200",
  dialog: "bg-purple-100 text-purple-700 border-purple-200",
  "ingen-tilbud": "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Dashboard() {
  const router = useRouter();
  const [navn, setNavn] = useState("");
  const [projekter, setProjekter] = useState<Projekt[]>([]);
  const [aftaler, setAftaler] = useState<Aftale[]>([]);
  const [indlæser, setIndlæser] = useState(true);
  const [opretter, setOpretter] = useState(false);
  const [pendingUdkast, setPendingUdkast] = useState<{ titel: string } | null>(null);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) { router.push("/login"); return; }

      // Tjek om der er et ufærdiggjort udkast i sessionStorage
      try {
        const raw = sessionStorage.getItem("udbud_resultat");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.titel) setPendingUdkast({ titel: parsed.titel });
        }
      } catch { /* ignore */ }

      const { data: profil } = await supabase
        .from("profiler").select("navn").eq("id", user.id).single();

      setNavn(profil?.navn || user.user_metadata?.navn || user.email?.split("@")[0] || "");

      const { data: projektData } = await supabase
        .from("projekter")
        .select("id, projekttype, adresse, status, pakke_betalt, oprettet_at")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false })
        .limit(10);

      if (projektData) setProjekter(projektData);

      const { data: aftaleData } = await supabase
        .from("kontrakter")
        .select("id, projekt_id, titel, status, haandvaerker_navn, haandvaerker_email, oprettet_at, bygherre_godkendt_at, haandvaerker_godkendt_at")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false });

      if (aftaleData) setAftaler(aftaleData);
      setIndlæser(false);
    };
    hent();
  }, [router]);

  function opretNyAftale() {
    router.push("/opret");
  }

  const timer = new Date().getHours();
  const hilsen = timer < 3 ? "Godaften" : timer < 10 ? "Godmorgen" : timer < 12 ? "Goddag" : timer < 17 ? "Godeftermiddag" : "Godaften";
  const fornavn = navn.split(" ")[0];

  const aktiveProjekter = projekter.filter(p => p.status !== "afsluttet");
  const harProblemer = projekter.some(p => p.status === "problem");
  const ingenProjekter = projekter.length === 0;

  if (indlæser) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      {/* Nav */}
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="logo">nembyggestyring</span>
          <div className="flex items-center gap-4">
            <Link href="/opret/upload" className="text-sm font-semibold text-[#1e3a2a] hover:opacity-70 transition-opacity hidden sm:block">
              Tjek tilbud
            </Link>
            <Link href="/konto" className="w-9 h-9 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity">
              {fornavn?.[0]?.toUpperCase() || "?"}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Velkomst */}
        <div className="mb-8">
          <p className="text-base text-gray-500 mb-1">
            {hilsen}{fornavn ? `, ${fornavn}` : ""}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            {ingenProjekter && aftaler.length === 0
              ? "Hvad skal du bygge?"
              : aftaler.length > 0 && ingenProjekter
              ? aftaler.length === 1 ? "Du har ét aftalegrundlag" : `Du har ${aftaler.length} aftalegrundlag`
              : aktiveProjekter.length === 1
              ? "Du har ét aktivt projekt"
              : `Du har ${aktiveProjekter.length} aktive projekter`}
          </h1>
        </div>

        {/* Ufærdiggjort udkast fra sessionStorage */}
        {pendingUdkast && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-900">Du har et udkast klar</p>
                <p className="text-xs text-amber-700 mt-0.5">{pendingUdkast.titel}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/opret/udbud-resultat")}
              className="flex-shrink-0 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Fortsæt her
            </button>
          </div>
        )}

        {/* Aktive aftaler fra kontrakter-tabellen */}
        {aftaler.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Dine aftalegrundlag</h2>
            <div className="space-y-3">
              {aftaler.map(a => {
                const beggeGodkendt = a.status === "begge_godkendt";
                const afventerHaandvaerker = a.bygherre_godkendt_at && !a.haandvaerker_godkendt_at;
                const underForhandling = a.status === "forhandling";
                const statusTekst = beggeGodkendt ? "Godkendt af begge" : afventerHaandvaerker ? "Afventer håndværker" : underForhandling ? "Under forhandling" : a.haandvaerker_email ? "Invitation sendt" : "Udkast";
                const statusKlasse = beggeGodkendt ? "bg-green-100 text-green-700 border-green-200" : afventerHaandvaerker ? "bg-blue-100 text-blue-700 border-blue-200" : underForhandling ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200";
                return (
                  <Link
                    key={a.id}
                    href={`/projekt/${a.projekt_id}/aftale`}
                    className="bg-white rounded-2xl border border-[#e0ddd6] px-5 py-4 flex items-center justify-between hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors text-sm">
                          {a.titel || "Aftalegrundlag uden titel"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.haandvaerker_navn || a.haandvaerker_email || "Ingen håndværker tilknyttet endnu"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusKlasse}`}>
                        {statusTekst}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={opretNyAftale}
              disabled={opretter}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-dashed border-[#1e3a2a]/30 rounded-2xl py-4 text-sm font-semibold text-[#1e3a2a] hover:border-[#1e3a2a]/60 hover:bg-[#1e3a2a]/5 transition-all disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {opretter ? "Opretter..." : "Nyt aftalegrundlag"}
            </button>
          </div>
        )}

        {/* Tvist-advarsel */}
        {harProblemer && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800 mb-0.5">Et projekt har en aktiv tvist</p>
              <p className="text-xs text-red-600">Vi anbefaler kontakt til en byggesagkyndig. <Link href="/tilkoeb" className="font-semibold underline">Se rådgiverydelser</Link></p>
            </div>
          </div>
        )}

        {/* Tom tilstand — ny bruger */}
        {ingenProjekter && aftaler.length === 0 && (
          <div className="space-y-4 mb-8">
            {/* Primær CTA */}
            <div className="bg-[#1e3a2a] rounded-2xl p-8 text-white">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Kom i gang med dit projekt</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Beskriv dit projekt og vi laver et professionelt udbudsdokument klar til at sende til håndværkere. Eller upload et tilbud du allerede har modtaget.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={opretNyAftale}
                  disabled={opretter}
                  className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                >
                  {opretter ? "Opretter..." : "Start aftalegrundlag"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
                <Link
                  href="/opret/upload"
                  className="inline-flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors text-sm border border-white/30"
                >
                  Tjek et tilbud
                </Link>
              </div>
            </div>

            {/* Tre trin */}
            <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Sådan virker det</p>
              <div className="space-y-5">
                {[
                  { nr: "1", titel: "Upload dit tilbud", desc: "PDF, billede eller tekst fra en mail" },
                  { nr: "2", titel: "Vi screener dokumentet", desc: "Mod AB-Forbruger 2012 og centrale aftalepunkter" },
                  { nr: "3", titel: "Du ved hvad du mangler", desc: "Konkrete spørgsmål du kan stille håndværkeren" },
                ].map(t => (
                  <div key={t.nr} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {t.nr}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.titel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projekter */}
        {projekter.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Dine projekter</h2>
              <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a2a] hover:underline">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nyt projekt
              </Link>
            </div>
            <div className="space-y-3">
              {projekter.map(p => (
                <Link
                  key={p.id}
                  href={`/projekt/${p.id}`}
                  className="bg-white rounded-2xl border border-[#e0ddd6] px-5 py-4 flex items-center justify-between hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors text-sm">
                        {p.adresse || projekttypeLabels[p.projekttype] || "Byggeprojekt"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusFarve[p.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA til at tjekke nyt tilbud */}
            <Link
              href="/opret/upload"
              className="mt-4 flex items-center justify-center gap-2 bg-white border border-dashed border-[#1e3a2a]/30 rounded-2xl py-4 text-sm font-semibold text-[#1e3a2a] hover:border-[#1e3a2a]/60 hover:bg-[#1e3a2a]/5 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tjek nyt tilbud
            </Link>
          </div>
        )}

        {/* Bund — genveje */}
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {!projekter.some(p => p.pakke_betalt) && (
            <Link
              href="/pakke"
              className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a2a]/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-0.5">Vælg en pakke</p>
                <p className="text-xs text-gray-400 leading-relaxed">Se hvad der er inkluderet i de forskellige løsninger</p>
              </div>
            </Link>
          )}
          <Link
            href="/tilkoeb"
            className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a2a]/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">Book en rådgiver</p>
              <p className="text-xs text-gray-400 leading-relaxed">Få en byggesagkyndig til at kigge med</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
