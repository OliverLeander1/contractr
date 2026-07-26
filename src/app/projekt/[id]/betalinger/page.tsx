"use client";

import { use, useEffect, useState, useCallback } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import { createClient } from "@/lib/supabase";

interface Betaling {
  id: string;
  projekt_id: string;
  beskrivelse: string;
  beloeb: number;
  status: "afventer" | "markeret-faerdig" | "godkendt" | "betalt";
  markeret_af: string | null;
  godkendt_af: string | null;
  godkendt_at: string | null;
  sorteret_index: number;
}

interface Kontrakt {
  projekt_id: string;
  total_pris: number | null;
  haandvaerker_email: string;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const STANDARD_FASER = [
  { index: 0, beskrivelse: "Opstart: mobilisering og materialer", pct: 20 },
  { index: 1, beskrivelse: "Halvvejs: første store fase afsluttet", pct: 30 },
  { index: 2, beskrivelse: "Næsten færdig: 80% af arbejde udført", pct: 30 },
  { index: 3, beskrivelse: "Aflevering: alt arbejde godkendt", pct: 20 },
];

export default function Betalinger({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [userId, setUserId]         = useState<string | null>(null);
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [betalinger, setBetalinger] = useState<Betaling[]>([]);
  const [kontrakt, setKontrakt]     = useState<Kontrakt | null>(null);
  const [indlæser, setIndlæser]     = useState(true);
  const [opretter, setOpretter]     = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); setUserEmail(user.email ?? null); }
    });
  }, []);

  const hentData = useCallback(async () => {
    setIndlæser(true);
    const [{ data: k }, { data: b }] = await Promise.all([
      supabase.from("kontrakter").select("projekt_id,total_pris,haandvaerker_email").eq("projekt_id", id).maybeSingle(),
      supabase.from("betalinger").select("*").eq("projekt_id", id).order("sorteret_index"),
    ]);
    setKontrakt(k);
    setBetalinger(b || []);
    setIndlæser(false);
  }, [id]);

  useEffect(() => { hentData(); }, [hentData]);

  async function opretStandardplan() {
    if (!userId || opretter) return;
    setOpretter(true);
    const total = kontrakt?.total_pris ?? 0;
    await supabase.from("betalinger").insert(
      STANDARD_FASER.map(f => ({
        projekt_id: id,
        beskrivelse: f.beskrivelse,
        beloeb: Math.round(total * f.pct / 100),
        status: "afventer",
        sorteret_index: f.index,
      }))
    );
    setOpretter(false);
    hentData();
  }

  async function markerFaerdig(bet_id: string) {
    if (!userId) return;
    await supabase.from("betalinger").update({ status: "markeret-faerdig", markeret_af: userId }).eq("id", bet_id);
    setBetalinger(p => p.map(b => b.id === bet_id ? { ...b, status: "markeret-faerdig" as const, markeret_af: userId } : b));
  }

  async function godkend(bet_id: string) {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from("betalinger").update({ status: "godkendt", godkendt_af: userId, godkendt_at: now }).eq("id", bet_id);
    setBetalinger(p => p.map(b => b.id === bet_id ? { ...b, status: "godkendt" as const, godkendt_af: userId, godkendt_at: now } : b));
  }

  const erHaandvaerker = !!(userEmail && kontrakt?.haandvaerker_email &&
    userEmail.toLowerCase() === kontrakt.haandvaerker_email.toLowerCase());

  const total     = kontrakt?.total_pris ?? 0;
  const udbetalt  = betalinger.filter(b => b.status === "godkendt" || b.status === "betalt").reduce((s, b) => s + b.beloeb, 0);
  const pct       = total > 0 ? Math.round((udbetalt / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Betalinger</h1>
          <p className="text-sm text-gray-400 mt-1">Betaling frigives fase for fase i takt med dokumenteret fremdrift</p>
        </div>

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : betalinger.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen betalingsplan oprettet</p>
            <p className="text-sm text-gray-400 mb-6">
              {total > 0 ? `Kontraktsum: ${fmtKr(total)}. Opret en standard betalingsplan fordelt på 4 faser.` : "Ingen kontraktsum fundet."}
            </p>
            {!erHaandvaerker && (
              <button onClick={opretStandardplan} disabled={opretter}
                className="px-6 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40">
                {opretter ? "Opretter..." : "Opret standard betalingsplan"}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Samlet fremgang</p>
                  <p className="text-2xl font-bold text-gray-900">{fmtKr(udbetalt)}</p>
                  <p className="text-sm text-gray-400">af {fmtKr(total)}</p>
                </div>
                <span className="text-3xl font-bold text-[#1e3a2a]">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1e3a2a] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {betalinger.map((b, i) => {
                const erGodkendt = b.status === "godkendt" || b.status === "betalt";
                return (
                  <div key={b.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${erGodkendt ? "border-green-100" : "border-gray-100"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        erGodkendt ? "bg-green-100" : b.status === "markeret-faerdig" ? "bg-amber-100" : "bg-gray-100"
                      }`}>
                        {erGodkendt ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : b.status === "markeret-faerdig" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{b.beskrivelse}</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{fmtKr(b.beloeb)}</p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${
                            erGodkendt ? "bg-green-100 text-green-700" :
                            b.status === "markeret-faerdig" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {b.status === "afventer" ? "Afventer fremdrift" :
                             b.status === "markeret-faerdig" ? "Fremdrift markeret" :
                             b.status === "godkendt" ? "Godkendt" : "Betalt"}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {erHaandvaerker && b.status === "afventer" && (
                            <button onClick={() => markerFaerdig(b.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                              Marker fremdrift som opnået
                            </button>
                          )}
                          {!erHaandvaerker && b.status === "markeret-faerdig" && (
                            <button onClick={() => godkend(b.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                              Godkend og frigiv betaling
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <ABTip type="info" paragraf="AB-Forbruger § 25 og § 37" titel="Betaling skal følge dokumenteret fremdrift"
          resumé="Betal aldrig et nyt afdrag, før den aftalte fase er dokumenteret og godkendt."
          detaljer="AB-Forbruger § 25 og § 37 fastslår at betaling skal ske i takt med arbejdets fremdrift. Du er ikke forpligtet til at betale forud for udførelsen." />
      </div>
    </div>
  );
}
