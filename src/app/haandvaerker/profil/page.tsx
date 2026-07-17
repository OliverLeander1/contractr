"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Haandvaerker {
  navn?: string;
  virksomhed?: string;
  cvr?: string;
  telefon?: string;
  email?: string;
  specialer?: string[];
  oprettetDato?: string;
}

function Stjerner({ antal }: { antal: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= antal ? "#1e3a2a" : "none"} stroke="#1e3a2a" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function HaandvaerkerProfil() {
  const [profil, setProfil] = useState<Haandvaerker | null>(null);
  const [redigerer, setRedigerer] = useState(false);
  const [nytNavn, setNytNavn] = useState("");
  const [nyVirksomhed, setNyVirksomhed] = useState("");
  const [nytCvr, setNytCvr] = useState("");
  const [nytTelefon, setNytTelefon] = useState("");
  const [gemtBesked, setGemtBesked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("contractr_haandvaerker");
      if (raw) {
        const h = JSON.parse(raw);
        setProfil(h);
        setNytNavn(h.navn || "");
        setNyVirksomhed(h.virksomhed || "");
        setNytCvr(h.cvr || "");
        setNytTelefon(h.telefon || "");
      }
    } catch { /* ignore */ }
  }, []);

  const gemProfil = () => {
    const opdateret: Haandvaerker = {
      ...(profil || {}),
      navn: nytNavn.trim(),
      virksomhed: nyVirksomhed.trim(),
      cvr: nytCvr.trim(),
      telefon: nytTelefon.trim(),
    };
    localStorage.setItem("contractr_haandvaerker", JSON.stringify(opdateret));
    setProfil(opdateret);
    setRedigerer(false);
    setGemtBesked(true);
    setTimeout(() => setGemtBesked(false), 3000);
  };

  const initial = profil?.navn ? profil.navn[0].toUpperCase() : "?";
  const oprettetAar = profil?.oprettetDato
    ? new Date(profil.oprettetDato).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/haandvaerker/sager" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Mine sager
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="logo">nembyggestyring</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {!profil && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen profildata fundet</p>
            <p className="text-sm text-gray-400 mb-6">Opret din profil via et invitationslink fra en bygherre.</p>
          </div>
        )}

        {profil && (
          <>
            {/* Profilkort */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-2xl flex-shrink-0">
                  {initial}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">{profil.navn || "Ikke angivet"}</h1>
                  {(profil.virksomhed || profil.cvr) && (
                    <p className="text-gray-500 mb-3">
                      {profil.virksomhed || ""}
                      {profil.cvr ? ` · CVR ${profil.cvr}` : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
                    {profil.telefon && (
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {profil.telefon}
                      </span>
                    )}
                    {profil.email && (
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        {profil.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Medlem siden {oprettetAar}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setRedigerer(!redigerer)}
                  className="text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  {redigerer ? "Annuller" : "Rediger profil"}
                </button>
              </div>

              {redigerer && (
                <div className="border-t border-gray-100 pt-5 mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Navn</label>
                    <input type="text" value={nytNavn} onChange={e => setNytNavn(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Virksomhed</label>
                    <input type="text" value={nyVirksomhed} onChange={e => setNyVirksomhed(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR</label>
                      <input type="text" value={nytCvr} onChange={e => setNytCvr(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                      <input type="tel" value={nytTelefon} onChange={e => setNytTelefon(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                    </div>
                  </div>
                  <button onClick={gemProfil} className="bg-[#1e3a2a] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                    Gem profil
                  </button>
                </div>
              )}

              {gemtBesked && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-xs text-green-700 font-medium">Profil gemt.</p>
                </div>
              )}
            </div>

            {/* Omtaler — kun rigtige, ingen demo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-5">Omtaler fra bygherrer</h2>
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-1">Ingen omtaler endnu</p>
                <p className="text-xs text-gray-400">Omtaler fra bygherrer vises her efterhånden som projekter afsluttes.</p>
              </div>
            </div>

            {/* Specialer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Dit fagområde</h2>
              <p className="text-sm text-gray-400">Specialer tilføjes når du opretter tilbud på projekter.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
