"use client";

interface TidsplanFase {
  navn: string;
  startdato: string;
  slutdato: string;
}

interface Tidsplan {
  type: "faser" | "ingen_tidsplan";
  faser?: TidsplanFase[];
  godkendt_af_bygherre?: boolean;
}

interface Props {
  tekst?: string;
  titel?: string;
  adresse?: string | null;
  oprettetAt?: string | null;
  bygherreNavn?: string;
  bygherreKontakt?: string;
  // Live felter fra kontrakt
  totalPris?: number | null;
  startdato?: string | null;
  slutdato?: string | null;
  betalingsplan?: { milepæl: string; andel: string }[] | null;
  forudsaetninger?: string | null;
  tidsplan?: Tidsplan | null;
  vilkaar?: string | null;
  haandvaerkerNavn?: string | null;
  haandvaerkerFirma?: string | null;
  erAftaleEndeligtGodkendt?: boolean;
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

// ---------------------------------------------------------------------------
// V2-dokumentformat — stabile, interne strukturmarkører til nye AI-genererede
// aftaler. Erstatter den upålidelige regex-baserede opdeling af ældre
// dokumenter. Eksporteres herfra så både klientsider og serverruten, der
// gemmer/validerer kontrakter.beskrivelse, kan genbruge samme, ene
// implementering uden at duplikere parsing-logikken.
// ---------------------------------------------------------------------------

export const V2_MARKØR = "[[NEMBYG_DOKUMENT_V2]]";

const V2_SEKTIONSMARKØRER = {
  intro: "[INTRO]",
  arbejdsomfang: "[ARBEJDSOMFANG]",
  kravOgOensker: "[KRAV_OG_OENSKER]",
  praktiskeForhold: "[PRAKTISKE_FORHOLD]",
} as const;

export interface V2Sektioner {
  intro: string;
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

  const resultat: V2Sektioner = { intro: "", arbejdsomfang: "", kravOgOensker: "", praktiskeForhold: "" };

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
    V2_SEKTIONSMARKØRER.intro,
    sektioner.intro.trim(),
    "",
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

function SektionsOverskrift({ nr, label, badge }: { nr: number; label: string; badge?: string }) {
  return (
    <div className="pt-8 pb-3">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {nr}
        </span>
        <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">{label}</p>
        {badge && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e3a2a] bg-[#1e3a2a]/8 px-1.5 py-0.5 rounded">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function DataRække({ label, værdi }: { label: string; værdi: string }) {
  return (
    <div className="flex gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-500 w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{værdi}</span>
    </div>
  );
}

// Linjeopdeling til V2's narrative sektioner — ingen boilerplate at filtrere
// fra (dokumenthoved, dato, titel osv. renderes nu udelukkende af selve
// komponenten), kun tomme linjer fjernes.
const v2NarrativLinjer = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);

function V2NarrativLinje({ linje }: { linje: string }) {
  if (linje.startsWith("- ")) {
    return (
      <div className="flex items-start gap-3 py-1 pl-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a2a] flex-shrink-0 mt-2" />
        <span className="text-sm text-gray-700 leading-relaxed">{linje.slice(2).replace(/\s*—\s*/g, ", ")}</span>
      </div>
    );
  }
  return <p className="text-sm text-gray-700 leading-[1.8] py-0.5">{linje.replace(/\s*—\s*/g, ", ")}</p>;
}

export default function DokumentRenderer({
  tekst,
  titel,
  adresse,
  oprettetAt,
  bygherreNavn,
  bygherreKontakt,
  totalPris,
  startdato,
  slutdato,
  betalingsplan,
  forudsaetninger,
  tidsplan,
  vilkaar,
  haandvaerkerNavn,
  haandvaerkerFirma,
  erAftaleEndeligtGodkendt = false,
}: Props) {
  const erV2 = erV2Dokument(tekst);

  // V2-dokumenter viser altid deres autoritative oprettelsesdato, aldrig
  // "nu". Legacy-dokumenter bevarer uændret den hidtidige adfærd.
  const dato = erV2 && oprettetAt
    ? fmtDato(oprettetAt)
    : new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

  const v2 = erV2 ? parseV2Sektioner(tekst || "") : null;

  // ---- Legacy-parsing (uændret) — bruges kun når dokumentet IKKE er V2 ----
  const udledSektioner = (rå: string) => {
    const kravIdx = rå.indexOf("[KRAV OG ØNSKER]");
    const praktiskIdx = rå.indexOf("[PRAKTISKE FORHOLD]");
    const hoved = kravIdx !== -1 ? rå.slice(0, kravIdx) : (praktiskIdx !== -1 ? rå.slice(0, praktiskIdx) : rå);
    const krav = kravIdx !== -1
      ? (praktiskIdx !== -1 ? rå.slice(kravIdx + 16, praktiskIdx) : rå.slice(kravIdx + 16))
      : null;
    const praktisk = praktiskIdx !== -1 ? rå.slice(praktiskIdx + 19) : null;
    return { hoved, krav, praktisk };
  };

  const { hoved: hovedTekst, krav: kravTekst, praktisk: praktiskTekst } = erV2
    ? { hoved: "", krav: null, praktisk: null }
    : udledSektioner(tekst || "");

  const filtrerLinjer = (t: string) =>
    t.split("\n").filter(l => {
      const tr = l.trim();
      if (!tr) return false;
      if (/^NEMBYGGESTYRING$/i.test(tr)) return false;
      if (/^nembyggestyring\.dk$/i.test(tr)) return false;
      if (/UDBUDSDOKUMENT/i.test(tr)) return false;
      if (/^Dato$/i.test(tr)) return false;
      if (titel && tr === titel) return false;
      if (/^BYGHERRE$/i.test(tr)) return false;
      if (/^ENTREPREN[ØO]R$/i.test(tr)) return false;
      if (/^[-_*=]{3,}$/.test(tr)) return false;
      if (/^[-_]{5,}/.test(tr)) return false;
      if (/^\d+\.\s+[A-ZÆØÅ\s]+$/.test(tr)) return false;
      if (/^\d+\.$/.test(tr)) return false;
      return true;
    });

  const beskrivelsesLinjer = erV2 ? [] : filtrerLinjer(hovedTekst);
  const kravLinjer = !erV2 && kravTekst ? filtrerLinjer(kravTekst) : [];
  const praktiskLinjer = !erV2 && praktiskTekst ? filtrerLinjer(praktiskTekst) : [];

  const harKravSektion = erV2 ? !!v2?.kravOgOensker : kravLinjer.length > 0;
  const harPraktiskSektion = erV2 ? !!v2?.praktiskeForhold : praktiskLinjer.length > 0;
  const harPrisSektion = !!(totalPris || (betalingsplan && betalingsplan.length > 0));
  const harBetalingsplan = !!(betalingsplan && betalingsplan.length > 0);
  const harTidsplan = !!(startdato || slutdato || tidsplan);
  const harForudsaetninger = !!forudsaetninger?.trim();

  let sektionsNr = 1;

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">

      {/* Dokument-header */}
      <div className="px-10 pt-10 pb-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold text-[#1e3a2a] uppercase tracking-[0.15em] mb-1">Nembyggestyring</p>
            <p className="text-[10px] text-gray-400">nembyggestyring.dk</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 mb-0.5">Dato</p>
            <p className="text-xs font-semibold text-gray-600">{dato}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Aftalegrundlag</p>
          {titel && (
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{titel}</h1>
          )}
          {erV2 && adresse && (
            <p className="text-sm text-gray-500 mt-1">{adresse}</p>
          )}
        </div>

        <div className="mt-5 flex gap-8">
          {(bygherreNavn || bygherreKontakt) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">Bygherre</p>
              {bygherreNavn && <p className="text-sm font-semibold text-gray-800">{bygherreNavn}</p>}
              {bygherreKontakt && <p className="text-xs text-gray-500">{bygherreKontakt}</p>}
            </div>
          )}
          {(haandvaerkerNavn || haandvaerkerFirma) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">Entreprenør</p>
              {haandvaerkerFirma && <p className="text-sm font-semibold text-gray-800">{haandvaerkerFirma}</p>}
              {haandvaerkerNavn && <p className="text-xs text-gray-500">{haandvaerkerNavn}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Dokument-indhold */}
      <div className="px-10 py-8">

        {erV2 ? (
          <>
            {/* Projektopsummering — read-only, systemgenereret */}
            {v2!.intro && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Projektopsummering" badge="Ikke redigerbar" />
                <p className="text-sm text-gray-700 leading-[1.8]">{v2!.intro}</p>
              </div>
            )}

            {/* Arbejdsomfang */}
            {v2!.arbejdsomfang && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Arbejdsomfang" />
                <div className="space-y-0.5">
                  {v2NarrativLinjer(v2!.arbejdsomfang).map((linje, i) => <V2NarrativLinje key={i} linje={linje} />)}
                </div>
              </div>
            )}

            {/* Krav og ønsker */}
            {harKravSektion && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Krav og ønsker" />
                <div className="space-y-0.5">
                  {v2NarrativLinjer(v2!.kravOgOensker).map((linje, i) => <V2NarrativLinje key={i} linje={linje} />)}
                </div>
              </div>
            )}

            {/* Praktiske forhold */}
            {harPraktiskSektion && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Praktiske forhold" />
                <div className="space-y-0.5">
                  {v2NarrativLinjer(v2!.praktiskeForhold).map((linje, i) => <V2NarrativLinje key={i} linje={linje} />)}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 1. Projektbeskrivelse */}
            {beskrivelsesLinjer.length > 0 && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Projektbeskrivelse" />
                <div className="space-y-0.5">
                  {beskrivelsesLinjer.map((linje, i) => {
                    const trimmet = linje.trim();
                    // Nummererede overskrifter fra AI-dokument — f.eks. "1. PROJEKTBESKRIVELSE"
                    if (/^\d+\.\s+[A-ZÆØÅ]/.test(trimmet)) {
                      const tekst = trimmet.replace(/^\d+\.\s+/, "");
                      return (
                        <p key={i} className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-5 pb-1">
                          {tekst}
                        </p>
                      );
                    }
                    if (trimmet.startsWith("- ")) {
                      return (
                        <div key={i} className="flex items-start gap-3 py-1 pl-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a2a] flex-shrink-0 mt-2" />
                          <span className="text-sm text-gray-700 leading-relaxed">{trimmet.slice(2).replace(/\s*—\s*/g, ", ")}</span>
                        </div>
                      );
                    }
                    if (/^[A-ZÆØÅ][a-zæøåA-ZÆØÅ\s]+:\s+\S/.test(trimmet)) {
                      const kolon = trimmet.indexOf(":");
                      return (
                        <div key={i} className="flex gap-4 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-xs font-semibold text-gray-500 w-40 flex-shrink-0 pt-0.5">{trimmet.slice(0, kolon).trim()}</span>
                          <span className="text-sm text-gray-800 flex-1">{trimmet.slice(kolon + 1).trim().replace(/\s*—\s*/g, ", ")}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-sm text-gray-700 leading-[1.8] py-0.5">{trimmet.replace(/\s*—\s*/g, ", ")}</p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Krav og ønsker */}
            {harKravSektion && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Krav og ønsker" />
                <div className="space-y-0.5">
                  {kravLinjer.map((linje, i) => {
                    const trimmet = linje.trim();
                    if (trimmet.startsWith("- ")) {
                      return (
                        <div key={i} className="flex items-start gap-3 py-1 pl-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a2a] flex-shrink-0 mt-2" />
                          <span className="text-sm text-gray-700 leading-relaxed">{trimmet.slice(2).replace(/\s*—\s*/g, ", ")}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-sm text-gray-700 leading-[1.8] py-0.5">{trimmet.replace(/\s*—\s*/g, ", ")}</p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Praktiske forhold */}
            {harPraktiskSektion && (
              <div>
                <SektionsOverskrift nr={sektionsNr++} label="Praktiske forhold" />
                <div className="space-y-0.5">
                  {praktiskLinjer.map((linje, i) => {
                    const trimmet = linje.trim();
                    if (trimmet.startsWith("- ")) {
                      return (
                        <div key={i} className="flex items-start gap-3 py-1 pl-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a2a] flex-shrink-0 mt-2" />
                          <span className="text-sm text-gray-700 leading-relaxed">{trimmet.slice(2).replace(/\s*—\s*/g, ", ")}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-sm text-gray-700 leading-[1.8] py-0.5">{trimmet.replace(/\s*—\s*/g, ", ")}</p>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* 4. Entreprisesum og betalingsplan */}
        {harPrisSektion && (
          <div>
            <SektionsOverskrift nr={sektionsNr++} label="Entreprisesum og betalingsplan" />
            <div className="space-y-0">
              {totalPris ? (
                <DataRække
                  label={erAftaleEndeligtGodkendt ? "Aftalt pris (fast)" : "Pris fra entreprenør"}
                  værdi={`${fmtKr(totalPris)} inkl. moms`}
                />
              ) : (
                <p className="text-sm text-gray-400 italic">Entreprisesum er endnu ikke fastsat.</p>
              )}
              {harBetalingsplan ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {erAftaleEndeligtGodkendt ? "Aftalt betalingsplan" : "Foreslået betalingsplan"}
                  </p>
                  <div className="space-y-1.5">
                    {betalingsplan!.map((b, i) => {
                      const pct = parseFloat(b.andel);
                      const beloeb = totalPris && !isNaN(pct) ? fmtKr(totalPris * (pct / 100)) : null;
                      return (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-sm text-gray-700 flex-1">{b.milepæl}</span>
                          <span className="text-sm font-semibold text-gray-900">{b.andel} %</span>
                          {beloeb && <span className="text-xs text-gray-400 w-24 text-right">{beloeb}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {!erAftaleEndeligtGodkendt && (
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                      Den foreslåede betalingsplan indgår først i aftalen, når bygherre har godkendt det samlede aftalegrundlag.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Betalingsbetingelser</p>
                  <p className="text-sm text-gray-700 leading-[1.8]">
                    Betaling sker efter AB-Forbruger § 25, medmindre andet er aftalt. Betaling sker, når arbejdet er afleveret, og entreprenøren har fremsendt faktura. Fakturaen forfalder til betaling, når bygherre modtager fakturaen. Betaling anses for rettidig, når den sker senest 15 arbejdsdage efter forfaldsdagen. Ved uenighed om en faktura kan bygherre holde hele eller dele af betalingen tilbage, men skal betale den del af fakturaen, der er enighed om.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Tidsplan */}
        {harTidsplan && (
          <div>
            <SektionsOverskrift nr={sektionsNr++} label="Tidsplan" />
            <div className="space-y-0">
              {startdato && <DataRække label="Opstartsdato" værdi={fmtDato(startdato)} />}
              {slutdato && <DataRække label="Færdigmelding" værdi={fmtDato(slutdato)} />}
              {tidsplan?.type === "ingen_tidsplan" && (
                <p className="text-sm text-gray-600 py-1 leading-relaxed">
                  Parterne har aftalt at arbejdet udføres uden en faseopdelt tidsplan.
                  Dette udgør en eksplicit fravigelse af AB-Forbruger 2012 § 12.
                </p>
              )}
              {tidsplan?.type === "faser" && tidsplan.faser && tidsplan.faser.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Arbejdsfaser</p>
                  <div className="space-y-1.5">
                    {tidsplan.faser.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="w-5 h-5 rounded-full bg-[#1e3a2a]/10 text-[#1e3a2a] text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-gray-700 flex-1">{f.navn}</span>
                        <span className="text-xs text-gray-500">
                          {f.startdato && fmtDato(f.startdato)}
                          {f.startdato && f.slutdato && " – "}
                          {f.slutdato && fmtDato(f.slutdato)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Tidsfristerne i tidsplanen er bindende i henhold til AB-Forbruger 2012 § 12.
                Overskridelse kan udløse krav om erstatning.
              </p>
            </div>
          </div>
        )}

        {/* 4. Forudsætninger */}
        {harForudsaetninger && (
          <div>
            <SektionsOverskrift nr={sektionsNr++} label="Forudsætninger og krav til projektet" />
            <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
              <p className="text-sm text-gray-700 leading-[1.8] whitespace-pre-wrap">{forudsaetninger}</p>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Ovenstående forudsætninger er fremsat af entreprenøren og accepteret af bygherre som vilkår for arbejdets udførelse.
            </p>
          </div>
        )}

        {/* 5. Vilkår */}
        <div>
          <SektionsOverskrift nr={sektionsNr++} label="Aftalevilkår" />
          <p className="text-sm text-gray-700 leading-[1.8]">
            {vilkaar || "AB-Forbruger 2012 indgår som fast del af aftalegrundlaget. Det betyder, at aftalegrundlaget tager udgangspunkt i regler om blandt andet ekstraarbejde (§ 23), betaling (§ 25 og § 37) og aflevering (§ 38)."}
          </p>
        </div>

      </div>

      {/* Dokument-footer */}
      <div className="px-10 py-6 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400">Genereret via nembyggestyring.dk</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1e3a2a]" />
            <p className="text-[10px] font-semibold text-gray-500">AB-Forbruger 2012</p>
          </div>
        </div>
      </div>
    </div>
  );
}
