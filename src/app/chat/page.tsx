"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Samtale {
  samtale_id: string;
  kontrakt_id: string;
  projekt_id: string;
  kontrakt_titel: string;
  modpart_navn: string;
  seneste_besked_id: string | null;
  seneste_besked_preview: string | null;
  seneste_afsender_id: string | null;
  seneste_afsender_navn: string | null;
  seneste_sendt_at: string | null;
  ulaest_antal: number;
  link: string;
}

type Tilstand =
  | { type: "indlæser" }
  | { type: "login-krævet" }
  | { type: "fejl" }
  | { type: "klar"; samtaler: Samtale[]; brugerId: string };

function fmtTid(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const nu = new Date();
  if (d.toDateString() === nu.toDateString()) {
    return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

export default function GlobalChat() {
  const [tilstand, setTilstand] = useState<Tilstand>({ type: "indlæser" });
  const [genindlæsning, setGenindlæsning] = useState(0);

  useEffect(() => {
    let annulleret = false;

    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (!annulleret) setTilstand({ type: "login-krævet" });
        return;
      }

      try {
        const res = await fetch("/api/chat/oversigt", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.status === 401) {
          if (!annulleret) setTilstand({ type: "login-krævet" });
          return;
        }
        if (!res.ok) {
          if (!annulleret) setTilstand({ type: "fejl" });
          return;
        }

        const body = await res.json();
        if (!annulleret) {
          setTilstand({
            type: "klar",
            samtaler: Array.isArray(body?.samtaler) ? body.samtaler : [],
            brugerId: session.user.id,
          });
        }
      } catch {
        if (!annulleret) setTilstand({ type: "fejl" });
      }
    })();

    return () => { annulleret = true; };
  }, [genindlæsning]);

  function prøvIgen() {
    setTilstand({ type: "indlæser" });
    setGenindlæsning((n) => n + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-sm text-gray-400 mt-1">
            Alle dine samtaler med håndværkere, samlet ét sted.
          </p>
        </div>

        {tilstand.type === "indlæser" && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tilstand.type === "login-krævet" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="font-semibold text-gray-800 mb-2">Log ind for at se dine samtaler</p>
            <Link href="/login?next=/chat" className="text-sm text-[#1e3a2a] font-semibold hover:underline">
              Gå til login
            </Link>
          </div>
        )}

        {tilstand.type === "fejl" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="font-semibold text-gray-800 mb-2">Chat kunne ikke hentes lige nu</p>
            <button
              onClick={prøvIgen}
              className="text-sm text-[#1e3a2a] font-semibold hover:underline"
            >
              Prøv igen
            </button>
          </div>
        )}

        {tilstand.type === "klar" && tilstand.samtaler.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-[#1e3a2a]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-800 mb-1">Ingen samtaler endnu</p>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
              Samtaler vises her, når et af dine aftalegrundlag har en tilknyttet håndværkerchat.
            </p>
          </div>
        )}

        {tilstand.type === "klar" && tilstand.samtaler.length > 0 && (
          <div className="space-y-3">
            {tilstand.samtaler.map((s) => {
              const harBesked = !!s.seneste_besked_id;
              const erMig = harBesked && s.seneste_afsender_id === tilstand.brugerId;
              const afsenderLabel = erMig ? "Du" : s.seneste_afsender_navn || s.modpart_navn;
              const indhold = (
                <>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{s.modpart_navn}</p>
                        {s.seneste_sendt_at && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{fmtTid(s.seneste_sendt_at)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{s.kontrakt_titel}</p>
                      {harBesked ? (
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          <span className="font-medium text-gray-700">{afsenderLabel}: </span>
                          {s.seneste_besked_preview}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1 italic">
                          Samtalen er oprettet — ingen beskeder endnu
                        </p>
                      )}
                    </div>
                  </div>
                  {s.ulaest_antal > 0 && (
                    <span className="flex-shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#1e3a2a] text-white text-xs font-bold flex items-center justify-center ml-2">
                      {s.ulaest_antal > 99 ? "99+" : s.ulaest_antal}
                    </span>
                  )}
                </>
              );

              if (!s.link) {
                return (
                  <div
                    key={s.samtale_id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between opacity-70"
                  >
                    {indhold}
                  </div>
                );
              }

              return (
                <Link
                  key={s.samtale_id}
                  href={s.link}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:border-[#1e3a2a]/40 hover:shadow-md transition-all"
                >
                  {indhold}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
