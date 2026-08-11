// Fælles typer, statuskonstanter, tidslogik og formatteringshjælpere til besigtigelsesflowet.
// Bruges i dashboard, BesigtigelseKort, aftale-siden og API-routes.
// Al tidszonelogik samles her — ingen spredte new Date()-sammenligninger i komponenter.

export type BesigtigelseStatusVaerdi = "foreslaaet" | "godkendt" | "afvist";
export type BesigtigelseForeslaaetAf = "bygherre" | "haandvaerker";

// Ét alternativt tidspunkt inden for en besigtigelsesrunde (besigtigelse_tidspunkter).
export interface BesigtigelseTidspunktData {
  id: string;
  dato: string;
  tidspunkt: string;
}

// Mindste fælles type: de felter getBesigtigelseStatusUI og hentEffektivDatoTid kræver.
// Dashboard og BesigtigelseKort har egne udvidede interfaces — de opfylder
// automatisk dette krav, da de er supersets.
// dato/tidspunkt er de LEGACY parent-felter (kun udfyldt for rækker fra før
// multi-tids-flowet). Nye runder har dato/tidspunkt = null på parent-niveau —
// deres reelle tider findes udelukkende i tidspunkter-arrayet.
export interface BesigtigelseData {
  id: string;
  kontrakt_id: string;
  dato: string | null;
  tidspunkt: string | null;
  status: string;
  foreslaaet_af: string;
  varighed_minutter?: number | null;
  valgt_tidspunkt_id: string | null;
  tidspunkter?: BesigtigelseTidspunktData[];
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

// Kontrollerede valgmuligheder for varighed — ingen fri indtastning noget sted.
export const VARIGHED_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "30 min." },
  { value: 45, label: "45 min." },
  { value: 60, label: "1 time" },
  { value: 90, label: "1½ time" },
  { value: 120, label: "2 timer" },
];
export const VARIGHED_DEFAULT = 60;

// Kontrollerede 15-minutters tidspunktsvalg til <select> — 00:00 til 23:45.
// Ingen fri tekstindtastning, hverken her eller server-side.
export const TIDSPUNKT_OPTIONS: string[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const hh = Math.floor(i / 4);
  const mm = (i % 4) * 15;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
});

// Ren UX-gruppering af TIDSPUNKT_OPTIONS til visning: normal arbejdstid
// (07:00–18:00) først, så brugeren ikke skal scrolle forbi midnat for at nå
// de mest almindelige tider. Dette er UDELUKKENDE en visningsrækkefølge —
// enhver kvarterstid i døgnet er fortsat lige gyldig og vælgbar, og
// server-/RPC-validering af 15-minutters-reglen er helt uændret og uafhængig
// af denne gruppering.
export const TIDSPUNKT_ARBEJDSTID: string[] = TIDSPUNKT_OPTIONS.filter(
  (t) => t >= "07:00" && t <= "18:00",
);
export const TIDSPUNKT_UDEN_FOR_ARBEJDSTID: string[] = TIDSPUNKT_OPTIONS.filter(
  (t) => t < "07:00" || t > "18:00",
);

// Formatteret varighedstekst til visning, eller null hvis varigheden er ukendt
// (legacy-rækker fra før varighedsbegrebet fandtes) — viser ALDRIG en opdigtet værdi.
export function fmtVarighed(minutter: number | null | undefined): string | null {
  if (!minutter) return null;
  const match = VARIGHED_OPTIONS.find((o) => o.value === minutter);
  return match ? match.label : `${minutter} min.`;
}

// Beregner "start–slut"-intervaltekst ud fra et starttidspunkt og en varighed.
// Sluttiden gemmes aldrig separat i databasen — den udledes altid herfra til visning.
// Uden kendt varighed (legacy) vises kun starttidspunktet, ingen opdigtet sluttid.
export function fmtTidsinterval(tidspunkt: string, varighedMinutter: number | null | undefined): string {
  const start = tidspunkt.slice(0, 5);
  if (!varighedMinutter) return start;
  const [hh, mm] = start.split(":").map(Number);
  const startMin = hh * 60 + mm;
  const slutMin = (startMin + varighedMinutter + 24 * 60) % (24 * 60);
  const slutHh = Math.floor(slutMin / 60);
  const slutMm = slutMin % 60;
  const slut = `${String(slutHh).padStart(2, "0")}:${String(slutMm).padStart(2, "0")}`;
  return `${start}–${slut}`;
}

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

/**
 * Finder den faktisk gældende dato/tidspunkt for en besigtigelsesrunde, uanset om
 * den stammer fra det nye multi-tids-flow eller er en legacy-række.
 *
 * Rækkefølge:
 *   1. Hvis valgt_tidspunkt_id er sat og matcher et element i tidspunkter — brug det
 *      (en godkendt runde fra det nye flow: den valgte af 1-3 tilbudte tider).
 *   2. Ellers, hvis parent.dato findes — brug parentens egne dato/tidspunkt
 *      (en legacy-række fra før multi-tids-flowet).
 *   3. Ellers null — en aktiv, endnu ikke besvaret multi-tids-runde har IKKE én
 *      entydig dato endnu (der er 1-3 ligeværdige alternativer, intet er valgt).
 *
 * Returnerer aldrig en opdigtet værdi. For en legacy-række uden tidspunkt
 * returneres tidspunkt: null uændret — intet klokkeslæt vises da i UI'et.
 */
export function hentEffektivDatoTid(
  b: Pick<BesigtigelseData, "dato" | "tidspunkt" | "valgt_tidspunkt_id" | "tidspunkter">,
): { dato: string; tidspunkt: string | null } | null {
  if (b.valgt_tidspunkt_id && b.tidspunkter) {
    const valgt = b.tidspunkter.find((t) => t.id === b.valgt_tidspunkt_id);
    if (valgt) return { dato: valgt.dato, tidspunkt: valgt.tidspunkt };
  }
  if (b.dato) return { dato: b.dato, tidspunkt: b.tidspunkt };
  return null;
}

// Statusetiket til en historisk (ikke-aktuel) besigtigelsesrunde.
// En "foreslaaet"-status i historikken er pr. definition ikke længere aktuel
// (den aktuelle runde afgøres altid som nyeste efter oprettet_at), og betyder derfor,
// at ingen af de tilbudte tider blev valgt, før et nyt forslag blev sendt.
// Dette er en ren UI-aflæsning — ingen ny databasestatus.
export function getBesigtigelseHistorikLabel(status: string): string {
  if (status === "godkendt") return "Besigtigelse aftalt";
  if (status === "afvist") return "Afvist";
  return "Ingen af tiderne passede";
}

// Bygherre-perspektiv: beregner badge, tekst, CSS-klasser og prioritet
// til brug i dashboardkort og aftale-handlingsboks.
// Prioritet 1 = kræver aktiv handling, 3 = afventer, 4 = godkendt kommende.
// Prioritet 5 = passeret — vises ikke som aktuel badge i dashboardet.
export function getBesigtigelseStatusUI(b: BesigtigelseData): BesigtigelseStatusUI {
  if (b.status === "godkendt") {
    const effektiv = hentEffektivDatoTid(b);
    const datoTekst = effektiv
      ? `${fmtBesigtigelseDatoKort(effektiv.dato)}${effektiv.tidspunkt ? ` kl. ${fmtTidspunkt(effektiv.tidspunkt)}` : ""}`
      : null;

    if (effektiv && erBesigtigelsePasseret(effektiv.dato, effektiv.tidspunkt)) {
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

  if (b.status === "foreslaaet") {
    // Ingen enkelt dato at vise for en aktiv multi-tids-runde — vis i stedet et
    // antal. Aldrig "Mulighed 1" fremstillet som en aftalt dato.
    const antal = b.tidspunkter?.length ?? (b.dato ? 1 : 0);
    const tekst = antal > 0 ? `${antal} ${antal === 1 ? "tid" : "tider"} foreslået` : null;

    if (b.foreslaaet_af === "haandvaerker") {
      return {
        badge: "Besigtigelse afventer dit svar",
        tekst,
        klasse: "bg-amber-100 text-amber-800 border-amber-200",
        prioritet: 1,
      };
    }
    return {
      badge: "Dit forslag afventer entreprenøren",
      tekst,
      klasse: "bg-blue-100 text-blue-700 border-blue-200",
      prioritet: 3,
    };
  }

  return {
    badge: "Besigtigelse aftalt",
    tekst: null,
    klasse: "bg-green-100 text-green-700 border-green-200",
    prioritet: 4,
  };
}
