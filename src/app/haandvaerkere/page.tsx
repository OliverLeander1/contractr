"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SimpleNav from "@/components/SimpleNav";
import { createClient } from "@/lib/supabase";

interface HaandvaerkerProfil {
  id: string;
  navn: string | null;
  virksomhed: string | null;
  fag: string | null;
  email: string | null;
  postnummer: string | null;
  by: string | null;
  standby: boolean;
  oprettet_at: string;
}

const FAGS = [
  "Alle fag",
  "Hovedentreprenør", "Totalentreprenør", "Tømrer", "Murer",
  "VVS", "Elektriker", "Maler", "Gulvlægger", "Blikkenslager",
  "Snedker", "Smed", "Kloakmester", "Facademontør",
];

export default function HaandvaererDirectory() {
  const supabase = createClient();
  const [profiler, setProfiler]     = useState<HaandvaerkerProfil[]>([]);
  const [filtreret, setFiltreret]   = useState<HaandvaerkerProfil[]>([]);
  const [indlæser, setIndlæser]     = useState(true);
  const [søgning, setSøgning]       = useState("");
  const [valgtFag, setValgtFag]     = useState("Alle fag");

  useEffect(() => {
    const hent = async () => {
      const { data } = await supabase
        .from("profiler")
        .select("id, navn, virksomhed, fag, email, postnummer, by, standby, oprettet_at")
        .eq("rolle", "haandvaerker")
        .eq("tilgaengelig", true)
        .order("standby", { ascending: true })
        .order("oprettet_at", { ascending: false });
      setProfiler(data || []);
      setFiltreret(data || []);
      setIndlæser(false);
    };
    hent();
  }, []);

  useEffect(() => {
    let res = profiler;
    if (valgtFag !== "Alle fag") {
      res = res.filter(p => p.fag?.toLowerCase().includes(valgtFag.toLowerCase()));
    }
    if (søgning.trim()) {
      const s = søgning.toLowerCase();
      res = res.filter(p =>
        p.navn?.toLowerCase().includes(s) ||
        p.virksomhed?.toLowerCase().includes(s) ||
        p.fag?.toLowerCase().includes(s) ||
        p.by?.toLowerCase().includes(s) ||
        p.postnummer?.includes(s)
      );
    }
    setFiltreret(res);
  }, [søgning, valgtFag, profiler]);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <SimpleNav tilbage="/" tilbageLabel="Forsiden" />

      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="mb-10">
          <span className="text-xs font-semibold text-[#1e3a2a] uppercase tracking-widest">Entreprenører</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-3">Find en entreprenør i dit område</h1>
          <p className="text-gray-500 max-w-lg leading-relaxed">
            Alle entreprenører herunder er registreret på platformen og kan inviteres direkte ind på dit projekt.
          </p>
        </div>

        {/* Søg og filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Søg på navn, firma, by eller postnummer..."
              value={søgning}
              onChange={e => setSøgning(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#e0ddd6] rounded-xl text-sm bg-white focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
            />
          </div>
          <select
            value={valgtFag}
            onChange={e => setValgtFag(e.target.value)}
            className="border border-[#e0ddd6] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1e3a2a] text-gray-700"
          >
            {FAGS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : filtreret.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e0ddd6] p-12 text-center">
            <div className="text-3xl mb-4">🔍</div>
            <p className="font-semibold text-gray-900 mb-1">
              {profiler.length === 0 ? "Ingen entreprenører registreret endnu" : "Ingen resultater"}
            </p>
            <p className="text-sm text-gray-400">
              {profiler.length === 0
                ? "Bliv den første — opret en gratis entreprenørprofil."
                : "Prøv at ændre dit søgekriterium."}
            </p>
            {profiler.length === 0 && (
              <Link href="/haandvaerker/opret-konto"
                className="inline-block mt-5 bg-[#1e3a2a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                Opret gratis profil
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{filtreret.length} entreprenør{filtreret.length !== 1 ? "er" : ""} fundet</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {filtreret.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#1e3a2a]/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#1e3a2a] font-bold text-lg">
                      {(p.navn || p.virksomhed || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 truncate">{p.navn || "Ikke angivet"}</p>
                        {p.standby && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">Travlt</span>
                        )}
                      </div>
                      {p.virksomhed && <p className="text-sm text-gray-500 truncate">{p.virksomhed}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.fag && (
                          <span className="text-xs bg-[#1e3a2a]/8 text-[#1e3a2a] px-2 py-0.5 rounded-full font-medium">
                            {p.fag}
                          </span>
                        )}
                        {p.by && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {p.postnummer ? `${p.postnummer} ` : ""}{p.by}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Medlem siden {new Date(p.oprettet_at).getFullYear()}
                    </p>
                    {p.email && (
                      <a href={`mailto:${p.email}`}
                        className="text-xs font-semibold text-[#1e3a2a] hover:underline">
                        Kontakt →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA til håndværkere */}
        <div className="mt-10 bg-[#1e3a2a] rounded-2xl p-6 text-center">
          <p className="text-green-200/60 text-xs uppercase tracking-widest mb-2">For entreprenører</p>
          <h3 className="text-white font-bold text-lg mb-2">Er du håndværker eller entreprenør?</h3>
          <p className="text-green-200/70 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
            Opret en gratis profil og bliv synlig for bygherrer i dit område. Du modtager invitationer direkte på platformen.
          </p>
          <Link href="/haandvaerker/opret-konto"
            className="inline-flex items-center gap-2 bg-white text-[#1e3a2a] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#f5f3ee] transition-colors">
            Opret gratis profil →
          </Link>
        </div>
      </div>
    </div>
  );
}
