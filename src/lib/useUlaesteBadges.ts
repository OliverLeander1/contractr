"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface UlaesteBadges {
  ulaestSamlet: number | null;
  ulaestNotifikationer: number | null;
  rolle: "bygherre" | "haandvaerker" | null;
}

// Delt mellem AuthenticatedAppShell (bygherre-orienterede ruter) og
// entreprenørens egne sideheadere (/haandvaerker/sager,
// /haandvaerker/projekt/[id]) — samme opslag ét sted, så de to
// navigationer aldrig kan drifte fra hinanden. Genbruger samme skema/
// read-state som /notifikationer/page.tsx (laest-feltet på
// public.notifikationer) — intet nyt system.
export function useUlaesteBadges(aktiv: boolean, herudoverKey?: unknown): UlaesteBadges {
  const [ulaestSamlet, setUlaestSamlet] = useState<number | null>(null);
  const [ulaestNotifikationer, setUlaestNotifikationer] = useState<number | null>(null);
  const [rolle, setRolle] = useState<"bygherre" | "haandvaerker" | null>(null);

  useEffect(() => {
    if (!aktiv) return;
    let annulleret = false;

    // Ingen synkron nulstilling her (undgår cascading renders) — badges
    // sættes eksplicit til enten en værdi eller null i alle grene nedenfor,
    // så en forkert/gammel værdi fra en tidligere rute aldrig bliver stående.
    const hentBadges = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !session.user) {
          if (!annulleret) { setUlaestSamlet(null); setUlaestNotifikationer(null); setRolle(null); } // udløbet/manglende session
          return;
        }

        const [chatRes, notifikationerRes, profilRes] = await Promise.all([
          fetch("/api/chat/oversigt", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          supabase
            .from("notifikationer")
            .select("id", { count: "exact", head: true })
            .eq("bruger_id", session.user.id)
            .eq("laest", false),
          supabase.from("profiler").select("rolle").eq("id", session.user.id).maybeSingle(),
        ]);

        if (!annulleret) {
          if (chatRes.ok) {
            const body = await chatRes.json();
            setUlaestSamlet(typeof body?.ulaest_samlet === "number" ? body.ulaest_samlet : null);
          } else {
            setUlaestSamlet(null);
          }
          setUlaestNotifikationer(notifikationerRes.error ? null : (notifikationerRes.count ?? 0));
          setRolle(profilRes.data?.rolle === "haandvaerker" ? "haandvaerker" : "bygherre");
        }
      } catch {
        // Badgefejl må aldrig skjule eller deaktivere navigationen — badges skjules blot.
        if (!annulleret) { setUlaestSamlet(null); setUlaestNotifikationer(null); }
      }
    };

    // Genhentes ved mount/genindlæsningsnøgle, når fanen får fokus igen, når
    // fanen bliver synlig igen, og med let polling — så badgen ikke kræver
    // en manuel genindlæsning for at vise nye tal.
    hentBadges();
    window.addEventListener("focus", hentBadges);
    const handleSynlighed = () => { if (document.visibilityState === "visible") hentBadges(); };
    document.addEventListener("visibilitychange", handleSynlighed);
    const interval = setInterval(hentBadges, 30_000);

    // /notifikationer dispatcher denne straks efter selv at have markeret
    // alt som læst, så badgen nulstilles øjeblikkeligt uden at vente på et
    // routeskift eller pollingintervallet.
    const handleLaest = () => { if (!annulleret) setUlaestNotifikationer(0); };
    window.addEventListener("nembyg:notifikationer-laest", handleLaest);

    return () => {
      annulleret = true;
      window.removeEventListener("focus", hentBadges);
      document.removeEventListener("visibilitychange", handleSynlighed);
      window.removeEventListener("nembyg:notifikationer-laest", handleLaest);
      clearInterval(interval);
    };
  }, [aktiv, herudoverKey]);

  return { ulaestSamlet, ulaestNotifikationer, rolle };
}
