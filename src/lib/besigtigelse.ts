// Fælles typer, statuskonstanter og formatteringshjælpere til besigtigelsesflowet.
// Bruges i dashboard, BesigtigelseKort og aftale-siden.
// Kalenderen kan genbruge de samme typer og formatteringer uden ombygning.

export type BesigtigelseStatusVaerdi = "foreslaaet" | "godkendt" | "afvist";
export type BesigtigelseForeslaaetAf = "bygherre" | "haandvaerker";

// Mindste fælles type: de felter getBesigtigelseStatusUI kræver.
// Dashboard og BesigtigelseKort har egne udvidede interfaces — de opfylder
// automatisk dette krav, da de er supersets.
export interface BesigtigelseData {
  id: string;
  kontrakt_id: string;
  dato: string;
  tidspunkt: string | null;
  status: string;
  foreslaaet_af: string;
}

export interface BesigtigelseStatusUI {
  badge: string;
  tekst: string | null;
  klasse: string;
  prioritet: number;
}

// Kort datoformat til dashboard-badge: "man. 14. aug."
export const fmtBesigtigelseDatoKort = (iso: string): string =>
  new Date(iso + "T00:00:00").toLocaleDateString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// Langt datoformat til detaljevisning: "mandag den 14. august 2026"
export const fmtBesigtigelseDatoLang = (iso: string): string =>
  new Date(iso + "T00:00:00").toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Tidspunkt formateret som "HH:MM", eller null ved manglende tidspunkt
export const fmtTidspunkt = (tid: string | null): string | null =>
  tid ? tid.slice(0, 5) : null;

// Bygherre-perspektiv: beregner badge, tekst, CSS-klasser og prioritet
// til brug i dashboardkort og aftale-handlingsboks.
// Prioritet 1 = kræver aktiv handling, 3 = afventer, 4 = godkendt.
export function getBesigtigelseStatusUI(b: BesigtigelseData): BesigtigelseStatusUI {
  const datoTekst = b.dato
    ? `${fmtBesigtigelseDatoKort(b.dato)}${b.tidspunkt ? ` kl. ${fmtTidspunkt(b.tidspunkt)}` : ""}`
    : null;

  if (b.status === "foreslaaet" && b.foreslaaet_af === "haandvaerker") {
    return {
      badge: "Besigtigelse afventer dit svar",
      tekst: datoTekst,
      klasse: "bg-amber-100 text-amber-800 border-amber-200",
      prioritet: 1,
    };
  }
  if (b.status === "foreslaaet" && b.foreslaaet_af === "bygherre") {
    return {
      badge: "Dit forslag afventer entreprenøren",
      tekst: datoTekst,
      klasse: "bg-blue-100 text-blue-700 border-blue-200",
      prioritet: 3,
    };
  }
  return {
    badge: "Besigtigelse aftalt",
    tekst: datoTekst,
    klasse: "bg-green-100 text-green-700 border-green-200",
    prioritet: 4,
  };
}
