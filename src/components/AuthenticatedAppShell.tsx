"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUlaesteBadges } from "@/lib/useUlaesteBadges";

// Kun rutepræfikser — ingen adgangskontrol. Middleware og de sikre
// API-routes er fortsat autoritative for hvem der reelt må se siderne.
// /haandvaerker/* er bevidst IKKE med her: de ruter har egne lokale headere
// (se haandvaerker/sager og haandvaerker/projekt/[id]), som ville kollidere
// med denne sticky shell-header, hvis begge blev vist samtidig.
const SHELL_PRÆFIKSER = ["/dashboard", "/projekt", "/chat", "/notifikationer"];
const SHELL_EKSAKT = ["/konto"];
const SHELL_UDELUKKET = ["/konto/gendan"];

function matcherPræfiks(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function skalViseShell(pathname: string): boolean {
  if (SHELL_UDELUKKET.some((p) => matcherPræfiks(pathname, p))) return false;
  if (SHELL_EKSAKT.includes(pathname)) return true;
  return SHELL_PRÆFIKSER.some((base) => matcherPræfiks(pathname, base));
}

// Chat er aktiv både på de globale chatruter og på en konkret
// kontraktchat under et projekt — segmentgrænse via (\/|$) forhindrer
// at /projekt/x/chatbot fejlagtigt ville matche.
function erChatAktiv(pathname: string): boolean {
  if (matcherPræfiks(pathname, "/chat")) return true;
  return /^\/projekt\/[^/]+\/chat(\/|$)/.test(pathname);
}

const IkonOverblik = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const IkonChat = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IkonNotifikationer = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IkonProfil = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

interface NavItem {
  label: string;
  href: string;
  aktiv: (pathname: string) => boolean;
  ikon: React.ReactNode;
}

// Kun "Overblik"/"Profil" er rolleafhængige. En entreprenør kan sagtens
// lande på en delt rute (/chat, /notifikationer) via fx et notifikations-
// link, og skal så se sine egne mål ("Mine sager" / entreprenørprofilen),
// ikke bygherrens dashboard/konto.
function bestemNavItems(erHaandvaerker: boolean): NavItem[] {
  return [
    {
      label: erHaandvaerker ? "Mine sager" : "Overblik",
      href: erHaandvaerker ? "/haandvaerker/sager" : "/dashboard",
      aktiv: (p) => (erHaandvaerker ? matcherPræfiks(p, "/haandvaerker") : matcherPræfiks(p, "/dashboard")),
      ikon: IkonOverblik,
    },
    { label: "Samtaler", href: "/chat", aktiv: erChatAktiv, ikon: IkonChat },
    { label: "Notifikationer", href: "/notifikationer", aktiv: (p) => matcherPræfiks(p, "/notifikationer"), ikon: IkonNotifikationer },
    {
      label: "Profil",
      href: erHaandvaerker ? "/haandvaerker/profil" : "/konto",
      aktiv: (p) => (erHaandvaerker ? p === "/haandvaerker/profil" : p === "/konto"),
      ikon: IkonProfil,
    },
  ];
}

export default function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const visShell = skalViseShell(pathname);
  const { ulaestSamlet, ulaestNotifikationer, rolle } = useUlaesteBadges(visShell, pathname);
  const erHaandvaerker = rolle === "haandvaerker";
  const navItems = bestemNavItems(erHaandvaerker);
  const overblikHref = erHaandvaerker ? "/haandvaerker/sager" : "/dashboard";
  const profilHref = erHaandvaerker ? "/haandvaerker/profil" : "/konto";
  const profilAktiv = erHaandvaerker ? pathname === "/haandvaerker/profil" : pathname === "/konto";

  // Ikke en shell-rute (fx forsiden, login): uændret, ingen højde-låsning,
  // intet scroll-container-lag — ren normal dokument-scroll som hidtil.
  if (!visShell) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  return (
    // Mobil: skallen er låst til den reelle synlige viewport-højde (dvh, ikke
    // vh — følger iOS' dynamiske adressefelt korrekt) og delt i to rigtige
    // flex-rækker: (1) et scrollbart indholdsområde og (2) bundnavigationen
    // som en almindelig, ikke-positioneret søskende der optager sin egen
    // plads nederst. Bundnavigationen er dermed aldrig et overlay oven på
    // indholdet — den er en fast del af layoutet, og indholdet kan fysisk
    // ikke fortsætte bagved den. Fra md: uændret normal dokument-scroll,
    // ingen højde-låsning, ingen bundnavigation.
    // --shell-h: topheaderens egen højde (bruges også af ProjektNav's
    // sticky-offset på desktop).
    <div className="flex flex-col h-dvh md:h-auto md:flex-1 [--shell-h:44px] md:[--shell-h:64px]">
      {/* Scrollbart indholdsområde. min-h-0 er nødvendigt: uden det vil et
          flex-1-element som udgangspunkt aldrig blive mindre end sit eget
          indhold, og overflow-y-auto ville derfor aldrig få noget at scrolle. */}
      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
        {/* Almindelig del af det scrollbare indhold på mobil — scroller væk
            med resten. Sticky fra md, som hidtil. */}
        <header className="md:sticky top-0 z-50 bg-white border-b border-gray-100 h-[var(--shell-h)] flex-shrink-0 overflow-x-hidden">
          {/* Desktop — én kompakt vandret bar, uændret */}
          <div className="hidden md:flex items-center justify-between h-full max-w-6xl mx-auto px-6">
            <Link href={overblikHref} className="logo flex-shrink-0">nembyggestyring</Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const aktiv = item.aktiv(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      aktiv ? "bg-[#1e3a2a]/10 text-[#1e3a2a]" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    {item.href === "/chat" && ulaestSamlet !== null && ulaestSamlet > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1e3a2a] text-white text-[10px] font-bold flex items-center justify-center">
                        {ulaestSamlet > 99 ? "99+" : ulaestSamlet}
                      </span>
                    )}
                    {item.href === "/notifikationer" && ulaestNotifikationer !== null && ulaestNotifikationer > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#9c3b3b] text-white text-[10px] font-bold flex items-center justify-center">
                        {ulaestNotifikationer > 9 ? "9+" : ulaestNotifikationer}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobil — kun logo + profil. Almindelig del af det scrollbare
              indhold: scroller væk med resten. */}
          <div className="md:hidden flex items-center justify-between h-full px-4">
            <Link href={overblikHref} className="logo">nembyggestyring</Link>
            <Link
              href={profilHref}
              aria-label="Profil"
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                profilAktiv ? "text-[#1e3a2a]" : "text-gray-500"
              }`}
            >
              {IkonProfil}
            </Link>
          </div>
        </header>

        {children}
      </div>

      {/* Bundnavigation — normal flex-søskende UDEN FOR det scrollbare
          område, ikke positioneret/fixed. Optager sin egen faste plads
          nederst i viewporten; indholdet ovenfor kan derfor aldrig ses eller
          fortsætte visuelt bagved den. */}
      <nav
        className="md:hidden flex-shrink-0 grid grid-cols-4 bg-white border-t border-gray-100 h-14"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map((item) => {
          const aktiv = item.aktiv(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`relative min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors ${
                aktiv ? "text-[#1e3a2a]" : "text-gray-400"
              }`}
            >
              {item.ikon}
              <span className="w-full text-center text-[9px] font-semibold leading-none truncate">
                {item.label}
              </span>
              {item.href === "/chat" && ulaestSamlet !== null && ulaestSamlet > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-[#1e3a2a]" />
              )}
              {item.href === "/notifikationer" && ulaestNotifikationer !== null && ulaestNotifikationer > 0 && (
                <span className="absolute top-0.5 right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#9c3b3b] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {ulaestNotifikationer > 9 ? "9+" : ulaestNotifikationer}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
