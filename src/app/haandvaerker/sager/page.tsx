"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Kontrakt {
  id: string;
  projekt_id: string;
  titel: string | null;
  haandvaerker_navn: string | null;
  total_pris: number | null;
  status: string;
  oprettet_at: string;
  haandvaerker_godkendt_at: string | null;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

export default function HaandvaerkerSager() {
  const supabase = createClient();
  const [kontrakter, setKontrakter] = useState<Kontrakt[]>([]);
  const [navn, setNavn]   = useState("");
  const [firma, setFirma] = useState("");
  const [initials, setInitials] = useState("H");
  const [indlæser, setIndlæser] = useState(true);

  const hentData = useCallback(async () => {
    setIndlæser(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIndlæser(false); return; }

    const [{ data: profil }, sagerRes] = await Promise.all([
      supabase.from("profiler").select("navn,firma").eq("id", user.id).maybeSingle(),
      fetch(`/api/haandvaerker/sager?email=${encodeURIComponent(user.email ?? "")}`).then(r => r.json()),
    ]);

    if (profil) {
      const n = profil.navn || "";
      setNavn(n);
      setFirma(profil.firma || "");
      setInitials(n ? n.split(" ").map((x: string) => x[0]).join("").toUpperCase().slice(0, 2) : "E");
    }
    setKontrakter(Array.isArray(sagerRes) ? sagerRes : []);
    setIndlæser(false);
  }, []);

  useEffect(() => { hentData(); }, [hentData]);

  const aktive     = kontrakter.filter(k => k.status !== "afsluttet");
  const afsluttede = kontrakter.filter(k => k.status === "afsluttet");
  const samletVærdi = aktive.reduce((s, k) => s + (k.total_pris ?? 0), 0);
  const afventer    = aktive.filter(k => k.status === "afventer" || k.status === "sendt").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <span className="logo">contractr</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/haandvaerker/nyt-tilbud"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold bg-[#1e3a2a] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nyt tilbud
            </Link>
            <Link href="/haandvaerker/profil" className="w-8 h-8 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white font-semibold text-sm hover:opacity-90 transition-opacity" title="Min profil">
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mine sager</h1>
          {navn && <p className="text-sm text-gray-400 mt-1">{navn}{firma ? ` · ${firma}` : ""}</p>}
        </div>

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : kontrakter.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#1e3a2a]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Ingen sager endnu</h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed mb-6">
              Opret dit første digitale tilbud og send det direkte til en bygherre. Når de accepterer, dukker sagen op her.
            </p>
            <Link href="/haandvaerker/nyt-tilbud"
              className="inline-flex items-center justify-center gap-2 bg-[#1e3a2a] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Opret nyt tilbud
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Aktive sager</p>
                <p className="text-3xl font-bold text-[#1e3a2a]">{aktive.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Afventer svar</p>
                <p className="text-3xl font-bold text-amber-500">{afventer}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-1">Samlet tilbudsværdi</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{fmtKr(samletVærdi)}</p>
              </div>
            </div>

            {aktive.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aktive sager</h2>
                <div className="space-y-3">
                  {aktive.map(k => (
                    <Link key={k.id} href={`/haandvaerker/projekt/${k.projekt_id}`}
                      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#1e3a2a]/30 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors truncate">
                              {k.titel || "Projekt"}
                            </h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              k.status === "accepteret" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {k.status === "accepteret" ? "Accepteret" : "Afventer"}
                            </span>
                          </div>
                          {k.haandvaerker_navn && <p className="text-sm text-gray-500 mb-2">{k.haandvaerker_navn}</p>}
                          <p className="text-xs text-gray-400">Sendt {fmtDato(k.oprettet_at)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{k.total_pris ? fmtKr(k.total_pris) : "—"}</p>
                          <p className="text-xs text-gray-400 mt-0.5">inkl. moms</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {afsluttede.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Afsluttede</h2>
                <div className="space-y-3">
                  {afsluttede.map(k => (
                    <div key={k.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 opacity-60">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{k.titel || "Projekt"}</h3>
                            <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Afsluttet</span>
                          </div>
                          {k.haandvaerker_navn && <p className="text-sm text-gray-400">{k.haandvaerker_navn}</p>}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{k.total_pris ? fmtKr(k.total_pris) : "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
