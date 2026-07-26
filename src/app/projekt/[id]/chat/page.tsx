"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";

interface Samtale {
  id: string;
  projekt_id: string;
  bygherre_id: string;
  modpart_navn: string;
  modpart_email: string | null;
  modpart_rolle: string;
  modpart_user_id: string | null;
  oprettet_at: string;
  sidsteBesked?: {
    indhold: string;
    sendt_at: string;
    afsender_navn: string;
  };
}

interface Besked {
  id: string;
  samtale_id: string;
  afsender_id: string;
  afsender_navn: string;
  indhold: string;
  sendt_at: string;
}

const FARVER = ["blue", "purple", "orange", "teal"] as const;
type Farve = (typeof FARVER)[number];

function farveKlasse(f: Farve) {
  return {
    blue:   "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    teal:   "bg-teal-100 text-teal-700",
  }[f];
}

function samtaleFarve(idx: number): Farve {
  return FARVER[idx % FARVER.length];
}

function initials(navn: string) {
  return navn.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
}

function tidKort(iso: string) {
  const d = new Date(iso);
  const nu = new Date();
  if (d.toDateString() === nu.toDateString()) {
    return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  }
  const dage = Math.floor((nu.getTime() - d.getTime()) / 86400000);
  if (dage < 7) return d.toLocaleDateString("da-DK", { weekday: "short" });
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function tidLang(iso: string) {
  const d = new Date(iso);
  const nu = new Date();
  if (d.toDateString() === nu.toDateString()) {
    return "I dag " + d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" }) +
    " " + d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatSide() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userNavn, setUserNavn] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [erBygherre, setErBygherre] = useState(true);

  const [samtaler, setSamtaler] = useState<Samtale[]>([]);
  const [aktivId, setAktivId] = useState<string | null>(null);
  const [beskeder, setBeskeder] = useState<Besked[]>([]);
  const [tekst, setTekst] = useState("");
  const [sender, setSender] = useState(false);
  const [indlæser, setIndlæser] = useState(true);

  const [sidebarÅben, setSidebarÅben] = useState(true);
  const [nyModalÅben, setNyModalÅben] = useState(false);
  const [nytNavn, setNytNavn] = useState("");
  const [nytEmail, setNytEmail] = useState("");
  const [nytRolle, setNytRolle] = useState("Entreprenør");
  const [opretterSamtale, setOpretterSamtale] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const realtimeKanal = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Hent bruger
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIndlæser(false); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");

      supabase.from("profiler").select("navn, rolle").eq("id", user.id).single()
        .then(({ data }) => {
          const navn = data?.navn || user.user_metadata?.navn || user.email?.split("@")[0] || "Ukendt";
          setUserNavn(navn);
          setErBygherre(data?.rolle !== "haandvaerker");
        });
    });
  }, []);

  // Hent samtaler
  const hentSamtaler = useCallback(async () => {
    if (!userId) return;
    setIndlæser(true);

    const { data } = await supabase
      .from("chat_samtaler")
      .select("*")
      .eq("projekt_id", id)
      .order("oprettet_at", { ascending: false });

    if (data) {
      // Hent sidste besked per samtale
      const medSidste: Samtale[] = await Promise.all(
        data.map(async (s) => {
          const { data: sidste } = await supabase
            .from("chat_beskeder")
            .select("indhold, sendt_at, afsender_navn")
            .eq("samtale_id", s.id)
            .order("sendt_at", { ascending: false })
            .limit(1)
            .single();
          return { ...s, sidsteBesked: sidste || undefined };
        })
      );
      setSamtaler(medSidste);
      if (medSidste.length > 0 && !aktivId) {
        setAktivId(medSidste[0].id);
      }
    }
    setIndlæser(false);
  }, [userId, id, aktivId]);

  useEffect(() => {
    if (userId) hentSamtaler();
  }, [userId]);

  // Hent beskeder for aktiv samtale
  const hentBeskeder = useCallback(async (samId: string) => {
    const { data } = await supabase
      .from("chat_beskeder")
      .select("*")
      .eq("samtale_id", samId)
      .order("sendt_at", { ascending: true });

    setBeskeder(data || []);
  }, []);

  useEffect(() => {
    if (!aktivId) return;
    hentBeskeder(aktivId);

    // Afmeld gammel kanal
    if (realtimeKanal.current) {
      supabase.removeChannel(realtimeKanal.current);
    }

    // Subscribe til nye beskeder i aktiv samtale
    realtimeKanal.current = supabase
      .channel(`chat-${aktivId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_beskeder",
          filter: `samtale_id=eq.${aktivId}`,
        },
        (payload) => {
          const nyBesked = payload.new as Besked;
          setBeskeder((prev) => {
            if (prev.find((b) => b.id === nyBesked.id)) return prev;
            return [...prev, nyBesked];
          });
          // Opdater sidsteBesked i sidebar
          setSamtaler((prev) =>
            prev.map((s) =>
              s.id === aktivId
                ? { ...s, sidsteBesked: { indhold: nyBesked.indhold, sendt_at: nyBesked.sendt_at, afsender_navn: nyBesked.afsender_navn } }
                : s
            )
          );
        }
      )
      .subscribe();

    return () => {
      if (realtimeKanal.current) supabase.removeChannel(realtimeKanal.current);
    };
  }, [aktivId]);

  // Scroll til bund
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [beskeder]);

  async function sendBesked() {
    const trimmed = tekst.trim();
    if (!trimmed || !aktivId || !userId || sender) return;

    setSender(true);
    setTekst("");

    const { error } = await supabase.from("chat_beskeder").insert({
      samtale_id: aktivId,
      projekt_id: id,
      afsender_id: userId,
      afsender_navn: userNavn,
      indhold: trimmed,
    });

    if (error) {
      console.error("Fejl ved afsendelse:", error);
      setTekst(trimmed); // Tilbagesæt tekst ved fejl
    }

    setSender(false);
    inputRef.current?.focus();
  }

  async function opretSamtale() {
    if (!nytNavn.trim() || !userId || opretterSamtale) return;
    setOpretterSamtale(true);

    const { data, error } = await supabase.from("chat_samtaler").insert({
      projekt_id: id,
      bygherre_id: userId,
      modpart_navn: nytNavn.trim(),
      modpart_email: nytEmail.trim() || null,
      modpart_rolle: nytRolle,
    }).select().single();

    setOpretterSamtale(false);

    if (error || !data) {
      console.error("Fejl ved oprettelse:", error);
      return;
    }

    setSamtaler((prev) => [data, ...prev]);
    setAktivId(data.id);
    setNyModalÅben(false);
    setNytNavn("");
    setNytEmail("");
    setNytRolle("Entreprenør");
  }

  const aktivSamtale = samtaler.find((s) => s.id === aktivId);
  const aktivIdx = samtaler.findIndex((s) => s.id === aktivId);

  // Grupper beskeder efter dato
  function renderBeskeder() {
    const elements: React.ReactNode[] = [];
    let sidsteDato = "";

    beskeder.forEach((b, i) => {
      const dato = new Date(b.sendt_at).toDateString();
      if (dato !== sidsteDato) {
        sidsteDato = dato;
        elements.push(
          <div key={`dato-${i}`} className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium px-2">
              {dato === new Date().toDateString()
                ? "I dag"
                : new Date(b.sendt_at).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        );
      }

      const erMig = b.afsender_id === userId;
      const farve = erMig ? null : (aktivSamtale ? samtaleFarve(aktivIdx) : "blue");

      elements.push(
        <div key={b.id} className={`flex gap-3 mb-3 ${erMig ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${
            erMig ? "bg-[#1e3a2a] text-white" : farveKlasse(farve as Farve)
          }`}>
            {initials(b.afsender_navn)}
          </div>
          <div className={`max-w-[72%] flex flex-col ${erMig ? "items-end" : "items-start"}`}>
            <div className={`flex items-center gap-2 mb-1 ${erMig ? "flex-row-reverse" : ""}`}>
              <span className="text-xs font-semibold text-gray-700">{b.afsender_navn}</span>
              <span className="text-xs text-gray-400">{tidKort(b.sendt_at)}</span>
            </div>
            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              erMig
                ? "bg-[#1e3a2a] text-white rounded-tr-md"
                : "bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm"
            }`}>
              {b.indhold.split("\n").map((l, li, arr) => (
                <span key={li}>{l}{li < arr.length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        </div>
      );
    });

    return elements;
  }

  if (!userId && !indlæser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ProjektNav id={id} />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Log ind for at bruge chatten</p>
            <p className="text-sm text-gray-400">Du skal være logget ind for at sende og modtage beskeder.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjektNav id={id} />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

        {/* SIDEBAR */}
        <aside className={`${sidebarÅben ? "w-72" : "w-0"} flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-200 overflow-hidden`}>

          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-shrink-0">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Beskeder</p>
              <p className="text-xs text-gray-400">{samtaler.length} {samtaler.length === 1 ? "samtale" : "samtaler"}</p>
            </div>
            {erBygherre && (
              <button
                onClick={() => setNyModalÅben(true)}
                className="w-8 h-8 rounded-lg bg-[#1e3a2a] flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Ny samtale"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {indlæser ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
              </div>
            ) : samtaler.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">Ingen samtaler endnu</p>
                {erBygherre && (
                  <button onClick={() => setNyModalÅben(true)} className="text-xs font-semibold text-[#1e3a2a] hover:underline">
                    Start en samtale
                  </button>
                )}
              </div>
            ) : (
              samtaler.map((s, idx) => {
                const erAktiv = s.id === aktivId;
                const farve = samtaleFarve(idx);
                return (
                  <button
                    key={s.id}
                    onClick={() => setAktivId(s.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${erAktiv ? "bg-[#1e3a2a]/5" : "hover:bg-gray-50"}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${farveKlasse(farve)}`}>
                      {initials(s.modpart_navn)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${erAktiv ? "text-[#1e3a2a]" : "text-gray-800"}`}>
                          {s.modpart_navn}
                        </span>
                        {s.sidsteBesked && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{tidKort(s.sidsteBesked.sendt_at)}</span>
                        )}
                      </div>
                      {s.sidsteBesked ? (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{s.sidsteBesked.indhold}</p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5">Ingen beskeder endnu</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bruger i bunden */}
          {userNavn && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2.5 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials(userNavn)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{userNavn}</p>
                <p className="text-xs text-gray-400">{erBygherre ? "Bygherre" : "Entreprenør"}</p>
              </div>
            </div>
          )}
        </aside>

        {/* HOVED-OMRÅDE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {aktivSamtale ? (
            <>
              {/* Chat-header */}
              <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setSidebarÅben(!sidebarÅben)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 3v18"/>
                  </svg>
                </button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${farveKlasse(samtaleFarve(aktivIdx))}`}>
                  {initials(aktivSamtale.modpart_navn)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-none">{aktivSamtale.modpart_navn}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {aktivSamtale.modpart_rolle}
                    {aktivSamtale.modpart_email && ` · ${aktivSamtale.modpart_email}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Alt dokumenteret
                </div>
              </div>

              {/* Beskeder */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="max-w-2xl mx-auto">
                  {beskeder.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-sm text-gray-400">
                        Ingen beskeder endnu. Send den første besked til {aktivSamtale.modpart_navn}.
                      </p>
                      {aktivSamtale.modpart_email && (
                        <p className="text-xs text-gray-300 mt-2">
                          {aktivSamtale.modpart_navn} kan logge ind med {aktivSamtale.modpart_email} for at besvare.
                        </p>
                      )}
                    </div>
                  )}
                  {renderBeskeder()}
                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
                <div className="max-w-2xl mx-auto flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials(userNavn)}
                  </div>
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
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">Enter sender · Shift+Enter laver linjeskift</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              {!sidebarÅben && (
                <button
                  onClick={() => setSidebarÅben(true)}
                  className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  Vis samtaler
                </button>
              )}
              <div className="w-16 h-16 bg-[#1e3a2a]/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              {indlæser ? (
                <div className="w-5 h-5 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin mx-auto" />
              ) : (
                <>
                  <h2 className="font-bold text-gray-900 text-lg mb-2">
                    {samtaler.length === 0 ? "Ingen samtaler endnu" : "Vælg en samtale"}
                  </h2>
                  <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
                    {samtaler.length === 0
                      ? "Start en samtale med en del af projektet — f.eks. din VVS-mester eller tømrer."
                      : "Vælg en samtale i listen til venstre."}
                  </p>
                  {erBygherre && (
                    <button
                      onClick={() => setNyModalÅben(true)}
                      className="inline-flex items-center gap-2 bg-[#1e3a2a] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Start ny samtale
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: ny samtale */}
      {nyModalÅben && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNyModalÅben(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Ny samtale</h2>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Opret en samtale med en part i projektet. Har de en konto, matcher vi automatisk via e-mail.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Navn</label>
                <input
                  type="text"
                  placeholder="F.eks. Lars VVS eller Tømrer Hansen ApS"
                  value={nytNavn}
                  onChange={(e) => setNytNavn(e.target.value)}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-mail <span className="text-gray-400 font-normal">(valgfri)</span>
                </label>
                <input
                  type="email"
                  placeholder="modpart@firma.dk"
                  value={nytEmail}
                  onChange={(e) => setNytEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">Modparten kan se og besvare samtalen, når de logger ind med denne e-mail.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rolle</label>
                <select
                  value={nytRolle}
                  onChange={(e) => setNytRolle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] transition-all bg-white"
                >
                  <option>Entreprenør</option>
                  <option>Bygherre</option>
                  <option>Rådgiver</option>
                  <option>Arkitekt</option>
                  <option>Ingeniør</option>
                  <option>Andet</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setNyModalÅben(false); setNytNavn(""); setNytEmail(""); }}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={opretSamtale}
                disabled={!nytNavn.trim() || opretterSamtale}
                className="flex-1 bg-[#1e3a2a] text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {opretterSamtale ? "Opretter..." : "Start samtale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
