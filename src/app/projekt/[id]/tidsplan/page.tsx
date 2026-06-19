"use client";

import { use, useState } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

// Mar 12 → Sep 30 2025 = 202 days total
const TOTAL = 202;
const TODAY = 99; // June 19

const MONTHS = [
  { label: "Mar", day: 0 },
  { label: "Apr", day: 20 },
  { label: "Maj", day: 50 },
  { label: "Jun", day: 81 },
  { label: "Jul", day: 111 },
  { label: "Aug", day: 142 },
  { label: "Sep", day: 173 },
];

type Status = "done" | "active" | "forsinket" | "upcoming";

interface Opgave {
  id: string;
  label: string;
  ansvarlig: string;
  farve: string;
  fillDone: string;
  fillActive: string;
  fillUpcoming: string;
  start: number;
  end: number;
  planEnd?: number;
  status: Status;
  note: string;
  afhængerAf: string[];
}

const OPGAVER: Opgave[] = [
  {
    id: "nedrivning",
    label: "Nedrivning",
    ansvarlig: "TM Byg ApS",
    farve: "#64748b",
    fillDone: "#cbd5e1",
    fillActive: "#94a3b8",
    fillUpcoming: "#f1f5f9",
    start: 0, end: 16, status: "done",
    note: "Eksisterende installationer og overflader fjernes inden nye materialer monteres.",
    afhængerAf: [],
  },
  {
    id: "el",
    label: "El-installationer",
    ansvarlig: "EL-firma ApS",
    farve: "#b45309",
    fillDone: "#fcd34d",
    fillActive: "#f59e0b",
    fillUpcoming: "#fef3c7",
    start: 16, end: 37, status: "done",
    note: "Rå-el, dåser og rørføring lægges inden gipsvæggene lukkes. Løber parallelt med VVS.",
    afhængerAf: ["nedrivning"],
  },
  {
    id: "vvs",
    label: "VVS-installationer",
    ansvarlig: "VVS-firma ApS",
    farve: "#0369a1",
    fillDone: "#7dd3fc",
    fillActive: "#38bdf8",
    fillUpcoming: "#e0f2fe",
    start: 16, end: 37, status: "done",
    note: "Vandrør og afløb klargøres parallelt med el-arbejdet inden gips lukkes.",
    afhængerAf: ["nedrivning"],
  },
  {
    id: "gips",
    label: "Gipsvægge",
    ansvarlig: "TM Byg ApS",
    farve: "#6d28d9",
    fillDone: "#c4b5fd",
    fillActive: "#a78bfa",
    fillUpcoming: "#ede9fe",
    start: 37, end: 49, status: "done",
    note: "Kan kun starte når el-dåser og VVS-rør er monterede. Spartles og tørrer inden maling.",
    afhængerAf: ["el", "vvs"],
  },
  {
    id: "maler",
    label: "Malerarbejde",
    ansvarlig: "TM Byg ApS",
    farve: "#15803d",
    fillDone: "#86efac",
    fillActive: "#4ade80",
    fillUpcoming: "#dcfce7",
    start: 49, end: 99, planEnd: 95, status: "forsinket",
    note: "Forsinket 4 dage pga. ekstra el-dåser i stuen (aftaleseddel #3). Kræver tørre gipsvægge.",
    afhængerAf: ["gips"],
  },
  {
    id: "gulv",
    label: "Gulvlægning",
    ansvarlig: "Gulvfirma ApS",
    farve: "#c2410c",
    fillDone: "#fb923c",
    fillActive: "#f97316",
    fillUpcoming: "#ffedd5",
    start: 99, end: 125, status: "upcoming",
    note: "Lægges efter maling — undgår ridser og malingsstænk. Rykket 4 dage pga. malerforsinkelse.",
    afhængerAf: ["maler"],
  },
];

const LABEL_W = 22; // % of row for labels
const pct = (day: number) => `${(day / TOTAL) * 100}%`;
const barLeft = (day: number) => `${(day / TOTAL) * 100}%`;
const barW = (days: number) => `${Math.max((days / TOTAL) * 100, 7)}%`; // min 7% so short tasks look like pills not circles

export default function Tidsplan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selected, setSelected] = useState<string | null>(null);
  const [depVis, setDepVis] = useState(false);

  const selectedOpgave = OPGAVER.find(o => o.id === selected);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tidsplan</h1>
            <p className="text-sm text-gray-400 mt-1">12. mar – 30. sep 2025 · Indvendig renovering – Valby</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Maler 4 dage forsinket
            </span>
            <button className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tilføj opgave
            </button>
          </div>
        </div>

        {/* Gantt chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">

          {/* Chart grid + rows */}
          <div className="relative">

            {/* Month tick marks */}
            <div className="absolute inset-0 pointer-events-none" style={{ left: `${LABEL_W}%` }}>
              {MONTHS.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 bottom-0 w-px bg-gray-100"
                  style={{ left: pct(m.day) }}
                />
              ))}
              {/* Today */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400"
                style={{ left: pct(TODAY) }}
              />
            </div>

            {/* Month label row */}
            <div className="flex items-center border-b border-gray-100 h-9">
              <div className="shrink-0 px-5" style={{ width: `${LABEL_W}%` }}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faggruppe</span>
              </div>
              <div className="flex-1 relative h-full">
                {MONTHS.map((m, i) => {
                  const nextDay = MONTHS[i + 1]?.day ?? TOTAL;
                  return (
                    <div
                      key={m.label}
                      className="absolute top-0 bottom-0 flex items-center"
                      style={{ left: pct(m.day), width: pct(nextDay - m.day) }}
                    >
                      <span className="text-[11px] font-semibold text-gray-400 pl-2">{m.label}</span>
                    </div>
                  );
                })}
                {/* Today chip */}
                <div
                  className="absolute top-0 bottom-0 flex items-center"
                  style={{ left: pct(TODAY), transform: "translateX(-50%)" }}
                >
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">I dag</span>
                </div>
              </div>
            </div>

            {/* Task rows */}
            {OPGAVER.map((o, i) => {
              const isSelected = selected === o.id;
              const barFill =
                o.status === "done" ? o.fillDone :
                o.status === "active" || o.status === "forsinket" ? o.fillActive :
                o.fillUpcoming;

              return (
                <div
                  key={o.id}
                  onClick={() => setSelected(isSelected ? null : o.id)}
                  className={`flex items-center border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors duration-100 ${isSelected ? "bg-blue-50/30" : i % 2 === 1 ? "bg-gray-50/50 hover:bg-gray-100/50" : "hover:bg-gray-50/60"}`}
                  style={{ height: 68 }}
                >
                  {/* Label */}
                  <div className="shrink-0 flex items-center gap-3 px-5" style={{ width: `${LABEL_W}%` }}>
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: o.status === "upcoming" ? o.fillUpcoming : barFill, border: `2px solid ${o.farve}`, opacity: o.status === "upcoming" ? 1 : 1 }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{o.label}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{o.ansvarlig}</p>
                    </div>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative" style={{ height: 68 }}>

                    {/* Plan-end marker (forsinket) */}
                    {o.planEnd && (
                      <div
                        className="absolute top-3 bottom-3 w-0.5 border-l-2 border-dashed border-amber-400 z-10"
                        style={{ left: pct(o.planEnd) }}
                      />
                    )}

                    {/* Bar */}
                    <div
                      className="absolute rounded-full transition-all duration-150"
                      style={{
                        left: barLeft(o.start),
                        width: barW(o.end - o.start),
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: 30,
                        backgroundColor: o.status === "upcoming" ? o.fillUpcoming : barFill,
                        border: `1.5px solid ${o.farve}50`,
                        boxShadow: isSelected ? `0 0 0 2.5px ${o.farve}40` : undefined,
                      }}
                    >
                      <div className="flex items-center h-full px-3 gap-2">
                        {/* Status icon */}
                        {o.status === "done" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={o.farve} strokeWidth="3" className="shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {o.status === "forsinket" && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={o.farve} strokeWidth="2.5" className="shrink-0">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        )}
                        {o.status === "active" && (
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.farve }} />
                        )}

                        {/* Forsinket badge */}
                        {o.status === "forsinket" && (
                          <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: o.farve }}>
                            +4 dage
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dependency start dot */}
                    {o.afhængerAf.length > 0 && (
                      <div
                        className="absolute w-2 h-2 rounded-full border-2 border-white z-20"
                        style={{
                          left: pct(o.start),
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: o.farve,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Aflevering milestone row */}
            <div
              className="flex items-center border-t border-gray-50"
              style={{ height: 52 }}
            >
              <div className="shrink-0 flex items-center gap-3 px-5" style={{ width: `${LABEL_W}%` }}>
                <div className="w-3 h-3 rounded-sm bg-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Aflevering</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Begge parter</p>
                </div>
              </div>
              <div className="flex-1 relative" style={{ height: 52 }}>
                <div
                  className="absolute flex items-center gap-1.5"
                  style={{ right: 16, top: "50%", transform: "translateY(-50%)" }}
                >
                  <span className="text-[10px] font-bold text-primary whitespace-nowrap">30. sep</span>
                  <div className="w-4 h-4 bg-primary rotate-45 shadow-md shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected task detail strip */}
        {selectedOpgave && (
          <div
            className="rounded-2xl border p-4 mb-5 transition-all"
            style={{
              backgroundColor: selectedOpgave.fillUpcoming,
              borderColor: `${selectedOpgave.farve}30`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: selectedOpgave.fillDone }}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedOpgave.farve }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900">{selectedOpgave.label}</p>
                    <span className="text-[10px] font-semibold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">{selectedOpgave.ansvarlig}</span>
                    {selectedOpgave.status === "done" && <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Afsluttet</span>}
                    {selectedOpgave.status === "forsinket" && <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Forsinket 4 dage</span>}
                    {selectedOpgave.status === "upcoming" && <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Kommende</span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-lg">{selectedOpgave.note}</p>
                  {selectedOpgave.afhængerAf.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-2">
                      <span className="font-semibold">Afhænger af:</span>{" "}
                      {selectedOpgave.afhængerAf.map(d => OPGAVER.find(o => o.id === d)?.label).join(" + ")}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Legend + forsinkelse note inline */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {[
              { farve: "#64748b", label: "Murer/tømrer" },
              { farve: "#b45309", label: "Elektriker" },
              { farve: "#0369a1", label: "VVS" },
              { farve: "#6d28d9", label: "Gipsmontør" },
              { farve: "#15803d", label: "Maler" },
              { farve: "#c2410c", label: "Gulvlægger" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.farve }} />
                <span className="text-[11px] text-gray-500">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200">
              <div className="w-4 h-0 border-t-2 border-dashed border-amber-400" />
              <span className="text-[11px] text-gray-500">Planlagt slutdato</span>
            </div>
          </div>
          <button
            onClick={() => setDepVis(!depVis)}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Afhængigheder
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${depVis ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Dependency panel (collapsible) */}
        {depVis && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Arbejdsafhængigheder</p>
            <div className="space-y-3">
              {[
                { fra: ["Nedrivning"], til: "El + VVS (parallelt)", note: "El og VVS kan begge starte med det samme når nedrivning er færdig" },
                { fra: ["El", "VVS"], til: "Gipsvægge", note: "Gipsvæggene lukkes når el-dåser og VVS-rør er sat — begge skal være færdige" },
                { fra: ["Gipsvægge"], til: "Malerarbejde", note: "Malerens grundering og maling kræver tørre, spartlede vægge" },
                { fra: ["Malerarbejde"], til: "Gulvlægning", note: "Gulvet lægges sidst for at undgå ridser og maling på belægningen" },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="flex items-center gap-1 shrink-0 mt-0.5 flex-wrap">
                    {d.fra.map(f => (
                      <span key={f} className="bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-md">{f}</span>
                    ))}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="shrink-0 mt-0.5"><polyline points="9 18 15 12 9 6"/></svg>
                  <div>
                    <span className="bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-md">{d.til}</span>
                    <p className="text-gray-400 mt-1 leading-relaxed">{d.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forsinkelse box — compact */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900 mb-2">Forsinkelse — domino-effekt</p>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="bg-white border border-amber-200 text-amber-800 font-medium px-2.5 py-1 rounded-lg">Ekstra el-dåser tilføjet</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="bg-white border border-amber-200 text-amber-800 font-medium px-2.5 py-1 rounded-lg">Maler +4 dage</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="bg-white border border-amber-200 text-amber-800 font-medium px-2.5 py-1 rounded-lg">Gulv rykket 4 dage</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="bg-green-50 border border-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-lg">Aflevering 30. sep uændret ✓</span>
            </div>
          </div>
        </div>

        {/* AB tips */}
        <div className="space-y-3">
          <ABTip
            paragraf="AB-Forbruger § 28 & § 36"
            titel="Forsinkelse — hvornår er håndværkeren ansvarlig?"
            resumé="Der foreligger forsinkelse, hvis arbejdet ikke er udført inden aftalt tid, og håndværkeren ikke har ret til tidsfristforlængelse (fx force majeure eller dine egne forhold)."
            detaljer="Anser håndværkeren sig berettiget til tidsfristforlængelse, skal han snarest muligt underrette dig herom og på forlangende dokumentere, at forsinkelsen skyldes det påberåbte forhold (§ 36, stk. 2)."
            type="advarsel"
          />
          <ABTip
            paragraf="AB-Forbruger § 31"
            titel="Dagbod og erstatning ved ansvarspådragende forsinkelse"
            resumé="Er dagbod aftalt, kan du kræve dagbod. Er dagbod ikke aftalt, er du berettiget til erstatning efter dansk rets almindelige regler."
            detaljer="Dagbodsklausuler skal aftales skriftligt i kontrakten. Tjek din kontrakt for om dagbod er aftalt og til hvilken sats."
            type="vigtig"
          />
        </div>
      </div>
    </div>
  );
}
