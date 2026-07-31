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
}

const fmtKr = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n);

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

function SektionsOverskrift({ nr, label }: { nr: number; label: string }) {
  return (
    <div className="pt-8 pb-3">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {nr}
        </span>
        <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">{label}</p>
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

export default function DokumentRenderer({
  tekst,
  titel,
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
}: Props) {
  const dato = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });

  // Udled sektioner fra rå tekst via markører sat af udbud-flow
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

  const { hoved: hovedTekst, krav: kravTekst, praktisk: praktiskTekst } = udledSektioner(tekst || "");

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

  const beskrivelsesLinjer = filtrerLinjer(hovedTekst);
  const kravLinjer = kravTekst ? filtrerLinjer(kravTekst) : [];
  const praktiskLinjer = praktiskTekst ? filtrerLinjer(praktiskTekst) : [];

  const harKravSektion = kravLinjer.length > 0;
  const harPraktiskSektion = praktiskLinjer.length > 0;
  const harPrisSektion = !!(totalPris || (betalingsplan && betalingsplan.length > 0));
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

        {/* 4. Entreprisesum og betalingsplan */}
        {harPrisSektion && (
          <div>
            <SektionsOverskrift nr={sektionsNr++} label="Entreprisesum og betalingsplan" />
            <div className="space-y-0">
              {totalPris ? (
                <DataRække label="Aftalt pris (fast)" værdi={`${fmtKr(totalPris)} inkl. moms`} />
              ) : (
                <p className="text-sm text-gray-400 italic">Entreprisesum er endnu ikke fastsat.</p>
              )}
              {betalingsplan && betalingsplan.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Betalingsplan</p>
                  <div className="space-y-1.5">
                    {betalingsplan.map((b, i) => {
                      const pct = parseFloat(b.andel);
                      const beloeb = totalPris && !isNaN(pct) ? fmtKr(totalPris * (pct / 100)) : null;
                      return (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-sm text-gray-700 flex-1">{b.milepæl}</span>
                          <span className="text-sm font-semibold text-gray-900">{b.andel}</span>
                          {beloeb && <span className="text-xs text-gray-400 w-24 text-right">{beloeb}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    Betaling frigives mod dokumenteret fremdrift i henhold til AB-Forbruger 2012 § 25 og § 37.
                    Bygherre er ikke forpligtet til at betale en rate, før den tilhørende milepæl er nået og godkendt.
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
          <SektionsOverskrift nr={sektionsNr++} label="Juridiske vilkår" />
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
