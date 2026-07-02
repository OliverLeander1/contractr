"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Besked {
  id: string;
  afsender: string;
  navn: string;
  rolle: "bygherre" | "haandvaerker" | "system";
  tekst: string;
  tidspunkt: string;
  vedhæftning?: string;
}

function tidFormat(iso: string) {
  const d = new Date(iso);
  const nu = new Date();
  const erI_dag = d.toDateString() === nu.toDateString();
  if (erI_dag) return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

export default function ProjektChat() {
  const { id } = useParams<{ id: string }>();
  const [beskeder, setBeskeder] = useState<Besked[]>([]);
  const [tekst, setTekst] = useState("");
  const [rolle, setRolle] = useState<"bygherre" | "haandvaerker">("bygherre");
  const [bygherreNavn, setBygherreNavn] = useState("Dig");
  const [haandvaerkerNavn, setHaandvaerkerNavn] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`contractr_chat_${id}`);
    if (raw) {
      setBeskeder(JSON.parse(raw));
    } else {
      // Velkomstbesked fra systemet
      const velkomst: Besked = {
        id: "system-1",
        afsender: "system",
        navn: "Contractr",
        rolle: "system",
        tekst: "Projektchatten er oprettet. Her kan bygherre og håndværker kommunikere direkte — alt er dokumenteret og tidsstemplet.",
        tidspunkt: new Date().toISOString(),
      };
      setBeskeder([velkomst]);
      localStorage.setItem(`contractr_chat_${id}`, JSON.stringify([velkomst]));
    }

    // Hent navne fra projekt
    const projektRaw = localStorage.getItem("contractr_projekt");
    if (projektRaw) {
      const projekt = JSON.parse(projektRaw);
      if (projekt.navn) setBygherreNavn(projekt.navn);
    }
    const hvNavn = localStorage.getItem("contractr_haandvaerker_navn");
    if (hvNavn) setHaandvaerkerNavn(hvNavn);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [beskeder]);

  const sendBesked = () => {
    const trimmed = tekst.trim();
    if (!trimmed) return;

    const ny: Besked = {
      id: `msg-${Date.now()}`,
      afsender: rolle,
      navn: rolle === "bygherre" ? bygherreNavn : (haandvaerkerNavn || "Håndværker"),
      rolle,
      tekst: trimmed,
      tidspunkt: new Date().toISOString(),
    };

    const opdaterede = [...beskeder, ny];
    setBeskeder(opdaterede);
    localStorage.setItem(`contractr_chat_${id}`, JSON.stringify(opdaterede));
    setTekst("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBesked();
    }
  };

  // Grupper beskeder: vis dato-skillelinje når dato skifter
  const renderBeskeder = () => {
    const elements: React.ReactNode[] = [];
    let sidsteDato = "";

    beskeder.forEach((b, i) => {
      const dato = new Date(b.tidspunkt).toDateString();
      if (dato !== sidsteDato) {
        sidsteDato = dato;
        const erIDag = dato === new Date().toDateString();
        elements.push(
          <div key={`dato-${i}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">
              {erIDag ? "I dag" : new Date(b.tidspunkt).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        );
      }

      if (b.rolle === "system") {
        elements.push(
          <div key={b.id} className="flex justify-center mb-3">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 max-w-md text-center">
              <p className="text-xs text-gray-500 leading-relaxed">{b.tekst}</p>
            </div>
          </div>
        );
        return;
      }

      const erMig = b.rolle === rolle;
      elements.push(
        <div key={b.id} className={`flex gap-3 mb-3 ${erMig ? "flex-row-reverse" : "flex-row"}`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${
            b.rolle === "bygherre" ? "bg-[#1a5c38]/10 text-[#1a5c38]" : "bg-blue-100 text-blue-700"
          }`}>
            {b.navn.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className={`max-w-[70%] ${erMig ? "items-end" : "items-start"} flex flex-col`}>
            <div className={`flex items-center gap-2 mb-1 ${erMig ? "flex-row-reverse" : "flex-row"}`}>
              <span className="text-xs font-semibold text-gray-700">{b.navn}</span>
              <span className="text-xs text-gray-400">{tidFormat(b.tidspunkt)}</span>
            </div>
            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              erMig
                ? "bg-[#1a5c38] text-white rounded-tr-md"
                : "bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm"
            }`}>
              {b.tekst.split("\n").map((linje, li) => (
                <span key={li}>{linje}{li < b.tekst.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href={`/projekt/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Projekt
          </Link>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-none">Projektchat</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {beskeder.filter(b => b.rolle !== "system").length} beskeder · Alt dokumenteret
              </p>
            </div>
          </div>
          {/* Rolle-skifte (demo) */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setRolle("bygherre")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${rolle === "bygherre" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Bygherre
            </button>
            <button
              onClick={() => setRolle("haandvaerker")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${rolle === "haandvaerker" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Håndværker
            </button>
          </div>
        </div>
      </nav>

      {/* Beskeder */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {renderBeskeder()}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              rolle === "bygherre" ? "bg-[#1a5c38]/10 text-[#1a5c38]" : "bg-blue-100 text-blue-700"
            }`}>
              {(rolle === "bygherre" ? bygherreNavn : (haandvaerkerNavn || "HV")).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-end gap-3 focus-within:border-[#1a5c38] focus-within:ring-2 focus-within:ring-[#1a5c38]/10 transition-all">
              <textarea
                ref={inputRef}
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Skriv som ${rolle === "bygherre" ? bygherreNavn : (haandvaerkerNavn || "Håndværker")}...`}
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
                disabled={!tekst.trim()}
                className="w-8 h-8 bg-[#1a5c38] rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-[#163f28] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Enter sender · Shift+Enter laver linjeskift · Alt gemmes automatisk</p>
        </div>
      </div>
    </div>
  );
}
