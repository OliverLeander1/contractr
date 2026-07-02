"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Oversigt", href: "" },
  { label: "Tidsplan", href: "/tidsplan" },
  { label: "Dokumenter", href: "/dokumenter" },
  { label: "Kontrakt", href: "/kontrakt" },
  { label: "Økonomi", href: "/betalinger" },
  { label: "Mangler", href: "/mangler" },
  { label: "Ekstraarbejde", href: "/ekstraarbejde" },
  { label: "Chat", href: "/chat" },
];

export default function ProjektNav({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projekt/${id}`;
  const [menuÅben, setMenuÅben] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-lg tracking-tight" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const href = `${base}${link.href}`;
            const isActive = pathname === href;
            return (
              <Link
                key={link.label}
                href={href}
                className={`pb-1 transition-colors ${isActive ? "text-primary border-b-2 border-primary font-semibold" : "text-gray-500 hover:text-gray-900"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/abforbruger" className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Dine rettigheder
          </Link>
          <Link href="/tilkoeb" className="hidden md:block text-sm bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Book rådgiver
          </Link>
          <Link href="/notifikationer" className="relative">
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">2</span>
          </Link>
          <Link href="/konto">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">C</div>
          </Link>
          {/* Burger - mobile only */}
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

      {/* Mobile menu */}
      {menuÅben && (
        <div className="md:hidden border-t border-gray-100 mt-4 pt-4 pb-2 space-y-1">
          {navLinks.map((link) => {
            const href = `${base}${link.href}`;
            const isActive = pathname === href;
            return (
              <Link
                key={link.label}
                href={href}
                onClick={() => setMenuÅben(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 mt-2 flex gap-2">
            <Link href="/tilkoeb" className="flex-1 text-center text-sm bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Book rådgiver
            </Link>
            <Link href="/abforbruger" className="flex-1 text-center text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Dine rettigheder
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
