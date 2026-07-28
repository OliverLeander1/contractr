"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

function AccepterInvitationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projektId   = searchParams.get("projekt")     || "1";
  const projektNavn = searchParams.get("projektNavn") || "Byggeprojekt";
  const bygherreNavn = searchParams.get("bygherre")   || "Bygherre";
  const haandvaerkerEmail = searchParams.get("email") || "";

  const [trin, setTrin] = useState(1);
  const [mode, setMode] = useState<"opret" | "login">("opret");

  // Profilfelter
  const [navn, setNavn]           = useState("");
  const [virksomhed, setVirksomhed] = useState("");
  const [cvr, setCvr]             = useState("");
  const [telefon, setTelefon]     = useState("");

  // Auth-felter
  const [email, setEmail]         = useState(haandvaerkerEmail);
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [alleredeLoggetInd, setAlleredeLoggetInd] = useState(false);

  // Tjek om allerede logget ind
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setAlleredeLoggetInd(true);
    });
  }, []);

  const opret = async () => {
    setError("");
    if (!navn.trim()) { setError("Indtast dit navn."); return; }
    if (!email.trim()) { setError("Indtast din e-mail."); return; }
    if (password.length < 8) { setError("Adgangskoden skal være mindst 8 tegn."); return; }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { navn: navn.trim(), brugerType: "haandvaerker" },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Der findes allerede en konto med denne e-mail. Log ind i stedet.");
        setMode("login");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // Automatisk login efter signup
    if (data.user) {
      await supabase.from("profiler").upsert({
        id: data.user.id,
        navn: navn.trim(),
        virksomhed: virksomhed.trim() || null,
        cvr: cvr.trim() || null,
        telefon: telefon.trim() || null,
        email: email.trim(),
        rolle: "haandvaerker",
      }, { onConflict: "id" });
    }

    setLoading(false);
    router.push(`/haandvaerker/projekt/${projektId}`);
  };

  const login = async () => {
    setError("");
    if (!email.trim()) { setError("Indtast din e-mail."); return; }
    if (!password.trim()) { setError("Indtast din adgangskode."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Forkert e-mail eller adgangskode.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/haandvaerker/projekt/${projektId}`);
  };

  const gaTilProjekt = () => router.push(`/haandvaerker/projekt/${projektId}`);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <span className="logo">nembyggestyring</span>
      </Link>

      {/* Trin 1 — Invitation */}
      {trin === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          <div className="w-14 h-14 bg-[#f0f7f3] rounded-2xl flex items-center justify-center mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Du er inviteret</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            <span className="font-semibold text-gray-900">{bygherreNavn}</span> har inviteret dig til projektet{" "}
            <span className="font-semibold text-gray-900">&ldquo;{projektNavn}&rdquo;</span> på Nembyggestyring.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">Projekt</p>
              <p className="text-sm font-medium text-gray-900">{projektNavn}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-gray-400">Inviteret af</p>
              <p className="text-sm font-medium text-gray-900">{bygherreNavn}</p>
            </div>
            {haandvaerkerEmail && (
              <div className="flex justify-between">
                <p className="text-sm text-gray-400">Din e-mail</p>
                <p className="text-sm font-medium text-gray-900">{haandvaerkerEmail}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => alleredeLoggetInd ? gaTilProjekt() : setTrin(2)}
            className="w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mb-3"
          >
            {alleredeLoggetInd ? "Gå til projektet" : "Accepter invitation"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full border border-gray-200 text-gray-500 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Afvis invitation
          </button>
        </div>
      )}

      {/* Trin 2 — Opret konto eller log ind */}
      {trin === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          {/* Mode-toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("opret")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "opret" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              Opret konto
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              Log ind
            </button>
          </div>

          {mode === "opret" && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Opret din profil</h1>
              <p className="text-sm text-gray-400 mb-5">Så bygherre ved hvem de arbejder med</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dit navn <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Dit fulde navn" value={navn} onChange={e => setNavn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Virksomhed</label>
                  <input type="text" placeholder="Firmanavn" value={virksomhed} onChange={e => setVirksomhed(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR</label>
                    <input type="text" placeholder="8 cifre" value={cvr} onChange={e => setCvr(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                    <input type="tel" placeholder="20 12 34 56" value={telefon} onChange={e => setTelefon(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail <span className="text-red-400">*</span></label>
                  <input type="email" placeholder="din@email.dk" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all mb-3" />
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adgangskode <span className="text-red-400">*</span></label>
                  <input type="password" placeholder="Mindst 8 tegn" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              <button onClick={opret} disabled={loading}
                className="w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-5 disabled:opacity-50">
                {loading ? "Opretter konto..." : "Opret konto og gå til projekt"}
              </button>
            </>
          )}

          {mode === "login" && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Log ind</h1>
              <p className="text-sm text-gray-400 mb-5">Du accepterer invitationen og sendes direkte til projektet</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adgangskode</label>
                  <input type="password" placeholder="Din adgangskode" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && login()}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              <button onClick={login} disabled={loading}
                className="w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-5 disabled:opacity-50">
                {loading ? "Logger ind..." : "Log ind og gå til projekt"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AccepterInvitation() {
  return (
    <Suspense>
      <AccepterInvitationInner />
    </Suspense>
  );
}
