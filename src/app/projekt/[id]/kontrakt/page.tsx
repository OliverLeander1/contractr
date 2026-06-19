import { use } from "react";
import ProjektNav from "@/components/ProjektNav";
import Link from "next/link";

const projekter: Record<string, {
  bygherre: string; adresse: string; cpr: string;
  entreprenør: string; cvr: string; entreprAdresse: string;
  omfang: string; entreprisesum: string; startdato: string; slutdato: string;
  betalingsplan: { milepæl: string; andel: string; beløb: string; forfald: string; status: string }[];
  underskrevet: boolean; bygherre_dato?: string; entreprenør_dato?: string;
}> = {
  "1": {
    bygherre: "Camilla Jensen",
    adresse: "Valby Langgade 85, 2500 Valby",
    cpr: "xxxxxx-xxxx",
    entreprenør: "Thomas Madsen / TM Byg ApS",
    cvr: "12 34 56 78",
    entreprAdresse: "Toftevej 4, 2600 Glostrup",
    omfang: "Indvendig renovering inkl. opsætning af gipsvægge, malerarbejde i alle rum samt lettere el-arbejde. Arbejdet udføres på adressen Valby Langgade 85, 2500 Valby.",
    entreprisesum: "112.500",
    startdato: "12. marts 2025",
    slutdato: "30. september 2025",
    betalingsplan: [
      { milepæl: "Opstart og nedrivning", andel: "20%", beløb: "22.500 kr.", forfald: "12. mar. 2025", status: "betalt" },
      { milepæl: "Gipsvægge og installationer", andel: "25%", beløb: "28.125 kr.", forfald: "30. apr. 2025", status: "betalt" },
      { milepæl: "Malerarbejde afsluttet", andel: "25%", beløb: "28.125 kr.", forfald: "15. jun. 2025", status: "afventer" },
      { milepæl: "Endelig aflevering", andel: "30%", beløb: "33.750 kr.", forfald: "30. sep. 2025", status: "kommende" },
    ],
    underskrevet: true,
    bygherre_dato: "12. mar. 2025 kl. 14:22",
    entreprenør_dato: "12. mar. 2025 kl. 16:05",
  },
};

export default function Kontrakt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projekt = projekter[id] ?? projekter["1"];

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kontrakt</h1>
            <p className="text-sm text-gray-400 mt-1">Genereret på baggrund af AB-Forbruger 2012 · {projekt.startdato}</p>
          </div>
          <div className="flex items-center gap-2">
            {projekt.underskrevet && (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Underskrevet af begge parter
              </span>
            )}
            <button className="flex items-center gap-2 text-sm font-medium border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* AB-Forbruger info */}
        <div className="bg-accent border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded flex-shrink-0">AB-Forbruger 2012</span>
          <p className="text-sm text-primary leading-relaxed">Denne kontrakt er baseret på AB-Forbruger standardbetingelserne, som giver dig som forbruger den bedste beskyttelse ved private byggesager over 3.000 kr. jf. § 1.</p>
        </div>

        {/* Selve kontraktteksten */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6 font-serif">

          <div className="text-center mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Entreprisekontrakt</p>
            <h2 className="text-xl font-bold text-gray-900">Aftale om byggearbejde</h2>
            <p className="text-sm text-gray-500 mt-1">Baseret på AB-Forbruger (Almindelige betingelser for aftaler om byggearbejder for forbrugere, 2012)</p>
          </div>

          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

            {/* § 1 Parterne */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 1 — Parterne</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Bygherre (forbruger)</p>
                  <p className="font-semibold text-gray-900">{projekt.bygherre}</p>
                  <p className="text-gray-500">{projekt.adresse}</p>
                  <p className="text-gray-400 text-xs mt-1">CPR: {projekt.cpr}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Entreprenør</p>
                  <p className="font-semibold text-gray-900">{projekt.entreprenør}</p>
                  <p className="text-gray-500">{projekt.entreprAdresse}</p>
                  <p className="text-gray-400 text-xs mt-1">CVR: {projekt.cvr}</p>
                </div>
              </div>
            </div>

            {/* § 2 Arbejdets omfang */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 2 — Arbejdets omfang</h3>
              <p>{projekt.omfang}</p>
              <p className="mt-3 text-gray-500">Arbejdet udføres fagmæssigt korrekt og i overensstemmelse med gældende bygningsreglement. Materialer skal være af sædvanlig god kvalitet, medmindre andet er angivet jf. AB-Forbruger § 15.</p>
            </div>

            {/* § 3 Pris */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 3 — Pris</h3>
              <p>Entreprisesummen er aftalt til <strong className="text-gray-900">{projekt.entreprisesum} kr. inkl. moms</strong> (fast pris). Ændringer i arbejdets art og omfang aftales skriftligt og prissættes på forhånd jf. AB-Forbruger § 23.</p>
              <p className="mt-3 text-gray-500">Overstiger prisen det aftalte overslag med mere end 15%, indhentes forbrugerens stillingtagen til arbejdets fortsættelse, inden arbejdet fortsættes jf. AB-Forbruger § 24, stk. 2.</p>
            </div>

            {/* § 4 Tidsplan */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 4 — Tidsplan</h3>
              <p>Arbejdet påbegyndes <strong className="text-gray-900">{projekt.startdato}</strong> og afsluttes senest <strong className="text-gray-900">{projekt.slutdato}</strong>.</p>
              <p className="mt-3 text-gray-500">Forsinkelse der ikke skyldes forhold beskrevet i AB-Forbruger § 29 (herunder force majeure, vejrlig eller forbrugerens egne forhold) er ansvarspådragende for entreprenøren jf. § 30. Parterne skal søge at undgå og begrænse forsinkelser jf. § 36.</p>
            </div>

            {/* § 5 Betaling */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 5 — Betalingsplan</h3>
              <p className="mb-4">Betaling sker løbende i rater koblet til nedenstående milepæle jf. AB-Forbruger § 26. Faktura forfalder til betaling ved modtagelse og er rettidig senest 15 arbejdsdage efter forfaldsdagen jf. § 25, stk. 2.</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 font-semibold text-gray-500 font-sans">Milepæl</th>
                    <th className="pb-2 font-semibold text-gray-500 font-sans">Andel</th>
                    <th className="pb-2 font-semibold text-gray-500 font-sans">Beløb</th>
                    <th className="pb-2 font-semibold text-gray-500 font-sans">Forfald</th>
                    <th className="pb-2 font-semibold text-gray-500 font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projekt.betalingsplan.map((b, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 text-gray-800">{b.milepæl}</td>
                      <td className="py-2 pr-3 text-gray-500">{b.andel}</td>
                      <td className="py-2 pr-3 font-semibold text-gray-800">{b.beløb}</td>
                      <td className="py-2 pr-3 text-gray-500">{b.forfald}</td>
                      <td className="py-2">
                        {b.status === "betalt" && <span className="text-green-700 font-semibold">Betalt</span>}
                        {b.status === "afventer" && <span className="text-amber-600 font-semibold">Afventer</span>}
                        {b.status === "kommende" && <span className="text-gray-400">Kommende</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 font-bold">
                    <td className="pt-2 text-gray-900 font-sans">Total</td>
                    <td className="pt-2 text-gray-500">100%</td>
                    <td className="pt-2 text-gray-900 font-sans">{projekt.entreprisesum} kr.</td>
                    <td /><td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* § 6 Aflevering og mangler */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 6 — Aflevering og mangler</h3>
              <p>Arbejdet afleveres ved skriftlig meddelelse til forbrugeren jf. AB-Forbruger § 37. Er entreprisesummen over 50.000 kr. kan begge parter kræve afleveringsforretning jf. § 38. Forbrugeren har 5 års reklamationsret på mangler fra afleveringsdatoen.</p>
              <p className="mt-3 text-gray-500">Forbrugeren kan tilbageholde betaling svarende til manglernes udbedring ved dokumenterede mangler jf. § 25, stk. 3. Entreprenøren har pligt og ret til at afhjælpe mangler inden rimelig tid jf. § 43.</p>
            </div>

            {/* § 7 AB-Forbruger */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 font-sans text-xs uppercase tracking-widest text-primary">§ 7 — Aftalegrundlag</h3>
              <p>AB-Forbruger (Almindelige betingelser for aftaler om byggearbejder for forbrugere, 2012) er gældende for denne aftale i sin helhed. Fravigelse af betingelserne gælder kun, hvis det sker tydeligt og udtrykkeligt jf. AB-Forbruger § 1, stk. 2. Opstår der uenighed, kan forbrugeren indbringe sagen for et ankenævn eller de almindelige domstole jf. § 63.</p>
            </div>
          </div>
        </div>

        {/* Underskrifter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Digitale underskrifter</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { navn: projekt.bygherre, rolle: "Bygherre", dato: projekt.bygherre_dato },
              { navn: projekt.entreprenør.split(" / ")[0], rolle: projekt.entreprenør.split(" / ")[1] ?? "Entreprenør", dato: projekt.entreprenør_dato },
            ].map((p) => (
              <div key={p.navn} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{p.navn[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.navn}</p>
                    <p className="text-xs text-gray-400">{p.rolle}</p>
                  </div>
                </div>
                {p.dato ? (
                  <div className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <p className="text-xs text-gray-400">Underskrevet {p.dato}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <p className="text-xs text-amber-600 font-medium">Afventer underskrift</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-3">
          <Link href="/abforbruger" className="flex-1 text-center border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
            Læs AB-Forbruger
          </Link>
          <Link href={`/projekt/${id}/aflevering`} className="flex-1 text-center bg-primary text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
            Gå til afleveringsforretning →
          </Link>
        </div>
      </div>
    </div>
  );
}
