import Link from "next/link";

const fordele = [
  {
    ikon: "M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zm0 5h20",
    titel: "Betaling mod fremdrift",
    tekst: "Du behøver ikke at forudbetale. Betaling sker løbende i takt med at arbejdet udføres, ikke på forhånd.",
  },
  {
    ikon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    titel: "Bindende tidsplan",
    tekst: "Start- og slutdato skal være aftalt. Overskrides slutdatoen uden gyldig grund, har du ret til dagbod.",
  },
  {
    ikon: "M12 5v14M5 12h14",
    titel: "Ekstraarbejde skriftligt",
    tekst: "Ingen håndværker må sætte ekstraarbejde i gang uden at I begge har skrevet under. Ingen overraskelser på slutregningen.",
  },
  {
    ikon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    titel: "Ret til afleveringsforretning",
    tekst: "Du har ret til at gennemgå arbejdet formelt inden du overtager det. Alle mangler noteres og håndværkeren skal udbedre.",
  },
  {
    ikon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    titel: "5 års reklamationsret",
    tekst: "Du kan kræve fejl og mangler udbedret i op til 5 år efter aflevering. Ved entrepriser over 500.000 kr. er der desuden ret til 1-årseftersyn.",
  },
];

interface Props {
  kompakt?: boolean;
  visLink?: boolean;
}

export default function ABForbrugerIntro({ kompakt = false, visLink = true }: Props) {
  if (kompakt) {
    return (
      <div className="bg-[#1a5c38]/5 border border-[#1a5c38]/15 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 bg-[#1a5c38] rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Hvad er AB-Forbruger?</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              AB-Forbruger 2012 er standardbetingelserne for private byggeaftaler i Danmark. De er lavet for at beskytte dig, men de træder kun i kraft hvis du og håndværkeren eksplicit aftaler det. Det betyder at du aktivt skal bede om at AB-Forbruger inkluderes i jeres aftale.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {fordele.map((f) => (
            <div key={f.titel} className="flex items-start gap-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2.5" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <span className="text-xs font-semibold text-gray-800">{f.titel}: </span>
                <span className="text-xs text-gray-500">{f.tekst}</span>
              </div>
            </div>
          ))}
        </div>
        {visLink && (
          <Link href="/abforbruger" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c38] hover:underline mt-4">
            Læs hele AB-Forbruger-oversigten →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#111c17] px-6 py-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <p className="text-white font-bold">AB-Forbruger 2012</p>
            <p className="text-white/50 text-xs">Standardbetingelser for private byggeaftaler</p>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          AB-Forbruger er lavet for at beskytte dig som privat bygherre, men de træder <strong className="text-white">kun i kraft hvis du og håndværkeren eksplicit aftaler det.</strong> De fleste aftaler nævner det slet ikke. Det er der vi kan hjælpe dig.
        </p>
      </div>
      <div className="divide-y divide-gray-50">
        {fordele.map((f) => (
          <div key={f.titel} className="px-6 py-4 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#1a5c38]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="1.8">
                <path d={f.ikon}/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">{f.titel}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.tekst}</p>
            </div>
          </div>
        ))}
      </div>
      {visLink && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">AB-Forbruger 2012 · DI Byggeri og Forbrugerrådet Tænk</p>
          <Link href="/abforbruger" className="text-xs font-semibold text-[#1a5c38] hover:underline">
            Læs alle paragraffer →
          </Link>
        </div>
      )}
    </div>
  );
}
