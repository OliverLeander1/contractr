// Fælles typer, statuskonstanter, tidslogik og formatteringshjælpere til besigtigelsesflowet.
// Bruges i dashboard, BesigtigelseKort, aftale-siden og API-routes.
// Al tidszonelogik samles her — ingen spredte new Date()-sammenligninger i komponenter.

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

/**
 * Afgør om en besigtigelses dato+tidspunkt er passeret i dansk tid (Europe/Copenhagen).
 * Source of truth for passeret-tilstanden — bruges i UI, API-routes og lib-helpers.
 * Ingen spredte new Date()-sammenligninger andre steder.
 *
 * Manglende tidspunkt: datoen anses for passeret efter 23:59 på den pågældende dag.
 * Virker i Node.js (API-routes) og i browseren (klientkomponenter).
 */
export function erBesigtigelsePasseret(dato: string, tidspunkt: string | null): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const nowDato = `${get("year")}-${get("month")}-${get("day")}`;
  // hour12: false kan returnere "24" ved midnat i visse miljøer
  const rawHour = get("hour");
  const nowTime = `${rawHour === "24" ? "00" : rawHour}:${get("minute")}`;

  const hhmm = tidspunkt ? tidspunkt.slice(0, 5) : "23:59";

  if (nowDato > dato) return true;
  if (nowDato < dato) return false;
  return nowTime > hhmm;
}

// Bygherre-perspektiv: beregner badge, tekst, CSS-klasser og prioritet
// til brug i dashboardkort og aftale-handlingsboks.
// Prioritet 1 = kræver aktiv handling, 3 = afventer, 4 = godkendt kommende.
// Prioritet 5 = passeret — vises ikke som aktuel badge i dashboardet.
export function getBesigtigelseStatusUI(b: BesigtigelseData): BesigtigelseStatusUI {
  const datoTekst = b.dato
    ? `${fmtBesigtigelseDatoKort(b.dato)}${b.tidspunkt ? ` kl. ${fmtTidspunkt(b.tidspunkt)}` : ""}`
    : null;

  if (b.status === "godkendt") {
    if (erBesigtigelsePasseret(b.dato, b.tidspunkt)) {
      return {
        badge: "Tidspunkt passeret",
        tekst: datoTekst,
        klasse: "bg-gray-100 text-gray-500 border-gray-200",
        prioritet: 5,
      };
    }
    return {
      badge: "Besigtigelse aftalt",
      tekst: datoTekst,
      klasse: "bg-green-100 text-green-700 border-green-200",
      prioritet: 4,
    };
  }

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
