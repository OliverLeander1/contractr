"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";

interface Kontrakt {
  id: string;
  titel: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  haandvaerker_email: string | null;
  status: string;
}

export default function ChatLanding() {
  const { id } = useParams<{ id: string }>();
  const [kontrakter, setKontrakter] = useState<Kontrakt[]>([]);
  const [indlæser, setIndlæser] = useState(true);
  const [ikkeLoggetInd, setIkkeLoggetInd] = useState(false);

  useEffect(() => {
    async function hent() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIkkeLoggetInd(true);
        setIndlæser(false);
        return;
      }
      const res = await fetch(`/api/projekter/${id}/kontrakter`);
      const data = await res.json();
      if (Array.isArray(data)) setKontrakter(data);
      setIndlæser(false);
    }
    hent();
  }, [id]);

  if (!indlæser && ikkeLoggetInd) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-sm text-gray-500">Log ind for at se dine samtaler.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-sm text-gray-400 mt-1">
            Samtaler er knyttet til de enkelte aftalegrundlag i projektet.
          </p>
        </div>

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : kontrakter.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-800 mb-1">Ingen aftalegrundlag endnu</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Opret et aftalegrundlag under fanen Aftale for at starte en samtale med din håndværker.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {kontrakter.map((k) => {
              const harEmail = !!k.haandvaerker_email;
              const modpart = k.haandvaerker_firma || k.haandvaerker_navn || "Håndværker";
              return (
                <div
                  key={k.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${!harEmail ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-[#1e3a2a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {k.titel || "Aftalegrundlag"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{modpart}</p>
                        {!harEmail && (
                          <p className="text-xs text-amber-600 mt-1">
                            Håndværkerens e-mail mangler. Inviter håndværkeren fra Aftale-fanen.
                          </p>
                        )}
                      </div>
                    </div>

                    {harEmail ? (
                      <Link
                        href={`/projekt/${id}/chat/${k.id}`}
                        className="flex-shrink-0 flex items-center gap-2 bg-[#1e3a2a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Åbn
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </Link>
                    ) : (
                      <span className="flex-shrink-0 text-sm text-gray-300 font-medium px-4 py-2.5">
                        Ikke tilgængelig
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 px-4 py-3 bg-gray-100 rounded-xl">
          <p className="text-xs text-gray-400 leading-relaxed">
            Tidligere projektsamtaler er endnu ikke tilgængelige i den nye visning.
          </p>
        </div>
      </div>
    </div>
  );
}
