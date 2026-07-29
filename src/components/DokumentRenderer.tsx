"use client";

interface Props {
  tekst: string;
  titel?: string;
  bygherreNavn?: string;
  bygherreKontakt?: string;
}

export default function DokumentRenderer({ tekst, titel, bygherreNavn, bygherreKontakt }: Props) {
  const linjer = tekst.split("\n");
  const dato = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">

      {/* Dokument-header */}
      <div className="px-10 pt-10 pb-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold text-[#1e3a2a] uppercase tracking-[0.15em] mb-1">Nembyggestyring</p>
            <p className="text-[10px] text-gray-400">nembyggestyring.dk</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">Dato</p>
            <p className="text-xs font-semibold text-gray-600">{dato}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Udbudsdokument</p>
          {titel && (
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{titel}</h1>
          )}
        </div>

        {(bygherreNavn || bygherreKontakt) && (
          <div className="mt-5 flex gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">Bygherre</p>
              {bygherreNavn && <p className="text-sm font-semibold text-gray-800">{bygherreNavn}</p>}
              {bygherreKontakt && <p className="text-xs text-gray-500">{bygherreKontakt}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Dokument-indhold */}
      <div className="px-10 py-8">
        <div className="space-y-0.5 max-w-none">
          {linjer.map((linje, i) => {
            const trimmet = linje.trim();

            // Spring UDBUDSDOKUMENT og tom titel over (vises i header)
            if (/^UDBUDSDOKUMENT$/i.test(trimmet)) return null;
            if (i < 4 && trimmet === titel) return null;

            // Nummereret overskrift: "1. PROJEKTBESKRIVELSE"
            if (/^\d+\.\s+[A-ZÆØÅ][A-ZÆØÅ\s]+$/.test(trimmet) && trimmet.length > 3) {
              return (
                <div key={i} className="pt-8 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {trimmet.match(/^\d+/)?.[0]}
                    </span>
                    <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                      {trimmet.replace(/^\d+\.\s+/, "")}
                    </p>
                  </div>
                  <div className="mt-3 h-px bg-gray-100" />
                </div>
              );
            }

            // Bullet-punkt
            if (trimmet.startsWith("- ")) {
              return (
                <div key={i} className="flex items-start gap-3 py-1 pl-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a2a] flex-shrink-0 mt-2" />
                  <span className="text-sm text-gray-700 leading-relaxed">{trimmet.slice(2)}</span>
                </div>
              );
            }

            // Label:værdi-linje
            if (/^[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]+:\s+\S/.test(trimmet)) {
              const kolon = trimmet.indexOf(":");
              const label = trimmet.slice(0, kolon).trim();
              const værdi = trimmet.slice(kolon + 1).trim();
              return (
                <div key={i} className="flex gap-4 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm text-gray-800 flex-1">{værdi}</span>
                </div>
              );
            }

            // Tom linje
            if (trimmet === "") return <div key={i} className="h-3" />;

            // Normal tekst
            return (
              <p key={i} className="text-sm text-gray-700 leading-[1.8] py-0.5">
                {trimmet}
              </p>
            );
          })}
        </div>
      </div>

      {/* Dokument-footer */}
      <div className="px-10 py-6 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400">Genereret via nembyggestyring.dk</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1e3a2a]" />
            <p className="text-[10px] font-semibold text-gray-500">AB-Forbruger 2012</p>
          </div>
        </div>
      </div>
    </div>
  );
}
