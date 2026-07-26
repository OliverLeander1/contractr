"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function IgangFlow() {
  const router = useRouter();

  const [projekttype, setProjekttype] = useState("");
  const [adresse, setAdresse] = useState("");
  const [navn, setNavn] = useState("");

  const [haandvaerkerNavn, setHaandvaerkerNavn] = useState("");
  const [haandvaerkerFirma, setHaandvaerkerFirma] = useState("");
  const [haandvaerkerEmail, setHaandvaerkerEmail] = useState("");
  const [totalPris, setTotalPris] = useState("");
  const [startdato, setStartdato] = useState("");
  const [slutdato, setSlutdato] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");

  const [opretter, setOpretter] = useState(false);
  const [fejl, setFejl] = useState("");

  useEffect(() => {
    setProjekttype(sessionStorage.getItem("screening_projekttype") || "");
    setAdresse(sessionStorage.getItem("screening_adresse") || "");
    setNavn(sessionStorage.getItem("screening_navn") || "");
  }, []);

  const kanOprette = haandvaerkerNavn.trim().length > 0;

  async function opretProjekt() {
    if (!kanOprette || opretter) return;
    setOpretter(true);
    setFejl("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?next=/opret/igang"); return; }

      const projekt_id = crypto.randomUUID();
      const prisNum = parseFloat(totalPris.replace(/\./g, "").replace(",", ".")) || null;
      const titel = [projekttype, adresse].filter(Boolean).join(", ") || "Igangværende projekt";

      const { error } = await supabase.from("kontrakter").insert({
        projekt_id,
        bygherre_id: user.id,
        status: "begge_godkendt",
        titel,
        beskrivelse: beskrivelse || null,
        total_pris: prisNum,
        startdato: startdato || null,
        slutdato: slutdato || null,
        haandvaerker_navn: haandvaerkerNavn,
        haandvaerker_firma: haandvaerkerFirma || null,
        haandvaerker_email: haandvaerkerEmail || null,
      });

      if (error) { setFejl("Noget gik galt. Prøv igen."); setOpretter(false); return; }

      router.push(`/projekt/${projekt_id}`);
    } catch {
      setFejl("Noget gik galt. Tjek din forbindelse og prøv igen.");
      setOpretter(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="logo">nembyggestyring</Link>
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">
            ← Tilbage
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span>🔨</span>
            Arbejdet er i gang
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Opret dit projektrum</h1>
          <p className="text-gray-500 leading-relaxed">
            Udfyld hvad du ved om den eksisterende aftale. Du kan altid tilføje mere senere. Projektrummet giver dig overblik over betalinger, ekstraarbejde og mangler fra dag ét.
          </p>
        </div>

        {/* Oplysninger om håndværkeren */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">Hvem udfører arbejdet?</h2>
          <p className="text-sm text-gray-400 mb-5">Disse oplysninger bruges til at identificere håndværkeren i projektrummet</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Håndværkerens navn <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="F.eks. Thomas Madsen"
                  value={haandvaerkerNavn}
                  onChange={e => setHaandvaerkerNavn(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Firma</label>
                <input
                  type="text"
                  placeholder="F.eks. TM Byg ApS"
                  value={haandvaerkerFirma}
                  onChange={e => setHaandvaerkerFirma(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Håndværkerens e-mail
                <span className="ml-1.5 text-xs text-gray-400 font-normal">(bruges til at invitere dem til projektrummet)</span>
              </label>
              <input
                type="email"
                placeholder="haandvaerker@firma.dk"
                value={haandvaerkerEmail}
                onChange={e => setHaandvaerkerEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Aftaledetaljer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">Hvad er aftalt?</h2>
          <p className="text-sm text-gray-400 mb-5">Udfyld det du kender. Spring det over du ikke har på hånden.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Samlet aftalt pris inkl. moms
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="F.eks. 125.000"
                  value={totalPris}
                  onChange={e => setTotalPris(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">kr.</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Bruges til at generere en betalingsplan koblet til fremdrift</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Startdato</label>
                <input
                  type="date"
                  value={startdato}
                  onChange={e => setStartdato(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Forventet slutdato</label>
                <input
                  type="date"
                  value={slutdato}
                  onChange={e => setSlutdato(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kort beskrivelse af arbejdet</label>
              <textarea
                rows={3}
                placeholder="F.eks. Totalrenovering af badeværelse på 8 m². Inkluderer nye fliser, walk-in bruser, dobbelt håndvask og gulvvarme."
                value={beskrivelse}
                onChange={e => setBeskrivelse(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* AB-Forbruger note */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Er AB-Forbruger aftalt?</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              AB-Forbruger træder kun i kraft hvis begge parter eksplicit har aftalt det. Er det ikke nævnt i din aftale, anbefaler vi at du beder håndværkeren bekræfte det skriftligt, inden næste betaling.
            </p>
          </div>
        </div>

        {fejl && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 text-sm text-red-700">{fejl}</div>
        )}

        <button
          onClick={opretProjekt}
          disabled={!kanOprette || opretter}
          className={`w-full py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-3 ${
            kanOprette && !opretter
              ? "bg-[#1e3a2a] text-white hover:opacity-90 shadow-md shadow-[#1e3a2a]/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {opretter ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              Opretter projektrummet...
            </>
          ) : (
            "Gå til projektrummet →"
          )}
        </button>
        {!kanOprette && (
          <p className="text-center text-xs text-gray-400 mt-3">Angiv håndværkerens navn for at fortsætte</p>
        )}
      </main>
    </div>
  );
}
