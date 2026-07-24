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
  pakke?: string;
  pakke_betalt?: boolean;
  oprettet_at: string;
}

interface Screening {
  id: string;
  projekt_id: string;
  samlet_risiko: string;
  oprettet_at: string;
  projekter: { projekttype: string; adresse?: string } | null;
}

const projekttypeEmoji: Record<string, string> = {
  badevarelse: "🚿", kokken: "🍳", tag: "🏠",
  tilbygning: "🏗️", totalrenovering: "🔨", vinduer: "🪟",
  maler: "🖌️", carport: "🏠", vaadrum: "🚿", andet: "📋",
};

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
  igang: "bg-green-100 text-green-700",
  problem: "bg-red-100 text-red-700",
  afsluttet: "bg-gray-100 text-gray-500",
  tilbud: "bg-amber-100 text-amber-700",
  accepteret: "bg-blue-100 text-blue-700",
  dialog: "bg-purple-100 text-purple-700",
  "ingen-tilbud": "bg-purple-100 text-purple-700",
};

const risikoFarve: Record<string, string> = {
  lav: "bg-green-100 text-green-700",
  middel: "bg-amber-100 text-amber-700",
  høj: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const router = useRouter();
  const [navn, setNavn] = useState("");
  const [projekter, setProjekter] = useState<Projekt[]>([]);
  const [screeninger, setScreeninger] = useState<Screening[]>([]);
  const [indlæser, setIndlæser] = useState(true);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Hent profil
      const { data: profil } = await supabase
        .from("profiler")
        .select("navn")
        .eq("id", user.id)
        .single();

      setNavn(profil?.navn || user.user_metadata?.navn || user.email?.split("@")[0] || "");

      // Hent projekter
      const { data: projektData } = await supabase
        .from("projekter")
        .select("id, projekttype, adresse, status, pakke, pakke_betalt, oprettet_at")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false })
        .limit(10);

      if (projektData) setProjekter(projektData);

      // Hent seneste screeninger
      const { data: screeningData } = await supabase
        .from("screeninger")
        .select("id, projekt_id, samlet_risiko, oprettet_at, projekter(projekttype, adresse)")
        .order("oprettet_at", { ascending: false })
        .limit(5);

      if (screeningData) setScreeninger(screeningData as unknown as Screening[]);

      setIndlæser(false);
    };

    hent();
  }, [router]);

  const timer = new Date().getHours();
  const hilsen = timer < 10 ? "Godmorgen" : timer < 17 ? "Goddag" : "Godaften";

  const aktiveProjekter = projekter.filter(p => p.status !== "afsluttet");
  const harProblemer = projekter.some(p => p.status === "problem");

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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="logo">contractr</span>
          <div className="flex items-center gap-5">
            <Link href="/opret/upload" className="text-sm font-semibold text-[#1e3a2a] hover:opacity-70 transition-opacity">
              Tjek tilbud
            </Link>
            <Link href="/konto" className="w-8 h-8 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-sm hover:bg-[#1e3a2a]/20 transition-colors">
              {navn?.[0]?.toUpperCase() || "?"}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Velkomst */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {hilsen}{navn ? `, ${navn.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-500">
            {aktiveProjekter.length === 0
              ? "Du har ingen aktive projekter endnu."
              : aktiveProjekter.length === 1
              ? "Du har ét aktivt projekt."
              : `Du har ${aktiveProjekter.length} aktive projekter.`}
          </p>
        </div>

        {/* Advarsel ved tvist */}
        {harProblemer && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800 mb-0.5">Et af dine projekter har en aktiv tvist</p>
              <p className="text-xs text-red-600">Vi anbefaler at du kontakter en byggesagkyndig. <Link href="/tilkoeb" className="font-semibold underline">Se rådgiverydelser</Link></p>
            </div>
          </div>
        )}

        {/* Hurtige handlinger — ingen projekter */}
        {projekter.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm p-10 text-center mb-8">
            <div className="w-16 h-16 bg-[#1e3a2a]/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Tjek dit første tilbud</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
              Upload et tilbud eller en kontrakt. Vi screener det mod AB-Forbruger og fortæller dig hvad du bør afklare inden du siger ja.
            </p>
            <Link
              href="/opret/upload"
              className="inline-block bg-[#1e3a2a] text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Upload tilbud gratis
            </Link>
          </div>
        )}

        {/* Projekter */}
        {projekter.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Dine projekter</h2>
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
                    <div className="w-11 h-11 rounded-xl bg-[#f0f7f3] flex items-center justify-center text-2xl flex-shrink-0">
                      {projekttypeEmoji[p.projekttype] || "📋"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors">
                        {p.adresse || projekttypeLabels[p.projekttype] || "Byggeprojekt"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Oprettet {new Date(p.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusFarve[p.status] || "bg-gray-100 text-gray-500"}`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Seneste screeninger */}
        {screeninger.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Seneste screeninger</h2>
            <div className="space-y-3">
              {screeninger.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-[#e0ddd6] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {s.projekter?.adresse || projekttypeLabels[s.projekter?.projekttype || ""] || "Dokument screenet"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(s.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${risikoFarve[s.samlet_risiko] || "bg-gray-100 text-gray-500"}`}>
                    {s.samlet_risiko === "lav" ? "Lav risiko" : s.samlet_risiko === "middel" ? "Middel risiko" : "Høj risiko"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hurtige handlinger */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
              titel: "Tjek nyt tilbud",
              desc: "Upload og screen et dokument",
              href: "/opret/upload",
            },
            {
              ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              titel: "AB-Forbruger",
              desc: "Dine rettigheder på dansk",
              href: "/abforbruger",
            },
            {
              ikon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              titel: "Book rådgiver",
              desc: "Få en fagmand til at kigge med",
              href: "/tilkoeb",
            },
          ].map(a => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center mb-3 group-hover:bg-[#1e3a2a]/10 transition-colors">
                {a.ikon}
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{a.titel}</p>
              <p className="text-xs text-gray-400">{a.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
