interface TidsplanFase {
  navn?: string | null;
  startdato?: string | null;
  slutdato?: string | null;
}

interface KontraktTidsplan {
  type?: string | null;
  faser?: TidsplanFase[] | null;
  godkendt_af_bygherre?: boolean | null;
}

interface KontraktMedDatoer {
  startdato?: string | null;
  slutdato?: string | null;
  tidsplan?: KontraktTidsplan | null;
}

function erSkudaar(aar: number): boolean {
  return (aar % 4 === 0 && aar % 100 !== 0) || aar % 400 === 0;
}

// Streng, lokal validering af en date-only værdi — kun "YYYY-MM-DD", og kun
// hvis den faktisk repræsenterer en reel kalenderdato (afviser fx
// "2026-02-31", "2026-13-01", "2026-2-1", "11/09/2026", "foo", "").
// Bevidst IKKE baseret alene på !Number.isNaN(new Date(v).getTime()), da
// JavaScripts Date-parsing kan normalisere/acceptere overflow-værdier
// (fx "2026-02-31" bliver til 3. marts), hvilket ikke må kunne blive en
// canonical, juridisk relevant kontraktdato. Ingen dependency, ingen
// timezone-konvertering.
function erGyldigDatoOnly(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const aar = Number(match[1]);
  const maaned = Number(match[2]);
  const dag = Number(match[3]);
  if (maaned < 1 || maaned > 12) return false;

  const dageIMaaned = [31, erSkudaar(aar) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dag >= 1 && dag <= dageIMaaned[maaned - 1];
}

// Udleder den oprindeligt aftalte slutdato for ÉN kontrakt — ren, read-only
// derived helper, ingen Supabase-kald. Bruges til at vise ét konsistent tal
// alle steder, i stedet for at lade forskellige sider læse kontrakt.slutdato
// og kontrakt.tidsplan.faser[].slutdato uafhængigt af hinanden (dokumenteret
// produktionsinkonsistens: samme kontrakt viste "9. august" i projekt-
// headeren og "11. september" i den godkendte AB-Forbruger §12-tidsplan).
//
// Prioritet:
// 1. Den AB-Forbruger §12-godkendte fasetidsplan (kontrakt.tidsplan), hvis
//    den findes, er af type "faser", ER godkendt af bygherre, og indeholder
//    mindst én fase med en gyldig slutdato — her bruges den SENESTE
//    slutdato blandt ALLE faser (ikke kun den første, for at understøtte
//    multi-fase korrekt).
// 2. Ellers kontrakt.slutdato, hvis den findes.
// 3. Ellers null — ingen dato opfindes.
//
// Arbejder udelukkende på ÉN kontrakt. Sammenligner eller summerer aldrig
// på tværs af flere kontrakter, og udleder aldrig et projekts overordnede
// slutdato — det er en separat, endnu ikke truffet produktbeslutning.
export function hentOprindeligAftaltSlutdato(
  kontrakt: KontraktMedDatoer | null | undefined,
): string | null {
  if (!kontrakt) return null;

  const tidsplan = kontrakt.tidsplan;
  if (
    tidsplan &&
    tidsplan.type === "faser" &&
    tidsplan.godkendt_af_bygherre === true &&
    Array.isArray(tidsplan.faser)
  ) {
    const gyldigeSlutdatoer = tidsplan.faser
      .map((fase) => fase?.slutdato)
      .filter(erGyldigDatoOnly);

    if (gyldigeSlutdatoer.length > 0) {
      // Strict "YYYY-MM-DD" er fast bredde og nul-paddet, så leksikalsk
      // strengsammenligning giver samme rækkefølge som kronologisk
      // sammenligning — ingen Date-parsing eller timezone-konvertering
      // nødvendig for at finde den seneste.
      return gyldigeSlutdatoer.reduce((seneste, dato) => (dato > seneste ? dato : seneste));
    }
  }

  return erGyldigDatoOnly(kontrakt.slutdato) ? kontrakt.slutdato : null;
}

// Samme princip som hentOprindeligAftaltSlutdato, men for aftalt startdato:
// 1. Godkendt fasetidsplan findes → den TIDLIGSTE gyldige startdato blandt
//    ALLE faser (ikke kun første fase i arrayet).
// 2. Ellers kontrakt.startdato, hvis den er en gyldig date-only værdi.
// 3. Ellers null.
//
// Produktbeslutning (Contract dates truth & UX consistency v1): fallback
// til kontrakt.startdato/slutdato er bevidst bevaret for en kontrakt uden
// godkendt tidsplan, også efter endelig underskrift — ellers ville
// kontrakter, der aldrig har brugt tidsplan-godkendelsesfunktionen, miste
// deres eneste kendte aftalte dato. Det er dokumenteret (se projektets
// noter), at kontrakt.startdato/slutdato i dag IKKE er låst mod ændring
// efter begge_godkendt uden nulstilling af underskrifter — dette er en
// kendt, separat opfølgningsopgave og ikke løst her.
export function hentOprindeligAftaltStartdato(
  kontrakt: KontraktMedDatoer | null | undefined,
): string | null {
  if (!kontrakt) return null;

  const tidsplan = kontrakt.tidsplan;
  if (
    tidsplan &&
    tidsplan.type === "faser" &&
    tidsplan.godkendt_af_bygherre === true &&
    Array.isArray(tidsplan.faser)
  ) {
    const gyldigeStartdatoer = tidsplan.faser
      .map((fase) => fase?.startdato)
      .filter(erGyldigDatoOnly);

    if (gyldigeStartdatoer.length > 0) {
      return gyldigeStartdatoer.reduce((tidligste, dato) => (dato < tidligste ? dato : tidligste));
    }
  }

  return erGyldigDatoOnly(kontrakt.startdato) ? kontrakt.startdato : null;
}
