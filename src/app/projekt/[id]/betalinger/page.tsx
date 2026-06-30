import { use } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";

const betalinger = [
  { navn: "Opstart og nedrivning", andel: "20%", beløb: "22.500 kr.", forfald: "12. mar. 2025", betalt: "14. mar. 2025", status: "betalt" },
  { navn: "Gipsvægge og installationer", andel: "25%", beløb: "28.125 kr.", forfald: "30. apr. 2025", betalt: "2. maj 2025", status: "betalt" },
  { navn: "Malerarbejde afsluttet", andel: "25%", beløb: "28.125 kr.", forfald: "15. jun. 2025", betalt: null, status: "afventer" },
  { navn: "Endelig aflevering", andel: "30%", beløb: "33.750 kr.", forfald: "30. sep. 2025", betalt: null, status: "kommende" },
];

export default function Betalinger({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const betalt = 50625;
  const tilbage = 61875;
  const total = 112500;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Økonomi</h1>
          <p className="text-sm text-gray-400 mt-1">Indvendig renovering - Valby</p>
        </div>

        {/* Overblik */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Entreprisesum", value: "112.500 kr.", sub: "Fast pris inkl. moms", color: "text-gray-900" },
            { label: "Betalt til dato", value: "50.625 kr.", sub: "2 rater betalt", color: "text-green-600" },
            { label: "Tilbage at betale", value: "61.875 kr.", sub: "2 rater mangler", color: "text-gray-900" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Fremgangsbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Betalt</span>
            <span className="font-bold text-primary">{Math.round((betalt / total) * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(betalt / total) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>50.625 kr. betalt</span>
            <span>61.875 kr. tilbage</span>
          </div>
        </div>

        {/* Betalinger */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Betalingsrater</h2>
          <div className="space-y-3">
            {betalinger.map((b, i) => (
              <div key={i} className={`rounded-xl border p-4 ${b.status === "afventer" ? "border-amber-200 bg-amber-50/50" : "border-gray-100"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      b.status === "betalt" ? "bg-green-100" :
                      b.status === "afventer" ? "bg-amber-100" : "bg-gray-100"
                    }`}>
                      {b.status === "betalt" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : b.status === "afventer" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{b.navn}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {b.status === "betalt" ? `Betalt ${b.betalt}` : `Forfald ${b.forfald}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{b.beløb}</p>
                    <p className="text-xs text-gray-400">{b.andel} af total</p>
                  </div>
                </div>
                {b.status === "afventer" && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                      Godkend og betal
                    </button>
                    <button className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      Se grundlag
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <ABTip
            paragraf="AB-Forbruger § 25"
            titel="Betaling forfalder når du modtager fakturaen"
            resumé="En faktura forfalder til betaling, når du modtager den. Betaling er rettidig, når den sker senest 15 arbejdsdage efter forfaldsdagen. Ved løbende rater gælder de samme regler."
            detaljer="Betaler du ikke til tiden, kan håndværkeren kræve renter fra forfaldsdagen (§ 25, stk. 4) og efter 5 arbejdsdages skriftligt varsel standse arbejdet (§ 27)."
            type="info"
          />
          <ABTip
            paragraf="AB-Forbruger § 25, stk. 3"
            titel="Du kan tilbageholde ved uenighed om faktura"
            resumé="Er du uenig i en faktura, kan du holde hele eller dele af betalingen tilbage - men du skal betale den del, der er enighed om."
            detaljer="Tilbageholdelsen skal stå i rimeligt forhold til uenigheden eller manglen. Dokumentér altid årsagen skriftligt på platformen, så din tilbageholdelse er juridisk holdbar."
            type="advarsel"
          />
        </div>
      </div>
    </div>
  );
}
