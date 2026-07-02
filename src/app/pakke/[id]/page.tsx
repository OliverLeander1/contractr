"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const pakkeData = {
  lille: {
    navn: "Lille projekt",
    tagline: "Kom godt i gang med dit byggeprojekt",
    pris: 499,
    budget: "Under 100.000 kr.",
    eksempler: "Nyt badeværelse, malerarbejde, smårenoveringer",
    farve: "gray",
    inkluderet: [
      {
        kategori: "Aftale og kontrakt",
        punkter: [
          "Udbudsdokument med AB-Forbruger 2012 som grundlag",
          "Digital kontrakt til håndværker",
          "Accept-flow med dokumenteret tidspunkt",
        ],
      },
      {
        kategori: "Projektstyring",
        punkter: [
          "Tidsplan med milepæle",
          "Betalingsoverblik koblet til fremdrift",
          "Dokumentarkiv til kontrakter og fakturaer",
          "Mangel-registrering med billeder og status",
        ],
      },
      {
        kategori: "Kommunikation",
        punkter: [
          "Projektchat med håndværker — dokumenteret og tidsstemplet",
          "Inviter 1 håndværker til projektet",
        ],
      },
      {
        kategori: "Support",
        punkter: [
          "Adgang til guide og AB-Forbruger-oversigt",
          "E-mail support inden for 3 hverdage",
        ],
      },
    ],
    ikkeInkluderet: [
      "AI-gennemgang af tilbud",
      "Inviter flere håndværkere",
      "Ekstraarbejde-sedler",
      "Prioriteret support",
      "Dedikeret rådgiver",
    ],
    betaling: {
      tidspunkt: "Du betaler én gang når projektet er oprettet.",
      detalje: "Beløbet trækkes ved oprettelse og giver adgang til alle funktioner i pakken for hele projektets varighed — uanset om det tager 2 uger eller 6 måneder.",
      garanti: "30 dages pengene-tilbage-garanti hvis platformen ikke lever op til forventningerne.",
    },
  },
  mellem: {
    navn: "Mellem projekt",
    tagline: "Det fulde overblik for det seriøse byggeprojekt",
    pris: 999,
    budget: "100.000 - 500.000 kr.",
    eksempler: "Tilbygning, nyt tag, køkken, større renovering",
    farve: "green",
    popular: true,
    inkluderet: [
      {
        kategori: "Aftale og kontrakt",
        punkter: [
          "Udbudsdokument med AB-Forbruger 2012 som grundlag",
          "Digital kontrakt til håndværker",
          "Accept-flow med dokumenteret tidspunkt",
          "Ekstraarbejde-sedler med digital godkendelse",
        ],
      },
      {
        kategori: "AI-screening",
        punkter: [
          "AI-gennemgang af indkomne tilbud inkluderet",
          "Risikovurdering: lav / middel / høj",
          "Konkrete spørgsmål du bør stille håndværkeren",
          "Kopiérbar besked til håndværker",
        ],
      },
      {
        kategori: "Projektstyring",
        punkter: [
          "Tidsplan med milepæle",
          "Betalingsoverblik koblet til fremdrift",
          "Dokumentarkiv til kontrakter og fakturaer",
          "Mangel-registrering med billeder og status",
          "Afleveringsflow med tjekliste",
        ],
      },
      {
        kategori: "Kommunikation",
        punkter: [
          "Projektchat med håndværker — dokumenteret og tidsstemplet",
          "Inviter op til 3 håndværkere til projektet",
        ],
      },
      {
        kategori: "Support",
        punkter: [
          "Adgang til guide og AB-Forbruger-oversigt",
          "Prioriteret e-mail support inden for 1 hverdag",
        ],
      },
    ],
    ikkeInkluderet: [
      "Ubegrænsede håndværkere (maks. 3)",
      "Dedikeret rådgiver tilknyttet",
      "Ugentlig statusrapport",
    ],
    betaling: {
      tidspunkt: "Du betaler én gang når projektet er oprettet.",
      detalje: "Beløbet trækkes ved oprettelse og giver adgang til alle funktioner i pakken for hele projektets varighed — uanset projektets længde.",
      garanti: "30 dages pengene-tilbage-garanti hvis platformen ikke lever op til forventningerne.",
    },
  },
  stort: {
    navn: "Stort projekt",
    tagline: "Professionel rygrad til de største projekter",
    pris: 1999,
    budget: "Over 500.000 kr.",
    eksempler: "Ombygning, nybyg, total renovering",
    farve: "green",
    inkluderet: [
      {
        kategori: "Aftale og kontrakt",
        punkter: [
          "Udbudsdokument med AB-Forbruger 2012 som grundlag",
          "Digital kontrakt til håndværker",
          "Accept-flow med dokumenteret tidspunkt",
          "Ekstraarbejde-sedler med digital godkendelse",
        ],
      },
      {
        kategori: "AI-screening",
        punkter: [
          "AI-gennemgang af alle indkomne tilbud inkluderet",
          "Risikovurdering: lav / middel / høj",
          "Konkrete spørgsmål du bør stille håndværkeren",
          "Kopiérbar besked til håndværker",
        ],
      },
      {
        kategori: "Projektstyring",
        punkter: [
          "Tidsplan med milepæle",
          "Betalingsoverblik koblet til fremdrift",
          "Dokumentarkiv til kontrakter og fakturaer",
          "Mangel-registrering med billeder og status",
          "Afleveringsflow med tjekliste",
        ],
      },
      {
        kategori: "Kommunikation",
        punkter: [
          "Projektchat med håndværker — dokumenteret og tidsstemplet",
          "Ubegrænsede håndværkere i projektet",
          "Koordination på tværs af fag",
        ],
      },
      {
        kategori: "Dedikeret rådgiver",
        punkter: [
          "En navngiven byggesagkyndig tilknyttet dit projekt",
          "Ugentlig statusrapport fra rådgiveren",
          "Direkte kontakt ved spørgsmål eller tvivl",
          "Prioriteret support med svar samme dag",
        ],
      },
    ],
    ikkeInkluderet: [
      "Fysisk byggetilsyn (kan tilkøbes)",
      "Juridisk bistand ved tvist (kan tilkøbes)",
    ],
    betaling: {
      tidspunkt: "Du betaler én gang når projektet er oprettet.",
      detalje: "Beløbet trækkes ved oprettelse og giver adgang til alle funktioner — inklusiv den dedikerede rådgiver — for hele projektets varighed.",
      garanti: "30 dages pengene-tilbage-garanti hvis platformen ikke lever op til forventningerne.",
    },
  },
} as const;

type PakkeId = keyof typeof pakkeData;

export default function PakkeDetalje() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [formUdfyldt, setFormUdfyldt] = useState(false);

  const pakke = pakkeData[id as PakkeId];

  if (!pakke) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pakken findes ikke.</p>
          <Link href="/pakke" className="text-[#1a5c38] font-semibold hover:underline">← Tilbage til pakker</Link>
        </div>
      </div>
    );
  }

  const erMestValgt = "popular" in pakke && pakke.popular;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/pakke" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Alle pakker
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a5c38] rounded-lg flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-lg" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          {erMestValgt && (
            <span className="inline-block bg-[#1a5c38] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4">Mest valgte</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pakke.navn}</h1>
          <p className="text-gray-500 mb-2">{pakke.tagline}</p>
          <p className="text-xs text-gray-400">{pakke.budget} · {pakke.eksempler}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Venstre: features + ikke inkluderet */}
          <div className="md:col-span-2 space-y-5">

            {/* Inkluderet */}
            {pakke.inkluderet.map((sektion) => (
              <div key={sektion.kategori} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">{sektion.kategori}</h2>
                <div className="space-y-3">
                  {sektion.punkter.map((punkt) => (
                    <div key={punkt} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1a5c38]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{punkt}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Ikke inkluderet */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Ikke inkluderet i denne pakke</h2>
              <div className="space-y-3">
                {pakke.ikkeInkluderet.map((punkt) => (
                  <div key={punkt} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{punkt}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                Mangler du noget der ikke er inkluderet? Se om en højere pakke passer bedre, eller{" "}
                <Link href="/tilkoeb" className="text-[#1a5c38] hover:underline">tilkøb enkeltydelser</Link>.
              </p>
            </div>

          </div>

          {/* Højre: pris + betaling */}
          <div className="space-y-5">

            {/* Priskort */}
            <div className={`rounded-2xl border-2 p-6 ${erMestValgt ? "border-[#1a5c38] bg-[#1a5c38]/5" : "border-gray-100 bg-white"}`}>
              <p className="text-xs text-gray-400 mb-1">Engangspris</p>
              <p className="text-4xl font-bold text-gray-900 mb-0.5">{pakke.pris.toLocaleString("da-DK")}</p>
              <p className="text-sm text-gray-400 mb-5">kr. inkl. moms</p>

              <div className="space-y-2 mb-5 text-xs text-gray-500 leading-relaxed">
                <p>{pakke.betaling.tidspunkt}</p>
                <p>{pakke.betaling.detalje}</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p className="text-xs text-green-700 font-medium">{pakke.betaling.garanti}</p>
              </div>

              {/* Betalingsformular (klar til Stripe) */}
              {!formUdfyldt ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Dit navn"
                    value={navn}
                    onChange={(e) => setNavn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Din e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 transition-all"
                  />

                  {/* Kortnummer (placeholder) */}
                  <div className="border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 bg-gray-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span className="text-sm text-gray-400">Kortoplysninger · Aktiveres snart</span>
                  </div>

                  <button
                    onClick={() => {
                      if (navn && email) setFormUdfyldt(true);
                    }}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                      navn && email
                        ? "bg-[#1a5c38] text-white hover:bg-[#163f28]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Betal {pakke.pris.toLocaleString("da-DK")} kr. og opret projekt
                  </button>
                  <p className="text-xs text-gray-400 text-center">Betalingsløsning aktiveres snart</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Tak, {navn.split(" ")[0]}!</p>
                  <p className="text-sm text-gray-500 mb-5">Vi sender dig en besked på {email} når betalingsløsningen er klar.</p>
                  <button
                    onClick={() => router.push("/opret")}
                    className="w-full bg-[#1a5c38] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#163f28] transition-colors"
                  >
                    Opret projekt gratis i mellemtiden →
                  </button>
                </div>
              )}
            </div>

            {/* Sammenlign */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 mb-3">Sammenlign pakker</p>
              <div className="space-y-2">
                {(["lille", "mellem", "stort"] as PakkeId[]).map((pid) => (
                  <Link
                    key={pid}
                    href={`/pakke/${pid}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${pid === id ? "bg-[#1a5c38]/10" : "hover:bg-gray-50"}`}
                  >
                    <span className={`text-sm font-medium ${pid === id ? "text-[#1a5c38] font-semibold" : "text-gray-600"}`}>
                      {pakkeData[pid].navn}
                    </span>
                    <span className={`text-sm font-bold ${pid === id ? "text-[#1a5c38]" : "text-gray-400"}`}>
                      {pakkeData[pid].pris.toLocaleString("da-DK")} kr.
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
