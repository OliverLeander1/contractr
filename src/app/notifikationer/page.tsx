"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Notifikation {
  id: string;
  type: string;
  titel: string;
  besked: string | null;
  ab_paragraf: string | null;
  laest: boolean;
  oprettet_at: string;
  projekt_id: string | null;
}

const TYPE_IKON: Record<string, { ikon: string; cls: string }> = {
  ekstraarbejde_anmodning: { ikon: "📋", cls: "bg-amber-50 border-amber-200" },
  ekstraarbejde_godkendt:  { ikon: "✅", cls: "bg-green-50 border-green-200" },
  eftersyn_paamoind:       { ikon: "📅", cls: "bg-blue-50 border-blue-200" },
  betaling_markeret:       { ikon: "💰", cls: "bg-purple-50 border-purple-200" },
  mangel_opdateret:        { ikon: "🔧", cls: "bg-orange-50 border-orange-200" },
  ab_forbruger:            { ikon: "⚖️", cls: "bg-[#1e3a2a]/5 border-[#1e3a2a]/20" },
  besigtigelse_ny:         { ikon: "📅", cls: "bg-amber-50 border-amber-200" },
  besigtigelse_modforslag: { ikon: "📅", cls: "bg-amber-50 border-amber-200" },
  besigtigelse_godkendt:   { ikon: "✅", cls: "bg-green-50 border-green-200" },
  besigtigelse_afvist:     { ikon: "❌", cls: "bg-red-50 border-red-200" },
};

// Notifikationstyper der linker videre til besigtigelsen på det relevante
// projekt. Den korrekte destination afhænger af brugerens rolle — bygherre
// og entreprenør har hver deres projektside.
function erBesigtigelseType(type: string): boolean {
  return type.startsWith("besigtigelse_");
}

// Samme label-sæt som dashboard/konto/rapport bruger til at vise en
// menneskelig projekttype, når projektet ikke har en fri adresse endnu.
// Ikke ekstraheret til en delt helper i denne opgave (kosmetisk visning,
// UX-finish med begrænset scope) — kandidat til samling, hvis en 5. bruger
// tilføjes senere.
const PROJEKTTYPE_LABELS: Record<string, string> = {
  badevarelse: "Badeværelse", kokken: "Køkken", tag: "Tag",
  tilbygning: "Tilbygning", totalrenovering: "Totalrenovering",
  vinduer: "Vinduer og facade", maler: "Maler og gips",
  carport: "Carport og garage", vaadrum: "Vådrum", andet: "Generel renovering",
};

interface ProjektInfo {
  adresse: string | null;
  projekttype: string | null;
}

const fmtDato = (iso: string) => {
  const d = new Date(iso);
  const nu = new Date();
  const diff = Math.floor((nu.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Lige nu";
  if (diff < 3600) return `${Math.floor(diff / 60)} min. siden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} timer siden`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dage siden`;
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
};

export default function NotifikationerSide() {
  const supabase = createClient();
  const router = useRouter();
  const [notifikationer, setNotifikationer] = useState<Notifikation[]>([]);
  const [indlæser, setIndlæser] = useState(true);
  // Egen rolle hentes én gang og bruges til at afgøre den korrekte
  // rolle-specifikke destination for besigtigelsesnotifikationer — bygherre
  // og entreprenør har hver deres projektside.
  const [egenRolle, setEgenRolle] = useState<"bygherre" | "haandvaerker" | null>(null);
  // Sagsnavn pr. projekt_id, hentet i ét batched opslag (ikke pr. kort) ud
  // fra de projekt_id'er, notifikationerne allerede refererer.
  const [projektMap, setProjektMap] = useState<Record<string, ProjektInfo>>({});

  useEffect(() => {
    const hent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data }, { data: profil }] = await Promise.all([
        supabase
          .from("notifikationer")
          .select("*")
          .eq("bruger_id", user.id)
          .order("oprettet_at", { ascending: false })
          .limit(50),
        supabase.from("profiler").select("rolle").eq("id", user.id).single(),
      ]);
      setNotifikationer(data || []);
      setEgenRolle(profil?.rolle === "haandvaerker" ? "haandvaerker" : "bygherre");
      setIndlæser(false);

      const projektIder = Array.from(
        new Set((data || []).map(n => n.projekt_id).filter((id): id is string => !!id))
      );
      if (projektIder.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Server-side, verificeret opslag (bygherre-ejerskab hhv.
          // entreprenørens egen kontrakt-email) — ikke et direkte
          // client-side RLS-opslag, da entreprenørens læseadgang til
          // projekter ikke er dokumenteret sikkert i produktion.
          const res = await fetch(`/api/bruger/projekter?ids=${encodeURIComponent(projektIder.join(","))}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const map: Record<string, ProjektInfo> = await res.json();
            setProjektMap(map);
          }
        }
      }

      await supabase
        .from("notifikationer")
        .update({ laest: true })
        .eq("bruger_id", user.id)
        .eq("laest", false);
      // Navigationens badge lytter efter denne og nulstiller sig øjeblikkeligt
      // — uden at vente på et routeskift eller pollingintervallet.
      window.dispatchEvent(new Event("nembyg:notifikationer-laest"));
    };
    hent();
  }, []);

  const ulæste = notifikationer.filter(n => !n.laest).length;

  // Rolle-specifik destination for en besigtigelsesnotifikation, eller null
  // hvis notifikationen ikke skal være klikbar (ukendt type eller intet
  // projekt at linke til).
  function linkTil(n: Notifikation): string | null {
    if (!n.projekt_id || !erBesigtigelseType(n.type)) return null;
    return egenRolle === "haandvaerker"
      ? `/haandvaerker/projekt/${n.projekt_id}?fane=besigtigelse`
      : `/projekt/${n.projekt_id}#besigtigelse`;
  }

  // Diskret sekundær linje ("hvilken sag?") for enhver projekt-relateret
  // notifikation — ikke kun besigtigelse. Viser intet, hvis projektet ikke
  // (endnu) er hentet, så layoutet altid forbliver konsistent.
  function fmtSagsnavn(projektId: string | null): string | null {
    if (!projektId) return null;
    const p = projektMap[projektId];
    if (!p) return null;
    const label = (p.projekttype && PROJEKTTYPE_LABELS[p.projekttype]) || "Byggeprojekt";
    return p.adresse ? `${label}, ${p.adresse}` : label;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Notifikationer</h1>
          <p className="text-sm text-gray-400 mt-1">
            {ulæste > 0 ? `${ulæste} ulæste` : "Alle er markeret som læst"}
          </p>
        </div>

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : notifikationer.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-3xl mb-4">🔔</div>
            <p className="font-semibold text-gray-900 mb-1">Ingen notifikationer endnu</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Du får besked her når der er nyt på dine projekter: ekstraarbejde, betalinger, mangler og AB-Forbruger påmindelser.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifikationer.map(n => {
              const style = TYPE_IKON[n.type] || { ikon: "🔔", cls: "bg-gray-50 border-gray-100" };
              const link = linkTil(n);
              return (
                <div
                  key={n.id}
                  onClick={link ? () => router.push(link) : undefined}
                  role={link ? "button" : undefined}
                  tabIndex={link ? 0 : undefined}
                  onKeyDown={link ? (e) => { if (e.key === "Enter") router.push(link); } : undefined}
                  className={`rounded-2xl border p-4 flex gap-4 ${style.cls} ${!n.laest ? "ring-1 ring-[#1e3a2a]/20" : ""} ${link ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
                >
                  <div className="text-xl flex-shrink-0 mt-0.5">{style.ikon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{n.titel}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{fmtDato(n.oprettet_at)}</span>
                    </div>
                    {n.projekt_id && fmtSagsnavn(n.projekt_id) && (
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{fmtSagsnavn(n.projekt_id)}</p>
                    )}
                    {n.besked && <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{n.besked}</p>}
                    {n.ab_paragraf && (
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-[#1e3a2a]/10 text-[#1e3a2a] px-2 py-0.5 rounded-full">
                        AB-Forbruger {n.ab_paragraf}
                      </span>
                    )}
                  </div>
                  {link && (
                    <svg className="w-4 h-4 flex-shrink-0 self-center text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

