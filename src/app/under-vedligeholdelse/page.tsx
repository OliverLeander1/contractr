"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Vedligeholdelse() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [fejl, setFejl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visForm, setVisForm] = useState(false);

  const laasBind = async () => {
    if (!kode.trim()) return;
    setLoading(true);
    setFejl(false);
    const res = await fetch("/api/maintenance/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kode }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setFejl(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e3a2a] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="logo text-white/80 text-xl block mb-10">nembyggestyring</span>

        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Under vedligeholdelse</h1>
        <p className="text-white/60 text-base leading-relaxed mb-10">
          Vi arbejder på at gøre nembyggestyring endnu bedre. Vi er snart klar igen.
        </p>

        {!visForm ? (
          <button
            onClick={() => setVisForm(true)}
            className="text-white/40 text-xs hover:text-white/70 transition-colors underline underline-offset-4"
          >
            Log ind som administrator
          </button>
        ) : (
          <div className="bg-white/10 rounded-2xl p-6 text-left">
            <label className="block text-sm font-medium text-white/70 mb-2">Adgangskode</label>
            <input
              type="password"
              value={kode}
              onChange={e => { setKode(e.target.value); setFejl(false); }}
              onKeyDown={e => e.key === "Enter" && laasBind()}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 mb-3"
            />
            {fejl && (
              <p className="text-red-300 text-xs mb-3">Forkert kode. Prøv igen.</p>
            )}
            <button
              onClick={laasBind}
              disabled={loading || !kode.trim()}
              className="w-full bg-white text-[#1e3a2a] font-bold py-3 rounded-xl text-sm hover:bg-white/90 transition-colors disabled:opacity-40"
            >
              {loading ? "Kontrollerer..." : "Åbn systemet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
