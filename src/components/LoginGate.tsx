"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  trigger: boolean;
  onLuk: () => void;
  besked?: string;
}

export default function LoginGate({ trigger, onLuk, besked }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [navn, setNavn] = useState("");
  const [mode, setMode] = useState<"opret" | "login">("opret");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bekraeftelse, setBekraeftelse] = useState(false);

  useEffect(() => {
    if (trigger) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [trigger]);

  if (!trigger) return null;

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) { setError("Indtast din e-mail."); return; }
    if (!password.trim() || password.length < 8) { setError("Adgangskoden skal være mindst 8 tegn."); return; }
    if (mode === "opret" && !navn.trim()) { setError("Indtast dit navn."); return; }

    setLoading(true);

    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();

    if (mode === "opret") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { navn: navn.trim(), brugerType: "bygherre" } },
      });

      if (signUpError) {
        setLoading(false);
        if (signUpError.message.includes("already registered")) {
          setError("Der findes allerede en konto med denne e-mail. Log ind i stedet.");
          setMode("login");
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

      setBekraeftelse(true);
      setLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Forkert e-mail eller adgangskode.");
      return;
    }

    const meta = data.user?.user_metadata;
    localStorage.setItem("contractr_user", JSON.stringify({
      navn: meta?.navn || email.split("@")[0],
      email: email.trim(),
      brugerType: "bygherre",
      loginDato: new Date().toISOString(),
    }));

    onLuk();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onLuk} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {bekraeftelse ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Tjek din e-mail</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Vi har sendt en bekræftelseslink til <strong>{email}</strong>. Klik på linket og kom tilbage hertil.
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {besked || "Gem din rapport gratis"}
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">Opret konto på 30 sekunder</p>
                </div>
                <button onClick={onLuk} className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1 mt-4">
                <button
                  onClick={() => { setMode("opret"); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "opret" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  Opret konto
                </button>
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  Log ind
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {mode === "opret" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dit navn</label>
                  <input
                    type="text"
                    placeholder="Dit fulde navn"
                    value={navn}
                    onChange={e => setNavn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-mail</label>
                <input
                  type="email"
                  placeholder="din@email.dk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adgangskode</label>
                <input
                  type="password"
                  placeholder="Mindst 8 tegn"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full font-bold py-3 rounded-xl transition-all text-sm ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#1a5c38] text-white hover:opacity-90 shadow-md shadow-[#1a5c38]/20"}`}
              >
                {loading ? "Vent..." : mode === "opret" ? "Opret gratis konto" : "Log ind"}
              </button>

              {mode === "opret" && (
                <p className="text-xs text-gray-400 text-center">
                  Ingen kreditkort. Ingen binding.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
