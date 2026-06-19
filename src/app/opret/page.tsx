"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

const projekttyper = [
  { id: "badevarelse", label: "Badeværelse", ikon: "🚿" },
  { id: "kokken", label: "Køkken", ikon: "🍳" },
  { id: "tag", label: "Tag", ikon: "🏠" },
  { id: "tilbygning", label: "Tilbygning", ikon: "🏗️" },
  { id: "totalrenovering", label: "Totalrenovering", ikon: "🔨" },
  { id: "vinduer", label: "Vinduer & facade", ikon: "🪟" },
  { id: "maler", label: "Maler & gips", ikon: "🖌️" },
  { id: "andet", label: "Andet", ikon: "📋" },
];

export default function OpretProjekt() {
  const router = useRouter();
  const [valgtType, setValgtType] = useState("");
  const [budget, setBudget] = useState("");
  const [adresse, setAdresse] = useState("");
  const [status, setStatus] = useState("tilbud");

  const kanFortsætte = valgtType && adresse;

  return (
    <FlowLayout aktivTrin={1}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fortæl os om dit projekt</h1>
        <p className="text-gray-500">Vi bruger oplysningerne til at tilpasse screeningen til dit specifikke projekt.</p>
      </div>

      {/* Projekttype */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-1">Hvad handler projektet om?</h2>
        <p className="text-sm text-gray-400 mb-5">Vælg den type, der passer bedst</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {projekttyper.map((type) => (
            <button
              key={type.id}
              onClick={() => setValgtType(type.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                valgtType === type.id
                  ? "border-primary bg-accent"
                  : "border-gray-100 hover:border-gray-200 bg-gray-50"
              }`}
            >
              <span className="text-2xl">{type.ikon}</span>
              <span className={`text-xs font-semibold ${valgtType === type.id ? "text-primary" : "text-gray-600"}`}>
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Adresse og budget */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-900 mb-5">Projektdetaljer</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="F.eks. Valby Langgade 85, 2500 Valby"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Forventet budget <span className="text-gray-400 font-normal">(valgfrit)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="F.eks. 150.000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">kr.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status på aftalen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-1">Hvor er du i processen?</h2>
        <p className="text-sm text-gray-400 mb-4">Det hjælper os med at give den rigtige vejledning</p>
        <div className="space-y-2">
          {[
            { id: "dialog", label: "Jeg er i dialog med en håndværker, men har intet tilbud endnu", ikon: "💬" },
            { id: "tilbud", label: "Jeg har modtaget et tilbud og overvejer at sige ja", ikon: "📄" },
            { id: "accepteret", label: "Jeg har accepteret, men arbejdet er ikke startet", ikon: "✅" },
            { id: "igang", label: "Arbejdet er i gang", ikon: "🔨" },
            { id: "problem", label: "Der er opstået et problem eller en tvist", ikon: "⚠️" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                status === s.id
                  ? "border-primary bg-accent"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <span className="text-lg">{s.ikon}</span>
              <span className={`text-sm font-medium ${status === s.id ? "text-primary" : "text-gray-700"}`}>
                {s.label}
              </span>
              {status === s.id && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (!kanFortsætte) return;
          if (status === "dialog") router.push("/opret/ingen-tilbud");
          else router.push("/opret/upload");
        }}
        className={`w-full py-4 rounded-xl text-base font-bold transition-all ${
          kanFortsætte
            ? "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {status === "dialog" ? "Fortsæt →" : "Fortsæt til upload →"}
      </button>
      {!kanFortsætte && (
        <p className="text-center text-xs text-gray-400 mt-3">Vælg projekttype og angiv adresse for at fortsætte</p>
      )}
    </FlowLayout>
  );
}
