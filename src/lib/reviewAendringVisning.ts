// Sektionsbaseret forhandling v1 — delte, rene visningshjælpere for
// bygherres review_*-ændringsønsker (kontraktaendringer med
// felt ∈ REVIEW_AENDRING_TYPER). Bruges af både bygherres og
// entreprenørens aftale-side, så begge sider formaterer ny_vaerdi-JSON'en
// på nøjagtig samme måde. Ingen produktlogik, ingen writes.

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

// Skelner korrekt mellem kun startdato, kun slutdato, og begge — undgår
// den tidligere kendte copy-bug, hvor en enkelt slutdato blev omtalt som
// "opstart og aflevering".
export function fmtTidsplanOenske(startdato: string | null, slutdato: string | null): string {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  if (startdato && slutdato) return `Ønsket opstart: ${fmt(startdato)}. Ønsket aflevering: ${fmt(slutdato)}.`;
  if (slutdato) return `Ønsket aflevering: ${fmt(slutdato)}`;
  if (startdato) return `Ønsket opstart: ${fmt(startdato)}`;
  return "";
}

export function reviewAendringVisningstekst(felt: string, ny_vaerdi: string): string {
  try {
    const v = JSON.parse(ny_vaerdi);
    if (felt === "review_total_pris") {
      const dele: string[] = [];
      if (v.foreslaaetPris) dele.push(`Foreslået pris: ${Number(v.foreslaaetPris).toLocaleString("da-DK")} kr.`);
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
