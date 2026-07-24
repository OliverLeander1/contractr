"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function BetalingSuccess() {
  useEffect(() => {
    // Ryd pakke-valg fra sessionStorage
    sessionStorage.removeItem("valgt_pakke");
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center px-6 py-16">
      <div className="bg-white rounded-2xl border border-[#e0ddd6] shadow-sm p-10 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling gennemført</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Du har nu adgang til dit projektrum. Du modtager en kvittering på e-mail.
        </p>

        <Link
          href="/dashboard"
          className="block w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mb-3"
        >
          Gå til mit overblik
        </Link>
        <Link
          href="/opret"
          className="block w-full border border-[#e0ddd6] text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Opret nyt projekt
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Sikker betaling via Stripe · AB-Forbruger 2012 er standard
      </div>
    </div>
  );
}
