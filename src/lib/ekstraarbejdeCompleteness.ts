// Fælles, autoritativ definition af "komplet forslag" for en aftaleseddel.
// Bruges af opret-, svar- og godkend-routen, så alle tre har samme
// fortolkning af, hvornår et forslag er klar til bygherrens beslutning.
//
// To prisformer, hver med sin egen completeness-regel:
// - fast:         konkret samlet pris + tidskonsekvens, begge eksplicit sat
// - medgaaet_tid: timepris + gyldig materialeafregning (+ tillæg hvis
//                 relevant) + tidskonsekvens, alle eksplicit sat.
//                 Et prisoverslag er altid valgfrit og indgår ikke i
//                 completeness-tjekket.

export const MATERIALE_AFREGNINGER = [
  "inkluderet",
  "dokumenteret_pris",
  "dokumenteret_pris_med_tillaeg",
] as const;

export type MaterialeAfregning = (typeof MATERIALE_AFREGNINGER)[number];

export function erGyldigMaterialeAfregning(v: unknown): v is MaterialeAfregning {
  return typeof v === "string" && (MATERIALE_AFREGNINGER as readonly string[]).includes(v);
}

interface SedelTilCompletenessTjek {
  haandvaerker_pris_type: string | null;
  haandvaerker_pris: number | null;
  haandvaerker_timepris: number | null;
  haandvaerker_tidsdage: number | null;
  materiale_afregning: string | null;
  materiale_tillaeg_procent: number | null;
}

export function erForslagKomplet(sedel: SedelTilCompletenessTjek): boolean {
  if (sedel.haandvaerker_tidsdage === null || sedel.haandvaerker_tidsdage < 0) {
    return false;
  }

  if (sedel.haandvaerker_pris_type === "fast") {
    return sedel.haandvaerker_pris !== null && sedel.haandvaerker_pris >= 0;
  }

  if (sedel.haandvaerker_pris_type === "medgaaet_tid") {
    if (sedel.haandvaerker_timepris === null || sedel.haandvaerker_timepris < 0) {
      return false;
    }
    if (!erGyldigMaterialeAfregning(sedel.materiale_afregning)) {
      return false;
    }
    if (sedel.materiale_afregning === "dokumenteret_pris_med_tillaeg") {
      if (sedel.materiale_tillaeg_procent === null || sedel.materiale_tillaeg_procent < 0) {
        return false;
      }
    }
    return true;
  }

  return false;
}
