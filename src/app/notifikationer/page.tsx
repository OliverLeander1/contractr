"use client";

import Link from "next/link";

export default function Notifikationer() {
  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Tilbage
          </Link>
          <span className="logo">nembyggestyring</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Notifikationer</h1>

        <div className="bg-white rounded-2xl border border-[#e0ddd6] p-10 text-center">
          <div className="w-14 h-14 bg-[#1e3a2a]/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <p className="font-semibold text-gray-900 mb-2">Ingen notifikationer endnu</p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
            Når du har et aktivt projekt sender vi dig påmindelser baseret på AB-Forbruger 2012.
          </p>
          <Link
            href="/opret/upload"
            className="inline-block mt-6 bg-[#1e3a2a] text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Tjek dit første tilbud
          </Link>
        </div>
      </div>
    </div>
  );
}
