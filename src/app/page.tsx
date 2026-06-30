import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contractr - Kommer snart",
  description: "En ny måde at håndtere byggeprojekter på. Kommer snart.",
  robots: "noindex, nofollow",
};

export default function KommerSnart() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="w-12 h-12 bg-[#1a5c38] rounded-xl flex items-center justify-center mx-auto mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "3px" }} className="text-white text-2xl tracking-widest">
          contractr
        </span>
      </div>

      <p className="text-gray-400 text-sm tracking-widest uppercase">Kommer snart</p>

      <div className="mt-10 text-gray-600 text-xs">
        © 2025 Contractr
      </div>
    </div>
  );
}
