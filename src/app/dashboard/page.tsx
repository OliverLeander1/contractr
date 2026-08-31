"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PakkePop from "@/components/PakkePop";
import {
  getBesigtigelseStatusUI,
  type BesigtigelseData,
} from "@/lib/besigtigelse";
import { FileText, ArrowRight, Trash2, Plus } from "lucide-react";
import { hentOprindeligAftaltStartdato } from "@/lib/kontraktSlutdato";
import { beregnKontraktDeadline } from "@/lib/kontraktDeadline";

interface Projekt {
  id: string;
  projekttype: string;
  adresse?: string;
  status: string;
  pakke_betalt?: boolean;
  oprettet_at: string;
}

interface Aftale {
  id: string;
  projekt_id: string;
  titel: string | null;
  status: string;
  haandvaerker_navn: string | null;
  haandvaerker_email: string | null;
  haandvaerker_firma: string | null;
  oprettet_at: string;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  startdato: string | null;
  slutdato: string | null;
  total_pris: number | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  tidsplan: {
    type?: string;
    faser?: { navn?: string; startdato?: string; slutdato?: string }[];
    godkendt_af_bygherre: boolean;
    indsendt_at: string | null;
  } | null;
  forudsaetninger_sendt_at: string | null;
  forudsaetninger_godkendt: boolean | null;
  tilbud_dokument_url: string | null;
  besigtigelse_bekraeftet: boolean | null;
}

interface Besigtigelse extends BesigtigelseData {
  kommentar_haandvaerker: string | null;
  kommentar_bygherre: string | null;
}

interface KontraktStatus {
  badgeText: string | null;
  secondaryText: string | null;
  badgeKlasse: string;
}

function getContractorUpdateStatus(a: Aftale): KontraktStatus {
  const ingen: KontraktStatus = { badgeText: null, secondaryText: null, badgeKlasse: "" };

  if (a.bygherre_godkendt_at) return ingen;

  // Niveau 1: kræver aktiv handling fra bygherre
  const action: string[] = [];
  if (a.haandvaerker_godkendt_at && !a.bygherre_godkendt_at)
    action.push("Entreprenøren har sendt grundlaget til godkendelse");
  if (a.tidsplan?.indsendt_at && a.tidsplan.godkendt_af_bygherre === false)
    action.push("Entreprenøren har foreslået nye datoer");
  if (a.forudsaetninger_sendt_at && a.forudsaetninger_godkendt !== true)
    action.push("Entreprenøren har tilføjet forudsætninger");

  // Niveau 2: orientering (bygges altid, bruges til samlet tælling)
  const update: string[] = [];
  if (a.tilbud_dokument_url) update.push("Entreprenøren har uploadet tilbud");
  if (a.besigtigelse_bekraeftet === true) update.push("Entreprenøren har angivet besigtigelse");

  if (action.length > 0) {
    const samlet = action.length + update.length;
    return {
      badgeText: "Afventer din gennemgang",
      secondaryText: samlet > 1 ? "Entreprenøren har lavet flere opdateringer" : action[0],
      badgeKlasse: "bg-[#1e3a2a]/10 text-[#1e3a2a] border-[#1e3a2a]/20",
    };
  }

  if (update.length > 0) {
    return {
      badgeText: "Opdateret af entreprenør",
      secondaryText: update.length === 1 ? update[0] : "Entreprenøren har opdateret sagen",
      badgeKlasse: "bg-[#f0f7f3] text-[#1e3a2a]/70 border-[#1e3a2a]/10",
    };
  }

  return ingen;
}

const statusLabel: Record<string, string> = {
  dialog: "Søger håndværker", "ingen-tilbud": "I dialog",
  tilbud: "Tilbud modtaget", accepteret: "Accepteret",
  igang: "I gang", problem: "Tvist", afsluttet: "Afsluttet",
};

// Bruges kun til titlen på projekter der endnu ikke har noget aftalegrundlag
// (kontrakt) — så disse projekter fortsat kan vises med en meningsfuld titel.
const projekttypeLabels: Record<string, string> = {
  badevarelse: "Badeværelse", kokken: "Køkken", tag: "Tag",
  tilbygning: "Tilbygning", totalrenovering: "Totalrenovering",
  vinduer: "Vinduer og facade", maler: "Maler og gips",
  carport: "Carport og garage", vaadrum: "Vådrum", andet: "Generel renovering",
};

// Én "kræver handling"-sag, udledt udelukkende af eksisterende
// kontrakt-/besigtigelsesstatus — aldrig af opdigtet data.
interface HandlingsSag {
  aftaleId: string;
  projektId: string;
  titel: string;
  label: string;
  beskrivelse: string | null;
  cta: string;
}

// Én sag i "Aktive og aftalte" — status/dato er altid direkte fra
// projekter.status / kontrakter.startdato/slutdato. sorteringsNoegle bruges
// KUN til intern rækkefølge og vises aldrig som et tal i UI'et.
interface AktivSag {
  aftaleId: string;
  projektId: string;
  titel: string;
  statusTekst: string;
  datoTekst: string | null;
  sorteringsNoegle: number;
}

// Én sag i "Afventer" eller "Udkast". href/cta gør det muligt at genbruge
// samme type til både rigtige aftalegrundlag OG projekter uden kontrakt endnu.
interface SekundaerSag {
  key: string;
  projektId: string;
  titel: string;
  statusTekst: string;
  href: string;
  cta: string;
  kanSlettes: boolean;
}

const pluralProjekt = (n: number) => (n === 1 ? "projekt" : "projekter");

export default function Dashboard() {
  const router = useRouter();
  const [navn, setNavn] = useState("");
  const [projekter, setProjekter] = useState<Projekt[]>([]);
  const [aftaler, setAftaler] = useState<Aftale[]>([]);
  const [besigtigelser, setBesigtigelser] = useState<Besigtigelse[]>([]);
  const [indlæser, setIndlæser] = useState(true);
  const [opretter, setOpretter] = useState(false);
  const [pendingUdkast, setPendingUdkast] = useState<{ titel: string } | null>(null);
  const [visPakkePop, setVisPakkePop] = useState(false);
  const [brugerInfo, setBrugerInfo] = useState<{ id: string; email: string; navn: string } | null>(null);
  const [sletterProjekt, setSletterProjekt] = useState<string | null>(null);
  const [besigtigelserFejl, setBesigtigelserFejl] = useState(false);
  const [visAlleHandlinger, setVisAlleHandlinger] = useState(false);
  // Nu-tidspunkt til sortering af "Aktive og aftalte" efter hvor langt en sag
  // er gennem sin planlagte periode. Sat i en effekt (ikke under render), så
  // selve rendering forbliver ren — ingen Date.now()-kald i komponentkroppen.
  const [nuTidsstempel, setNuTidsstempel] = useState<number | null>(null);
  const [sedlerPrKontrakt, setSedlerPrKontrakt] = useState<Record<string, { status: string; haandvaerker_tidsdage: number | null }[]>>({});

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      // Sat efter det første await, ligesom de øvrige setState-kald i denne
      // effekt — bruges kun til ren (ingen Date.now() i selve render) sortering
      // af "Aktive og aftalte" efter fremdrift gennem den planlagte periode.
      setNuTidsstempel(Date.now());

      if (!user) { router.push("/login"); return; }

      // Tjek om der er et ufærdiggjort udkast i sessionStorage
      try {
        const raw = sessionStorage.getItem("udbud_resultat");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.titel) setPendingUdkast({ titel: parsed.titel });
        }
      } catch { /* ignore */ }

      const { data: profil } = await supabase
        .from("profiler").select("navn").eq("id", user.id).single();

      const navnStr = profil?.navn || user.user_metadata?.navn || user.email?.split("@")[0] || "";
      setNavn(navnStr);
      setBrugerInfo({ id: user.id, email: user.email ?? "", navn: navnStr });

      const { data: projektData } = await supabase
        .from("projekter")
        .select("id, projekttype, adresse, status, pakke_betalt, oprettet_at")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false })
        .limit(10);

      if (projektData) {
        setProjekter(projektData);
      }

      const { data: aftaleData } = await supabase
        .from("kontrakter")
        .select("id, projekt_id, titel, status, haandvaerker_navn, haandvaerker_email, haandvaerker_firma, oprettet_at, bygherre_godkendt_at, haandvaerker_godkendt_at, startdato, slutdato, total_pris, betalingsplan, tidsplan, forudsaetninger_sendt_at, forudsaetninger_godkendt, tilbud_dokument_url, besigtigelse_bekraeftet")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false });

      if (aftaleData) {
        setAftaler(aftaleData);

        // Agreement sheet deadline extension v1 — ét batched kald for ALLE
        // kontrakter, grupperet client-side pr. kontrakt_id. Undgår N+1 (ikke
        // ét kald pr. aftale/aftaleseddel).
        const kontraktIder = aftaleData.map((a) => a.id);
        if (kontraktIder.length > 0) {
          const { data: sedler } = await supabase
            .from("ekstraarbejde")
            .select("kontrakt_id, status, haandvaerker_tidsdage")
            .in("kontrakt_id", kontraktIder);
          const grupperet: Record<string, { status: string; haandvaerker_tidsdage: number | null }[]> = {};
          (sedler ?? []).forEach((s) => {
            (grupperet[s.kontrakt_id] ??= []).push({ status: s.status, haandvaerker_tidsdage: s.haandvaerker_tidsdage });
          });
          setSedlerPrKontrakt(grupperet);
        }

        // Hent besigtigelse for brugerens kontrakter — ét serverside-kald
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const bRes = await fetch("/api/bruger/besigtigelser", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (bRes.ok) {
            const bData = await bRes.json();
            if (Array.isArray(bData)) {
              setBesigtigelser(bData);
            } else {
              setBesigtigelserFejl(true);
            }
          } else {
            setBesigtigelserFejl(true);
          }
        }
      }
      setIndlæser(false);
    };
    hent();
  }, [router]);

  function opretNyAftale() {
    setOpretter(true);
    router.push("/opret");
  }

  async function sletProjekt(projektId: string, label: string) {
    if (!confirm(`Slet "${label}"? Dette kan ikke fortrydes.`)) return;
    setSletterProjekt(projektId);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/projekt/${projektId}/slet`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setProjekter(prev => prev.filter(p => p.id !== projektId));
    setAftaler(prev => prev.filter(a => a.projekt_id !== projektId));
    setSletterProjekt(null);
  }

  const timer = new Date().getHours();
  const hilsen = timer < 3 ? "Godaften" : timer < 10 ? "Godmorgen" : timer < 12 ? "Goddag" : timer < 17 ? "Godeftermiddag" : "Godaften";
  const fornavn = navn.split(" ")[0];

  const harProblemer = projekter.some(p => p.status === "problem");
  const ingenProjekter = projekter.length === 0;

  const fmtDatoLang = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long" });

  if (indlæser) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lukPakkePop = () => {
    setVisPakkePop(false);
    sessionStorage.setItem("pakke_pop_vist", "1");
  };

  // ---------------------------------------------------------------------
  // Fordel hver aftale i præcis én af fire grupper — udelukkende ud fra
  // allerede eksisterende felter (samme logik som tidligere blev brugt til
  // badge/prioritet i "Dine aftalegrundlag"). Ingen ny status opfindes.
  // ---------------------------------------------------------------------
  const kraeverHandling: HandlingsSag[] = [];
  const aktiveOgAftalte: AktivSag[] = [];
  const afventer: SekundaerSag[] = [];
  const udkast: SekundaerSag[] = [];

  // projekt_id'er der allerede har mindst ét tilknyttet aftalegrundlag —
  // bruges bagefter til at finde projekter helt uden kontrakt.
  const projektIdMedAftale = new Set(aftaler.map(a => a.projekt_id));

  for (const a of aftaler) {
    const titel = a.titel || "Aftalegrundlag uden titel";
    const erUdkast = !a.haandvaerker_email;

    if (erUdkast) {
      udkast.push({
        key: a.id, projektId: a.projekt_id, titel, statusTekst: "Udkast",
        href: `/projekt/${a.projekt_id}/aftale`, cta: "Fortsæt udkast →", kanSlettes: true,
      });
      continue;
    }

    const kontraktStatus = getContractorUpdateStatus(a);
    const aktivBesigtigelse = besigtigelser.find(b => b.kontrakt_id === a.id);
    const besigtigelseUI = aktivBesigtigelse ? getBesigtigelseStatusUI(aktivBesigtigelse) : null;

    if (besigtigelseUI?.prioritet === 1) {
      kraeverHandling.push({
        aftaleId: a.id, projektId: a.projekt_id, titel,
        label: besigtigelseUI.badge, beskrivelse: besigtigelseUI.tekst,
        cta: "Se foreslåede tider",
      });
      continue;
    }
    if (kontraktStatus.badgeText === "Afventer din gennemgang") {
      kraeverHandling.push({
        aftaleId: a.id, projektId: a.projekt_id, titel,
        label: kontraktStatus.badgeText, beskrivelse: kontraktStatus.secondaryText,
        cta: "Gennemgå aftalegrundlag",
      });
      continue;
    }
    if (a.status === "begge_godkendt") {
      const relateretProjekt = projekter.find(p => p.id === a.projekt_id);
      const statusTekst = relateretProjekt ? (statusLabel[relateretProjekt.status] || "Aftalt") : "Aftalt";
      const aftaltStartdato = hentOprindeligAftaltStartdato(a);
      const { samletFristforlaengelseDage, gaeldendeAflevering } = beregnKontraktDeadline(a, sedlerPrKontrakt[a.id], a.id);
      let datoTekst: string | null = null;
      if (gaeldendeAflevering) {
        datoTekst = samletFristforlaengelseDage > 0
          ? `Gældende aflevering ${fmtDatoLang(gaeldendeAflevering)} (+${samletFristforlaengelseDage} kalenderdage)`
          : `Forventet aflevering ${fmtDatoLang(gaeldendeAflevering)}`;
      } else if (aftaltStartdato) {
        datoTekst = `Opstart ${fmtDatoLang(aftaltStartdato)}`;
      }

      // Sorteringsnøgle — beregnes uden at kalde Date.now() under render:
      // "nu" læses fra state (nuTidsstempel), sat i en effekt ved mount.
      // 1) Begge datoer + gyldigt interval (slut > start): sortér efter hvor
      //    langt gennem den planlagte periode sagen er (mest fremskreden
      //    først). Fraktionen vises aldrig — kun brugt til rækkefølge.
      // 2) Ellers: stabil fallback på den ene kendte dato (nærmeste først).
      // 3) Ingen datoer: sidst, i uændret rækkefølge.
      let sorteringsNoegle = Number.MAX_SAFE_INTEGER;
      const start = aftaltStartdato ? new Date(aftaltStartdato).getTime() : null;
      const slut = gaeldendeAflevering ? new Date(gaeldendeAflevering).getTime() : null;
      if (start !== null && slut !== null && slut > start && nuTidsstempel !== null) {
        const fraktion = Math.min(1, Math.max(0, (nuTidsstempel - start) / (slut - start)));
        sorteringsNoegle = -fraktion; // mest fremskreden (højeste fraktion) først
      } else if (slut !== null) {
        sorteringsNoegle = slut;
      } else if (start !== null) {
        sorteringsNoegle = start;
      }

      aktiveOgAftalte.push({ aftaleId: a.id, projektId: a.projekt_id, titel, statusTekst, datoTekst, sorteringsNoegle });
      continue;
    }

    const afventerHaandvaerker = a.bygherre_godkendt_at && !a.haandvaerker_godkendt_at;
    const underForhandling = a.status === "forhandling";
    const statusTekst = afventerHaandvaerker ? "Afventer håndværker" : underForhandling ? "Under forhandling" : "Invitation sendt";
    afventer.push({
      key: a.id, projektId: a.projekt_id, titel, statusTekst,
      href: `/projekt/${a.projekt_id}/aftale`, cta: "Åbn sag →", kanSlettes: false,
    });
  }

  // Projekter uden noget tilknyttet aftalegrundlag (0 kontrakter) forsvinder
  // ellers helt fra dashboardet i den nye, aftale-centrerede gruppering.
  // De vises i stedet under Udkast ELLER Afventer — aldrig automatisk Udkast
  // blot fordi kontrakten mangler. Klassificeringen følger projektets egen,
  // reelle status (samme statusLabel-mapping som "Aktive og aftalte" bruger):
  // "dialog"/"ingen-tilbud"/"tilbud" er reelt endnu intet formaliseret aftale-
  // grundlag (heller ingen invitation er sendt — invitation/håndværker-email
  // er et kontraktfelt, ikke et projektfelt) og hører derfor til Udkast.
  // "accepteret"/"igang"/"afsluttet"/"problem" betyder derimod at projektet
  // reelt er kommet videre end et udkast, selvom kontrakten mangler her — de
  // vises i stedet under Afventer, så en fejlagtig "Udkast"-etiket ikke
  // overskriver projektets egen status.
  const reeltUdkastStatus = new Set(["dialog", "ingen-tilbud", "tilbud"]);
  for (const p of projekter) {
    if (projektIdMedAftale.has(p.id)) continue;
    const titel = projekttypeLabels[p.projekttype] || "Projekt uden titel";
    const statusTekst = statusLabel[p.status] || "Udkast";
    const erReeltUdkast = reeltUdkastStatus.has(p.status);
    const sag: SekundaerSag = {
      key: `projekt-${p.id}`, projektId: p.id, titel, statusTekst,
      href: `/projekt/${p.id}`, cta: "Åbn projekt →", kanSlettes: erReeltUdkast,
    };
    if (erReeltUdkast) udkast.push(sag);
    else afventer.push(sag);
  }

  // Stabil sortering: sager der er længst gennem den planlagte periode (eller
  // med nærmeste kendte dato som fallback) vises først. Sager uden nogen dato
  // bevarer deres indbyrdes rækkefølge (nyeste oprettet først).
  aktiveOgAftalte.sort((x, y) => x.sorteringsNoegle - y.sorteringsNoegle);

  // Total og "kræver handling" tælles i PROJEKTER, ikke i antal aftaler/
  // kontrakter — et projekt med flere kontrakter, eller flere kontrakter der
  // hver kræver handling, må ikke tælles flere gange.
  const totalCount = projekter.length;
  const synligeHandlinger = visAlleHandlinger ? kraeverHandling : kraeverHandling.slice(0, 2);
  const projekterMedHandling = new Set(kraeverHandling.map(h => h.projektId)).size;
  const statusLinje = totalCount === 0
    ? null
    : projekterMedHandling === 0
      ? `Du er ajour · ${totalCount} ${pluralProjekt(totalCount)} i alt`
      : `${projekterMedHandling} ${pluralProjekt(projekterMedHandling)} kræver din handling · ${totalCount} ${pluralProjekt(totalCount)} i alt`;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      {visPakkePop && brugerInfo && projekter.length > 0 && (
        <PakkePop
          projekttype={projekter[0].projekttype}
          projektId={projekter[0].id}
          email={brugerInfo.email}
          navn={brugerInfo.navn}
          brugerId={brugerInfo.id}
          onLuk={lukPakkePop}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-14 py-10 md:py-0">

        {/* Masthead */}
        <div className="pt-4 md:pt-14 pb-6 md:pb-10">
          <p className="text-xs md:text-sm text-gray-400 mb-1.5 md:mb-3">
            {hilsen}{fornavn ? `, ${fornavn}` : ""}
          </p>
          <h1 className="font-serif text-[26px] md:text-[44px] font-normal text-[#16241c] leading-[1.2] md:leading-[1.15] tracking-tight mb-2 md:mb-3.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Her er dit daglige overblik
          </h1>
          {statusLinje ? (
            <p className="text-sm md:text-base font-medium text-[#46564d]">{statusLinje}</p>
          ) : (
            <p className="text-sm md:text-base font-medium text-[#46564d]">Opret dit første projekt for at komme i gang</p>
          )}
        </div>

        {/* Tvist-advarsel — bevaret som diskret linje, ikke en tung boks */}
        {harProblemer && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
            Et projekt har en aktiv tvist. Vi anbefaler kontakt til en byggesagkyndig —{" "}
            <Link href="/tilkoeb" className="font-semibold underline">se rådgiverydelser</Link>.
          </p>
        )}

        {/* Ufærdiggjort udkast fra sessionStorage */}
        {pendingUdkast && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText size={20} strokeWidth={1.75} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Du har et udkast klar</p>
                <p className="text-xs text-amber-700 mt-0.5">{pendingUdkast.titel}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/opret/udbud-resultat")}
              className="flex-shrink-0 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors min-h-11"
            >
              Fortsæt her
            </button>
          </div>
        )}

        {besigtigelserFejl && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">
            Besigtigelsesstatus kunne ikke hentes. Opdater siden for at prøve igen.
          </p>
        )}

        {/* Tom tilstand — ny bruger uden nogen projekter endnu */}
        {ingenProjekter && aftaler.length === 0 ? (
          <div className="space-y-4 mb-8">
            <div className="bg-[#f0f7f3] border border-[#1e3a2a]/10 rounded-2xl p-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm">
                <FileText size={24} strokeWidth={1.75} className="text-[#1e3a2a]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Kom i gang med dit projekt</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Beskriv dit projekt, og vi samler et aftalegrundlag du kan sende til din håndværker. Eller upload et tilbud du allerede har modtaget.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={opretNyAftale}
                  disabled={opretter}
                  className="inline-flex items-center justify-center gap-2 bg-[#1e3a2a] text-white font-bold px-6 py-3 min-h-11 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
                >
                  {opretter ? "Opretter..." : "Start aftalegrundlag"}
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
                <Link
                  href="/opret/upload"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#1e3a2a] font-semibold px-6 py-3 min-h-11 rounded-xl hover:bg-white/70 transition-colors text-sm border border-[#1e3a2a]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
                >
                  Tjek et tilbud
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e0ddd6] p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Sådan virker det</p>
              <div className="space-y-5">
                {[
                  { nr: "1", titel: "Upload dit tilbud", desc: "PDF, billede eller tekst fra en mail" },
                  { nr: "2", titel: "Vi screener dokumentet", desc: "Mod AB-Forbruger 2012 og centrale aftalepunkter" },
                  { nr: "3", titel: "Du ved hvad du mangler", desc: "Konkrete spørgsmål du kan stille håndværkeren" },
                ].map(t => (
                  <div key={t.nr} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-[#1e3a2a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {t.nr}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.titel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Handlingszone — mørk surface, maks. 2 direkte + udvid-linje */}
            {kraeverHandling.length > 0 && (
              <div className="bg-[#16241c] -mx-6 md:mx-0 md:rounded-2xl mb-10 md:mb-12">
                <div className={`grid grid-cols-1 ${Math.min(kraeverHandling.length, visAlleHandlinger ? kraeverHandling.length : 2) > 1 ? "md:grid-cols-2" : ""}`}>
                  {synligeHandlinger.map((h, i) => (
                    <div key={h.aftaleId} className={`px-6 md:px-10 py-7 md:py-9 ${i > 0 ? "border-t md:border-t-0 md:border-l border-white/10" : ""}`}>
                      <p className="text-[11px] font-semibold text-[#a9b3a5] uppercase tracking-wider mb-2.5">{h.label}</p>
                      <p className="text-lg md:text-xl font-medium text-white mb-2.5 break-words">{h.titel}</p>
                      {h.beskrivelse && <p className="text-sm text-[#8f9b8d] mb-3 break-words">{h.beskrivelse}</p>}
                      <Link
                        href={`/projekt/${h.projektId}/aftale`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#dfe8dc] border-b border-[#dfe8dc]/50 pb-0.5 hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dfe8dc] focus-visible:outline-offset-4 transition-opacity min-h-11"
                      >
                        {h.cta}
                        <ArrowRight size={15} strokeWidth={2.2} />
                      </Link>
                    </div>
                  ))}
                </div>
                {kraeverHandling.length > 2 && !visAlleHandlinger && (
                  <button
                    onClick={() => setVisAlleHandlinger(true)}
                    className="w-full flex items-center justify-end gap-1.5 px-6 md:px-10 py-4 border-t border-white/10 text-sm font-medium text-[#dfe8dc] hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dfe8dc] focus-visible:outline-offset-[-4px] transition-opacity min-h-11"
                  >
                    Se alle {kraeverHandling.length} {pluralProjekt(kraeverHandling.length)}
                    <ArrowRight size={14} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            )}

            {/* Aktive og aftalte — ens visuel vægt, sorteret internt efter fremdrift */}
            {aktiveOgAftalte.length > 0 && (
              <div className="mb-10">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Aktive og aftalte · {aktiveOgAftalte.length}
                </p>
                <div>
                  {aktiveOgAftalte.map(s => (
                    <div key={s.aftaleId}>
                      {/* Mobil — venstrestillet, stablet */}
                      <Link
                        href={`/projekt/${s.projektId}/aftale`}
                        className="md:hidden flex items-center justify-between gap-3 py-4 border-b border-[#e6e3da] min-h-11 focus-visible:outline-none focus-visible:bg-black/[0.02]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-[#16241c] truncate">{s.titel}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className="text-[#1e3a2a] font-medium">{s.statusTekst}</span>
                            {s.datoTekst && <> · {s.datoTekst}</>}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#1e3a2a] flex-shrink-0">Åbn →</span>
                      </Link>
                      {/* Desktop — fast 4-kolonne grid, status centreret */}
                      <Link
                        href={`/projekt/${s.projektId}/aftale`}
                        className="hidden md:grid grid-cols-[2fr_120px_1.6fr_auto] items-center gap-4 py-5 border-b border-[#e6e3da] focus-visible:outline-none focus-visible:bg-black/[0.02]"
                      >
                        <p className="text-[15px] text-[#16241c] min-w-0 truncate">{s.titel}</p>
                        <span className="text-[13px] font-medium text-[#1e3a2a] text-center">{s.statusTekst}</span>
                        <span className="text-[13px] text-gray-500">{s.datoTekst}</span>
                        <span className="text-[13px] font-medium text-[#1e3a2a] text-right">Åbn sag →</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Afventer og Udkast — separate, kompakte sektioner */}
            {(afventer.length > 0 || udkast.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 mb-10">
                {afventer.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Afventer · {afventer.length}</p>
                    {afventer.map(s => (
                      <Link
                        key={s.key}
                        href={s.href}
                        className="flex items-center justify-between gap-3 py-3.5 border-t border-[#e6e3da] min-h-11 focus-visible:outline-none focus-visible:bg-black/[0.02]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-[#16241c] truncate">{s.titel}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.statusTekst}</p>
                        </div>
                        <span className="text-xs font-medium text-[#1e3a2a] flex-shrink-0">{s.cta}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {udkast.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Udkast · {udkast.length}</p>
                    {udkast.map(s => (
                      <div key={s.key} className="flex items-center justify-between gap-2 border-t border-[#e6e3da]">
                        <Link
                          href={s.href}
                          className="flex-1 flex items-center justify-between gap-3 py-3.5 min-h-11 min-w-0 focus-visible:outline-none focus-visible:bg-black/[0.02]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-[#16241c] truncate">{s.titel}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.statusTekst}</p>
                          </div>
                          <span className="text-xs font-medium text-[#1e3a2a] flex-shrink-0">{s.cta}</span>
                        </Link>
                        {s.kanSlettes && (
                          <button
                            title="Slet"
                            aria-label={`Slet ${s.titel}`}
                            disabled={sletterProjekt === s.projektId}
                            onClick={() => sletProjekt(s.projektId, s.titel)}
                            className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40"
                          >
                            {sletterProjekt === s.projektId
                              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                              : <Trash2 size={16} strokeWidth={1.75} />
                            }
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Opret nyt aftalegrundlag — bevaret indgang til opret-flowet */}
            <button
              onClick={opretNyAftale}
              disabled={opretter}
              className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-[#1e3a2a]/30 rounded-2xl py-4 min-h-11 text-sm font-semibold text-[#1e3a2a] hover:border-[#1e3a2a]/60 hover:bg-[#1e3a2a]/5 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 mb-10"
            >
              <Plus size={16} strokeWidth={2} />
              {opretter ? "Opretter..." : "Nyt aftalegrundlag"}
            </button>

            {/* Bund — genveje til pakke/rådgiver (bevaret, ikke del af mockup-scope) */}
            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {!projekter.some(p => p.pakke_betalt) && (
                <Link
                  href="/pakke"
                  className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Vælg en pakke</p>
                    <p className="text-xs text-gray-400 leading-relaxed">Se hvad der er inkluderet i de forskellige løsninger</p>
                  </div>
                </Link>
              )}
              <Link
                href="/tilkoeb"
                className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">Book en rådgiver</p>
                  <p className="text-xs text-gray-400 leading-relaxed">Få en byggesagkyndig til at kigge med</p>
                </div>
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
