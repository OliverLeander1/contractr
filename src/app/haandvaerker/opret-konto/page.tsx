"use client";

import { useState } from "react";
import Link from "next/link";

type Trin = "invitation" | "konto" | "bekraeftet";

export default function HaandvaerkerOpretKonto() {
  const [trin, setTrin] = useState<Trin>("invitation");
  const [adgangskode, setAdgangskode] = useState("");
  const [bekræft, setBekræft] = useState("");
  const [vis, setVis] = useState(false);

  // I produktion ville disse komme fra URL-parameteret (invitation token)
  const invitation = {
    bygherre: "Camilla Jensen",
    projekt: "Indvendig renovering, Valby",
    email: "thomas@tmbyg.dk",
    firma: "TM Byg ApS",
  };

  const stærk = adgangskode.length >= 8;
  const matcher = adgangskode === bekræft && bekræft.length > 0;
  const kanOprette = stærk && matcher;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-xl" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
        </div>

        {trin === "invitation" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Du er inviteret til et projekt</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Opret din håndværkerkonto for at acceptere invitationen</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Bygherre</span>
                <span className="text-sm font-semibold text-gray-900">{invitation.bygherre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Projekt</span>
                <span className="text-sm font-semibold text-gray-900">{invitation.projekt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Din e-mail</span>
                <span className="text-sm font-semibold text-gray-900">{invitation.email}</span>
              </div>
            </div>

            <button
              onClick={() => setTrin("konto")}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Opret konto og accepter invitation →
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">
              Har du allerede en konto?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">Log ind her</Link>
            </p>
          </div>
        )}

        {trin === "konto" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Opret din konto</h1>
            <p className="text-sm text-gray-500 mb-6">Som håndværker på Contractr</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Navn</label>
                <input
                  type="text"
                  defaultValue="Thomas Madsen"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Firma</label>
                <input
                  type="text"
                  defaultValue={invitation.firma}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  defaultValue={invitation.email}
                  disabled
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vælg adgangskode</label>
                <div className="relative">
                  <input
                    type={vis ? "text" : "password"}
                    value={adgangskode}
                    onChange={e => setAdgangskode(e.target.value)}
                    placeholder="Mindst 8 tegn"
                    className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${stærk || !adgangskode ? "border-gray-200 focus:border-primary" : "border-red-200"}`}
                  />
                  <button type="button" onClick={() => setVis(!vis)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {vis ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
                {adgangskode && !stærk && <p className="text-xs text-red-500 mt-1">Adgangskode skal være mindst 8 tegn</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bekræft adgangskode</label>
                <input
                  type={vis ? "text" : "password"}
                  value={bekræft}
                  onChange={e => setBekræft(e.target.value)}
                  placeholder="Gentag adgangskode"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${!bekræft || matcher ? "border-gray-200 focus:border-primary" : "border-red-200"}`}
                />
                {bekræft && !matcher && <p className="text-xs text-red-500 mt-1">Adgangskoderne matcher ikke</p>}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => kanOprette && setTrin("bekraeftet")}
                className={`w-full font-bold py-3.5 rounded-xl transition-all ${kanOprette ? "bg-primary text-white hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                Opret konto →
              </button>
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Ved at oprette en konto accepterer du vores{" "}
                <Link href="/vilkaar" className="text-primary hover:underline">vilkår</Link>{" "}
                og{" "}
                <Link href="/privatliv" className="text-primary hover:underline">privatlivspolitik</Link>
              </p>
            </div>
          </div>
        )}

        {trin === "bekraeftet" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Konto oprettet!</h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Du er nu tilknyttet projektet <strong>{invitation.projekt}</strong> for {invitation.bygherre}. Du kan nu se projektet og kommunikere med bygherren.
            </p>
            <Link
              href="/haandvaerker/projekt/1"
              className="block w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Gå til projektet →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
