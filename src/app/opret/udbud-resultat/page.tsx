"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

interface UdbudResultat {
  titel: string;
  resumé: string;
  dokument: string;
}

export default function UdbudResultat() {
  const router = useRouter();
  const [data, setData] = useState<UdbudResultat | null>(null);
  const [kopieret, setKopieret] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("udbud_resultat");
    if (raw) {
      try { setData(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  function kopier() {
    if (!data) return;
    navigator.clipboard.writeText(data.dokument).then(() => {
      setKopieret(true);
      setTimeout(() => setKopieret(false), 2500);
    });
  }

  if (!data) {
    return (
      <FlowLayout aktivTrin={3}>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Intet dokument fundet — gå tilbage og udfyld formularen.</p>
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
            "Send det til 2–3 håndværkere og bed om tilbud inden en bestemt dato",
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
          <h2 className="font-semibold text-gray-900 text-sm">Udbudsdokument</h2>
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
        <div className="px-6 py-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {data.dokument}
          </pre>
        </div>
      </div>

      {/* Bund-knapper */}
      <div className="space-y-3">
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
            Redigér og generér igen
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
