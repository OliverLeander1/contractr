// Fælles, autoritativ definition af "uafklaret forslag" for et aftalegrundlag.
// Bruges BÅDE server-side (final approval-endpointet, som håndhæver reglen)
// og klient-side (kun til at vise en rolig statustekst — klienten er aldrig
// den autoritative kilde). Undgår at samme regel vedligeholdes to steder.

export interface UafklaretForslag {
  type: "felt" | "tidsplan" | "forudsaetninger";
  antal: number;
}

interface KontraktTilGodkendelsesTjek {
  kontraktaendringer?: { status: string }[] | null;
  tidsplan?: { indsendt_at?: string | null; godkendt_af_bygherre?: boolean } | null;
  forudsaetninger_sendt_at?: string | null;
  forudsaetninger_godkendt?: boolean | null;
}

// Kortlægning af hvilke eksisterende workflow-states der regnes som
// uafklarede, uafhængigt af hinanden:
// - kontraktaendringer med status "afventer" (titel/beskrivelse/total_pris)
// - en indsendt tidsplan, som bygherre endnu ikke har godkendt
// - en indsendt forudsætning, som bygherre endnu ikke har taget stilling til
// Besigtigelse indgår bevidst ikke — det er et selvstændigt planlægningsflow,
// adskilt fra selve aftalegrundlaget (se docs/PROJECT_STATE.md).
// Betalingsplan indgår bevidst ikke endnu — der findes i dag ikke et
// forslag/accept-flow for feltet at tjekke imod.
export function findUafklaredeForslag(kontrakt: KontraktTilGodkendelsesTjek): UafklaretForslag[] {
  const resultat: UafklaretForslag[] = [];

  const afventendeFelter = (kontrakt.kontraktaendringer ?? []).filter((a) => a.status === "afventer");
  if (afventendeFelter.length > 0) {
    resultat.push({ type: "felt", antal: afventendeFelter.length });
  }

  if (kontrakt.tidsplan?.indsendt_at && kontrakt.tidsplan.godkendt_af_bygherre !== true) {
    resultat.push({ type: "tidsplan", antal: 1 });
  }

  if (kontrakt.forudsaetninger_sendt_at && kontrakt.forudsaetninger_godkendt !== true) {
    resultat.push({ type: "forudsaetninger", antal: 1 });
  }

  return resultat;
}

export function talUafklaredeForslag(kontrakt: KontraktTilGodkendelsesTjek): number {
  return findUafklaredeForslag(kontrakt).reduce((sum, r) => sum + r.antal, 0);
}

interface KontraktTilLivscyklusTjek {
  status?: string | null;
  bygherre_godkendt_at?: string | null;
  haandvaerker_godkendt_at?: string | null;
}

// Autoritativ, fail-closed definition af "kontrakten er endeligt indgået
// af begge parter" (Signed contract date integrity v1). Status alene er
// IKKE tilstrækkelig som predicate — den generelle indholds-opdatering i
// /api/kontrakt kan i dag nulstille begge godkendelsestidsstempler uden
// samtidig at rette status tilbage fra "begge_godkendt", så en
// inkonsistent legacy-tilstand (status sat, tidsstempler tomme) er reelt
// mulig. Alle tre felter kræves derfor eksplicit som defense-in-depth.
// Bruges BÅDE server-side (til at autoritativt blokere mutation af
// bindende kontraktdatoer) og klient-side (kun til rolig
// statustekst/gating — klienten er aldrig den autoritative kilde).
export function erKontraktEndeligtIndgaaet(kontrakt: KontraktTilLivscyklusTjek | null | undefined): boolean {
  return !!(
    kontrakt &&
    kontrakt.status === "begge_godkendt" &&
    kontrakt.bygherre_godkendt_at &&
    kontrakt.haandvaerker_godkendt_at
  );
}

// En godkendelse gælder kun det aftalegrundlag, parten faktisk godkendte
// (Contract approval state coherence v1). Hvis blot ÉN part allerede har
// godkendt, skal en efterfølgende materiel ændring derfor blokeres på
// samme måde som håndværkerens egne mutation-routes allerede gør
// (fx PATCH /api/kontrakt/[token] og /[token]/tidsplan: "afvis ændringer
// når ét eller begge godkendelsestimestamps er sat"). Dette er en bevidst
// strengere — og samtidig enklere — regel end erKontraktEndeligtIndgaaet:
// den kræver ikke "begge", kun "mindst én", og undgår dermed at skulle
// opfinde en ny status-transition for en delvist godkendt kontrakt, som
// ingen eksisterende, entydig re-approval-status findes for.
export function erGodkendtAfNogen(kontrakt: KontraktTilLivscyklusTjek | null | undefined): boolean {
  return !!(kontrakt && (kontrakt.bygherre_godkendt_at || kontrakt.haandvaerker_godkendt_at));
}
