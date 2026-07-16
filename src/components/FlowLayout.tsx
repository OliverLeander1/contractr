"use client";

import Link from "next/link";

interface Step {
  nr: number;
  label: string;
}

const steps: Step[] = [
  { nr: 1, label: "Projektinfo" },
  { nr: 2, label: "Tips" },
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
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Nembyggestyring</span>
          </Link>

          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={step.nr} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step.nr < aktivTrin ? "bg-primary text-white" :
                    step.nr === aktivTrin ? "bg-primary text-white" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {step.nr < aktivTrin ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : step.nr}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step.nr === aktivTrin ? "text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${step.nr < aktivTrin ? "bg-primary" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400">Trin {aktivTrin} af {steps.length}</div>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
