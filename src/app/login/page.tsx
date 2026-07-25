"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || null;
  const [mode, setMode] = useState<"login" | "opret">("opret");
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { navn: navn.trim(), brugerType: "bygherre" },
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

      localStorage.setItem("contractr_user", JSON.stringify({
        navn: navn.trim(),
        email: email.trim(),
        brugerType: "bygherre",
        loginDato: new Date().toISOString(),
      }));

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setBekraeftelse(true);
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push(nextUrl || "/dashboard");
      return;
    }

    // Login
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

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

    const meta = data.user?.user_metadata;
    const gemt = {
      navn: meta?.navn || email.split("@")[0],
      email: email.trim(),
      brugerType: meta?.brugerType || "bygherre",
      loginDato: new Date().toISOString(),
    };
    localStorage.setItem("contractr_user", JSON.stringify(gemt));

    const raw = localStorage.getItem("contractr_projekt");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (!p.navn && gemt.navn) p.navn = gemt.navn;
        if (!p.kontakt && gemt.email) p.kontakt = gemt.email;
        localStorage.setItem("contractr_projekt", JSON.stringify(p));
      } catch { /* ignore */ }
    }

    const type = meta?.brugerType || "bygherre";
    router.push(nextUrl || (type === "haandvaerker" ? "/haandvaerker/sager" : "/dashboard"));
  };

  if (bekraeftelse) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="logo mb-10 block">nembyggestyring</Link>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tjek din e-mail</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Vi har sendt et bekræftelseslink til <strong>{email}</strong>. Klik på linket for at aktivere din konto og logge ind.
          </p>
          <p className="text-xs text-gray-400">Kan du ikke finde mailen? Tjek din spam-mappe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col lg:flex-row">

      {/* Venstre panel — value proposition */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a2a] flex-col justify-between px-16 py-14">
        <Link href="/" style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "2px" }} className="text-white/80 text-lg">
          nembyggestyring
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-6">
            Styr hele projektet.<br />Ikke bare papiret.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
            Fra det første udkast til 1-års eftersyn. Et sted for bygherre og håndværker, med alle aftaler samlet.
          </p>

          <div className="space-y-6">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                titel: "Opret projektet digitalt",
                tekst: "Beskriv hvad du vil bygge, og vi laver et professionelt udbudsdokument klar til entreprenører.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                titel: "Tjek tilbuddet inden du siger ja",
                tekst: "Vi gennemgår aftalegrundlaget og viser hvad der mangler eller bør afklares.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
                titel: "Alt samlet ét sted",
                tekst: "Kontrakt, billeder, ekstraarbejde og tidsplan. Ingen jagt på mails og SMS'er.",
              },
            ].map((p, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white/80">
                  {p.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5">{p.titel}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{p.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">Nembyggestyring skaber rammerne for det gode projekt</p>
      </div>

      {/* Højre panel — formular */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="logo mb-8 block lg:hidden">nembyggestyring</Link>

        <div className="w-full max-w-sm">
          {/* Tab-toggle */}
          <div className="flex bg-white border border-gray-100 shadow-sm rounded-xl p-1 mb-8">
            <button
              onClick={() => { setMode("opret"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "opret" ? "bg-[#1e3a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Opret konto
            </button>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-[#1e3a2a] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Log ind
            </button>
          </div>

          <div className="space-y-4">
            {mode === "opret" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dit navn</label>
                <input
                  type="text"
                  placeholder="F.eks. Mette Hansen"
                  value={navn}
                  onChange={e => setNavn(e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
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
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
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
                    className="text-xs text-[#1e3a2a] hover:underline"
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
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
              {mode === "opret" && (
                <p className="text-xs text-gray-400 mt-1.5">Mindst 8 tegn.</p>
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
            className={`w-full font-bold py-3.5 rounded-xl mt-6 transition-all ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#1e3a2a] text-white hover:opacity-90 shadow-md shadow-[#1e3a2a]/20"}`}
          >
            {loading ? "Vent..." : mode === "login" ? "Log ind" : "Opret gratis konto"}
          </button>

          {mode === "opret" && (
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              Ved oprettelse accepterer du vores{" "}
              <Link href="/vilkaar" className="text-[#1e3a2a] hover:underline">vilkår</Link>{" "}og{" "}
              <Link href="/privatliv" className="text-[#1e3a2a] hover:underline">privatlivspolitik</Link>.
            </p>
          )}

          {/* Mobilvisning: kompakt fordele */}
          <div className="lg:hidden mt-8 pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Hvad du får</p>
            <div className="space-y-3">
              {[
                "Opret projektet og send det i udbud til entreprenører",
                "Tjek tilbuddet inden du skriver under",
                "Alle aftaler og ekstraarbejde samlet ét sted",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
