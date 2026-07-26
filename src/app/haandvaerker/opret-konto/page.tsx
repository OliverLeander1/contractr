"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const FAGS = [
  "Hovedentreprenør", "Totalentreprenør", "Tømrer", "Murer", "VVS", "Elektriker",
  "Maler", "Gulvlægger", "Blikkenslager", "Snedker", "Smed", "Kloakmester", "Facademontør", "Andet",
];

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const projektId      = params.get("projekt") ?? "";
  const inviteBygherre = params.get("bygherre") ?? "";
  const inviteProjektNavn = params.get("projektNavn") ?? "";
  const inviteEmail    = params.get("email") ?? "";
  const inviteFirma    = params.get("firma") ?? "";
  const harInvitation  = !!projektId;

  const [trin, setTrin]           = useState<"start" | "konto" | "bekraeftet">("start");
  const [navn, setNavn]           = useState("");
  const [firma, setFirma]         = useState(inviteFirma);
  const [email, setEmail]         = useState(inviteEmail);
  const [fag, setFag]             = useState("");
  const [adgangskode, setAdgangskode] = useState("");
  const [bekræft, setBekræft]     = useState("");
  const [visAdgangskode, setVisAdgangskode] = useState(false);
  const [fejl, setFejl]           = useState("");
  const [loading, setLoading]     = useState(false);

  const stærk   = adgangskode.length >= 8;
  const matcher = adgangskode === bekræft && bekræft.length > 0;
  const kanOprette = stærk && matcher && navn.trim() && email.trim();

  async function fuldfør() {
    if (!kanOprette || loading) return;
    setFejl("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: adgangskode,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          navn: navn.trim(),
          firma: firma.trim() || null,
          fag: fag || null,
          brugerType: "haandvaerker",
        },
      },
    });

    if (error) {
      setLoading(false);
      if (error.message.includes("already registered")) {
        setFejl("Der findes allerede en konto med denne e-mail. Prøv at logge ind i stedet.");
      } else {
        setFejl(error.message);
      }
      return;
    }

    // Log ind med det samme (hvis e-mail bekræftelse ikke er krævet)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: adgangskode,
    });

    setLoading(false);

    if (signInError) {
      // E-mail bekræftelse påkrævet
      setTrin("bekraeftet");
      return;
    }

    // Opdater profil med firma og fag (triggeren opretter basisprofil)
    if (data.user) {
      await supabase.from("profiler").update({
        rolle: "haandvaerker",
        ...(firma.trim() ? { firma: firma.trim() } : {}),
        ...(fag ? { fag } : {}),
      }).eq("id", data.user.id);
    }

    setTrin("bekraeftet");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="logo">nembyggestyring</span>
          </Link>
          <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-widest">Entreprenør</p>
        </div>

        {/* START */}
        {trin === "start" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {harInvitation ? (
              <>
                <div className="w-14 h-14 bg-[#1e3a2a]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Du er inviteret til et projekt</h1>
                <p className="text-sm text-gray-500 text-center mb-6">Opret din konto for at acceptere invitationen og få adgang til projektet.</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Bygherre</span>
                    <span className="text-sm font-semibold text-gray-900">{inviteBygherre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Projekt</span>
                    <span className="text-sm font-semibold text-gray-900">{inviteProjektNavn}</span>
                  </div>
                  {inviteEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Din e-mail</span>
                      <span className="text-sm font-semibold text-gray-900">{inviteEmail}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-[#1e3a2a]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Opret entreprenørprofil</h1>
                <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                  Send digitale tilbud, hold styr på dine sager og modtag invitationer til projekter.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    "Opret og send digitale tilbud direkte til kunder",
                    "Bygherre accepterer via platformen. Alt er dokumenteret.",
                    "Se alle dine sager samlet ét sted",
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p className="text-sm text-gray-600">{t}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setTrin("konto")}
              className="w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              {harInvitation ? "Opret konto og accepter invitation" : "Opret gratis profil"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">
              Har du allerede en konto?{" "}
              <Link href="/login" className="text-[#1e3a2a] font-medium hover:underline">Log ind her</Link>
            </p>
          </div>
        )}

        {/* KONTO-FORMULAR */}
        {trin === "konto" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Dine oplysninger</h1>
            <p className="text-sm text-gray-500 mb-6">Udfyldes én gang. Du kan altid opdatere dem senere.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dit navn <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={navn}
                  onChange={e => setNavn(e.target.value)}
                  placeholder="F.eks. Thomas Madsen"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 focus:border-[#1e3a2a] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Firma <span className="text-gray-400 font-normal">(valgfrit)</span></label>
                <input
                  type="text"
                  value={firma}
                  onChange={e => setFirma(e.target.value)}
                  placeholder="F.eks. TM Byg ApS"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 focus:border-[#1e3a2a] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-mail <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={harInvitation && !!inviteEmail}
                  placeholder="din@email.dk"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 focus:border-[#1e3a2a] transition-colors ${harInvitation && inviteEmail ? "border-gray-100 bg-gray-50 text-gray-400" : "border-gray-200"}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fagområde <span className="text-gray-400 font-normal">(valgfrit)</span></label>
                <select
                  value={fag}
                  onChange={e => setFag(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 focus:border-[#1e3a2a] transition-colors bg-white"
                >
                  <option value="">Vælg fagområde...</option>
                  {FAGS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Adgangskode <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={visAdgangskode ? "text" : "password"}
                    value={adgangskode}
                    onChange={e => setAdgangskode(e.target.value)}
                    placeholder="Mindst 8 tegn"
                    className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 transition-colors ${stærk || !adgangskode ? "border-gray-200 focus:border-[#1e3a2a]" : "border-red-200"}`}
                  />
                  <button type="button" onClick={() => setVisAdgangskode(!visAdgangskode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {visAdgangskode
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
                {adgangskode && !stærk && <p className="text-xs text-red-500 mt-1">Mindst 8 tegn</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bekræft adgangskode <span className="text-red-400">*</span></label>
                <input
                  type={visAdgangskode ? "text" : "password"}
                  value={bekræft}
                  onChange={e => setBekræft(e.target.value)}
                  placeholder="Gentag adgangskode"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a2a]/20 transition-colors ${!bekræft || matcher ? "border-gray-200 focus:border-[#1e3a2a]" : "border-red-200"}`}
                />
                {bekræft && !matcher && <p className="text-xs text-red-500 mt-1">Adgangskoderne matcher ikke</p>}
              </div>
            </div>

            {fejl && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs text-red-700">{fejl}</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={fuldfør}
                disabled={!kanOprette || loading}
                className={`w-full font-bold py-3.5 rounded-xl transition-all ${kanOprette && !loading ? "bg-[#1e3a2a] text-white hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                {loading ? "Opretter konto..." : "Opret konto"}
              </button>
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Ved at oprette en konto accepterer du vores{" "}
                <Link href="/vilkaar" className="text-[#1e3a2a] hover:underline">vilkår</Link>{" "}og{" "}
                <Link href="/privatliv" className="text-[#1e3a2a] hover:underline">privatlivspolitik</Link>
              </p>
            </div>
          </div>
        )}

        {/* BEKRÆFTELSE */}
        {trin === "bekraeftet" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {harInvitation ? "Konto oprettet!" : `Velkommen, ${navn.split(" ")[0]}!`}
            </h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {harInvitation
                ? `Du er nu tilknyttet projektet "${inviteProjektNavn}". Du kan nu se projektet og kommunikere med bygherren.`
                : "Din konto er klar. Tjek din e-mail for at bekræfte din adresse, log derefter ind for at komme i gang."}
            </p>
            {harInvitation ? (
              <Link
                href={`/haandvaerker/sager`}
                className="block w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Gå til mine sager
              </Link>
            ) : (
              <Link
                href="/login"
                className="block w-full bg-[#1e3a2a] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Log ind
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EntreprenørOpretKonto() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
