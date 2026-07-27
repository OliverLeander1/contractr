"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  onGem: (dataUrl: string) => void;
  onAnnuller: () => void;
}

type Værktøj = "pen" | "pil" | "cirkel" | "slet";

const FARVER = ["#dc2626", "#1e3a2a", "#2563eb", "#d97706", "#111827"];
const STØRRELSER = [2, 4, 8];

export default function BilledAnnotering({ onGem, onAnnuller }: Props) {
  const filInputRef  = useRef<HTMLInputElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);

  const [billede, setBillede]     = useState<HTMLImageElement | null>(null);
  const [tegner, setTegner]       = useState(false);
  const [startX, setStartX]       = useState(0);
  const [startY, setStartY]       = useState(0);
  const [farve, setFarve]         = useState(FARVER[0]);
  const [størrelse, setStørrelse] = useState(STØRRELSER[1]);
  const [værktøj, setVærktøj]     = useState<Værktøj>("pen");
  const [snapshot, setSnapshot]   = useState<ImageData | null>(null);

  // Tegn billedet på canvas
  const tegnBillede = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxW = Math.min(img.naturalWidth, 800);
    const scale = maxW / img.naturalWidth;
    canvas.width  = img.naturalWidth  * scale;
    canvas.height = img.naturalHeight * scale;
    const overlay = overlayRef.current!;
    overlay.width  = canvas.width;
    overlay.height = canvas.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  function indlæsBillede(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setBillede(img); tegnBillede(img); URL.revokeObjectURL(url); };
    img.src = url;
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width  / rect.width;
    const scaleY = overlay.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function startTegning(e: React.MouseEvent | React.TouchEvent) {
    if (!billede || værktøj === "slet") return;
    e.preventDefault();
    const { x, y } = getPos(e);
    setStartX(x); setStartY(y); setTegner(true);
    const ctx = overlayRef.current!.getContext("2d")!;
    setSnapshot(ctx.getImageData(0, 0, overlayRef.current!.width, overlayRef.current!.height));
    if (værktøj === "pen") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }

  function tegnUnder(e: React.MouseEvent | React.TouchEvent) {
    if (!tegner || !billede) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const overlay = overlayRef.current!;
    const ctx = overlay.getContext("2d")!;
    ctx.lineWidth   = størrelse;
    ctx.strokeStyle = farve;
    ctx.fillStyle   = farve;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    if (værktøj === "pen") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      if (snapshot) ctx.putImageData(snapshot, 0, 0);
      if (værktøj === "pil") {
        tegnPil(ctx, startX, startY, x, y);
      } else if (værktøj === "cirkel") {
        const rx = Math.abs(x - startX) / 2;
        const ry = Math.abs(y - startY) / 2;
        const cx = startX + (x - startX) / 2;
        const cy = startY + (y - startY) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function stopTegning(e: React.MouseEvent | React.TouchEvent) {
    if (!tegner) return;
    e.preventDefault();
    setTegner(false);
  }

  function tegnPil(ctx: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number) {
    const vinkel  = Math.atan2(ty - fy, tx - fx);
    const spids   = størrelse * 4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - spids * Math.cos(vinkel - Math.PI / 6), ty - spids * Math.sin(vinkel - Math.PI / 6));
    ctx.lineTo(tx - spids * Math.cos(vinkel + Math.PI / 6), ty - spids * Math.sin(vinkel + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function sletAlt() {
    const overlay = overlayRef.current!;
    const ctx = overlay.getContext("2d")!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }

  function gem() {
    const canvas  = canvasRef.current!;
    const overlay = overlayRef.current!;
    const combined = document.createElement("canvas");
    combined.width  = canvas.width;
    combined.height = canvas.height;
    const ctx = combined.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(overlay, 0, 0);
    onGem(combined.toDataURL("image/jpeg", 0.85));
  }

  const VAERKTOEJER: { id: Værktøj; label: string; svg: React.ReactNode }[] = [
    {
      id: "pen", label: "Frihånd",
      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    },
    {
      id: "pil", label: "Pil",
      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg>,
    },
    {
      id: "cirkel", label: "Cirkel",
      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>,
    },
    {
      id: "slet", label: "Slet alt",
      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {!billede ? (
        <div
          onClick={() => filInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-[#1e3a2a]/40 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Vælg et billede</p>
          <p className="text-xs text-gray-400">Foto af væg, rum, tegning — du kan derefter markere præcist hvad du ønsker</p>
          <input ref={filInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && indlæsBillede(e.target.files[0])} />
        </div>
      ) : (
        <>
          {/* Værktøjslinje */}
          <div className="flex flex-wrap items-center gap-2">
            {VAERKTOEJER.map(v => (
              <button key={v.id}
                onClick={() => { if (v.id === "slet") { sletAlt(); } else { setVærktøj(v.id); } }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  værktøj === v.id && v.id !== "slet"
                    ? "bg-[#1e3a2a] text-white border-[#1e3a2a]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                {v.svg} {v.label}
              </button>
            ))}

            <div className="flex items-center gap-1 ml-auto">
              {FARVER.map(f => (
                <button key={f} onClick={() => setFarve(f)}
                  style={{ background: f }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${farve === f ? "border-gray-800 scale-125" : "border-transparent"}`} />
              ))}
            </div>

            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              {STØRRELSER.map(s => (
                <button key={s} onClick={() => setStørrelse(s)}
                  className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${størrelse === s ? "bg-gray-800 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                  {s === 2 ? "S" : s === 4 ? "M" : "L"}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 touch-none"
            style={{ cursor: værktøj === "slet" ? "default" : "crosshair" }}>
            <canvas ref={canvasRef} className="block w-full" />
            <canvas ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={startTegning} onMouseMove={tegnUnder} onMouseUp={stopTegning} onMouseLeave={stopTegning}
              onTouchStart={startTegning} onTouchMove={tegnUnder} onTouchEnd={stopTegning} />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => { setBillede(null); sletAlt(); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Skift billede
            </button>
            <div className="flex gap-2 ml-auto">
              <button onClick={onAnnuller}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                Annuller
              </button>
              <button onClick={gem}
                className="px-4 py-2 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90">
                Brug annoteret billede
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
