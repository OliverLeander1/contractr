"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Besked = {
  id: number;
  afsender: "bygherre" | "haandvaerker";
  navn: string;
  tekst: string;
  tid: string;
  billede?: string;
};

export default function Chat({ bruger, projektId }: { bruger: "bygherre" | "haandvaerker"; projektId?: string }) {
  const searchParams = useSearchParams();
  const [beskeder, setBeskeder] = useState<Besked[]>([]);
  const [ny, setNy] = useState("");
  const [åben, setÅben] = useState(searchParams.get("chat") === "1");
  const [billedeValgt, setBilledeValgt] = useState(false);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [modpartNavn, setModpartNavn] = useState("");
  const [projektTitel, setProjektTitel] = useState("Projekt");
  const bundenRef = useRef<HTMLDivElement>(null);
  const chatKey = `contractr_chat_${projektId || "1"}`;

  useEffect(() => {
    // Læs navne fra localStorage
    try {
      const rawBruger = localStorage.getItem("contractr_user");
      const rawProjekt = localStorage.getItem("contractr_projekt");

      let bygherreNavn = "";
      let haandvaerkerNavn = "";

      if (rawProjekt) {
        const p = JSON.parse(rawProjekt);
        if (p.navn) bygherreNavn = p.navn;
        if (p.haandvaerkerNavn) haandvaerkerNavn = p.haandvaerkerNavn;
        if (p.adresse) setProjektTitel(p.adresse);
        else if (p.projekttype) setProjektTitel(p.projekttype);
      }
      if (rawBruger) {
        const b = JSON.parse(rawBruger);
        if (bruger === "bygherre") {
          if (b.navn) bygherreNavn = b.navn;
        } else {
          if (b.navn) haandvaerkerNavn = b.navn;
        }
      }

      const mitNavn = bruger === "bygherre" ? bygherreNavn : haandvaerkerNavn;
      const modNavn = bruger === "bygherre" ? haandvaerkerNavn : bygherreNavn;

      setBrugerNavn(mitNavn || (bruger === "bygherre" ? "Bygherre" : "Håndværker"));
      setModpartNavn(modNavn || (bruger === "bygherre" ? "Håndværker" : "Bygherre"));

      // Læs gemte beskeder
      const rawChat = localStorage.getItem(chatKey);
      if (rawChat) setBeskeder(JSON.parse(rawChat));
    } catch { /* ignore */ }
  }, [bruger, chatKey]);

  useEffect(() => {
    if (åben) bundenRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [beskeder, åben]);

  const sendBesked = () => {
    if (!ny.trim() && !billedeValgt) return;
    const tid = new Date().toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(",", " kl.");
    const besked: Besked = {
      id: Date.now(),
      afsender: bruger,
      navn: brugerNavn,
      tekst: billedeValgt ? "📷 Billede sendt" : ny,
      tid,
    };
    const nyListe = [...beskeder, besked];
    setBeskeder(nyListe);
    try { localStorage.setItem(chatKey, JSON.stringify(nyListe)); } catch { /* ignore */ }
    setNy("");
    setBilledeValgt(false);
  };

  const ulæste = beskeder.filter(b => b.afsender !== bruger).length;

  const modpartInitial = modpartNavn ? modpartNavn[0].toUpperCase() : (bruger === "bygherre" ? "H" : "B");

  return (
    <>
      {/* Chat-knap */}
      <button
        onClick={() => setÅben(!åben)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1e3a2a] text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-50"
      >
        {åben ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {ulæste > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{ulæste}</span>
            )}
          </div>
        )}
      </button>

      {/* Chat-vindue */}
      {åben && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 flex flex-col" style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-semibold text-sm">
                {modpartInitial}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{modpartNavn}</p>
                <p className="text-xs text-gray-400">{projektTitel}</p>
              </div>
            </div>
            <button onClick={() => setÅben(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Beskeder */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {beskeder.length === 0 && (
              <div className="text-center py-10">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-sm text-gray-400">Ingen beskeder endnu.</p>
                <p className="text-xs text-gray-300 mt-1">Send den første besked herunder.</p>
              </div>
            )}
            {beskeder.map((b) => {
              const erMig = b.afsender === bruger;
              return (
                <div key={b.id} className={`flex ${erMig ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${erMig ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {!erMig && <p className="text-xs text-gray-400 ml-1">{b.navn}</p>}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${erMig ? "bg-[#1e3a2a] text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                      {b.tekst}
                    </div>
                    <p className="text-[10px] text-gray-400 mx-1">{b.tid}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bundenRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            {billedeValgt && (
              <div className="bg-[#f0f7f3] rounded-xl px-3 py-2 mb-2 flex items-center justify-between">
                <span className="text-xs text-[#1e3a2a] font-medium">📷 Billede klar til afsendelse</span>
                <button onClick={() => setBilledeValgt(false)} className="text-gray-400 hover:text-gray-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBilledeValgt(true)}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1e3a2a] hover:border-[#1e3a2a]/30 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <input
                type="text"
                value={ny}
                onChange={e => setNy(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendBesked()}
                placeholder="Skriv en besked..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] transition-all"
              />
              <button
                onClick={sendBesked}
                disabled={!ny.trim() && !billedeValgt}
                className="w-9 h-9 bg-[#1e3a2a] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
