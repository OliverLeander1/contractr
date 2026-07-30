"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function GendanKonto() {
  const router = useRouter();
  const [slettesDato, setSlettesDato] = useState<string | null>(null);
  const [dagetilbage, setDageTilbage] = useState<number | null>(null);
  const [gendanner, setGendanner] = useState(false);
  const [gendannet, setGendannet] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profil } = await supabase
        .from("profiler")
        .select("slettet_planlagt_at")
        .eq("id", user.id)
        .single();

      if (!profil?.slettet_planlagt_at) {
        router.push("/dashboard");
        return;
      }

      const dato = new Date(profil.slettet_planlagt_at);
      setSlettesDato(dato.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" }));
      const dage = Math.ceil((dato.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setDageTilbage(Math.max(0, dage));
    };
    hent();
  }, [router]);

  async function gendan() {
    setGendanner(true);
    setError("");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Ikke logget ind."); setGendanner(false); return; }

    const res = await fetch("/api/bruger/slet", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      setGendannet(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    } else {
      setError("Noget gik galt. Prøv igen.");
      setGendanner(false);
    }
  }

  async function logUd() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (gendannet) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Konto gendannet</h2>
          <p className="text-sm text-gray-500">Du sendes tilbage til dit dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="logo block text-center mb-10">nembyggestyring</Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Rød header */}
          <div className="bg-red-50 border-b border-red-100 px-8 py-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-red-900">Din konto er planlagt til sletning</h1>
            {slettesDato && (
              <p className="text-sm text-red-600 mt-1">
                Alle dine data slettes automatisk den <strong>{slettesDato}</strong>
                {dagetilbage !== null && ` (om ${dagetilbage} ${dagetilbage === 1 ? "dag" : "dage"})`}
              </p>
            )}
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Du har anmodet om sletning af din konto. Inden fristen kan du fortryde og gendanne adgang til alle dine projekter og dokumenter.
            </p>

            <div className="space-y-3">
              <button
                onClick={gendan}
                disabled={gendanner}
                className="w-full py-3.5 bg-[#1e3a2a] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {gendanner ? "Gendanner..." : "Fortryd — gendan min konto"}
              </button>

              <button
                onClick={logUd}
                className="w-full py-3 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Log ud og lad sletningen fortsætte
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 mt-3 text-center">{error}</p>
            )}

            <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
              Spørgsmål? Kontakt os på{" "}
              <a href="mailto:support@nembyggestyring.dk" className="text-[#1e3a2a] hover:underline">
                support@nembyggestyring.dk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
