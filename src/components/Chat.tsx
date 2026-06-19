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

const startBeskeder: Besked[] = [
  { id: 1, afsender: "haandvaerker", navn: "Thomas", tekst: "Hej Camilla, jeg er i gang med gipsvæggene. Forventer at være færdig fredag.", tid: "30. apr. kl. 08:14" },
  { id: 2, afsender: "bygherre", navn: "Camilla", tekst: "Super, tak for opdateringen! Skal jeg kigge forbi inden da?", tid: "30. apr. kl. 09:22" },
  { id: 3, afsender: "haandvaerker", navn: "Thomas", tekst: "Det er ikke nødvendigt, men du er selvfølgelig velkommen. Jeg sender billeder løbende.", tid: "30. apr. kl. 09:35" },
];

export default function Chat({ bruger }: { bruger: "bygherre" | "haandvaerker" }) {
  const searchParams = useSearchParams();
  const [beskeder, setBeskeder] = useState<Besked[]>(startBeskeder);
  const [ny, setNy] = useState("");
  const [åben, setÅben] = useState(searchParams.get("chat") === "1");
  const [billedeValgt, setBilledeValgt] = useState(false);
  const bundenRef = useRef<HTMLDivElement>(null);

  const ulæste = beskeder.filter(b => b.afsender !== bruger).length;

  useEffect(() => {
    if (åben) bundenRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [beskeder, åben]);

  const sendBesked = () => {
    if (!ny.trim() && !billedeValgt) return;
    const besked: Besked = {
      id: beskeder.length + 1,
      afsender: bruger,
      navn: bruger === "bygherre" ? "Camilla" : "Thomas",
      tekst: billedeValgt ? "📷 Billede sendt" : ny,
      tid: "Nu",
      billede: billedeValgt ? "/placeholder-image.jpg" : undefined,
    };
    setBeskeder([...beskeder, besked]);
    setNy("");
    setBilledeValgt(false);
  };

  return (
    <>
      {/* Chat-knap */}
      <button
        onClick={() => setÅben(!åben)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-50"
      >
        {åben ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {!åben && ulæste > 0 && (
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
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {bruger === "bygherre" ? "T" : "C"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{bruger === "bygherre" ? "Thomas Madsen" : "Camilla Jensen"}</p>
                <p className="text-xs text-gray-400">Indvendig renovering – Valby</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online
            </span>
          </div>

          {/* Beskeder */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {beskeder.map((b) => {
              const erMig = b.afsender === bruger;
              return (
                <div key={b.id} className={`flex ${erMig ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${erMig ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {!erMig && <p className="text-xs text-gray-400 ml-1">{b.navn}</p>}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${erMig ? "bg-primary text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
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
              <div className="bg-accent rounded-xl px-3 py-2 mb-2 flex items-center justify-between">
                <span className="text-xs text-primary font-medium">📷 Billede klar til afsendelse</span>
                <button onClick={() => setBilledeValgt(false)} className="text-gray-400 hover:text-gray-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBilledeValgt(true)}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <input
                type="text"
                value={ny}
                onChange={e => setNy(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendBesked()}
                placeholder="Skriv en besked..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all"
              />
              <button
                onClick={sendBesked}
                disabled={!ny.trim() && !billedeValgt}
                className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
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
