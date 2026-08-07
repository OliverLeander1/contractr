// ---------------------------------------------------------------------------
// V2-dokumentformat — stabile, interne strukturmarkører til nye AI-genererede
// aftaler. Erstatter den upålidelige regex-baserede opdeling af ældre
// dokumenter. Rene, framework-uafhængige funktioner uden "use client", React
// eller server-only kode, så de kan importeres sikkert fra både klientsider
// og server-routes (fx den route, der gemmer/validerer kontrakter.beskrivelse)
// uden at krydse en client-component-grænse.
// ---------------------------------------------------------------------------

export const V2_MARKØR = "[[NEMBYG_DOKUMENT_V2]]";

// [INTRO] er bevidst ikke en sektionsmarkør her. Arbejdsomfang er den ene
// autoritative arbejdsbeskrivelse i aftalegrundlaget — der findes ikke
// længere en separat, systemgenereret "Projektopsummering" i selve
// dokumentet. Ældre gemte dokumenter kan stadig indeholde en [INTRO]-blok;
// da markøren ikke indgår nedenfor, bliver dens tekst blot ikke tildelt
// nogen sektion og forsvinder derfor fra parsing og visning uden at nogen
// databaseværdi omskrives.
const V2_SEKTIONSMARKØRER = {
  arbejdsomfang: "[ARBEJDSOMFANG]",
  kravOgOensker: "[KRAV_OG_OENSKER]",
  praktiskeForhold: "[PRAKTISKE_FORHOLD]",
} as const;

export interface V2Sektioner {
  arbejdsomfang: string;
  kravOgOensker: string;
  praktiskeForhold: string;
}

export function erV2Dokument(tekst?: string | null): boolean {
  return !!tekst && tekst.trimStart().startsWith(V2_MARKØR);
}

// Deterministisk parsing ud fra præcise, kontrollerede markørstrenge — ikke
// et gæt ud fra AI-formatering. Rækkefølgen af markører i den gemte tekst
// har ingen betydning; hver sektions indhold afgrænses af den næstnærmeste
// markør, uanset hvilken.
export function parseV2Sektioner(raa: string): V2Sektioner {
  const tekst = raa ?? "";
  const positioner = (Object.entries(V2_SEKTIONSMARKØRER) as [keyof V2Sektioner, string][])
    .map(([nøgle, markør]) => ({ nøgle, markør, index: tekst.indexOf(markør) }))
    .filter((p) => p.index !== -1)
    .sort((a, b) => a.index - b.index);

  const resultat: V2Sektioner = { arbejdsomfang: "", kravOgOensker: "", praktiskeForhold: "" };

  positioner.forEach((p, i) => {
    const indholdStart = p.index + p.markør.length;
    const indholdSlut = i + 1 < positioner.length ? positioner[i + 1].index : tekst.length;
    resultat[p.nøgle] = tekst.slice(indholdStart, indholdSlut).trim();
  });

  return resultat;
}

export function byggV2Dokument(sektioner: V2Sektioner): string {
  return [
    V2_MARKØR,
    V2_SEKTIONSMARKØRER.arbejdsomfang,
    sektioner.arbejdsomfang.trim(),
    "",
    V2_SEKTIONSMARKØRER.kravOgOensker,
    sektioner.kravOgOensker.trim(),
    "",
    V2_SEKTIONSMARKØRER.praktiskeForhold,
    sektioner.praktiskeForhold.trim(),
  ].join("\n");
}

// Deterministisk, snæver datodetektion til brug i klient- og servervalidering
// af de redigerbare V2-sektioner. Blokerer konkrete kalenderdatoer (numerisk
// eller med dansk månedsnavn), men ikke bare årstal eller standard-/produktnumre
// (fx "AB-Forbruger 2012", "BR18", "DS/EN 12464-1", "Produktserie 2024") eller
// beløb. Disse eksempler bruges udelukkende til at teste, at årstal og
// standardnumre ikke fejlagtigt tolkes som datoer — ikke som en erklæring om,
// at noget af dette er gældende for en konkret aftale.
const NUMERISK_DATO_MØNSTER = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b|\b\d{4}-\d{1,2}-\d{1,2}\b/;
const DANSKE_MÅNEDER = "januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december";
const MÅNEDSNAVN_DATO_MØNSTER = new RegExp(`\\b(den\\s+)?\\d{1,2}\\.?\\s*(?:${DANSKE_MÅNEDER})\\b`, "i");

export function indeholderKonkretDato(tekst: string): boolean {
  if (!tekst) return false;
  return NUMERISK_DATO_MØNSTER.test(tekst) || MÅNEDSNAVN_DATO_MØNSTER.test(tekst);
}
