"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";

export default function UploadAftale() {
  const router = useRouter();
  const [filer, setFiler] = useState<File[]>([]);
  const [trækOver, setTrækOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const håndterFiler = (nyeFiler: FileList | null) => {
    if (!nyeFiler) return;
    setFiler((prev) => [...prev, ...Array.from(nyeFiler)]);
  };

  const fjernFil = (index: number) => {
    setFiler((prev) => prev.filter((_, i) => i !== index));
  };

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

  return (
    <FlowLayout aktivTrin={2}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload din byggeaftale</h1>
        <p className="text-gray-500">Tilbud, kontrakt, ordrebekræftelse, mail eller screenshot — vi forstår det hele.</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setTrækOver(true); }}
        onDragLeave={() => setTrækOver(false)}
        onDrop={(e) => { e.preventDefault(); setTrækOver(false); håndterFiler(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-5 ${
          trækOver
            ? "border-primary bg-accent"
            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => håndterFiler(e.target.files)}
        />
        <div className="w-16 h-16 rounded-2xl bg-accent mx-auto flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900 mb-1">Træk filer hertil eller klik for at uploade</p>
        <p className="text-sm text-gray-400">PDF, JPG, PNG — op til 20 MB per fil</p>
      </div>

      {/* Uploadede filer */}
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-medium">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    Klar
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); fjernFil(i); }}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 hover:text-red-400">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hvad vi kan læse */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Vi kan screene alle typer aftaler</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Tilbud fra håndværker", desc: "PDF eller billede" },
            { label: "Kontrakt / entrepriseaftale", desc: "PDF eller Word-fil" },
            { label: "Ordrebekræftelse", desc: "PDF eller billede" },
            { label: "Mail med aftale", desc: "Screenshot eller PDF" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GDPR note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-8">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 flex-shrink-0 mt-0.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          Dine dokumenter behandles fortroligt og bruges kun til at generere din rapport. Vi sælger aldrig dine oplysninger. Du kan til enhver tid anmode om sletning.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ← Tilbage
        </button>
        <button
          onClick={() => filer.length > 0 && router.push("/opret/screening")}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition-all ${
            filer.length > 0
              ? "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Start screening →
        </button>
      </div>
    </FlowLayout>
  );
}
