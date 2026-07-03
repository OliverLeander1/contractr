"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AccepterInvitationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trin, setTrin] = useState(1);
  const [navn, setNavn] = useState("");
  const [virksomhed, setVirksomhed] = useState("");
  const [telefon, setTelefon] = useState("");
  const [cvr, setCvr] = useState("");

  // Læs projektdata fra URL-parametre (genereret af /projekt/[id]/inviter)
  const projektId = searchParams.get("projekt") || "1";
  const projektNavn = searchParams.get("projektNavn") || "Byggeprojekt";
  const bygherreNavn = searchParams.get("bygherre") || "Bygherre";
  const haandvaerkerEmail = searchParams.get("email") || "";

  // Prefill e-mail hvis den er i URL
  useEffect(() => {
    if (haandvaerkerEmail) {
      // Gem til sessionStorage så profil-siden kan bruge det
      sessionStorage.setItem("haandvaerker_email", haandvaerkerEmail);
    }
  }, [haandvaerkerEmail]);

  const accepter = () => {
    // Gem håndværkerdata i localStorage
    const haandvaerker = {
      navn: navn.trim(),
      virksomhed: virksomhed.trim(),
      telefon: telefon.trim(),
      cvr: cvr.trim(),
      email: haandvaerkerEmail,
      tilknyttetProjekt: projektId,
      oprettetDato: new Date().toISOString(),
    };
    localStorage.setItem("contractr_haandvaerker", JSON.stringify(haandvaerker));
    router.push(`/haandvaerker/projekt/${projektId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 bg-[#1a5c38] rounded-xl flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="text-xl" style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "2px" }}>contractr</span>
      </Link>

      {trin === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          <div className="w-14 h-14 bg-[#f0f7f3] rounded-2xl flex items-center justify-center mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Du er inviteret</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            <span className="font-semibold text-gray-900">{bygherreNavn}</span> har inviteret dig til projektet{" "}
            <span className="font-semibold text-gray-900">&ldquo;{projektNavn}&rdquo;</span> på Contractr.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">Projekt</p>
              <p className="text-sm font-medium text-gray-900">{projektNavn}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">Inviteret af</p>
              <p className="text-sm font-medium text-gray-900">{bygherreNavn}</p>
            </div>
            {haandvaerkerEmail && (
              <div className="flex justify-between">
                <p className="text-sm text-gray-400">Din e-mail</p>
                <p className="text-sm font-medium text-gray-900">{haandvaerkerEmail}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setTrin(2)}
            className="w-full bg-[#1a5c38] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mb-3"
          >
            Accepter invitation
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full border border-gray-200 text-gray-500 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Afvis invitation
          </button>
        </div>
      )}

      {trin === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Opret din profil</h1>
          <p className="text-sm text-gray-400 mb-6">Så bygherre ved hvem de arbejder med</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dit navn</label>
              <input
                type="text"
                placeholder="Dit fulde navn"
                value={navn}
                onChange={e => setNavn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Virksomhed</label>
              <input
                type="text"
                placeholder="Din virksomheds navn"
                value={virksomhed}
                onChange={e => setVirksomhed(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR-nummer</label>
              <input
                type="text"
                placeholder="8 cifre"
                value={cvr}
                onChange={e => setCvr(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <input
                type="tel"
                placeholder="f.eks. 20 12 34 56"
                value={telefon}
                onChange={e => setTelefon(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
              />
            </div>
          </div>
          <button
            onClick={accepter}
            disabled={!navn.trim()}
            className="w-full bg-[#1a5c38] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-6 disabled:opacity-40"
          >
            Gå til projektet
          </button>
          {!navn.trim() && (
            <p className="text-xs text-gray-400 text-center mt-2">Indtast dit navn for at fortsætte</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AccepterInvitation() {
  return (
    <Suspense>
      <AccepterInvitationInner />
    </Suspense>
  );
}
