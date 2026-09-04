// Sektionsbaseret forhandling v1 — delte, rene visningshjælpere for
// bygherres review_*-ændringsønsker (kontraktaendringer med
// felt ∈ REVIEW_AENDRING_TYPER). Bruges af både bygherres og
// entreprenørens aftale-side, OG af den dedikerede resolve-route
// server-side (rene funktioner, ingen React/DOM), så begge sider og
// serveren fortolker/sammenligner ny_vaerdi/gammel_vaerdi-JSON'en på
// nøjagtig samme måde. Ingen produktlogik ud over selve
// formatterings-/sammenligningsreglerne, ingen writes.

export type ReviewAendringType =
  | "review_total_pris"
  | "review_tidsplan"
  | "review_betalingsplan"
  | "review_forudsaetninger";

export const REVIEW_AENDRING_TYPER: readonly ReviewAendringType[] = [
  "review_total_pris",
  "review_tidsplan",
  "review_betalingsplan",
  "review_forudsaetninger",
];

export const REVIEW_SEKTIONS_LABEL: Record<ReviewAendringType, string> = {
  review_total_pris: "Pris",
  review_tidsplan: "Tidsplan",
  review_betalingsplan: "Betalingsplan",
  review_forudsaetninger: "Forudsætninger",
};

// Sektionsbaseret forhandling v1 (rettelse) — "accepteret" (databasens
// interne statusværdi, bevidst uændret for at undgå migration) må ALDRIG
// vises til brugeren som "indarbejdet" eller "accepteret" for et review_*
// ønske: det ville fejlagtigt antyde, at bygherres PRÆCISE foreslåede
// værdi er blevet anvendt 1:1. Entreprenøren kan have revideret til et
// kompromis. "Behandlet" er den korrekte, neutrale brugervendte term.
export const REVIEW_STATUS_LABEL: Record<"afventer" | "accepteret" | "afvist", string> = {
  afventer: "Afventer entreprenør",
  accepteret: "Behandlet",
  afvist: "Afvist",
};

// Ren dato-fragment (fx "aflevering 29. okt." eller "opstart 20. okt. og
// aflevering 29. okt.") — uden "Bygherre ønsker"-præfiks eller
// afsluttende punktum, så den kan genbruges i forskellige sætnings-
// sammenhænge. Skelner korrekt mellem kun startdato, kun slutdato, begge
// (forskellige datoer) og begge (samme dato) — dette er den tidligere
// kendte, parkerede copy-bug, hvor en enkelt slutdato blev omtalt som
// "opstart og aflevering".
export function fmtTidsplanFragment(
  startdato: string | null,
  slutdato: string | null,
  fmt: (iso: string) => string,
): string {
  if (startdato && slutdato) {
    if (startdato === slutdato) return `opstart og aflevering ${fmt(slutdato)}`;
    return `opstart ${fmt(startdato)} og aflevering ${fmt(slutdato)}`;
  }
  if (slutdato) return `aflevering ${fmt(slutdato)}`;
  if (startdato) return `opstart ${fmt(startdato)}`;
  return "";
}

const fmtLangDato = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

// Kompakt, læsevenlig étlinjes-sætning ("Ønsket opstart 20. oktober 2026
// og aflevering 29. oktober 2026.") — bruges til korte statuslinjer (fx
// bygherres "Dit ændringsønske"-visning efter afsendelse), IKKE til de
// strukturerede label/værdi-rækker i selve draft-/anmodningskortene (se
// tidsplanRaekker nedenfor).
export function fmtTidsplanOenske(startdato: string | null, slutdato: string | null): string {
  const fragment = fmtTidsplanFragment(startdato, slutdato, fmtLangDato);
  if (!fragment) return "";
  return `Ønsket ${fragment}.`;
}

export interface ReviewAendringRad {
  label: string;
  vaerdi: string;
}

export const fmtPrisKr = (n: number) => `${Number(n).toLocaleString("da-DK")} kr.`;

// Strukturerede label/værdi-rækker til de kompakte draft- og
// anmodningskort (Problem 3/4) — viser den konkrete, kontrollerbare
// værdi i stedet for en bare "klargjort"/"ønsket ændring"-tekst.
// labelPrefix varierer med kontekst: bygherres eget draft/summary bruger
// "Ønsket" (default), mens entreprenørens modtagne anmodning viser
// bygherres ønske som "Foreslået" og den aktuelle/reviderede kontraktværdi
// som "Aktuel"/"Revideret" — samme rækkestruktur, forskelligt præfiks.
export function pristRaekker(v: { foreslaaetPris?: number | null }, labelPrefix = "Ønsket"): ReviewAendringRad[] {
  if (v.foreslaaetPris === undefined || v.foreslaaetPris === null) return [];
  return [{ label: `${labelPrefix} entreprisesum`, vaerdi: fmtPrisKr(v.foreslaaetPris) }];
}

export function tidsplanRaekker(v: { startdato?: string | null; slutdato?: string | null }, labelPrefix = "Ønsket"): ReviewAendringRad[] {
  const raekker: ReviewAendringRad[] = [];
  if (v.startdato) raekker.push({ label: `${labelPrefix} opstart`, vaerdi: fmtLangDato(v.startdato) });
  if (v.slutdato) raekker.push({ label: `${labelPrefix} aflevering`, vaerdi: fmtLangDato(v.slutdato) });
  return raekker;
}

export function reviewAendringVisningstekst(felt: string, ny_vaerdi: string): string {
  try {
    const v = JSON.parse(ny_vaerdi);
    if (felt === "review_total_pris") {
      const dele: string[] = [];
      if (v.foreslaaetPris) dele.push(`Foreslået pris: ${fmtPrisKr(v.foreslaaetPris)}`);
      if (v.kommentar) dele.push(v.kommentar);
      return dele.join(" — ") || "Ændring ønsket";
    }
    if (felt === "review_tidsplan") {
      const datoTekst = fmtTidsplanOenske(v.startdato ?? null, v.slutdato ?? null);
      return [datoTekst, v.kommentar].filter(Boolean).join(" — ") || "Ændring ønsket";
    }
    return v.kommentar || "Ændring ønsket";
  } catch {
    return "Ændring ønsket";
  }
}

// ==================================================
// Sammenligning mod gammel_vaerdi-snapshot (Problem 4 — server-side guard)
// ==================================================
// Rene funktioner, importeret BÅDE af den dedikerede resolve-route
// (server-side, autoritativ håndhævelse) og af klienten (kun til at vise
// korrekt "aktuel"/"revideret"-status — klienten er aldrig autoritativ).

// Samme offer/review-datokilde, som resten af aftalesiden allerede bruger
// under bygherres review (entreprenørens faktisk indsendte tilbud) —
// opfinder bevidst ingen tredje datokilde. Identisk formel til den, der
// allerede bruges til at bygge gammel_vaerdi-snapshottet ved oprettelse.
export function effektivTidsplanDatoer(
  tidsplan: { faser?: { startdato?: string; slutdato?: string }[] } | null | undefined,
  fallbackStartdato: string | null,
  fallbackSlutdato: string | null,
): { startdato: string | null; slutdato: string | null } {
  return {
    startdato: tidsplan?.faser?.[0]?.startdato ?? fallbackStartdato ?? null,
    slutdato: tidsplan?.faser?.[0]?.slutdato ?? fallbackSlutdato ?? null,
  };
}

export function prisErUaendret(gammelPris: number | null | undefined, aktuelPris: number | null | undefined): boolean {
  return (gammelPris ?? null) === (aktuelPris ?? null);
}

export function tidsplanErUaendret(
  gammel: { startdato: string | null | undefined; slutdato: string | null | undefined },
  aktuelStartdato: string | null,
  aktuelSlutdato: string | null,
): boolean {
  return (gammel.startdato ?? null) === aktuelStartdato && (gammel.slutdato ?? null) === aktuelSlutdato;
}

// Element-for-element sammenligning (ikke JSON.stringify) — undgår
// falske forskelle pga. property-rækkefølge i det gemte JSON-snapshot.
export function betalingsplanErUaendret(
  gammel: { milepæl: string; andel: string }[] | null | undefined,
  aktuel: { milepæl: string; andel: string }[] | null | undefined,
): boolean {
  const g = gammel ?? [];
  const a = aktuel ?? [];
  if (g.length !== a.length) return false;
  return g.every((række, i) => række.milepæl === a[i]?.milepæl && String(række.andel) === String(a[i]?.andel));
}

export function forudsaetningerErUaendret(gammelTekst: string | null | undefined, aktuelTekst: string | null | undefined): boolean {
  return (gammelTekst ?? "").trim() === (aktuelTekst ?? "").trim();
}
