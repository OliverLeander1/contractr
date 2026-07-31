"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { track, identifyUser } from "@/lib/analytics";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || null;
  const rolleFraUrl = searchParams.get("rolle");
  const [mode, setMode] = useState<"login" | "opret">(rolleFraUrl ? "opret" : "login");
  const [rolle, setRolle] = useState<"bygherre" | "haandvaerker">(rolleFraUrl === "haandvaerker" ? "haandvaerker" : "bygherre");
  const roterende = ["aftaler", "tidsplanen", "mangler", "betalinger", "ekstraarbejde"];
  const [rotIdx, setRotIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setRotIdx(i => (i + 1) % roterende.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [navn, setNavn] = useState("");
  const [adresse, setAdresse] = useState("");
  const [adresseForslag, setAdresseForslag] = useState<{ tekst: string; data?: { id: string } }[]>([]);
  const [visAdresseForslag, setVisAdresseForslag] = useState(false);
  const [virksomhed, setVirksomhed] = useState("");
  const [cvr, setCvr] = useState("");
  const [fag, setFag] = useState("");
  const [cvrSoeger, setCvrSoeger] = useState(false);
  const [cvrVerificeret, setCvrVerificeret] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bekraeftelse, setBekraeftelse] = useState(false);
  const [visPassword, setVisPassword] = useState(false);

  const FAGS = [
    "Hovedentreprenør", "Totalentreprenør", "Tømrer", "Murer", "VVS", "Elektriker",
    "Maler", "Gulvlægger", "Blikkenslager", "Snedker", "Smed", "Kloakmester", "Facademontør", "Andet",
  ];

  useEffect(() => {
    if (adresse.length < 3) { setAdresseForslag([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(adresse)}&type=adresse&per_side=6`);
        const data = await res.json();
        setAdresseForslag(data);
        setVisAdresseForslag(true);
      } catch { setAdresseForslag([]); }
    }, 200);
    return () => clearTimeout(timeout);
  }, [adresse]);

  useEffect(() => {
    const digits = cvr.replace(/\D/g, "");
    if (digits.length !== 8) { setCvrVerificeret(false); return; }
    setCvrSoeger(true);
    fetch(`https://cvrapi.dk/api?search=${digits}&country=dk`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.name) { setVirksomhed(data.name); setCvrVerificeret(true); } })
      .catch(() => {})
      .finally(() => setCvrSoeger(false));
  }, [cvr]);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) { setError("Indtast din e-mail."); return; }
    if (!password.trim()) { setError("Indtast din adgangskode."); return; }
    if (mode === "opret" && !navn.trim()) { setError("Indtast dit navn."); return; }
    if (mode === "opret" && rolle === "haandvaerker" && cvr.replace(/\D/g, "").length !== 8) { setError("Indtast dit CVR-nummer (8 cifre) for at oprette konto som entreprenør."); return; }
    if (mode === "opret" && rolle === "haandvaerker" && !fag) { setError("Vælg dit fagområde for at oprette konto som entreprenør."); return; }
    if (password.length < 8) { setError("Adgangskoden skal være mindst 8 tegn."); return; }
    if (mode === "opret" && !/[A-Z]/.test(password)) { setError("Adgangskoden skal indeholde mindst ét stort bogstav."); return; }
    if (mode === "opret" && !/[0-9]/.test(password)) { setError("Adgangskoden skal indeholde mindst ét tal."); return; }

    setLoading(true);
    const supabase = createClient();

    if (mode === "opret") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { navn: navn.trim(), brugerType: rolle },
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

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setBekraeftelse(true);
        setLoading(false);
        return;
      }

      // Gem ekstra profil-data
      if (signInData?.user) {
        if (rolle === "haandvaerker") {
          await supabase.from("profiler").upsert({
            id: signInData.user.id,
            virksomhed: virksomhed.trim() || null,
            cvr: cvr.trim() || null,
            fag: fag || null,
            rolle: "haandvaerker",
          }, { onConflict: "id" });
        } else if (adresse.trim()) {
          await supabase.from("profiler").upsert({
            id: signInData.user.id,
            adresse: adresse.trim(),
            rolle: "bygherre",
          }, { onConflict: "id" });
        }
      }

      track("signup_completed", { brugerType: rolle });
      setLoading(false);
      router.push(nextUrl || (rolle === "haandvaerker" ? "/haandvaerker/sager" : "/dashboard"));
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
    const type = meta?.brugerType || "bygherre";
    identifyUser(data.user.id, { email: email.trim(), navn: meta?.navn || email.split("@")[0], brugerType: type });
    track("login_completed", { brugerType: type });
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
            Hold styr på{" "}
            <span
              style={{
                display: "inline-block",
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                color: "#86efac",
              }}
            >
              {roterende[rotIdx]}
            </span>
            <br />og undgå dyre overraskelser.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
            Et godt byggeprojekt starter med klare aftaler. Vi hjælper dig med at få styr på det vigtigste, før arbejdet går i gang.
          </p>

          <div className="space-y-6">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                titel: "Klare aftaler fra start",
                tekst: "Få samlet tilbud, pris, tidsplan og ekstraarbejde ét sted, så både du og håndværkeren ved, hvad der er aftalt.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                titel: "Bygherre og håndværker på samme side",
                tekst: "Aftaler, beskeder og ændringer samles ét sted, så begge parter kan følge med.",
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                titel: "Færre misforståelser undervejs",
                tekst: "Når aftalegrundlaget er tydeligt, bliver det lettere at undgå uklare forventninger, ekstraregninger og uenigheder.",
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

        {/* Mobil headline med roterende ord */}
        <div className="block lg:hidden mb-8">
          <p className="text-xl font-bold text-[#111816] leading-snug">
            Hold styr på{" "}
            <span
              style={{
                display: "inline-block",
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                color: "#1e3a2a",
              }}
            >
              {roterende[rotIdx]}
            </span>
            <br />og undgå dyre overraskelser.
          </p>
        </div>

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
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Jeg er</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setRolle("bygherre")}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${rolle === "bygherre" ? "border-[#1e3a2a] bg-[#1e3a2a]/5 text-[#1e3a2a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Bygherre
                    </button>
                    <button onClick={() => setRolle("haandvaerker")}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${rolle === "haandvaerker" ? "border-[#1e3a2a] bg-[#1e3a2a]/5 text-[#1e3a2a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      Entreprenør
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dit navn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={rolle === "haandvaerker" ? "F.eks. Thomas Madsen" : "F.eks. Mette Hansen"}
                    value={navn}
                    onChange={e => setNavn(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                  />
                </div>
                {rolle === "bygherre" && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse på projektet</label>
                    <input
                      type="text"
                      placeholder="F.eks. Valby Langgade 85, 2500 Valby"
                      value={adresse}
                      onChange={e => { setAdresse(e.target.value); setVisAdresseForslag(true); }}
                      onBlur={() => setTimeout(() => setVisAdresseForslag(false), 150)}
                      autoComplete="off"
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                    />
                    {visAdresseForslag && adresseForslag.length > 0 && (
                      <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {adresseForslag.map((f, i) => (
                          <li
                            key={f.data?.id ?? i}
                            onMouseDown={() => { setAdresse(f.tekst); setVisAdresseForslag(false); setAdresseForslag([]); }}
                            className="px-4 py-3 text-sm text-gray-800 hover:bg-[#f5f3ee] cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            {f.tekst}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">Gemmes til dit profil og udfyldes automatisk næste gang.</p>
                  </div>
                )}
                {rolle === "haandvaerker" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input type="text" placeholder="8 cifre" value={cvr} maxLength={8}
                            onChange={e => { setCvr(e.target.value); setCvrVerificeret(false); }}
                            className={`w-full border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 transition-all pr-8 ${cvrVerificeret ? "border-green-400 focus:border-green-500 focus:ring-green-500/10" : "border-gray-200 focus:border-[#1e3a2a] focus:ring-[#1e3a2a]/10"}`} />
                          {cvrSoeger && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-300 border-t-[#1e3a2a] rounded-full animate-spin" />}
                          {cvrVerificeret && !cvrSoeger && <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        {cvrVerificeret && <p className="text-xs text-green-600 mt-1">CVR verificeret</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Virksomhed</label>
                        <input type="text" placeholder="Firmanavn" value={virksomhed}
                          onChange={e => setVirksomhed(e.target.value)}
                          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Fagområde <span className="text-red-500">*</span></label>
                      <select value={fag} onChange={e => setFag(e.target.value)}
                        className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all">
                        <option value="">Vælg fagområde...</option>
                        {FAGS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </>
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
              <div className="relative">
                <input
                  type={visPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setVisPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {visPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {mode === "opret" && (
                <p className="text-xs text-gray-400 mt-1.5">Mindst 8 tegn, ét stort bogstav og ét tal.</p>
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
                "Klare aftaler fra start — tilgængeligt for begge parter",
                "Bygherre og håndværker på samme side",
                "Færre misforståelser undervejs, fordi aftalegrundlaget er tydeligt fra start",
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

export default function Login() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
