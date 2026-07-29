"use client";

interface Props {
  startdato: string | null;
  slutdato: string | null;
  kompakt?: boolean;
}

type Fase = "forberedelse" | "igang" | "slutspurt" | "overskredet";

interface Status {
  dageIgjen: number;
  fase: Fase;
  pct: number;
  slut: Date;
}

function beregnStatus(startdato: string | null, slutdato: string | null): Status | null {
  if (!slutdato) return null;

  const nu = new Date();
  nu.setHours(0, 0, 0, 0);
  const slut = new Date(slutdato);
  slut.setHours(0, 0, 0, 0);

  const dageIgjen = Math.round((slut.getTime() - nu.getTime()) / (1000 * 60 * 60 * 24));

  let fase: Fase = "igang";
  if (startdato) {
    const start = new Date(startdato);
    start.setHours(0, 0, 0, 0);
    if (nu < start) fase = "forberedelse";
  }
  if (dageIgjen < 0) fase = "overskredet";
  else if (dageIgjen <= 5 && fase === "igang") fase = "slutspurt";

  let pct = 0;
  if (startdato) {
    const start = new Date(startdato);
    start.setHours(0, 0, 0, 0);
    const total = slut.getTime() - start.getTime();
    const gaaet = nu.getTime() - start.getTime();
    pct = Math.min(100, Math.max(0, Math.round((gaaet / total) * 100)));
  }

  return { dageIgjen, fase, pct, slut };
}

const fmtDatoLang = (d: Date) =>
  d.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

const fmtDatoKort = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

const FARVER: Record<Fase, { bg: string; ring: string; tal: string; bar: string; badge: string; badgeTekst: string }> = {
  forberedelse: { bg: "bg-[#f0f7f3]",   ring: "border-[#1e3a2a]/20", tal: "text-[#1e3a2a]", bar: "bg-[#1e3a2a]", badge: "bg-blue-100 text-blue-700",   badgeTekst: "Starter snart" },
  igang:        { bg: "bg-[#f0f7f3]",   ring: "border-green-200",    tal: "text-[#1e3a2a]", bar: "bg-[#1e3a2a]", badge: "bg-green-100 text-green-700", badgeTekst: "I gang" },
  slutspurt:    { bg: "bg-amber-50",    ring: "border-amber-200",    tal: "text-amber-700", bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700",  badgeTekst: "Slutspurt" },
  overskredet:  { bg: "bg-red-50",      ring: "border-red-200",      tal: "text-red-600",   bar: "bg-red-400",   badge: "bg-red-100 text-red-700",      badgeTekst: "Frist overskredet" },
};

export default function DeadlineTæller({ startdato, slutdato, kompakt = false }: Props) {
  const s = beregnStatus(startdato, slutdato);

  if (!slutdato) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center">
        <p className="text-sm text-gray-400">Slutdato ikke aftalt endnu</p>
      </div>
    );
  }

  if (!s) return null;

  const { dageIgjen, fase, pct, slut } = s;
  const f = FARVER[fase];
  const absdag = Math.abs(dageIgjen);
  const dagLabel = fase === "overskredet" ? "dage over frist" : fase === "forberedelse" ? "dage til opstart" : "dage tilbage";

  // Kompakt version (til sidebar, håndværkerside)
  if (kompakt) {
    return (
      <div className={`rounded-xl border p-4 ${f.bg} ${f.ring}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Færdigmelding</p>
            <p className={`text-3xl font-black tabular-nums ${f.tal}`}>{absdag}</p>
            <p className="text-xs text-gray-500 mt-0.5">{dagLabel}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.badge}`}>{f.badgeTekst}</span>
        </div>
      </div>
    );
  }

  // Fuld version
  const cifre = String(absdag).padStart(2, "0").split("");

  return (
    <div className={`rounded-2xl border overflow-hidden ${f.ring}`}>
      <div className={`px-6 pt-6 pb-5 ${f.bg}`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Færdigmelding</p>
            <p className="text-sm font-semibold text-gray-700">{fmtDatoLang(slut)}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${f.badge}`}>{f.badgeTekst}</span>
        </div>

        {/* Store tal */}
        <div className="flex items-end gap-4">
          <div className="flex gap-2">
            {cifre.map((c, i) => (
              <div key={i} className={`w-16 h-20 rounded-2xl bg-white border shadow-sm flex items-center justify-center ${f.ring}`}>
                <span className={`text-5xl font-black tabular-nums ${f.tal}`}>{c}</span>
              </div>
            ))}
          </div>
          <div className="pb-2">
            <p className={`text-base font-bold leading-tight ${f.tal}`}>{dagLabel}</p>
            {(fase === "igang" || fase === "slutspurt") && (
              <p className="text-xs text-gray-400 mt-1">{pct}% af projekttiden er gået</p>
            )}
          </div>
        </div>
      </div>

      {/* Fremgangsbar */}
      {(fase === "igang" || fase === "slutspurt") && startdato && (
        <div className="bg-white px-6 py-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{fmtDatoKort(startdato)}</span>
            <span>{fmtDatoKort(slutdato)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${f.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {fase === "overskredet" && (
        <div className="bg-white px-6 py-4">
          <p className="text-xs text-red-600 leading-relaxed">
            Aftalt færdigmeldingsdato er overskredet. Kontakt entreprenøren eller registrer en mangel.
          </p>
        </div>
      )}

      {fase === "forberedelse" && startdato && (
        <div className="bg-white px-6 py-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Arbejdet starter {new Date(startdato).toLocaleDateString("da-DK", { day: "numeric", month: "long" })}. Nedtæller til færdigmelding begynder da.
          </p>
        </div>
      )}
    </div>
  );
}
