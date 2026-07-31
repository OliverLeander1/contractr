"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Kontrakt {
  titel: string | null;
  haandvaerker_firma: string | null;
  haandvaerker_navn: string | null;
  status: string;
}

const fordele = [
  {
    ikon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    titel: "Et klart aftalegrundlag",
    tekst: "Ingen misforståelser om hvad der er aftalt. Alt er skriftligt og godkendt af begge parter inden arbejdet starter.",
  },
  {
    ikon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    titel: "Ét samlet sted",
    tekst: "Dokumenter, billeder, tidsplan og kommunikation samlet ét sted. Ingen jagt på mails og SMS'er.",
  },
  {
    ikon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    titel: "Ekstraarbejde dokumenteres digitalt",
    tekst: "Ændringsarbejder aftales og godkendes skriftligt inden opstart. Ingen tvister om hvad der er bestilt.",
  },
  {
    ikon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    titel: "Hurtigere betaling",
    tekst: "Betaling kobles til dokumenteret fremdrift. Når arbejdet er godkendt, frigives betalingen. Ingen unødige forsinkelser.",
  },
  {
    ikon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    titel: "Mindre administration",
    tekst: "Du bruger mindre tid på at rydde op efter misforståelser og mere tid på at bygge.",
  },
  {
    ikon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titel: "Dokumentation der holder",
    tekst: "Alle aftaler og godkendelser logges med tidsstempel. Din rygrad hvis der opstår uenighed.",
  },
];

export default function HaandvaerkerLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [kontrakt, setKontrakt] = useState<Kontrakt | null>(null);

  useEffect(() => {
    fetch(`/api/kontrakt/${token}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setKontrakt(d); })
      .catch(() => null);
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      {/* Nav */}
      <nav className="bg-[#f5f3ee] border-b border-[#e0ddd6] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <span style={{ fontFamily: "var(--font-logo)", fontWeight: 200, letterSpacing: "2px" }} className="text-[#1e3a2a] text-lg">
            nembyggestyring
          </span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#1e3a2a]/8 text-[#1e3a2a] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <div className="w-1.5 h-1.5 bg-[#1e3a2a] rounded-full" />
            Du er inviteret til et byggeprojekt
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {kontrakt?.titel
              ? <>Aftalegrundlag for<br /><span className="text-[#1e3a2a]">{kontrakt.titel}</span></>
              : "Et aftalegrundlag venter på dig"
            }
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto">
            En bygherre har oprettet et digitalt aftalegrundlag og ønsker at gennemgå det med dig inden arbejdet går i gang.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-[#1e3a2a] rounded-2xl p-6 mb-8 text-center">
          <p className="text-white/70 text-sm mb-1">Du kan gennemse aftalegrundlaget uden konto</p>
          <h2 className="text-white font-bold text-xl mb-4">Åbn aftalegrundlaget</h2>
          <Link
            href={`/kontrakt/${token}/aftale`}
            className="inline-block bg-white text-[#1e3a2a] font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Gå til aftalegrundlag →
          </Link>
          <p className="text-white/40 text-xs mt-4">Vil du sende tilbud, foreslå ændringer eller godkende, logger du ind med din e-mail. Det tager under et minut.</p>
        </div>

        {/* Fordele */}
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Hvad du får med NemByggestyring</p>
          <div className="space-y-3">
            {fordele.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e0ddd6] p-4 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a2a]/6 flex items-center justify-center flex-shrink-0 text-[#1e3a2a]">
                  {f.ikon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{f.titel}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bund CTA */}
        <Link
          href={`/kontrakt/${token}/aftale`}
          className="block w-full text-center bg-[#1e3a2a] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity text-sm mb-6"
        >
          Gå til aftalegrundlag →
        </Link>

        <p className="text-center text-xs text-gray-400">
          Nembyggestyring skaber rammerne for det gode projekt
        </p>
      </div>
    </div>
  );
}
