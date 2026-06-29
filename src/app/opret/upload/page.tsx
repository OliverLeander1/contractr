"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

export default function UploadAftale() {
  const router = useRouter();
  const [filer, setFiler] = useState<File[]>([]);
  const [tekst, setTekst] = useState("");
  const [trækOver, setTrækOver] = useState(false);
  const [aktiv, setAktiv] = useState<"upload" | "tekst">("upload");
  const inputRef = useRef<HTMLInputElement>(null);

  const håndterFiler = (nyeFiler: FileList | null) => {
    if (!nyeFiler) return;
    const arr = Array.from(nyeFiler);
    setFiler(prev => [...prev, ...arr]);
    // Prøv at læse tekst fra tekstbaserede filer
    arr.forEach(fil => {
      if (fil.type === "text/plain" || fil.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = e => {
          const indhold = e.target?.result as string;
          if (indhold) setTekst(prev => prev ? prev + "\n\n" + indhold : indhold);
        };
        reader.readAsText(fil);
      }
    });
  };

  const fjernFil = (index: number) => setFiler(prev => prev.filter((_, i) => i !== index));

  const filIkon = (navn: string) => {
    if (navn.endsWith(".pdf")) return "📄";
    if (navn.match(/\.(jpg|jpeg|png|webp)$/i)) return "🖼️";
    return "📎";
  };

  const formatStørrelse = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const kanFortsætte = tekst.trim().length > 30 || filer.length > 0;

  const fortsæt = () => {
    if (!kanFortsætte) return;
    sessionStorage.setItem("screening_tekst", tekst);
    router.push("/opret/screening");
  };

  return (
    <FlowLayout aktivTrin={2}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload din byggeaftale</h1>
        <p className="text-gray-500">Tilbud, kontrakt, ordrebekræftelse eller mail — vi screener det hele mod AB-Forbruger.</p>
      </div>

      {/* Fane-switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button
          onClick={() => setAktiv("upload")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${aktiv === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Upload fil
        </button>
        <button
          onClick={() => setAktiv("tekst")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${aktiv === "tekst" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Indsæt tekst
        </button>
      </div>

      {aktiv === "upload" ? (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setTrækOver(true); }}
            onDragLeave={() => setTrækOver(false)}
            onDrop={e => { e.preventDefault(); setTrækOver(false); håndterFiler(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-5 ${trækOver ? "border-primary bg-accent" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"}`}
          >
            <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" className="hidden" onChange={e => håndterFiler(e.target.files)} />
            <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Træk filer hertil eller klik for at uploade</p>
            <p className="text-sm text-gray-400">PDF, JPG, PNG, TXT — op til 20 MB per fil</p>
          </div>

          {filer.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Uploadede filer ({filer.length})</h3>
              <div className="space-y-2">
                {filer.map((fil, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-xl">{filIkon(fil.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fil.name}</p>
                      <p className="text-xs text-gray-400">{formatStørrelse(fil.size)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); fjernFil(i); }} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 hover:text-red-400"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-semibold text-amber-800 mb-1">Indsæt tilbuddets tekst for at screene</p>
                <p className="text-xs text-amber-700">Kopier teksten fra din PDF/mail og indsæt den nedenfor, eller skift til "Indsæt tekst" fanen — så kan AI'en analysere den.</p>
                <textarea
                  value={tekst}
                  onChange={e => setTekst(e.target.value)}
                  placeholder="Indsæt tekst fra tilbuddet her..."
                  rows={4}
                  className="mt-2 w-full text-xs border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-white"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Indsæt teksten fra tilbuddet</label>
            <p className="text-xs text-gray-400 mb-3">Kopier teksten direkte fra din mail, PDF eller screenshot — og indsæt den her.</p>
            <textarea
              value={tekst}
              onChange={e => setTekst(e.target.value)}
              placeholder="Indsæt tilbuddets tekst her...&#10;&#10;Eksempel:&#10;Tilbud på badeværelsesrenovering&#10;Pris: 68.500 kr. inkl. moms&#10;Opstart: 1. august 2025&#10;..."
              rows={14}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-gray-700"
            />
            {tekst.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{tekst.length} tegn — {tekst.length < 100 ? "tilføj mere tekst for et præcist resultat" : "ser godt ud ✓"}</p>
            )}
          </div>
        </div>
      )}

      {/* GDPR */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-8">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <p className="text-xs text-blue-700 leading-relaxed">Dine dokumenter behandles fortroligt og bruges kun til at generere din rapport. Vi sælger aldrig dine oplysninger.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
          ← Tilbage
        </button>
        <button
          onClick={fortsæt}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition-all ${kanFortsætte ? "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          Start screening →
        </button>
      </div>
      {!kanFortsætte && <p className="text-center text-xs text-gray-400 mt-3">Upload en fil eller indsæt tekst fra tilbuddet for at fortsætte</p>}
    </FlowLayout>
  );
}
