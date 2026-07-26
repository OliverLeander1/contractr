"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";
import { createClient } from "@/lib/supabase";

interface UdbudResultat {
  titel: string;
  resumé: string;
  dokument: string;
  bygherreNavn: string;
  bygherreKontakt: string;
  billeder?: { navn: string; data: string }[];
}

export default function UdbudResultat() {
  const router = useRouter();
  const [data, setData] = useState<UdbudResultat | null>(null);
  const [tekst, setTekst] = useState("");
  const [kopieret, setKopieret] = useState(false);
  const [opretter, setOpretter] = useState(false);

  // Invite-step state
  const [visInvite, setVisInvite] = useState(false);
  const [haandvaerkerNavn, setHaandvaerkerNavn] = useState("");
  const [haandvaerkerEmail, setHaandvaerkerEmail] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("udbud_resultat");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setData(parsed);
        setTekst(parsed.dokument);
      } catch { /* ignore */ }
    }
  }, []);

  async function opretAftalegrundlag() {
    if (!data) return;
    setOpretter(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?next=/opret/udbud-resultat"); return; }

      const projekt_id = crypto.randomUUID();

      // Opret kontrakt
      const r1 = await fetch(`/api/kontrakt?projekt_id=${projekt_id}&bygherre_id=${user.id}`);
      const k = await r1.json();
      if (k.error) return;

      // Fyld med AI-indhold og evt. håndværkeroplysninger
      await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: k.id,
          titel: data.titel,
          beskrivelse: tekst,
          ...(haandvaerkerNavn ? { haandvaerker_navn: haandvaerkerNavn } : {}),
          ...(haandvaerkerEmail ? { haandvaerker_email: haandvaerkerEmail } : {}),
        }),
      });

      sessionStorage.removeItem("udbud_resultat");
      router.push(`/projekt/${projekt_id}/aftale`);
    } finally {
      setOpretter(false);
    }
  }

  function kopier() {
    navigator.clipboard.writeText(tekst).then(() => {
      setKopieret(true);
      setTimeout(() => setKopieret(false), 2500);
    });
  }

  if (!data) {
    return (
      <FlowLayout aktivTrin={3}>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Intet dokument fundet - gå tilbage og udfyld formularen.</p>
          <button onClick={() => router.push("/opret/beskriv")} className="mt-4 text-primary text-sm underline">
            Gå tilbage
          </button>
        </div>
      </FlowLayout>
    );
  }

  return (
    <FlowLayout aktivTrin={3}>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Klar til udsendelse
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.titel}</h1>
        <p className="text-gray-500">{data.resumé}</p>
      </div>

      {/* Selve dokumentet */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Udbudsdokument</h2>
            <p className="text-xs text-gray-400 mt-0.5">Klik i teksten for at redigere</p>
          </div>
          <button
            onClick={kopier}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
              kopieret ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {kopieret ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Kopieret!</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopiér tekst</>
            )}
          </button>
        </div>

        {/* Bygherreoplysninger */}
        {(data.bygherreNavn || data.bygherreKontakt) && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Bygherre</p>
            {data.bygherreNavn && <p className="text-sm font-semibold text-gray-800">{data.bygherreNavn}</p>}
            {data.bygherreKontakt && <p className="text-sm text-gray-500">{data.bygherreKontakt}</p>}
          </div>
        )}

        <div className="px-6 py-5">
          <textarea
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={Math.max(30, tekst.split("\n").length + 2)}
            className="w-full text-sm text-gray-700 leading-relaxed font-mono resize-none focus:outline-none border-0 bg-transparent"
            style={{ fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace" }}
          />
        </div>
      </div>

      {/* Invite-step */}
      {!visInvite ? (
        <div className="space-y-3 mb-4">
          <button
            onClick={() => setVisInvite(true)}
            className="w-full py-4 rounded-xl text-base font-bold bg-[#1e3a2a] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Opret aftalegrundlag og inviter håndværker
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <p className="text-xs text-gray-400">eller</p>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={kopier}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {kopieret ? "Kopieret!" : "Kopiér dokument og send manuelt"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Hvem skal modtage aftalegrundlaget?</h3>
          <p className="text-sm text-gray-400 mb-5">Håndværkeren får et link til at gennemgå og godkende dokumentet. Du kan også springe dette over og tilføje dem senere.</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Navn på håndværker eller firma</label>
              <input
                type="text"
                placeholder="F.eks. Hansen VVS A/S"
                value={haandvaerkerNavn}
                onChange={e => setHaandvaerkerNavn(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                placeholder="haandvaerker@email.dk"
                value={haandvaerkerEmail}
                onChange={e => setHaandvaerkerEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setVisInvite(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Tilbage
            </button>
            <button
              onClick={opretAftalegrundlag}
              disabled={opretter}
              className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {opretter ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Opretter...</>
              ) : haandvaerkerEmail ? (
                "Opret og send invitation"
              ) : (
                "Opret uden invitation"
              )}
            </button>
          </div>

          {!haandvaerkerEmail && (
            <p className="text-xs text-gray-400 text-center mt-3">Du kan tilføje håndværkeroplysninger inde i aftalen bagefter.</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/opret/beskriv")}
          className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Start forfra
        </button>
        <button
          onClick={() => router.push("/opret/upload")}
          className="flex-1 py-3.5 rounded-xl border border-[#1e3a2a] text-[#1e3a2a] text-sm font-semibold hover:bg-accent transition-colors"
        >
          Modtaget tilbud? Upload her →
        </button>
      </div>
    </FlowLayout>
  );
}
