"use client";

export function UploadAnimation() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <style>{`
        @keyframes doc-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes arrow-bounce {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-5px); opacity: 0.7; }
        }
        @keyframes line-appear {
          0% { stroke-dashoffset: 30; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes cloud-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .doc-float { animation: doc-float 2.4s ease-in-out infinite; }
        .arrow-bounce { animation: arrow-bounce 1.2s ease-in-out infinite; }
        .cloud-pulse { animation: cloud-pulse 2.4s ease-in-out infinite; }
        .line1 { stroke-dasharray: 30; animation: line-appear 0.8s 0.2s ease-out forwards; opacity: 0; }
        .line2 { stroke-dasharray: 20; animation: line-appear 0.8s 0.5s ease-out forwards; opacity: 0; }
      `}</style>

      {/* Cloud */}
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
        {/* Background circle */}
        <circle cx="48" cy="48" r="44" fill="#eef2ff"/>

        {/* Cloud shape */}
        <g className="cloud-pulse" style={{ transformOrigin: "48px 30px" }}>
          <path d="M28 38 Q28 28 38 28 Q40 20 50 20 Q62 20 64 30 Q72 30 72 38 Q72 46 64 46 H32 Q28 46 28 38Z" fill="#4f46e5" opacity="0.12"/>
          <path d="M30 38 Q30 29 40 29 Q42 21 51 21 Q63 21 65 31 Q73 31 73 39 Q73 46 65 46 H33 Q29 46 29 39Z" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round"/>
        </g>

        {/* Document */}
        <g className="doc-float" style={{ transformOrigin: "48px 62px" }}>
          <rect x="35" y="50" width="26" height="32" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1.8"/>
          <line x1="40" y1="57" x2="56" y2="57" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" className="line1"/>
          <line x1="40" y1="63" x2="52" y2="63" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" className="line2"/>
          <line x1="40" y1="69" x2="54" y2="69" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" className="line2"/>
        </g>

        {/* Upload arrow */}
        <g className="arrow-bounce" style={{ transformOrigin: "48px 46px" }}>
          <line x1="48" y1="52" x2="48" y2="42" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="43,47 48,42 53,47" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </g>
      </svg>
    </div>
  );
}

export function ScanAnimation() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <style>{`
        @keyframes scan-move {
          0% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          100% { transform: translateX(-10px); }
        }
        @keyframes check-pop {
          0%, 60% { opacity: 0; transform: scale(0.5); }
          80% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes amber-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .scan-move { animation: scan-move 2s ease-in-out infinite; }
        .check-pop { animation: check-pop 2s 0.4s ease-out infinite; }
        .amber-blink { animation: amber-blink 1.6s 0.2s ease-in-out infinite; }
      `}</style>

      <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="44" fill="#fffbeb"/>

        {/* Document in background */}
        <rect x="26" y="22" width="34" height="44" rx="3" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
        <line x1="31" y1="31" x2="54" y2="31" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="37" x2="54" y2="37" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="43" x2="50" y2="43" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="49" x2="54" y2="49" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="55" x2="47" y2="55" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>

        {/* Animated scan line */}
        <rect x="26" y="22" width="34" height="44" rx="3" fill="none" clipPath="url(#doc-clip)"/>
        <clipPath id="doc-clip">
          <rect x="26" y="22" width="34" height="44" rx="3"/>
        </clipPath>
        <g className="scan-move" style={{ transformOrigin: "43px 44px" }} clipPath="url(#doc-clip)">
          <rect x="26" y="22" width="34" height="44" fill="none"/>
          <line x1="43" y1="22" x2="43" y2="66" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6"/>
          <rect x="26" y="22" width="17" height="44" fill="#fef3c7" fillOpacity="0.4"/>
        </g>

        {/* Status dots */}
        <circle cx="31" cy="31" r="3" fill="#4f46e5" className="check-pop"/>
        <circle cx="31" cy="43" r="3" fill="#f59e0b" className="amber-blink"/>

        {/* Magnifier */}
        <g className="scan-move" style={{ transformOrigin: "56px 52px" }}>
          <circle cx="56" cy="52" r="14" fill="white" fillOpacity="0.9" stroke="#4f46e5" strokeWidth="2.2"/>
          <circle cx="56" cy="52" r="9" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.3"/>
          <line x1="66" y1="62" x2="74" y2="70" stroke="#4f46e5" strokeWidth="2.8" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  );
}

export function AdvisorAnimation() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <style>{`
        @keyframes shield-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(26,92,56,0.2)); }
          50% { filter: drop-shadow(0 0 8px rgba(26,92,56,0.5)); }
        }
        @keyframes check-draw {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes badge-pop {
          0%, 70% { transform: scale(0); opacity: 0; }
          85% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes person-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .shield-glow { animation: shield-glow 2.5s ease-in-out infinite; }
        .check-draw { stroke-dasharray: 20; animation: check-draw 0.6s 0.3s ease-out forwards; stroke-dashoffset: 20; }
        .badge-pop { animation: badge-pop 2.5s ease-out infinite; transform-origin: 62px 30px; }
        .person-bob { animation: person-bob 2.5s ease-in-out infinite; }
      `}</style>

      <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="44" fill="#eef2ff"/>

        {/* Person */}
        <g className="person-bob" style={{ transformOrigin: "48px 55px" }}>
          {/* Body */}
          <rect x="34" y="55" width="28" height="22" rx="8" fill="#4f46e5" opacity="0.85"/>
          {/* Head */}
          <circle cx="48" cy="42" r="11" fill="#4f46e5" opacity="0.85"/>
          {/* Face highlight */}
          <circle cx="44" cy="40" r="2" fill="white" opacity="0.4"/>
        </g>

        {/* Shield badge */}
        <g className="badge-pop">
          <path d="M62 18 L72 22 L72 30 Q72 36 62 40 Q52 36 52 30 L52 22 Z" fill="#f59e0b"/>
          <path d="M56 29 L60 33 L68 25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="check-draw"/>
        </g>
      </svg>
    </div>
  );
}

export function ProjectAnimation() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <style>{`
        @keyframes item-check-1 {
          0%, 20% { opacity: 0; transform: scale(0.5) translateX(-4px); }
          35% { opacity: 1; transform: scale(1.1) translateX(0); }
          45%, 100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes item-check-2 {
          0%, 40% { opacity: 0; transform: scale(0.5) translateX(-4px); }
          55% { opacity: 1; transform: scale(1.1) translateX(0); }
          65%, 100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes item-check-3 {
          0%, 60% { opacity: 0; transform: scale(0.5) translateX(-4px); }
          75% { opacity: 1; transform: scale(1.1) translateX(0); }
          85%, 100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes board-slide {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .item-check-1 { animation: item-check-1 3s ease-out infinite; transform-origin: 42px 42px; }
        .item-check-2 { animation: item-check-2 3s ease-out infinite; transform-origin: 42px 53px; }
        .item-check-3 { animation: item-check-3 3s ease-out infinite; transform-origin: 42px 64px; }
        .board-slide { animation: board-slide 3s ease-in-out infinite; }
      `}</style>

      <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="44" fill="#eef2ff"/>

        {/* Clipboard board */}
        <g className="board-slide" style={{ transformOrigin: "48px 52px" }}>
          {/* Clip top */}
          <rect x="38" y="18" width="20" height="8" rx="2" fill="#4f46e5"/>
          {/* Board */}
          <rect x="24" y="22" width="48" height="56" rx="5" fill="white" stroke="#4f46e5" strokeWidth="1.8"/>

          {/* Header stripe */}
          <rect x="24" y="22" width="48" height="14" rx="5" fill="#4f46e5" opacity="0.08"/>
          <text x="35" y="32" fontSize="7" fill="#4f46e5" fontWeight="600" fontFamily="system-ui">PROJEKT</text>

          {/* Row 1 */}
          <rect x="32" y="40" width="32" height="8" rx="2" fill="#f3f4f6"/>
          <g className="item-check-1">
            <circle cx="42" cy="44" r="4" fill="#4f46e5"/>
            <path d="M39.5 44 L41.5 46 L44.5 42" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>

          {/* Row 2 */}
          <rect x="32" y="52" width="32" height="8" rx="2" fill="#f3f4f6"/>
          <g className="item-check-2">
            <circle cx="42" cy="56" r="4" fill="#4f46e5"/>
            <path d="M39.5 56 L41.5 58 L44.5 54" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>

          {/* Row 3 */}
          <rect x="32" y="64" width="32" height="8" rx="2" fill="#f3f4f6"/>
          <g className="item-check-3">
            <circle cx="42" cy="68" r="4" fill="#f59e0b"/>
            <path d="M39.5 68 L41.5 70 L44.5 66" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </g>
      </svg>
    </div>
  );
}

