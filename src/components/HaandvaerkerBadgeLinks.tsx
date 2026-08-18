"use client";

import Link from "next/link";
import { useUlaesteBadges } from "@/lib/useUlaesteBadges";

const IkonChat = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IkonNotifikationer = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// Delt Samtaler/Notifikationer-genvej med ulæst-badge til hele entreprenør-
// portalen — bruges både i de sider med egen header (haandvaerker/sager,
// haandvaerker/projekt/[id]) og som SimpleNav's højre-slot på de øvrige
// entreprenørsider (profil, nyt-tilbud, kontrakt, tidsplan, ekstraarbejde).
// Bruger samme delte useUlaesteBadges-hook som AuthenticatedAppShell, så der
// kun findes ét sted, der henter/holder styr på ulæst-tal.
export default function HaandvaerkerBadgeLinks() {
  const { ulaestSamlet, ulaestNotifikationer } = useUlaesteBadges(true);

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/chat"
        aria-label="Samtaler"
        title="Samtaler"
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {IkonChat}
        {ulaestSamlet !== null && ulaestSamlet > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#1e3a2a] text-white text-[9px] font-bold flex items-center justify-center">
            {ulaestSamlet > 9 ? "9+" : ulaestSamlet}
          </span>
        )}
      </Link>
      <Link
        href="/notifikationer"
        aria-label="Notifikationer"
        title="Notifikationer"
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {IkonNotifikationer}
        {ulaestNotifikationer !== null && ulaestNotifikationer > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#9c3b3b] text-white text-[9px] font-bold flex items-center justify-center">
            {ulaestNotifikationer > 9 ? "9+" : ulaestNotifikationer}
          </span>
        )}
      </Link>
    </div>
  );
}
