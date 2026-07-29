"use client";

import { useState } from "react";
import { PAKKER, anbefalPakke } from "@/app/pakke/page";

interface Props {
  projekttype: string;
  projektId: string;
  email: string;
  navn: string;
  brugerId: string;
  onLuk: () => void;
}

export default function PakkePop({ projekttype, projektId, email, navn, brugerId, onLuk }: Props) {
  const anbefalet = anbefalPakke(projekttype);
  const [valgt, setValgt] = useState(anbefalet);
  const [betaler, setBetaler] = useState(false);
  const [fejl, setFejl] = useState("");

  const valgtPakke = PAKKER.find(p => p.id === valgt)!;
  const anbefaletPakke = PAKKER.find(p => p.id === anbefalet)!;

  const startBetaling = async () => {
    if (!email) return;
    setBetaler(true);
    setFejl("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, navn, pakke: valgt, projekt_id: projektId, bruger_id: brugerId }),
      });
      const data = await res.json();
      if (data.error) { setFejl(data.error); setBetaler(false); return; }
      window.location.href = data.url;
    } catch (e) {
      setFejl(e instanceof Error ? e.message : "Netværksfejl");
      setBetaler(false);
    }
  };

  const projekttypeLabel: Record<string, string> = {
    badevarelse: "badeværelse", kokken: "køkken", tag: "tagprojekt",
    tilbygning: "tilbygning", totalrenovering: "totalrenovering",
    vinduer: "vindues- og facadeprojekt", maler: "maler- og gipsprojekt",
    carport: "carport/garage", vaadrum: "vådrum", andet: "byggeprojekt",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-[#1e3a2a] rounded-t-3xl px-7 py-6 relative">
          <button onClick={onLuk} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Pakkeanbefaling</p>
          <h2 className="text-white text-xl font-bold">
            Til et {projekttypeLabel[projekttype] || "byggeprojekt"} anbefaler vi{" "}
            <span className="text-white underline decoration-white/40">{anbefaletPakke.navn}-pakken</span>
          </h2>
          <p className="text-white/60 text-sm mt-1">Du kan altid skifte pakke herunder</p>
        </div>

        <div className="p-6 space-y-4">

          {/* Pakke-valg — kompakt */}
          <div className="grid grid-cols-3 gap-3">
            {PAKKER.map(pakke => {
              const erValgt = valgt === pakke.id;
              const erAnbefalet = pakke.id === anbefalet;
              return (
                <button
                  key={pakke.id}
                  onClick={() => setValgt(pakke.id)}
                  className={`relative text-left rounded-2xl border-2 p-4 transition-all ${
                    erValgt
                      ? "border-[#1e3a2a] bg-[#1e3a2a]/5"
                      : "border-[#e0ddd6] bg-white hover:border-[#1e3a2a]/30"
                  }`}
                >
                  {erAnbefalet && (
                    <div className="absolute -top-2.5 left-3 bg-[#1e3a2a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Anbefalet
                    </div>
                  )}
                  <p className={`font-bold text-sm mb-0.5 ${erValgt ? "text-[#1e3a2a]" : "text-gray-900"}`}>{pakke.navn}</p>
                  <p className="text-lg font-bold text-gray-900">{pakke.pris.toLocaleString("da-DK")} <span className="text-xs font-normal text-gray-400">kr.</span></p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-tight">{pakke.eksempler}</p>
                  {erValgt && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#1e3a2a] flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-[11px] font-semibold text-[#1e3a2a]">Valgt</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hvad er inkluderet */}
          <div className="bg-[#f5f3ee] rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{valgtPakke.navn}-pakken inkluderer</p>
            <div className="space-y-1.5">
              {valgtPakke.features.map(f => (
                <div key={f} className="flex items-start gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-xs text-gray-700 leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Betal */}
          <div className="space-y-3">
            <button
              onClick={startBetaling}
              disabled={betaler}
              className="w-full py-4 rounded-xl text-sm font-bold bg-[#1e3a2a] text-white hover:bg-[#162d20] transition-colors disabled:opacity-60 shadow-md shadow-[#1e3a2a]/20"
            >
              {betaler ? "Sender til betaling..." : `Fortsæt med ${valgtPakke.navn} — ${valgtPakke.pris.toLocaleString("da-DK")} kr.`}
            </button>

            {fejl && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs text-red-700">{fejl}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="text-xs text-gray-400">Engangsbetaling</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <p className="text-xs text-gray-400">30 dages garanti</p>
                </div>
              </div>
              <button onClick={onLuk} className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline">
                Ikke nu
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
