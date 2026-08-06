"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlowLayout from "@/components/FlowLayout";
import { createClient } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import DokumentRenderer, { byggV2Dokument, indeholderKonkretDato } from "@/components/DokumentRenderer";

interface UdbudResultat {
  titel: string;
  resumé: string;
  dokument: string;
  kravOgOensker?: string;
  praktiskeForhold?: string;
  bygherreNavn: string;
  bygherreKontakt: string;
  billeder?: { navn: string; data: string }[];
  opstart?: string;
  slutdato?: string;
}

export default function UdbudResultat() {
  const router = useRouter();
  const [data, setData] = useState<UdbudResultat | null>(null);
  const [kopieret, setKopieret] = useState(false);
  const [opretter, setOpretter] = useState(false);
  const [opretFejl, setOpretFejl] = useState("");
  const [redigerer, setRedigerer] = useState(false);

  // De fire AI-felter holdes adskilt fra start — INTRO (fra resumé) er
  // aldrig redigerbar. Kun de tre narrative felter kan redigeres.
  const [intro, setIntro] = useState("");
  const [arbejdsomfang, setArbejdsomfang] = useState("");
  const [kravOgOensker, setKravOgOensker] = useState("");
  const [praktiskeForhold, setPraktiskeForhold] = useState("");
  const [valideringsFejl, setValideringsFejl] = useState("");

  // Invite-step state
  const [visInvite, setVisInvite] = useState(false);
  const [haandvaerkerNavn, setHaandvaerkerNavn] = useState("");
  const [haandvaerkerEmail, setHaandvaerkerEmail] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("udbud_resultat");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setData(parsed);
        setIntro(parsed.resumé || "");
        setArbejdsomfang(parsed.dokument || "");
        setKravOgOensker(parsed.kravOgOensker || "");
        setPraktiskeForhold(parsed.praktiskeForhold || "");
        track("document_generated", { titel: parsed.titel });
      } catch { /* ignore */ }
    }
  }, []);

  async function opretAftalegrundlag() {
    if (!data) return;
    setOpretter(true);
    setOpretFejl("");
    setValideringsFejl("");
    try {
      if (indeholderKonkretDato([arbejdsomfang, kravOgOensker, praktiskeForhold].join("\n"))) {
        setValideringsFejl("Datoer ændres i Tidsplan.");
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?next=/opret/udbud-resultat"); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setOpretFejl("Din session er udløbet. Log ind igen for at oprette aftalegrundlaget.");
        return;
      }

      // Læs projektoplysninger fra sessionStorage (udfyldt i trin 1)
      const projekttype = sessionStorage.getItem("screening_projekttype") || "andet";
      const adresse = sessionStorage.getItem("screening_adresse") || null;
      const navn = sessionStorage.getItem("screening_navn") || null;
      const kontakt = sessionStorage.getItem("screening_kontakt") || null;

      // 1. Opret projekt i databasen
      const rProjekt = await fetch("/api/projekter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ projekttype, adresse, navn, kontakt, startdato: data.opstart || null, slutdato: data.slutdato || null }),
      });
      if (rProjekt.status === 401) {
        setOpretFejl("Din session er udløbet. Log ind igen for at oprette aftalegrundlaget.");
        return;
      }
      if (rProjekt.status === 403) {
        setOpretFejl("Du har ikke adgang til at oprette et projekt.");
        return;
      }
      const projekt = await rProjekt.json();
      if (projekt.error || !projekt.id) {
        setOpretFejl(`Projekt fejl: ${projekt.error || "ukendt fejl"}`);
        return;
      }
      const projekt_id = projekt.id;

      // 2. Opret kontrakt for projektet
      const rKontrakt = await fetch(`/api/projekter/${projekt_id}/kontrakter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      if (rKontrakt.status === 401) {
        setOpretFejl("Din session er udløbet. Log ind igen for at oprette aftalegrundlaget.");
        return;
      }
      if (rKontrakt.status === 403) {
        setOpretFejl("Du har ikke adgang til at oprette dette aftalegrundlag.");
        return;
      }
      const k = await rKontrakt.json();
      if (k.error || !k.id) {
        setOpretFejl("Kunne ikke oprette aftalegrundlag. Prøv igen.");
        return;
      }

      // 3. Fyld kontrakt med AI-dokument (V2-format) og evt. håndværkeroplysninger
      const beskrivelse = byggV2Dokument({ intro, arbejdsomfang, kravOgOensker, praktiskeForhold });
      const rOpdater = await fetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          kontrakt_id: k.id,
          titel: data.titel,
          beskrivelse,
          ...(haandvaerkerEmail ? { haandvaerker_email: haandvaerkerEmail } : {}),
        }),
      });
      if (rOpdater.status === 401) {
        setOpretFejl("Din session er udløbet. Log ind igen for at fortsætte.");
        return;
      }
      if (rOpdater.status === 403) {
        setOpretFejl("Du har ikke adgang til at opdatere dette aftalegrundlag.");
        return;
      }
      const opdateretKontrakt = await rOpdater.json();
      if (opdateretKontrakt.error) {
        setOpretFejl(opdateretKontrakt.error);
        return;
      }

      // 4. Send invitations-email til håndværker
      if (haandvaerkerEmail && k.haandvaerker_token) {
        const baseUrl = window.location.origin;
        await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: haandvaerkerEmail,
            link: `${baseUrl}/kontrakt/${k.haandvaerker_token}`,
            navn: null,
            projekttitel: data.titel || null,
          }),
        });
      }

      track("aftale_created", { med_invitation: !!haandvaerkerEmail });
      if (haandvaerkerEmail) track("haandvaerker_invited");
      sessionStorage.removeItem("udbud_resultat");
      router.push(`/projekt/${projekt_id}/aftale`);
    } finally {
      setOpretter(false);
    }
  }

  function byggLæsbarKopi(): string {
    const dele = [intro.trim(), arbejdsomfang.trim()].filter(Boolean);
    if (kravOgOensker.trim()) dele.push(`Krav og ønsker:\n${kravOgOensker.trim()}`);
    if (praktiskeForhold.trim()) dele.push(`Praktiske forhold:\n${praktiskeForhold.trim()}`);
    return dele.join("\n\n");
  }

  function kopier() {
    navigator.clipboard.writeText(byggLæsbarKopi()).then(() => {
      setKopieret(true);
      setTimeout(() => setKopieret(false), 2500);
    });
  }

  if (!data) {
    return (
      <FlowLayout aktivTrin={3}>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">Intet dokument fundet - gå tilbage og udfyld formularen.</p>
          <button onClick={() => router.push("/opret/beskriv")} className="mt-4 text-primary text-sm underline">
            Gå tilbage
          </button>
        </div>
      </FlowLayout>
    );
  }

  return (
    <FlowLayout aktivTrin={3}>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Klar til udsendelse
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.titel}</h1>
        <p className="text-gray-500">{intro}</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">{redigerer ? "Redigerer indhold" : "Forhåndsvisning"}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRedigerer(r => !r)}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {redigerer ? "Luk redigering" : "Redigér tekst"}
          </button>
          <button
            onClick={kopier}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
              kopieret ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {kopieret ? "Kopieret!" : "Kopiér"}
          </button>
        </div>
      </div>

      {/* Selve dokumentet */}
      <div className="mb-6">
        {redigerer ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Projektopsummering (redigeres ikke her)</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5 leading-relaxed">{intro}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Arbejdsomfang</label>
              <textarea
                value={arbejdsomfang}
                onChange={(e) => setArbejdsomfang(e.target.value)}
                rows={Math.max(14, arbejdsomfang.split("\n").length + 2)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Krav og ønsker</label>
              <textarea
                value={kravOgOensker}
                onChange={(e) => setKravOgOensker(e.target.value)}
                rows={Math.max(4, kravOgOensker.split("\n").length + 2)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Praktiske forhold</label>
              <textarea
                value={praktiskeForhold}
                onChange={(e) => setPraktiskeForhold(e.target.value)}
                rows={Math.max(4, praktiskeForhold.split("\n").length + 2)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
              />
            </div>
            {valideringsFejl && (
              <p className="text-xs text-red-600 font-medium">{valideringsFejl}</p>
            )}
          </div>
        ) : (
          <DokumentRenderer
            tekst={byggV2Dokument({ intro, arbejdsomfang, kravOgOensker, praktiskeForhold })}
            titel={data.titel}
            bygherreNavn={data.bygherreNavn}
            bygherreKontakt={data.bygherreKontakt}
            startdato={data.opstart || null}
            slutdato={data.slutdato || null}
          />
        )}
      </div>

      {/* Invite-step */}
      {!visInvite ? (
        <div className="space-y-3 mb-4">
          <button
            onClick={() => setVisInvite(true)}
            className="w-full py-4 rounded-xl text-base font-bold bg-[#1e3a2a] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Opret aftalegrundlag og inviter håndværker
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <p className="text-xs text-gray-400">eller</p>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={kopier}
            className="w-full py-3.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {kopieret ? "Kopieret!" : "Kopiér dokument og send manuelt"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-1">Hvem skal modtage aftalegrundlaget?</h3>
          <p className="text-sm text-gray-400 mb-5">Håndværkeren får et link til at gennemgå og godkende dokumentet. Du kan også springe dette over og tilføje dem senere.</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="haandvaerker@email.dk"
                value={haandvaerkerEmail}
                onChange={e => setHaandvaerkerEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setVisInvite(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Tilbage
            </button>
            <button
              onClick={opretAftalegrundlag}
              disabled={opretter}
              className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {opretter ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Opretter...</>
              ) : haandvaerkerEmail ? (
                "Opret og send invitation"
              ) : (
                "Opret uden invitation"
              )}
            </button>
          </div>

          {!haandvaerkerEmail && (
            <p className="text-xs text-gray-400 text-center mt-3">Du kan tilføje håndværkeroplysninger inde i aftalen bagefter.</p>
          )}
          {(opretFejl || valideringsFejl) && (
            <p className="text-xs text-red-600 text-center mt-2 font-medium">{opretFejl || valideringsFejl}</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/opret/beskriv")}
          className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Start forfra
        </button>
        <button
          onClick={() => router.push("/opret/upload")}
          className="flex-1 py-3.5 rounded-xl border border-[#1e3a2a] text-[#1e3a2a] text-sm font-semibold hover:bg-accent transition-colors"
        >
          Modtaget tilbud? Upload her →
        </button>
      </div>
    </FlowLayout>
  );
}
