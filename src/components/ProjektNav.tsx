"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Oversigt",     href: "" },
  { label: "Aftale",       href: "/aftale" },
  { label: "Logbog",       href: "/logbog" },
  { label: "Aftalesedler", href: "/ekstraarbejde" },
  { label: "Økonomi",      href: "/betalinger" },
  { label: "Mangler",      href: "/mangler" },
  { label: "Chat",         href: "/chat" },
  { label: "Rapport",      href: "/rapport" },
];

const IkonRaadgiver = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IkonChevron = (åben: boolean) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={`flex-shrink-0 transition-transform ${åben ? "rotate-180" : ""}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Kompakt, projektspecifik kontekstlinje — et tydeligt underniveau til den
// globale app-shell. Logo, "Overblik", notifikationer og profil hører til
// shellen og vises bevidst ikke her igen — se AuthenticatedAppShell.tsx.
export default function ProjektNav({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projekt/${id}`;
  const [menuÅben, setMenuÅben] = useState(false);

  function erAktiv(href: string) {
    const fuld = `${base}${href}`;
    if (href === "") return pathname === base;
    return pathname === fuld || pathname.startsWith(`${fuld}/`);
  }

  const aktivtPunkt = navLinks.find((link) => erAktiv(link.href)) ?? navLinks[0];

  return (
    // top-0 på mobil: topheaderen i AuthenticatedAppShell er ikke længere
    // fastgjort der (den scroller væk som almindeligt sideindhold), så denne
    // sticky-fane skal klæbe direkte i toppen af viewporten uden at reservere
    // dens højde. Fra md er topheaderen fortsat sticky og optager sin egen
    // plads, så uændret top-[var(--shell-h)] der.
    <nav className="bg-[#f0f7f3] border-b border-[#1e3a2a]/10 sticky top-0 md:top-[var(--shell-h)] z-40 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Desktop — uændret: label, skillelinje, vandret fanerække, Book rådgiver */}
        <div className="hidden md:flex items-center gap-3 h-10">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[11px] font-semibold text-[#1e3a2a]/50 uppercase tracking-wide whitespace-nowrap">
              I denne sag
            </span>
            <span className="w-px h-4 bg-[#1e3a2a]/15" />
          </div>

          <div
            className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {navLinks.map((link) => {
              const aktiv = erAktiv(link.href);
              return (
                <Link
                  key={link.label}
                  href={`${base}${link.href}`}
                  className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    aktiv
                      ? "bg-[#1e3a2a]/10 text-[#1e3a2a]"
                      : "text-[#1e3a2a]/60 hover:text-[#1e3a2a] hover:bg-white/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/tilkoeb"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1e3a2a] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Book rådgiver
          </Link>
        </div>

        {/* Mobil — fast, breddebegrænset projektvælger. Ingen vandret scroll:
            den tidligere scrollbare fanerække er erstattet af en lukket
            knap der viser den aktive sektion, med en lodret fold-ud-menu. */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 h-10">
            <button
              type="button"
              aria-expanded={menuÅben}
              aria-controls="projekt-fane-menu"
              aria-label={`Skift sektion i projektet. Aktiv sektion: ${aktivtPunkt.label}`}
              onClick={() => setMenuÅben((v) => !v)}
              className="flex-1 min-w-0 flex items-center gap-2 h-full text-left"
            >
              <span className="text-[10px] font-semibold text-[#1e3a2a]/50 uppercase tracking-wide flex-shrink-0">
                I denne sag
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1e3a2a]">
                {aktivtPunkt.label}
              </span>
              {IkonChevron(menuÅben)}
            </button>

            <Link
              href="/tilkoeb"
              aria-label="Book rådgiver"
              title="Book rådgiver"
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[#1e3a2a] hover:bg-[#1e3a2a]/10 transition-colors"
            >
              {IkonRaadgiver}
            </Link>
          </div>

          {menuÅben && (
            <div id="projekt-fane-menu" className="border-t border-[#1e3a2a]/10 py-2">
              <div className="grid grid-cols-2 gap-1">
                {navLinks.map((link) => {
                  const aktiv = erAktiv(link.href);
                  return (
                    <Link
                      key={link.label}
                      href={`${base}${link.href}`}
                      onClick={() => setMenuÅben(false)}
                      className={`min-w-0 truncate px-3 py-2 rounded-lg text-xs font-medium text-center transition-colors ${
                        aktiv
                          ? "bg-[#1e3a2a]/10 text-[#1e3a2a]"
                          : "text-[#1e3a2a]/70 hover:bg-white/60"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
