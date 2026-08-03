"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";

interface Besked {
  id: string;
  afsender_id: string;
  afsender_navn: string;
  afsender_rolle: string;
  indhold: string;
  sendt_at: string;
}

const FEJLTEKSTER: Record<number, string> = {
  401: "Log ind for at bruge chatten.",
  403: "Du har ikke adgang til denne samtale.",
  404: "Samtalen eller kontrakten blev ikke fundet.",
  422: "Kontrakten mangler håndværkerens e-mail. Inviter håndværkeren fra Aftale-fanen.",
};

function tidKort(iso: string) {
  const d = new Date(iso);
  const nu = new Date();
  if (d.toDateString() === nu.toDateString()) {
    return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function initials(navn: string) {
  return navn.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
}

export default function KontraktChat({ params }: { params: Promise<{ id: string; kontraktId: string }> }) {
  const { id, kontraktId } = use(params);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [samtaleId, setSamtaleId] = useState<string | null>(null);
  const [beskeder, setBeskeder] = useState<Besked[]>([]);
  const [tekst, setTekst] = useState("");
  const [sender, setSender] = useState(false);
  const [indlæser, setIndlæser] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hentBeskeder = useCallback(async (accessToken: string) => {
    const res = await fetch(`/api/chat/beskeder?kontrakt_id=${encodeURIComponent(kontraktId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      setFejl(FEJLTEKSTER[res.status] ?? "Beskeder kunne ikke hentes.");
      return;
    }
    const data = await res.json();
    setBeskeder(data.beskeder ?? []);
  }, [kontraktId]);

  const åbnSamtale = useCallback(async (accessToken: string): Promise<string | null> => {
    const res = await fetch("/api/chat/samtale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ kontrakt_id: kontraktId }),
    });
    if (!res.ok) {
      setFejl(FEJLTEKSTER[res.status] ?? "Der opstod en fejl. Prøv at genindlæse siden.");
      setIndlæser(false);
      return null;
    }
    const data = await res.json();
    return data.samtale_id as string;
  }, [kontraktId]);

  useEffect(() => {
    async function initialisér() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setFejl("Log ind for at bruge chatten.");
        setIndlæser(false);
        return;
      }
      setUserId(session.user.id);
      setToken(session.access_token);

      const samId = await åbnSamtale(session.access_token);
      if (!samId) return;

      setSamtaleId(samId);
      await hentBeskeder(session.access_token);
      setIndlæser(false);
    }
    initialisér();
  }, [åbnSamtale, hentBeskeder]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [beskeder]);

  async function sendBesked() {
    const trimmet = tekst.trim();
    if (!trimmet || sender || !token) return;

    setSender(true);
    setTekst("");

    const res = await fetch("/api/chat/beskeder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kontrakt_id: kontraktId, indhold: trimmet }),
    });

    if (!res.ok) {
      setTekst(trimmet);
    } else {
      await hentBeskeder(token);
    }

    setSender(false);
    inputRef.current?.focus();
  }

  if (!indlæser && fejl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="font-semibold text-gray-800 mb-2">{fejl}</p>
          <Link href={`/projekt/${id}/chat`} className="text-sm text-[#1e3a2a] font-semibold hover:underline">
            Tilbage til samtaler
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjektNav id={id} />

      <div className="flex flex-col flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/projekt/${id}/chat`}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors flex-shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </Link>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-none">Samtale</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">Kontraktspecifik chat</p>
            </div>
          </div>
          <button
            onClick={() => token && hentBeskeder(token)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Opdater
          </button>
        </div>

        {/* Beskeder */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="max-w-2xl mx-auto">
            {indlæser ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
              </div>
            ) : beskeder.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#1e3a2a]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Ingen beskeder endnu. Send den første besked.</p>
              </div>
            ) : (
              beskeder.map((b) => {
                const erMig = b.afsender_id === userId;
                return (
                  <div key={b.id} className={`flex gap-3 mb-3 ${erMig ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${erMig ? "bg-[#1e3a2a] text-white" : "bg-gray-200 text-gray-700"}`}>
                      {initials(b.afsender_navn)}
                    </div>
                    <div className={`max-w-[72%] flex flex-col ${erMig ? "items-end" : "items-start"}`}>
                      <div className={`flex items-center gap-2 mb-1 ${erMig ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-semibold text-gray-700">{b.afsender_navn}</span>
                        <span className="text-xs text-gray-400">{tidKort(b.sendt_at)}</span>
                      </div>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${erMig ? "bg-[#1e3a2a] text-white rounded-tr-md" : "bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm"}`}>
                        {b.indhold.split("\n").map((l, li, arr) => (
                          <span key={li}>{l}{li < arr.length - 1 && <br />}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input — vises kun når samtalen er etableret */}
        {samtaleId && !indlæser && (
          <div className="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
            <div className="max-w-2xl mx-auto flex gap-3 items-end">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-end gap-3 focus-within:border-[#1e3a2a] focus-within:ring-2 focus-within:ring-[#1e3a2a]/10 transition-all">
                <textarea
                  ref={inputRef}
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBesked(); }
                  }}
                  placeholder="Skriv din besked..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
                  style={{ maxHeight: "120px" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={sendBesked}
                  disabled={!tekst.trim() || sender}
                  className="w-8 h-8 bg-[#1e3a2a] rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-[#163f28] transition-all"
                >
                  {sender ? (
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Enter sender · Shift+Enter laver linjeskift</p>
          </div>
        )}
      </div>
    </div>
  );
}
