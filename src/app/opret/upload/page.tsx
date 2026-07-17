"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

export default function UploadAftale() {
  const router = useRouter();
  const [filer, setFiler] = useState<File[]>([]);
  const [tekst, setTekst] = useState("");
  const [trækOver, setTrækOver] = useState(false);
  const [visTekstInput, setVisTekstInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const håndterFiler = (nyeFiler: FileList | null) => {
    if (!nyeFiler) return;
    const arr = Array.from(nyeFiler);
    setFiler(prev => [...prev, ...arr]);
    arr.forEach(fil => {
      if (fil.type === "application/pdf" || fil.name.endsWith(".pdf")) {
        const reader = new FileReader();
        reader.onload = e => {
          const dataUrl = e.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          sessionStorage.setItem("screening_pdf_base64", base64);
          sessionStorage.removeItem("screening_tekst");
        };
        reader.readAsDataURL(fil);
      } else if (fil.type === "text/plain" || fil.name.endsWith(".txt")) {
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

  const formatStørrelse = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const harPdf = filer.some(f => f.name.endsWith(".pdf") || f.type === "application/pdf");
  const kanFortsætte = tekst.trim().length > 30 || harPdf || filer.length > 0;

  const fortsæt = () => {
    if (!kanFortsætte) return;
    if (!harPdf && tekst) sessionStorage.setItem("screening_tekst", tekst);
    router.push("/opret/screening");
  };

  return (
    <FlowLayout aktivTrin={3}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload dit tilbud</h1>
        <p className="text-gray-500 leading-relaxed">
          Tilbud, kontrakt, mail eller screenshot fra håndværkeren. Vi screener det og fortæller dig hvad du skal afklare inden du siger ja.
        </p>
      </div>

      {/* Primær upload-zone */}
      {!visTekstInput && (
        <div
          onDragOver={e => { e.preventDefault(); setTrækOver(true); }}
          onDragLeave={() => setTrækOver(false)}
          onDrop={e => { e.preventDefault(); setTrækOver(false); håndterFiler(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-4 ${trækOver ? "border-primary bg-accent/40" : "border-gray-200 hover:border-primary/40 hover:bg-gray-50/60"}`}
        >
          <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" className="hidden" onChange={e => håndterFiler(e.target.files)} />
          <div className="w-16 h-16 rounded-2xl bg-[#e5ede7] mx-auto flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="font-bold text-gray-900 text-lg mb-2">Klik for at vælge fil</p>
          <p className="text-sm text-gray-400 mb-1">eller træk og slip her</p>
          <p className="text-xs text-gray-300 mt-3">PDF, billede eller tekstfil · op til 20 MB</p>
        </div>
      )}

      {/* Uploadede filer */}
      {filer.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Valgte filer</p>
          <div className="space-y-2">
            {filer.map((fil, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#e5ede7]/50">
                <div className="w-8 h-8 bg-[#1e3a2a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fil.name}</p>
                  <p className="text-xs text-gray-400">{formatStørrelse(fil.size)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); fjernFil(i); }} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
          {!harPdf && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Tip:</strong> For at screene indholdet korrekt, indsæt teksten fra tilbuddet nedenfor.
              </p>
              <textarea
                value={tekst}
                onChange={e => setTekst(e.target.value)}
                placeholder="Kopier teksten fra tilbuddet og indsæt her..."
                rows={4}
                className="mt-2 w-full text-xs border border-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Alternativ: indsæt tekst */}
      <button
        onClick={() => setVisTekstInput(!visTekstInput)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm mb-4 text-left hover:border-gray-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Har du tilbuddet som tekst?</p>
            <p className="text-xs text-gray-400">Kopiér fra mail eller PDF og indsæt her</p>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" className={`transition-transform ${visTekstInput ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {visTekstInput && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Tekst fra tilbuddet</label>
          <textarea
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            placeholder={"Indsæt teksten fra tilbuddet her...\n\nEksempel:\nTilbud på malerarbejde\nPris: 18.500 kr. inkl. moms\nOpstart: uge 14\n..."}
            rows={12}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-gray-700"
          />
          {tekst.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">{tekst.length} tegn {tekst.length < 80 ? "— tilføj mere tekst for et præcist resultat" : "— ser godt ud"}</p>
          )}
        </div>
      )}

      {/* Datasikkerhed */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 mb-8">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 mt-0.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <p className="text-xs text-gray-400 leading-relaxed">Dit dokument analyseres af vores AI og vises kun til dig. Vi gemmer ikke filer, og din rapport opbevares kun i din browser.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
          ← Tilbage
        </button>
        <button
          onClick={fortsæt}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition-all ${kanFortsætte ? "bg-primary text-white hover:opacity-90 shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          Start screening →
        </button>
      </div>
      {!kanFortsætte && (
        <p className="text-center text-xs text-gray-400 mt-3">Upload en fil eller indsæt tekst fra tilbuddet for at fortsætte</p>
      )}
    </FlowLayout>
  );
}
