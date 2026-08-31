import { erGyldigDatoOnly, hentOprindeligAftaltSlutdato } from "@/lib/kontraktSlutdato";

interface AftaleseddelTilFristforlaengelse {
  kontrakt_id?: string | null;
  status?: string | null;
  haandvaerker_tidsdage?: number | null;
}

interface KontraktMedBaseline {
  slutdato?: string | null;
  tidsplan?: {
    type?: string | null;
    faser?: { slutdato?: string | null }[] | null;
    godkendt_af_bygherre?: boolean | null;
  } | null;
}

export interface KontraktDeadline {
  oprindeligAftaltSlutdato: string | null;
  samletFristforlaengelseDage: number;
  gaeldendeAflevering: string | null;
}

// Lægger et helt antal kalenderdage til en strict "YYYY-MM-DD"-værdi.
// Bruger Date.UTC/getUTC*/setUTCDate udelukkende som et internt
// kalenderregnestykke (aldrig som et faktisk tidspunkt), så resultatet
// aldrig kan forskydes af serverens eller browserens lokale tidszone —
// samme dato-only-disciplin som kontraktSlutdato.ts. Kalenderdage, ikke
// arbejdsdage: ingen weekend-/helligdagslogik.
function laegKalenderdageTil(datoOnly: string, dage: number): string | null {
  if (!erGyldigDatoOnly(datoOnly)) return null;
  const [aar, maaned, dag] = datoOnly.split("-").map(Number);
  const d = new Date(Date.UTC(aar, maaned - 1, dag));
  d.setUTCDate(d.getUTCDate() + dage);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Summen af godkendte fristforlængelser (Agreement sheet deadline
// extension v1). Kun aftalesedler for DEN SAMME kontrakt_id og med
// status === "godkendt" tæller med — hverken afventende, afviste eller
// andre kontrakters aftalesedler. Ugyldige/negative værdier (bør ikke
// forekomme efter server-side validering, men behandles defensivt her
// også) ekskluderes stille fra summen i stedet for at kunne reducere
// fristen.
export function summerGodkendteFristforlaengelser(
  aftalesedler: AftaleseddelTilFristforlaengelse[] | null | undefined,
  kontraktId?: string | null,
): number {
  if (!Array.isArray(aftalesedler)) return 0;

  return aftalesedler
    .filter((s) => s.status === "godkendt")
    .filter((s) => kontraktId === undefined || s.kontrakt_id === kontraktId)
    .reduce((sum, s) => {
      const dage = s.haandvaerker_tidsdage;
      if (typeof dage !== "number" || !Number.isInteger(dage) || dage < 0) return sum;
      return sum + dage;
    }, 0);
}

// Den gældende, DERIVED afleveringsdato — oprindeligt aftalt slutdato
// (den underskrevne baseline, som denne funktion ALDRIG muterer) plus
// summen af godkendte fristforlængelser i kalenderdage. Falder tilbage
// til baseline uanset ugyldigt input — udleder aldrig en opdigtet dato,
// og reducerer aldrig fristen.
export function beregnGaeldendeAflevering(
  oprindeligAftaltSlutdato: string | null,
  samletFristforlaengelseDage: number,
): string | null {
  if (!oprindeligAftaltSlutdato || !erGyldigDatoOnly(oprindeligAftaltSlutdato)) return null;
  if (!Number.isInteger(samletFristforlaengelseDage) || samletFristforlaengelseDage <= 0) {
    return oprindeligAftaltSlutdato;
  }
  return laegKalenderdageTil(oprindeligAftaltSlutdato, samletFristforlaengelseDage) ?? oprindeligAftaltSlutdato;
}

// Samlet, bekvem beregning for én kontrakt — den mindste fælles model så
// aktive views ikke hver især skal duplikere sum- og adderings-logikken.
// `aftalesedler` forventes allerede hentet (typisk projekt- eller
// kontrakt-scoped, hentet én gang pr. view, ikke ét kald pr. seddel).
export function beregnKontraktDeadline(
  kontrakt: KontraktMedBaseline | null | undefined,
  aftalesedler: AftaleseddelTilFristforlaengelse[] | null | undefined,
  kontraktId?: string | null,
): KontraktDeadline {
  const oprindeligAftaltSlutdato = hentOprindeligAftaltSlutdato(kontrakt);
  const samletFristforlaengelseDage = summerGodkendteFristforlaengelser(aftalesedler, kontraktId);
  const gaeldendeAflevering = beregnGaeldendeAflevering(oprindeligAftaltSlutdato, samletFristforlaengelseDage);
  return { oprindeligAftaltSlutdato, samletFristforlaengelseDage, gaeldendeAflevering };
}
