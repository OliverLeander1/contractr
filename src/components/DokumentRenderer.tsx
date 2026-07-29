"use client";

interface Props {
  tekst: string;
}

export default function DokumentRenderer({ tekst }: Props) {
  const linjer = tekst.split("\n");

  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-1 font-[system-ui]">
      {linjer.map((linje, i) => {
        const trimmet = linje.trim();

        // Hoveddokument-titel (UDBUDSDOKUMENT)
        if (/^UDBUDSDOKUMENT$/i.test(trimmet)) {
          return (
            <p key={i} className="text-center font-bold text-xs text-gray-400 uppercase tracking-widest pt-2 pb-1">
              {trimmet}
            </p>
          );
        }

        // Nummereret overskrift: "1. PROJEKTBESKRIVELSE" etc.
        if (/^\d+\.\s+[A-ZÆØÅ\s]+$/.test(trimmet) && trimmet.length > 3) {
          return (
            <p key={i} className="text-center font-bold text-base text-gray-900 pt-6 pb-1">
              {trimmet}
            </p>
          );
        }

        // Projekttitel (fed, centreret, stor)
        if (i < 5 && trimmet.length > 10 && !trimmet.startsWith("-") && /[A-ZÆØÅ]/.test(trimmet[0]) && !/^\d/.test(trimmet)) {
          const erTitel = linjer.slice(0, 5).filter(l => l.trim().length > 0).indexOf(trimmet) === 0;
          if (erTitel) {
            return (
              <p key={i} className="text-center font-bold text-lg text-gray-900 pt-2 pb-4">
                {trimmet}
              </p>
            );
          }
        }

        // Bullet-punkt
        if (trimmet.startsWith("- ")) {
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
              <span className="text-[#1e3a2a] font-bold mt-0.5 flex-shrink-0">·</span>
              <span>{trimmet.slice(2)}</span>
            </div>
          );
        }

        // Label-linje (fx "Ønsket opstart:     [dato]")
        if (/^[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]+:\s/.test(trimmet) && trimmet.includes(":")) {
          const kolon = trimmet.indexOf(":");
          const label = trimmet.slice(0, kolon);
          const værdi = trimmet.slice(kolon + 1).trim();
          return (
            <div key={i} className="flex gap-2 py-0.5">
              <span className="font-semibold text-gray-800 flex-shrink-0">{label}:</span>
              <span className="text-gray-600">{værdi}</span>
            </div>
          );
        }

        // Tom linje
        if (trimmet === "") {
          return <div key={i} className="h-2" />;
        }

        // Normal tekst
        return <p key={i} className="py-0.5 text-gray-700">{trimmet}</p>;
      })}
    </div>
  );
}
