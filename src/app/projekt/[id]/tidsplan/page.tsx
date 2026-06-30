"use client";

import { use, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

const TOTAL = 202;
const TODAY_DAY = 99;
const START_DATE = (() => { const d = new Date(); d.setDate(d.getDate() - TODAY_DAY); return d; })();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmtDato = (d: Date) => d.toLocaleDateString("da-DK", { day: "numeric", month: "long" });
const fmtKort = (d: Date) => d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });

interface Fase {
  id: string;
  label: string;
  ansvarlig: string;
  startDag: number;
  slutDag: number;
  status: "done" | "aktiv" | "forsinket" | "kommende";
  forsinkelseDage?: number;
  hvadSker: string;
  hvadBetyder: string;
  farve: string;
  emoji: string;
}

const FASER: Fase[] = [
  {
    id: "nedrivning",
    label: "Nedrivning",
    ansvarlig: "TM Byg ApS",
    startDag: 0, slutDag: 16,
    status: "done",
    emoji: "🔨",
    farve: "gray",
    hvadSker: "Eksisterende fliser, toilet og installationer fjernes.",
    hvadBetyder: "Badeværelset er nu tomt og klar til det nye arbejde.",
  },
  {
    id: "el",
    label: "El & VVS",
    ansvarlig: "EL-firma + VVS-firma",
    startDag: 16, slutDag: 37,
    status: "done",
    emoji: "⚡",
    farve: "yellow",
    hvadSker: "Elkabler og vandrør lægges inde i væggene — inden de lukkes.",
    hvadBetyder: "Når dette er gjort, kan I ikke se installationerne, men de er der. Kræver godkendelse inden vægge lukkes.",
  },
  {
    id: "gips",
    label: "Gipsvægge",
    ansvarlig: "TM Byg ApS",
    startDag: 37, slutDag: 49,
    status: "done",
    emoji: "🧱",
    farve: "purple",
    hvadSker: "Væggene lukkes, spartles og tørrer.",
    hvadBetyder: "Badeværelset begynder at tage form. Vægge skal tørre fuldstændigt inden maling.",
  },
  {
    id: "maler",
    label: "Malerarbejde",
    ansvarlig: "TM Byg ApS",
    startDag: 49, slutDag: 99,
    status: "forsinket",
    forsinkelseDage: 4,
    emoji: "🖌️",
    farve: "green",
    hvadSker: "Grundering og maling af vægge og loft.",
    hvadBetyder: "Forsinkelsen skyldes ekstra el-dåser der blev tilføjet. Gulvlæggeren er varslet og starter 4 dage senere.",
  },
  {
    id: "gulv",
    label: "Gulvlægning",
    ansvarlig: "Gulvfirma ApS",
    startDag: 103, slutDag: 125,
    status: "kommende",
    emoji: "🪵",
    farve: "orange",
    hvadSker: "Gulvbelægning monteres — altid efter maling for at undgå ridser.",
    hvadBetyder: "Når gulvet er lagt, er det store arbejde overstået. Kun eftermontering tilbage.",
  },
  {
    id: "aflevering",
    label: "Aflevering",
    ansvarlig: "Begge parter",
    startDag: 195, slutDag: 202,
    status: "kommende",
    emoji: "🏁",
    farve: "primary",
    hvadSker: "Gennemgang af alt arbejde med håndværkeren. Eventuelle mangler noteres.",
    hvadBetyder: "Du overtager badeværelset. Herefter begynder 5-årsgarantien på skjulte fejl.",
  },
];

const FARVER: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  gray:    { bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-200",   dot: "bg-gray-400" },
  yellow:  { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-100",  dot: "bg-amber-400" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-100", dot: "bg-purple-400" },
  green:   { bg: "bg-green-50",   text: "text-green-700",  border: "border-green-100",  dot: "bg-green-500" },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-100", dot: "bg-orange-400" },
  primary: { bg: "bg-primary/5",  text: "text-primary",    border: "border-primary/20", dot: "bg-primary" },
};

function StatusBadge({ status, dage }: { status: Fase["status"]; dage?: number }) {
  if (status === "done") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      Afsluttet
    </span>
  );
  if (status === "forsinket") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {dage ? `+${dage} dage forsinket` : "Forsinket"}
    </span>
  );
  if (status === "aktiv") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      I gang nu
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
      Kommer
    </span>
  );
}

export default function Tidsplan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [åben, setÅben] = useState<string | null>(null);

  const fremskridt = Math.round((TODAY_DAY / TOTAL) * 100);
  const afleveringsDato = addDays(START_DATE, TOTAL);
  const dagetilbage = TOTAL - TODAY_DAY;

  const næsteFase = FASER.find(f => f.status === "kommende" || f.status === "aktiv" || f.status === "forsinket");
  const erForsinket = FASER.some(f => f.status === "forsinket");

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Overblik-kort */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Projektstatus</p>
              <h1 className="text-2xl font-bold text-gray-900">Dag {TODAY_DAY} af {TOTAL}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Aflevering planlagt <span className="font-semibold text-gray-700">{fmtDato(afleveringsDato)}</span> — om {dagetilbage} dage
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{fremskridt}%</p>
              <p className="text-xs text-gray-400">gennemført</p>
            </div>
          </div>

          {/* Fremskridtsbjælke */}
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${fremskridt}%` }}
            />
            {erForsinket && (
              <div
                className="absolute top-0 h-full w-1 bg-amber-400"
                style={{ left: `${Math.round(((TODAY_DAY - 4) / TOTAL) * 100)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{fmtKort(START_DATE)}</span>
            <span className="text-red-500 font-semibold">↑ I dag</span>
            <span>{fmtKort(afleveringsDato)}</span>
          </div>

          {/* Advarsel forsinkelse */}
          {erForsinket && (
            <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">Malerrunden er 4 dage forsinket</span> — gulvlæggeren starter tilsvarende 4 dage senere. Afleveringen er endnu ikke påvirket.
              </p>
            </div>
          )}
        </div>

        {/* Næste skridt */}
        {næsteFase && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Næste op</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{næsteFase.emoji}</span>
              <div>
                <p className="font-semibold text-gray-900">{næsteFase.label}</p>
                <p className="text-sm text-gray-500">
                  {næsteFase.ansvarlig} · starter {fmtKort(addDays(START_DATE, næsteFase.startDag))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Faser */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Alle faser</h2>
          <div className="space-y-2">
            {FASER.map((fase, i) => {
              const f = FARVER[fase.farve];
              const erÅben = åben === fase.id;
              const erAktuelFase = fase.status === "aktiv" || fase.status === "forsinket";

              return (
                <div
                  key={fase.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${erAktuelFase ? "border-primary/30 ring-1 ring-primary/10" : "border-gray-100"}`}
                >
                  <button
                    onClick={() => setÅben(erÅben ? null : fase.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    {/* Linje-indikator */}
                    <div className="flex flex-col items-center self-stretch shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${fase.status === "done" ? "bg-green-100" : fase.status === "forsinket" ? "bg-amber-100" : fase.status === "aktiv" ? "bg-blue-100" : "bg-gray-100"}`}>
                        {fase.status === "done" ? "✓" : fase.emoji}
                      </div>
                      {i < FASER.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-1 ${fase.status === "done" ? "bg-green-200" : "bg-gray-100"}`} style={{ minHeight: 16 }} />
                      )}
                    </div>

                    {/* Tekst */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`text-sm font-semibold ${fase.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {fase.label}
                        </p>
                        <StatusBadge status={fase.status} dage={fase.forsinkelseDage} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {fmtKort(addDays(START_DATE, fase.startDag))} – {fmtKort(addDays(START_DATE, fase.slutDag))} · {fase.ansvarlig}
                      </p>
                    </div>

                    {/* Chevron */}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className={`text-gray-300 shrink-0 transition-transform ${erÅben ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {erÅben && (
                    <div className={`px-4 pb-4 pt-1 border-t border-gray-50 ${f.bg}`}>
                      <div className="space-y-3 pt-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Hvad sker der?</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{fase.hvadSker}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Hvad betyder det for dig?</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{fase.hvadBetyder}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AB-tips */}
        <div className="space-y-3">
          <ABTip
            paragraf="AB-Forbruger § 38"
            titel="Husk afleveringsforretning"
            resumé="Inden du overtager det færdige arbejde, har du ret til en formel gennemgang med håndværkeren. Mangler noteres skriftligt."
            detaljer="Aflevering anses for sket, når håndværkeren meddeler, at arbejdet er klar, og der afholdes afleveringsforretning — eller du tager arbejdet i brug. Kræv altid en skriftlig afleveringsprotokol."
            type="god-ide"
          />
        </div>
      </div>
    </div>
  );
}
