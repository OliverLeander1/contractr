"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type BrugerType = "bygherre" | "haandvaerker" | null;

export default function Login() {
  const router = useRouter();
  const [brugerType, setBrugerType] = useState<BrugerType>(null);
  const [mode, setMode] = useState<"login" | "opret">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [navn, setNavn] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bekraeftelse, setBekraeftelse] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) { setError("Indtast din e-mail."); return; }
    if (!password.trim()) { setError("Indtast din adgangskode."); return; }
    if (mode === "opret" && !navn.trim()) { setError("Indtast dit navn."); return; }
    if (password.length < 8) { setError("Adgangskoden skal være mindst 8 tegn."); return; }

    setLoading(true);
    const supabase = createClient();

    if (mode === "opret") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            navn: navn.trim(),
            brugerType,
          },
        },
      });

      if (signUpError) {
        setLoading(false);
        if (signUpError.message.includes("already registered")) {
          setError("Der findes allerede en konto med denne e-mail. Prøv at logge ind i stedet.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Gem i localStorage så resten af platformen kan bruge det
      localStorage.setItem("contractr_user", JSON.stringify({
        navn: navn.trim(),
        email: email.trim(),
        brugerType,
        loginDato: new Date().toISOString(),
      }));

      setBekraeftelse(true);
      setLoading(false);
      return;
    }

    // Login
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Forkert e-mail eller adgangskode.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Bekræft din e-mail inden du logger ind. Tjek din indbakke.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    // Gem brugerdata i localStorage
    const meta = data.user?.user_metadata;
    const gemt = {
      navn: meta?.navn || email.split("@")[0],
      email: email.trim(),
      brugerType: meta?.brugerType || brugerType,
      loginDato: new Date().toISOString(),
    };
    localStorage.setItem("contractr_user", JSON.stringify(gemt));

    // Opdater evt. eksisterende projektdata
    const raw = localStorage.getItem("contractr_projekt");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (!p.navn && gemt.navn) p.navn = gemt.navn;
        if (!p.kontakt && gemt.email) p.kontakt = gemt.email;
        localStorage.setItem("contractr_projekt", JSON.stringify(p));
      } catch { /* ignore */ }
    }

    const type = meta?.brugerType || brugerType;
    router.push(type === "haandvaerker" ? "/haandvaerker/sager" : "/hub");
  };

  if (bekraeftelse) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <span className="logo">nembyggestyring</span>
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tjek din e-mail</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Vi har sendt en bekræftelseslink til <strong>{email}</strong>. Klik på linket for at aktivere din konto og logge ind.
          </p>
          <p className="text-xs text-gray-400">Kan du ikke finde mailen? Tjek din spam-mappe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <span className="logo">nembyggestyring</span>
      </Link>

      {!brugerType && (
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Hvem er du?</h1>
          <p className="text-sm text-gray-400 text-center mb-8">Vælg din rolle for at fortsætte</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setBrugerType("bygherre")}
              className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-[#1a5c38]/40 hover:shadow-md transition-all group"
            >
              <div className="w-14 h-14 bg-[#f0f7f3] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1a5c38]/10 transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">Bygherre</p>
              <p className="text-xs text-gray-400 leading-relaxed">Jeg skal renovere eller bygge</p>
            </button>
            <button
              onClick={() => setBrugerType("haandvaerker")}
              className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-[#1a5c38]/40 hover:shadow-md transition-all group"
            >
              <div className="w-14 h-14 bg-[#f0f7f3] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1a5c38]/10 transition-colors">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="1.8">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">Håndværker</p>
              <p className="text-xs text-gray-400 leading-relaxed">Jeg er inviteret til et projekt</p>
            </button>
          </div>
        </div>
      )}

      {brugerType && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          <button
            onClick={() => { setBrugerType(null); setError(""); }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Skift rolle
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#f0f7f3] rounded-xl flex items-center justify-center">
              {brugerType === "bygherre" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">{brugerType === "bygherre" ? "Log ind som bygherre" : "Log ind som håndværker"}</p>
              <p className="text-xs text-gray-400">{brugerType === "bygherre" ? "Adgang til dine byggeprojekter" : "Adgang til dine sager"}</p>
            </div>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Log ind
            </button>
            <button
              onClick={() => { setMode("opret"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "opret" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Opret konto
            </button>
          </div>

          <div className="space-y-4">
            {mode === "opret" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dit navn</label>
                <input
                  type="text"
                  placeholder="Dit fulde navn"
                  value={navn}
                  onChange={e => setNavn(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                placeholder="din@email.dk"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Adgangskode</label>
                {mode === "login" && (
                  <button
                    onClick={async () => {
                      if (!email.trim()) { setError("Indtast din e-mail for at nulstille adgangskoden."); return; }
                      const supabase = createClient();
                      await supabase.auth.resetPasswordForEmail(email.trim());
                      setError("Vi har sendt et link til at nulstille din adgangskode.");
                    }}
                    className="text-xs text-[#1a5c38] hover:underline"
                  >
                    Glemt adgangskode?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
              />
              {mode === "opret" && (
                <p className="text-xs text-gray-400 mt-1">Mindst 8 tegn.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full font-bold py-3.5 rounded-xl mt-6 transition-all ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#1a5c38] text-white hover:opacity-90"}`}
          >
            {loading ? "Vent..." : mode === "login" ? "Log ind" : "Opret konto"}
          </button>

          {mode === "opret" && (
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              Ved oprettelse accepterer du vores{" "}
              <Link href="/vilkaar" className="text-[#1a5c38] hover:underline">vilkår</Link>{" "}og{" "}
              <Link href="/privatliv" className="text-[#1a5c38] hover:underline">privatlivspolitik</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
