"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SimpleNav from "@/components/SimpleNav";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Profil {
  navn: string;
  email: string;
  telefon?: string;
}

interface Projekt {
  id: string;
  projekttype: string;
  adresse?: string;
  status: string;
  pakke?: string;
  pakke_betalt?: boolean;
  oprettet_at: string;
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

const projekttypeEmoji: Record<string, string> = {
  badevarelse: "🚿", kokken: "🍳", tag: "🏠",
  tilbygning: "🏗️", totalrenovering: "🔨", vinduer: "🪟",
  maler: "🖌️", carport: "🏠", vaadrum: "🚿", andet: "📋",
};

export default function MinSide() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [projekter, setProjekter] = useState<Projekt[]>([]);
  const [indlæser, setIndlæser] = useState(true);
  const [redigerer, setRedigerer] = useState(false);
  const [nytNavn, setNytNavn] = useState("");
  const [nyTelefon, setNyTelefon] = useState("");
  const [gemtBesked, setGemtBesked] = useState(false);
  const [gemmerProfil, setGemmerProfil] = useState(false);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Hent profil
      const { data: profilData } = await supabase
        .from("profiler")
        .select("navn, email, telefon")
        .eq("id", user.id)
        .single();

      if (profilData) {
        setProfil(profilData);
        setNytNavn(profilData.navn || "");
        setNyTelefon(profilData.telefon || "");
      } else {
        // Fallback til auth metadata
        const navn = user.user_metadata?.navn || user.email?.split("@")[0] || "";
        setProfil({ navn, email: user.email || "" });
        setNytNavn(navn);
      }

      // Hent projekter
      const { data: projektData } = await supabase
        .from("projekter")
        .select("id, projekttype, adresse, status, pakke, pakke_betalt, oprettet_at")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false });

      if (projektData) setProjekter(projektData);
      setIndlæser(false);
    };

    hent();
  }, [router]);

  const gemProfil = async () => {
    setGemmerProfil(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiler").upsert({
      id: user.id,
      navn: nytNavn.trim(),
      email: user.email,
      telefon: nyTelefon.trim() || null,
    });

    setProfil(prev => prev ? { ...prev, navn: nytNavn.trim(), telefon: nyTelefon.trim() } : null);
    setRedigerer(false);
    setGemmerProfil(false);
    setGemtBesked(true);
    setTimeout(() => setGemtBesked(false), 3000);
  };

  const logUd = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const initialer = profil?.navn
    ? profil.navn.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (indlæser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNav
        tilbage="/dashboard"
        tilbageLabel="Mit overblik"
        højre={
          <button onClick={logUd} className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
            Log ud
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-xl flex-shrink-0">
                {initialer}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profil?.navn || "Ikke angivet"}</h1>
                <p className="text-sm text-gray-400">{profil?.email}</p>
                {profil?.telefon && <p className="text-sm text-gray-400">{profil.telefon}</p>}
              </div>
            </div>
            <button
              onClick={() => setRedigerer(!redigerer)}
              className="text-sm font-semibold text-[#1e3a2a] hover:underline flex-shrink-0"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon (valgfrit)</label>
                <input
                  type="tel"
                  value={nyTelefon}
                  onChange={e => setNyTelefon(e.target.value)}
                  placeholder="f.eks. 12 34 56 78"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
              <button
                onClick={gemProfil}
                disabled={gemmerProfil}
                className="bg-[#1e3a2a] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
              >
                {gemmerProfil ? "Gemmer..." : "Gem oplysninger"}
              </button>
            </div>
          )}

          {gemtBesked && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-xs text-green-700 font-medium">Dine oplysninger er gemt.</p>
            </div>
          )}
        </div>

        {/* Din pakke */}
        {projekter.some(p => p.pakke_betalt) && (() => {
          const betaltProjekt = projekter.find(p => p.pakke_betalt);
          const pakkeNavne: Record<string, string> = {
            lille: "Mindre byggeprojekt",
            mellem: "Mellemstort byggeprojekt", renovering: "Mellemstort byggeprojekt",
            stor: "Stort byggeprojekt", totalrenovering: "Stort byggeprojekt",
          };
          const pakkeFeatures: Record<string, string[]> = {
            lille: ["Digitalt aftalegrundlag klar til underskrift", "Kopiérbar besked til håndværkeren", "Projektrum med dokumentarkiv", "Tjekliste over vigtige aftalepunkter", "Løbende rapporter"],
            mellem: ["Alt fra Mindre byggeprojekt", "Ekstraarbejde-sedler med digital godkendelse", "Betalingsplan koblet til dokumenteret fremdrift", "Afleveringsflow med tjekliste", "Mangelregistrering med billeder og status", "Løbende rapporter"],
            stor: ["Alt fra Mellemstort byggeprojekt", "Gratis online møde med byggesagkyndig (30 min.)", "Koordination på tværs af håndværkere", "Prioriteret support", "Ubegrænset dokumentopload"],
          };
          pakkeFeatures["renovering"] = pakkeFeatures["mellem"];
          pakkeFeatures["totalrenovering"] = pakkeFeatures["stor"];
          const pakkeId = betaltProjekt?.pakke ?? "mellem";
          const pakkePriser: Record<string, string> = { lille: "299", mellem: "2.499", stor: "4.999", renovering: "2.499", totalrenovering: "4.999" };
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Din pakke</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Aktiv</span>
              </div>
              <div className="flex items-start gap-4 p-4 bg-[#1e3a2a]/5 rounded-xl border border-[#1e3a2a]/10 mb-4">
                <div className="w-10 h-10 bg-[#1e3a2a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{pakkeNavne[pakkeId] ?? pakkeId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{pakkePriser[pakkeId] ?? "—"} kr. · Engangsbetaling</p>
                </div>
              </div>
              <div className="space-y-2">
                {(pakkeFeatures[pakkeId] ?? []).map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-xs text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Mine projekter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Mine projekter</h2>
            <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a2a] hover:underline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nyt projekt
            </Link>
          </div>

          {projekter.length > 0 ? (
            <div className="space-y-2">
              {projekter.map(p => (
                <Link
                  key={p.id}
                  href={`/projekt/${p.id}`}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-100 hover:border-[#1e3a2a]/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0f7f3] flex items-center justify-center text-xl flex-shrink-0">
                      {projekttypeEmoji[p.projekttype] || "📋"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors">
                        {p.adresse || projekttypeLabels[p.projekttype] || "Byggeprojekt"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Oprettet {new Date(p.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      p.status === "igang" ? "bg-green-100 text-green-700" :
                      p.status === "problem" ? "bg-red-100 text-red-700" :
                      p.status === "afsluttet" ? "bg-gray-100 text-gray-500" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {p.status === "igang" ? "I gang" :
                       p.status === "tilbud" ? "Tilbud modtaget" :
                       p.status === "accepteret" ? "Accepteret" :
                       p.status === "problem" ? "Tvist" :
                       p.status === "afsluttet" ? "Afsluttet" : "Under forberedelse"}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Du har ingen projekter endnu.</p>
            </div>
          )}
        </div>

        {/* Kontoindstillinger */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Kontoindstillinger</h2>
          <div className="space-y-1">
            <Link href="/notifikationer" className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">Notifikationer</span>
                <p className="text-xs text-gray-400">Påmindelser om deadlines, ekstraarbejde og afleveringer</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>

            <button
              onClick={logUd}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Log ud</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
