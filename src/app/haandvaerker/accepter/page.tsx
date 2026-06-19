"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccepeterInvitation() {
  const router = useRouter();
  const [trin, setTrin] = useState(1);
  const [navn, setNavn] = useState("");
  const [virksomhed, setVirksomhed] = useState("");
  const [telefon, setTelefon] = useState("");
  const [cvr, setCvr] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-xl">Contractr</span>
      </Link>

      {trin === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Du er inviteret</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            <span className="font-semibold text-gray-900">Camilla Jensen</span> har inviteret dig til projektet <span className="font-semibold text-gray-900">"Indvendig renovering – Valby"</span> på Contractr.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            {[
              { label: "Projekttype", value: "Indvendig renovering" },
              { label: "Adresse", value: "Valby Langgade 85, 2500 Valby" },
              { label: "Entreprisesum", value: "112.500 kr." },
              { label: "Opstart", value: "12. marts 2025" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <p className="text-sm text-gray-400">{r.label}</p>
                <p className="text-sm font-medium text-gray-900">{r.value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setTrin(2)}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mb-3"
          >
            Accepter invitation →
          </button>
          <button className="w-full border border-gray-200 text-gray-500 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
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
              <input type="text" placeholder="F.eks. Thomas Madsen" value={navn} onChange={e => setNavn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Virksomhed</label>
              <input type="text" placeholder="F.eks. TM Byg ApS" value={virksomhed} onChange={e => setVirksomhed(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR-nummer</label>
              <input type="text" placeholder="8 cifre" value={cvr} onChange={e => setCvr(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <input type="tel" placeholder="F.eks. 20 12 34 56" value={telefon} onChange={e => setTelefon(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
          </div>
          <button
            onClick={() => router.push("/haandvaerker/projekt/1")}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-6"
          >
            Gå til projektet →
          </button>
        </div>
      )}
    </div>
  );
}
