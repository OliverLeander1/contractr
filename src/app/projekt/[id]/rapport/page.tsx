"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Projekt {
  id: string;
  projekttype: string;
  adresse?: string;
  budget?: number;
  status: string;
  pakke?: string;
  pakke_betalt?: boolean;
  oprettet_at: string;
  beskrivelse?: string;
}

interface Ekstraarbejde {
  id: string;
  beskrivelse: string;
  pris?: number;
  godkendt: boolean;
  oprettet_at: string;
}

interface Mangel {
  id: string;
  beskrivelse: string;
  alvorlighed: string;
  status: string;
  oprettet_at: string;
}

const PAKKER_MED_RAPPORT = ["mellem", "stor", "renovering", "totalrenovering"];

const projekttypeLabel: Record<string, string> = {
  badevarelse: "Badeværelse", kokken: "Køkken", tag: "Tag",
  tilbygning: "Tilbygning", totalrenovering: "Totalrenovering",
  vinduer: "Vinduer og facade", maler: "Maler og gips",
  carport: "Carport og garage", vaadrum: "Vådrum", andet: "Generel renovering",
};

export default function RapportSide() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [projekt, setProjekt] = useState<Projekt | null>(null);
  const [ekstraarbejder, setEkstraarbejder] = useState<Ekstraarbejde[]>([]);
  const [mangler, setMangler] = useState<Mangel[]>([]);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [indlæser, setIndlæser] = useState(true);
  const [adgang, setAdgang] = useState(true);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
      if (profil?.navn) setBrugerNavn(profil.navn);

      const { data: p } = await supabase.from("projekter")
        .select("*").eq("id", id).eq("bygherre_id", user.id).single();

      if (!p) { router.push("/dashboard"); return; }
      setProjekt(p);

      if (!p.pakke_betalt || !PAKKER_MED_RAPPORT.includes(p.pakke ?? "")) {
        setAdgang(false);
        setIndlæser(false);
        return;
      }

      const [{ data: ea }, { data: ma }] = await Promise.all([
        supabase.from("ekstraarbejder").select("*").eq("projekt_id", id).order("oprettet_at"),
        supabase.from("mangler").select("*").eq("projekt_id", id).order("oprettet_at"),
      ]);

      setEkstraarbejder(ea ?? []);
      setMangler(ma ?? []);
      setIndlæser(false);
    };
    hent();
  }, [id, router]);

  if (indlæser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!adgang) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Rapporter kræver Mellemstort eller Stort byggeprojekt</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">Opgrader din pakke for at udtrække statusrapporter fra dette projekt.</p>
        <Link href="/pakke" className="block w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
          Se pakker
        </Link>
        <Link href={`/projekt/${id}`} className="block mt-3 text-sm text-gray-400 hover:text-gray-600">← Tilbage til projektet</Link>
      </div>
    </div>
  );

  const dato = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  const ekstraTotal = ekstraarbejder.reduce((sum, e) => sum + (e.pris ?? 0), 0);
  const godkendteEkstra = ekstraarbejder.filter(e => e.godkendt);
  const åbneMangler = mangler.filter(m => m.status !== "afsluttet");

  return (
    <div className="min-h-screen bg-[#f5f3ee]">

      {/* Nav — skjules ved print */}
      <nav className="bg-white border-b border-[#e0ddd6] px-6 py-4 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={`/projekt/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tilbage til projektet
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1e3a2a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Udskriv / gem som PDF
          </button>
        </div>
      </nav>

      {/* Rapport */}
      <div className="max-w-3xl mx-auto px-6 py-10 print:py-0 print:px-0">

        {/* Header */}
        <div className="bg-[#1e3a2a] rounded-2xl print:rounded-none px-8 py-7 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-300/60 text-xs uppercase tracking-widest mb-1">Statusrapport</p>
              <h1 className="text-2xl font-bold mb-1">
                {projekt?.adresse || projekttypeLabel[projekt?.projekttype ?? ""] || "Byggeprojekt"}
              </h1>
              <p className="text-green-200/70 text-sm">{brugerNavn} · Genereret {dato}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full mt-1 ${
              projekt?.status === "igang" ? "bg-green-400/20 text-green-300" :
              projekt?.status === "afsluttet" ? "bg-white/20 text-white/70" :
              "bg-amber-400/20 text-amber-300"
            }`}>
              {projekt?.status === "igang" ? "I gang" :
               projekt?.status === "afsluttet" ? "Afsluttet" :
               projekt?.status === "tilbud" ? "Tilbud modtaget" : "Under forberedelse"}
            </span>
          </div>
        </div>

        {/* Projektoverblik */}
        <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">Projektoverblik</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Projekttype", value: projekttypeLabel[projekt?.projekttype ?? ""] ?? projekt?.projekttype },
              { label: "Pakke", value: projekt?.pakke === "stor" || projekt?.pakke === "totalrenovering" ? "Stort byggeprojekt" : "Mellemstort byggeprojekt" },
              { label: "Budget", value: projekt?.budget ? `${projekt.budget.toLocaleString("da-DK")} kr.` : "Ikke angivet" },
              { label: "Oprettet", value: new Date(projekt?.oprettet_at ?? "").toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" }) },
            ].map(r => (
              <div key={r.label} className="bg-[#f5f3ee] rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{r.label}</p>
                <p className="text-sm font-semibold text-gray-900">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ekstraarbejder */}
        <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Ekstraarbejder</h2>
            {ekstraarbejder.length > 0 && (
              <span className="text-xs text-gray-500">{godkendteEkstra.length} godkendt · {ekstraTotal.toLocaleString("da-DK")} kr. i alt</span>
            )}
          </div>
          {ekstraarbejder.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Ingen ekstraarbejder registreret.</p>
          ) : (
            <div className="space-y-2">
              {ekstraarbejder.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-[#f0ede8]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${e.godkendt ? "bg-[#1e3a2a]" : "border border-gray-200"}`}>
                      {e.godkendt && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <p className="text-sm text-gray-700">{e.beskrivelse}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-4">
                    {e.pris ? `${e.pris.toLocaleString("da-DK")} kr.` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mangler */}
        <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Registrerede mangler</h2>
            {åbneMangler.length > 0 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">{åbneMangler.length} åbne</span>
            )}
          </div>
          {mangler.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Ingen mangler registreret.</p>
          ) : (
            <div className="space-y-2">
              {mangler.map(m => (
                <div key={m.id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl border border-[#f0ede8]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                    m.alvorlighed === "kritisk" ? "bg-red-100 text-red-700" :
                    m.alvorlighed === "alvorlig" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{m.alvorlighed}</span>
                  <p className="text-sm text-gray-700 flex-1">{m.beskrivelse}</p>
                  <span className={`text-[10px] font-semibold flex-shrink-0 mt-0.5 ${m.status === "afsluttet" ? "text-green-600" : "text-gray-400"}`}>
                    {m.status === "afsluttet" ? "Løst" : "Åben"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidefod */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">Rapport genereret af Nembyggestyring · {dato}</p>
        </div>

      </div>

      <style>{`
        @media print {
          nav { display: none !important; }
          body { background: white !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
