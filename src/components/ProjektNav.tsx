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

// Kompakt, projektspecifik fanelinje under den globale app-shell.
// Logo, "Mit overblik", notifikationer og profil hører til shellen og
// vises bevidst ikke her igen — se AuthenticatedAppShell.tsx.
export default function ProjektNav({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projekt/${id}`;

  function erAktiv(href: string) {
    const fuld = `${base}${href}`;
    if (href === "") return pathname === base;
    return pathname === fuld || pathname.startsWith(`${fuld}/`);
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-[var(--shell-h)] z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="flex items-center gap-1 overflow-x-auto py-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {navLinks.map((link) => {
            const aktiv = erAktiv(link.href);
            return (
              <Link
                key={link.label}
                href={`${base}${link.href}`}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  aktiv
                    ? "bg-[#1e3a2a]/10 text-[#1e3a2a] font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
