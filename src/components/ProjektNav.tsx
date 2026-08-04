"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

// Kompakt, projektspecifik kontekstlinje — et tydeligt underniveau til den
// globale app-shell. Logo, "Overblik", notifikationer og profil hører til
// shellen og vises bevidst ikke her igen — se AuthenticatedAppShell.tsx.
export default function ProjektNav({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projekt/${id}`;

  function erAktiv(href: string) {
    const fuld = `${base}${href}`;
    if (href === "") return pathname === base;
    return pathname === fuld || pathname.startsWith(`${fuld}/`);
  }

  return (
    <nav className="bg-[#f0f7f3] border-b border-[#1e3a2a]/10 sticky top-[var(--shell-h)] z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-10">
          {/* Label + skillelinje — signalerer at dette er et underniveau */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <span className="text-[11px] font-semibold text-[#1e3a2a]/50 uppercase tracking-wide whitespace-nowrap">
              I denne sag
            </span>
            <span className="w-px h-4 bg-[#1e3a2a]/15" />
          </div>

          {/* Projektfaner — vandret scrollbar, wrapper aldrig */}
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

          {/* Book rådgiver — projektspecifik CTA, ligger uden for scroll-området */}
          <Link
            href="/tilkoeb"
            className="hidden md:inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-white bg-[#1e3a2a] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Book rådgiver
          </Link>
          <Link
            href="/tilkoeb"
            aria-label="Book rådgiver"
            title="Book rådgiver"
            className="md:hidden flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[#1e3a2a] hover:bg-[#1e3a2a]/10 transition-colors"
          >
            {IkonRaadgiver}
          </Link>
        </div>
      </div>
    </nav>
  );
}
