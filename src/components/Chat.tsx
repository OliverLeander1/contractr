"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface Besked {
  id: string;
  afsender_id: string | null;
  afsender_navn: string;
  indhold: string;
  sendt_at: string;
}

export default function Chat({ bruger, projektId }: { bruger: "bygherre" | "haandvaerker"; projektId?: string }) {
  const [åben, setÅben] = useState(false);
  const [beskeder, setBeskeder] = useState<Besked[]>([]);
  const [ny, setNy] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [samtaleId, setSamtaleId] = useState<string | null>(null);
  const [sender, setSender] = useState(false);
  const bundenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projektId) return;
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profil } = await supabase.from("profiler").select("navn").eq("id", user.id).single();
        setBrugerNavn(profil?.navn || user.email?.split("@")[0] || bruger);
      }
      const res = await fetch(`/api/chat?projekt_id=${projektId}`);
      if (res.ok) {
        const d = await res.json();
        setBeskeder(d.beskeder ?? []);
        setSamtaleId(d.samtaleId);
      }
    };
    init();
  }, [projektId, bruger]);

  // Realtime subscription
  useEffect(() => {
    if (!samtaleId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-widget-${samtaleId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_beskeder",
        filter: `samtale_id=eq.${samtaleId}`,
      }, (payload) => {
        setBeskeder(prev => {
          const ny = payload.new as Besked;
          if (prev.some(b => b.id === ny.id)) return prev;
          return [...prev, ny];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [samtaleId]);

  useEffect(() => {
    if (åben) bundenRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [beskeder, åben]);

  const sendBesked = async () => {
    if (!ny.trim() || !projektId) return;
    setSender(true);
    const tekst = ny.trim();
    setNy("");
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projekt_id: projektId,
        afsender_id: userId,
        afsender_navn: brugerNavn,
        afsender_rolle: bruger,
        indhold: tekst,
      }),
    });
    setSender(false);
  };

  const modpartInitial = bruger === "bygherre" ? "H" : "B";
  const modpartLabel = bruger === "bygherre" ? "Håndværker" : "Bygherre";

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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
                <p className="text-sm font-semibold text-gray-900">{modpartLabel}</p>
                <p className="text-xs text-gray-400">Projektchat</p>
              </div>
            </div>
            <button onClick={() => setÅben(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Beskeder */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {beskeder.length === 0 && (
              <div className="text-center text-sm text-gray-400 mt-10">
                Ingen beskeder endnu. Send den første!
              </div>
            )}
            {beskeder.map(b => {
              const erMin = b.afsender_id === userId || (!b.afsender_id && b.afsender_navn === brugerNavn);
              return (
                <div key={b.id} className={`flex ${erMin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${erMin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <p className="text-[10px] text-gray-400">{b.afsender_navn}</p>
                    <div className={`px-4 py-3 rounded-2xl text-sm ${erMin ? "bg-[#1e3a2a] text-white" : "bg-gray-100 text-gray-800"}`}>
                      {b.indhold}
                    </div>
                    <p className="text-[10px] text-gray-300">
                      {new Date(b.sendt_at).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bundenRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={ny}
                onChange={e => setNy(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendBesked()}
                placeholder="Skriv en besked..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
              <button
                onClick={sendBesked}
                disabled={!ny.trim() || sender}
                className="w-10 h-10 bg-[#1e3a2a] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
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
