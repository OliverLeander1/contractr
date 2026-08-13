"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

// Kun rutepræfikser — ingen adgangskontrol. Middleware og de sikre
// API-routes er fortsat autoritative for hvem der reelt må se siderne.
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

const NAV_ITEMS: NavItem[] = [
  { label: "Overblik", href: "/dashboard", aktiv: (p) => matcherPræfiks(p, "/dashboard"), ikon: IkonOverblik },
  { label: "Samtaler", href: "/chat", aktiv: erChatAktiv, ikon: IkonChat },
  { label: "Notifikationer", href: "/notifikationer", aktiv: (p) => matcherPræfiks(p, "/notifikationer"), ikon: IkonNotifikationer },
  { label: "Profil", href: "/konto", aktiv: (p) => p === "/konto", ikon: IkonProfil },
];

export default function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const visShell = skalViseShell(pathname);
  const [ulaestSamlet, setUlaestSamlet] = useState<number | null>(null);
  // Genbruger samme skema/read-state som /notifikationer/page.tsx (laest-
  // feltet på public.notifikationer) — intet nyt system, kun endnu et
  // client-side count-opslag, RLS-scopet til brugerens egne rækker.
  const [ulaestNotifikationer, setUlaestNotifikationer] = useState<number | null>(null);

  useEffect(() => {
    if (!visShell) return;
    let annulleret = false;

    (async () => {
      // Ingen synkron nulstilling her (undgår cascading renders) — badges
      // sættes eksplicit til enten et tal eller null i alle grene nedenfor,
      // så et forkert/gammelt tal fra en tidligere rute aldrig bliver stående.
      // Genhentes ved hvert routeskift (samme mønster som chat-badgen), så
      // begge tæl naturligt opdaterer sig, når brugeren fx forlader
      // /notifikationer efter at siden selv har markeret alt som læst.
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !session.user) {
          if (!annulleret) { setUlaestSamlet(null); setUlaestNotifikationer(null); } // udløbet/manglende session — aldrig et falsk 0
          return;
        }

        const [chatRes, notifikationerRes] = await Promise.all([
          fetch("/api/chat/oversigt", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          supabase
            .from("notifikationer")
            .select("id", { count: "exact", head: true })
            .eq("bruger_id", session.user.id)
            .eq("laest", false),
        ]);

        if (!annulleret) {
          if (chatRes.ok) {
            const body = await chatRes.json();
            setUlaestSamlet(typeof body?.ulaest_samlet === "number" ? body.ulaest_samlet : null);
          } else {
            setUlaestSamlet(null);
          }
          setUlaestNotifikationer(notifikationerRes.error ? null : (notifikationerRes.count ?? 0));
        }
      } catch {
        // Badgefejl må aldrig skjule eller deaktivere navigationen — badges skjules blot.
        if (!annulleret) { setUlaestSamlet(null); setUlaestNotifikationer(null); }
      }
    })();

    return () => { annulleret = true; };
  }, [pathname, visShell]);

  return (
    <div className="flex-1 flex flex-col [--shell-h:88px] md:[--shell-h:64px]">
      {visShell && (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 h-[var(--shell-h)] flex-shrink-0 overflow-x-hidden">
          {/* Desktop — én kompakt vandret bar */}
          <div className="hidden md:flex items-center justify-between h-full max-w-6xl mx-auto px-6">
            <Link href="/dashboard" className="logo flex-shrink-0">nembyggestyring</Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
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
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1e3a2a]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobil — kompakt topnavigation i to rækker, ingen bundnavigation
              (en fast bundnav ville kollidere med chatcomposerens inputfelt) */}
          <div className="md:hidden flex flex-col h-full">
            <div className="h-11 flex items-center justify-between px-4 flex-shrink-0">
              <Link href="/dashboard" className="logo">nembyggestyring</Link>
              <Link
                href="/konto"
                aria-label="Profil"
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  pathname === "/konto" ? "text-[#1e3a2a]" : "text-gray-500"
                }`}
              >
                {IkonProfil}
              </Link>
            </div>
            {/* grid-cols-4 (i stedet for flex+justify-around) garanterer fire
                lige brede, ikke-krympende felter — en flex-række uden
                min-w-0 lod tidligere det lange ord "Notifikationer" tvinge
                rækken (og dermed siden) bredere end viewporten. */}
            <div className="h-11 w-full grid grid-cols-4 border-t border-gray-100 flex-shrink-0">
              {NAV_ITEMS.map((item) => {
                const aktiv = item.aktiv(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`relative min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-lg transition-colors ${
                      aktiv ? "text-[#1e3a2a]" : "text-gray-400"
                    }`}
                  >
                    {item.ikon}
                    <span className="w-full text-center text-[9px] font-semibold leading-none truncate">
                      {item.label}
                    </span>
                    {item.href === "/chat" && ulaestSamlet !== null && ulaestSamlet > 0 && (
                      <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-[#1e3a2a]" />
                    )}
                    {item.href === "/notifikationer" && ulaestNotifikationer !== null && ulaestNotifikationer > 0 && (
                      <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-[#1e3a2a]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
