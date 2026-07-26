"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";
import { createClient } from "@/lib/supabase";

interface TilbudsPost {
  id: string;
  beskrivelse: string;
  enhed: string;
  pris: string;
}

interface UdbudResultat {
  titel: string;
  resumé: string;
  dokument: string;
  bygherreNavn: string;
  bygherreKontakt: string;
  tilbudsposter?: TilbudsPost[];
  billeder?: { navn: string; data: string }[];
}

export default function UdbudResultat() {
  const router = useRouter();
  const [data, setData] = useState<UdbudResultat | null>(null);
  const [tekst, setTekst] = useState("");
  const [kopieret, setKopieret] = useState(false);
  const [linkKopieret, setLinkKopieret] = useState(false);
  const [opretter, setOpretter] = useState(false);

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

  function genererLink() {
    if (!data) return;
    const payload = JSON.stringify({ titel: data.titel, resumé: data.resumé, dokument: tekst, bygherreNavn: data.bygherreNavn, bygherreKontakt: data.bygherreKontakt, tilbudsposter: data.tilbudsposter || [], billeder: data.billeder || [] });
    const token = btoa(encodeURIComponent(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${window.location.origin}/udbud/se#${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkKopieret(true);
      setTimeout(() => setLinkKopieret(false), 3000);
    });
  }

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

      // Fyld med AI-genereret indhold
      await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: k.id,
          titel: data.titel,
          beskrivelse: tekst,
        }),
      });

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

      {/* Næste skridt */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-blue-900 text-sm mb-3">Sådan bruger du dokumentet</h3>
        <ol className="space-y-2">
          {[
            "Kopier dokumentet og tilføj dine kontaktoplysninger",
            "Send det til 2-3 håndværkere og bed om tilbud inden en bestemt dato",
            "Når du modtager tilbud, uploader du dem her til screening mod AB-Forbruger",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-blue-800">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
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
              kopieret
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {kopieret ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Kopieret!
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Kopiér tekst
              </>
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
            rows={Math.max(20, tekst.split("\n").length + 2)}
            className="w-full text-sm text-gray-700 leading-relaxed font-sans resize-none focus:outline-none border-0 bg-transparent"
          />
        </div>

        {/* Tilbudsposter */}
        {data.tilbudsposter && data.tilbudsposter.length > 0 && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Opgaveoversigt</p>
            <div className="space-y-2">
              {data.tilbudsposter.map((post, i) => (
                <div key={post.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1e3a2a]/10 text-[#1e3a2a] text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{post.beskrivelse}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{post.enhed}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bund-knapper */}
      <div className="space-y-3">

        {/* Primær CTA — opret aftalegrundlag */}
        <button
          onClick={opretAftalegrundlag}
          disabled={opretter}
          className="w-full py-4 rounded-xl text-base font-bold bg-[#1e3a2a] text-white hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 shadow-md"
        >
          {opretter ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Opretter aftalegrundlag...</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Opret aftalegrundlag og inviter håndværker</>
          )}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gray-100" />
          <p className="text-xs text-gray-400">eller send dokumentet manuelt</p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={genererLink}
          className={`w-full py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
            linkKopieret
              ? "bg-green-600 text-white"
              : "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
          }`}
        >
          {linkKopieret ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Link kopieret - send det til håndværkeren!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Del via link
            </>
          )}
        </button>

        <button
          onClick={kopier}
          className="w-full py-4 rounded-xl text-base font-bold bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
        >
          {kopieret ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Kopieret til udklipsholder!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Kopiér dokument
            </>
          )}
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/opret/beskriv")}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Start forfra med nye svar
          </button>
          <button
            onClick={() => router.push("/opret/upload")}
            className="flex-1 py-3.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-accent transition-colors"
          >
            Modtaget tilbud? Upload her →
          </button>
        </div>
      </div>
    </FlowLayout>
  );
}
