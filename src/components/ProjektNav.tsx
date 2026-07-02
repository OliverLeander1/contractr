"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Oversigt",  href: "" },
  { label: "Kontrakt",  href: "/kontrakt" },
  { label: "Økonomi",   href: "/betalinger" },
  { label: "Mangler",   href: "/mangler" },
  { label: "Chat",      href: "/chat" },
];

export default function ProjektNav({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projekt/${id}`;
  const [menuÅben, setMenuÅben] = useState(false);

  // Bestem aktiv link — /betalinger og /ekstraarbejde begge markerer "Økonomi"
  function erAktiv(href: string) {
    const fuld = `${base}${href}`;
    if (href === "/betalinger") {
      return pathname === fuld || pathname === `${base}/ekstraarbejde`;
    }
    if (href === "") return pathname === base;
    return pathname === fuld;
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}} className="text-gray-900">contractr</span>
        </Link>

        {/* Desktop nav — 5 punkter */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map((link) => {
            const aktiv = erAktiv(link.href);
            return (
              <Link
                key={link.label}
                href={`${base}${link.href}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  aktiv
                    ? "bg-[#1a5c38]/10 text-[#1a5c38] font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Højre side — minimal */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/tilkoeb"
            className="hidden md:block text-sm font-semibold bg-[#1a5c38] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Book rådgiver
          </Link>
          <Link href="/notifikationer" className="relative">
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1a5c38] hover:border-[#1a5c38]/30 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">2</span>
          </Link>
          <Link href="/konto">
            <div className="w-8 h-8 rounded-full bg-[#1a5c38]/10 flex items-center justify-center text-[#1a5c38] font-semibold text-sm">C</div>
          </Link>

          {/* Burger — mobil */}
          <button
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMenuÅben(!menuÅben)}
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuÅben ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuÅben ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuÅben ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobil-menu */}
      {menuÅben && (
        <div className="md:hidden border-t border-gray-100 mt-3 pt-3 pb-2 space-y-1">
          {navLinks.map((link) => {
            const aktiv = erAktiv(link.href);
            return (
              <Link
                key={link.label}
                href={`${base}${link.href}`}
                onClick={() => setMenuÅben(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  aktiv ? "bg-[#1a5c38]/10 text-[#1a5c38] font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 mt-2">
            <Link
              href="/tilkoeb"
              className="block text-center text-sm bg-[#1a5c38] text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Book rådgiver
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
