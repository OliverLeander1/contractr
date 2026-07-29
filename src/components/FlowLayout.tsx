"use client";

import Link from "next/link";

const steps = [
  { nr: 1, label: "Projektinfo" },
  { nr: 2, label: "Anbefalinger" },
  { nr: 3, label: "Upload aftale" },
  { nr: 4, label: "Din rapport" },
];

export default function FlowLayout({
  children,
  aktivTrin,
}: {
  children: React.ReactNode;
  aktivTrin: number;
}) {
  const aktivStep = steps.find(s => s.nr === aktivTrin);
  const pct = Math.round(((aktivTrin - 1) / (steps.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <nav className="bg-[#f5f3ee]/95 backdrop-blur border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>

          {/* Progress steps — desktop */}
          <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
            {steps.map((step, i) => {
              const done = step.nr < aktivTrin;
              const active = step.nr === aktivTrin;
              return (
                <div key={step.nr} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active ? "bg-[#1e3a2a] text-white" :
                    done ? "bg-[#1e3a2a]/10 text-[#1e3a2a]" :
                    "text-gray-300"
                  }`}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-white/20" : "bg-gray-100"}`}>{step.nr}</span>
                    )}
                    {step.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-5 h-px mx-0.5 ${done ? "bg-[#1e3a2a]/30" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobil: kun trin-label */}
          <div className="sm:hidden text-xs font-semibold text-[#1e3a2a] bg-[#1e3a2a]/10 px-3 py-1.5 rounded-full flex-shrink-0">
            {aktivStep?.label}
          </div>

          <div className="flex-shrink-0 w-20" />
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-0.5 bg-[#e0ddd6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a2a] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
