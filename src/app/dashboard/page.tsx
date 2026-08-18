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
import {
  FileText, Calendar, ChevronRight, Trash2, ArrowRight, ClipboardList,
  MessageSquare, AlertCircle, LayoutGrid, Shield, Plus, Home, Package, Users,
} from "lucide-react";

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
  tidsplan: { godkendt_af_bygherre: boolean; indsendt_at: string | null } | null;
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

const projekttypeLabels: Record<string, string> = {
  badevarelse: "Badeværelse", kokken: "Køkken", tag: "Tag",
  tilbygning: "Tilbygning", totalrenovering: "Totalrenovering",
  vinduer: "Vinduer og facade", maler: "Maler og gips",
  carport: "Carport og garage", vaadrum: "Vådrum", andet: "Generel renovering",
};

const statusLabel: Record<string, string> = {
  dialog: "Søger håndværker", "ingen-tilbud": "I dialog",
  tilbud: "Tilbud modtaget", accepteret: "Accepteret",
  igang: "I gang", problem: "Tvist", afsluttet: "Afsluttet",
};

const statusFarve: Record<string, string> = {
  igang: "bg-green-100 text-green-700 border-green-200",
  problem: "bg-red-100 text-red-700 border-red-200",
  afsluttet: "bg-gray-100 text-gray-500 border-gray-200",
  tilbud: "bg-amber-100 text-amber-700 border-amber-200",
  accepteret: "bg-blue-100 text-blue-700 border-blue-200",
  dialog: "bg-purple-100 text-purple-700 border-purple-200",
  "ingen-tilbud": "bg-purple-100 text-purple-700 border-purple-200",
};

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

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

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
        // Vis pakke-pop hvis brugeren har projekter men ingen betalt pakke
        // og ikke allerede har lukket pop'en denne session
        const harBetalt = projektData.some(p => p.pakke_betalt);
      }

      const { data: aftaleData } = await supabase
        .from("kontrakter")
        .select("id, projekt_id, titel, status, haandvaerker_navn, haandvaerker_email, haandvaerker_firma, oprettet_at, bygherre_godkendt_at, haandvaerker_godkendt_at, startdato, slutdato, total_pris, betalingsplan, tidsplan, forudsaetninger_sendt_at, forudsaetninger_godkendt, tilbud_dokument_url, besigtigelse_bekraeftet")
        .eq("bygherre_id", user.id)
        .order("oprettet_at", { ascending: false });

      if (aftaleData) {
        setAftaler(aftaleData);
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

  const aktiveProjekter = projekter.filter(p => p.status !== "afsluttet");
  const harProblemer = projekter.some(p => p.status === "problem");
  const ingenProjekter = projekter.length === 0;

  const fmtKr = (n: number) => n.toLocaleString("da-DK") + " kr.";
  const fmtDato = (iso: string) => new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
  const dageImellem = (fra: string, til: string) =>
    Math.round((new Date(til).getTime() - new Date(fra).getTime()) / (1000 * 60 * 60 * 24));

  // Find primær aktiv kontrakt for et projekt
  const aktivKontrakt = (projektId: string) =>
    aftaler.find(a => a.projekt_id === projektId && a.status === "begge_godkendt") ||
    aftaler.find(a => a.projekt_id === projektId);

  // Projekter der er "i gang" eller "accepteret" — vises som fuldt overblik
  const igangProjekter = projekter.filter(p => p.status === "igang" || p.status === "accepteret");
  const andreProjekter = projekter.filter(p => p.status !== "igang" && p.status !== "accepteret");

  // Sidepanelet ("Status og påmindelser") vises kun, hvis der reelt er noget
  // at vise — ingen tom widget udelukkende for at fylde 1/3-kolonnen.
  const visSidepanel = harProblemer || igangProjekter.length > 0;

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

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Velkomst */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-base text-gray-500 mb-1">
              {hilsen}{fornavn ? `, ${fornavn}` : ""}
            </p>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {ingenProjekter && aftaler.length === 0
                ? "Hvad skal du bygge?"
                : aftaler.length > 0 && ingenProjekter
                ? aftaler.length === 1 ? "Du har ét aftalegrundlag" : `Du har ${aftaler.length} aftalegrundlag`
                : aktiveProjekter.length === 1
                ? "Du har ét aktivt projekt"
                : `Du har ${aktiveProjekter.length} aktive projekter`}
            </h1>
          </div>
          <Link
            href="/opret/upload"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#1e3a2a] hover:opacity-70 transition-opacity flex-shrink-0 mt-1 min-h-11 px-2 -mx-2"
          >
            Tjek tilbud
          </Link>
        </div>

        <div className={`grid grid-cols-1 ${visSidepanel ? "lg:grid-cols-3" : ""} gap-6`}>
          {/* Hovedkolonne (2/3 på desktop) */}
          <div className={visSidepanel ? "lg:col-span-2" : ""}>

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

            {/* Aktive aftaler fra kontrakter-tabellen */}
            {aftaler.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Dine aftalegrundlag</h2>
                {besigtigelserFejl && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                    Besigtigelsesstatus kunne ikke hentes. Opdater siden for at prøve igen.
                  </p>
                )}
                <div className="space-y-3">
                  {aftaler.map(a => {
                    const beggeGodkendt = a.status === "begge_godkendt";
                    const afventerHaandvaerker = a.bygherre_godkendt_at && !a.haandvaerker_godkendt_at;
                    const underForhandling = a.status === "forhandling";
                    const kontraktStatus = getContractorUpdateStatus(a);
                    const erUdkast = !a.haandvaerker_email;

                    // Besigtigelse-status (selvstændig tabel — højeste prioritet)
                    const aktivBesigtigelse = besigtigelser.find(b => b.kontrakt_id === a.id);
                    const besigtigelseUI = aktivBesigtigelse ? getBesigtigelseStatusUI(aktivBesigtigelse) : null;

                    // Prioritet: 1 = bygherre skal svare, 2 = konkret kontrakthandling, 3 = bygherre afventer, 4 = godkendt, 5 = generel
                    const visBesigtigelseBadge = besigtigelseUI !== null && (
                      besigtigelseUI.prioritet === 1 ||
                      (!kontraktStatus.badgeText && besigtigelseUI.prioritet <= 4)
                    );

                    const statusTekst = visBesigtigelseBadge
                      ? besigtigelseUI!.badge
                      : (kontraktStatus.badgeText ?? (beggeGodkendt ? "Godkendt af begge" : afventerHaandvaerker ? "Afventer håndværker" : underForhandling ? "Under forhandling" : a.haandvaerker_email ? "Invitation sendt" : "Udkast"));
                    const statusKlasse = visBesigtigelseBadge
                      ? besigtigelseUI!.klasse
                      : (kontraktStatus.badgeKlasse || (beggeGodkendt ? "bg-green-100 text-green-700 border-green-200" : afventerHaandvaerker ? "bg-blue-100 text-blue-700 border-blue-200" : underForhandling ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"));

                    // Sekundær linje: vis generel kontrakt-info hvis besigtigelse tager badge, eller vis besigtigelse som supplement
                    const secondaryTekst = visBesigtigelseBadge && besigtigelseUI!.tekst
                      ? besigtigelseUI!.tekst
                      : (kontraktStatus.secondaryText ?? (besigtigelseUI?.tekst || null));

                    return (
                      <div key={a.id} className="flex items-center gap-2">
                        <Link
                          href={`/projekt/${a.projekt_id}/aftale`}
                          className="flex-1 bg-white rounded-2xl border border-[#e0ddd6] px-5 py-4 flex items-center justify-between hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${besigtigelseUI?.prioritet === 1 ? "bg-amber-100" : "bg-[#1e3a2a]/5"}`}>
                              {besigtigelseUI?.prioritet === 1 ? (
                                <Calendar size={20} strokeWidth={1.75} className="text-amber-800" />
                              ) : (
                                <FileText size={20} strokeWidth={1.75} className="text-[#1e3a2a]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors text-sm break-words">
                                {a.titel || "Aftalegrundlag uden titel"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {a.haandvaerker_navn || a.haandvaerker_email || "Ingen håndværker tilknyttet endnu"}
                              </p>
                              {secondaryTekst && (
                                <p className={`text-xs font-medium mt-0.5 truncate ${besigtigelseUI?.prioritet === 1 ? "text-amber-700" : "text-[#1e3a2a]"}`}>{secondaryTekst}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`max-w-[7rem] text-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusKlasse}`}>
                              {statusTekst}
                            </span>
                            <ChevronRight size={16} strokeWidth={2} className="flex-shrink-0 text-gray-300" />
                          </div>
                        </Link>
                        {erUdkast && (
                          <button
                            title="Slet udkast"
                            aria-label="Slet udkast"
                            disabled={sletterProjekt === a.projekt_id}
                            onClick={() => sletProjekt(a.projekt_id, a.titel || "Aftalegrundlag uden titel")}
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40"
                          >
                            {sletterProjekt === a.projekt_id
                              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                              : <Trash2 size={16} strokeWidth={1.75} />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={opretNyAftale}
                  disabled={opretter}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-white border border-dashed border-[#1e3a2a]/30 rounded-2xl py-4 min-h-11 text-sm font-semibold text-[#1e3a2a] hover:border-[#1e3a2a]/60 hover:bg-[#1e3a2a]/5 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40"
                >
                  <Plus size={16} strokeWidth={2} />
                  {opretter ? "Opretter..." : "Nyt aftalegrundlag"}
                </button>
              </div>
            )}

            {/* Tom tilstand — ny bruger. Lys tonal flade (ikke mørk) — det
                mørke hero-kort er forbeholdt et faktisk aktivt projekt. */}
            {ingenProjekter && aftaler.length === 0 && (
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

                {/* Tre trin */}
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
            )}

            {/* Aktive projekter — fuldt overblik. Mørkt hero-kort er
                fortsat det primære brandelement på siden. */}
            {igangProjekter.map(p => {
              const k = aktivKontrakt(p.id);
              const idag = new Date().toISOString();
              const dageТilSlut = k?.slutdato ? dageImellem(idag, k.slutdato) : null;
              const dageSidenStart = k?.startdato ? dageImellem(k.startdato, idag) : null;
              const totalDage = (k?.startdato && k?.slutdato) ? dageImellem(k.startdato, k.slutdato) : null;
              const fremdriftPct = (dageSidenStart !== null && totalDage && totalDage > 0)
                ? Math.min(100, Math.max(0, Math.round((dageSidenStart / totalDage) * 100)))
                : null;

              return (
                <div key={p.id} className="mb-6">
                  {/* Header-kort (variant A — hero) */}
                  <div className="bg-[#111c17] rounded-3xl overflow-hidden shadow-lg">
                    <div className="px-6 pt-6 pb-5">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-1">
                            {projekttypeLabels[p.projekttype] || "Byggeprojekt"}
                          </p>
                          <h2 className="text-xl font-bold text-white leading-snug">
                            {k?.titel || p.adresse || projekttypeLabels[p.projekttype] || "Dit byggeprojekt"}
                          </h2>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/20 uppercase tracking-wide">
                          I gang
                        </span>
                      </div>

                      {/* Nøgletal — 2-3 kolonner */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {k?.haandvaerker_navn && (
                          <div className="bg-white/5 rounded-2xl px-3 py-3">
                            <p className="text-[10px] text-white/40 mb-1">Håndværker</p>
                            <p className="text-sm font-bold text-white leading-snug truncate">{k.haandvaerker_navn}</p>
                            {k.haandvaerker_firma && <p className="text-[10px] text-white/40 mt-0.5 truncate">{k.haandvaerker_firma}</p>}
                          </div>
                        )}
                        {k?.total_pris && (
                          <div className="bg-white/5 rounded-2xl px-3 py-3">
                            <p className="text-[10px] text-white/40 mb-1">Entreprisesum</p>
                            <p className="text-sm font-bold text-white">{fmtKr(k.total_pris)}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">inkl. moms</p>
                          </div>
                        )}
                        {dageТilSlut !== null && (
                          <div className="bg-white/5 rounded-2xl px-3 py-3">
                            <p className="text-[10px] text-white/40 mb-1">Aflevering</p>
                            <p className={`text-sm font-bold ${dageТilSlut < 7 ? "text-amber-400" : "text-white"}`}>
                              {dageТilSlut <= 0 ? "I dag" : `${dageТilSlut} dage`}
                            </p>
                            {k?.slutdato && <p className="text-[10px] text-white/40 mt-0.5">{fmtDato(k.slutdato)}</p>}
                          </div>
                        )}
                      </div>

                      {/* Tidslinje-bar */}
                      {fremdriftPct !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-white/40">
                              {k?.startdato ? fmtDato(k.startdato) : "Opstart"}
                            </p>
                            <p className="text-[10px] font-semibold text-white/60">{fremdriftPct}% af tidsplanen</p>
                            <p className="text-[10px] text-white/40">
                              {k?.slutdato ? fmtDato(k.slutdato) : "Aflevering"}
                            </p>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#4ade80] rounded-full transition-all"
                              style={{ width: `${fremdriftPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hurtige handlinger */}
                    <div className="grid grid-cols-3 border-t border-white/10">
                      {[
                        { href: `/projekt/${p.id}/ekstraarbejde`, Ikon: ClipboardList, label: "Ekstraarbejde" },
                        { href: `/projekt/${p.id}/chat`, Ikon: MessageSquare, label: "Besked" },
                        { href: `/projekt/${p.id}/mangler`, Ikon: AlertCircle, label: "Mangel" },
                      ].map((a, i) => (
                        <Link
                          key={i}
                          href={a.href}
                          className="flex flex-col items-center justify-center gap-1.5 py-4 min-h-11 text-white/60 hover:text-white hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:bg-white/10"
                        >
                          <a.Ikon size={16} strokeWidth={1.75} />
                          <span className="text-[10px] font-semibold">{a.label}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Se fuldt projektrum — nu en linje i hero-kortet i
                        stedet for et separat hvidt kort */}
                    <Link
                      href={`/projekt/${p.id}`}
                      className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all group focus-visible:outline-none focus-visible:bg-white/10"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <LayoutGrid size={16} strokeWidth={1.75} />
                        Åbn projektrum
                      </span>
                      <ChevronRight size={16} strokeWidth={2} className="text-white/40 group-hover:text-white/70 transition-colors" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Øvrige projekter — kompakt liste */}
            {andreProjekter.length > 0 && (
              <div className="mb-6">
                {igangProjekter.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Andre projekter</h2>
                    <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a2a] hover:underline min-h-11 px-2 -mx-2">
                      <Plus size={16} strokeWidth={2.5} />
                      Nyt
                    </Link>
                  </div>
                )}
                {igangProjekter.length === 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Dine projekter</h2>
                    <Link href="/opret" className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a2a] hover:underline min-h-11 px-2 -mx-2">
                      <Plus size={16} strokeWidth={2.5} />
                      Nyt projekt
                    </Link>
                  </div>
                )}
                <div className="space-y-3">
                  {andreProjekter.map(p => {
                    const kanSlettes = p.status === "dialog" || p.status === "ingen-tilbud";
                    const projektLabel = p.adresse || projekttypeLabels[p.projekttype] || "Byggeprojekt";
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <Link
                          href={`/projekt/${p.id}`}
                          className="flex-1 bg-white rounded-2xl border border-[#e0ddd6] px-5 py-4 flex items-center justify-between hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0">
                              <Home size={20} strokeWidth={1.75} className="text-[#1e3a2a]" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-[#1e3a2a] transition-colors text-sm">
                                {projektLabel}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(p.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "long" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusFarve[p.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                              {statusLabel[p.status] || p.status}
                            </span>
                            <ChevronRight size={16} strokeWidth={2} className="text-gray-300" />
                          </div>
                        </Link>
                        {kanSlettes && (
                          <button
                            title="Slet projekt"
                            aria-label="Slet projekt"
                            disabled={sletterProjekt === p.id}
                            onClick={() => sletProjekt(p.id, projektLabel)}
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40"
                          >
                            {sletterProjekt === p.id
                              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                              : <Trash2 size={16} strokeWidth={1.75} />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/opret/upload"
                  className="mt-4 flex items-center justify-center gap-2 bg-white border border-dashed border-[#1e3a2a]/30 rounded-2xl py-4 min-h-11 text-sm font-semibold text-[#1e3a2a] hover:border-[#1e3a2a]/60 hover:bg-[#1e3a2a]/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40"
                >
                  <Plus size={16} strokeWidth={2} />
                  Tjek nyt tilbud
                </Link>
              </div>
            )}

            {/* Bund — genveje */}
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {!projekter.some(p => p.pakke_betalt) && (
                <Link
                  href="/pakke"
                  className="bg-white rounded-2xl border border-[#e0ddd6] p-5 hover:border-[#1e3a2a]/40 hover:shadow-sm transition-all group flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/40 focus-visible:ring-offset-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a2a]/10 transition-colors">
                    <Package size={20} strokeWidth={1.75} className="text-[#1e3a2a]" />
                  </div>
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
                <div className="w-10 h-10 rounded-xl bg-[#1e3a2a]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a2a]/10 transition-colors">
                  <Users size={20} strokeWidth={1.75} className="text-[#1e3a2a]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">Book en rådgiver</p>
                  <p className="text-xs text-gray-400 leading-relaxed">Få en byggesagkyndig til at kigge med</p>
                </div>
              </Link>
            </div>

          </div>

          {/* Sidekolonne (1/3 på desktop) — kun status/påmindelser der reelt
              er relevante. Renderes slet ikke, hvis der intet er (se
              visSidepanel ovenfor), i stedet for en tom hvid boks. */}
          {visSidepanel && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#e0ddd6] p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Status og påmindelser</p>
                <div className="divide-y divide-gray-50">
                  {harProblemer && (
                    <div className="py-3 first:pt-0 flex items-start gap-3">
                      <Shield size={20} strokeWidth={1.75} className="flex-shrink-0 mt-0.5 text-red-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-800">Et projekt har en aktiv tvist</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Vi anbefaler kontakt til en byggesagkyndig.{" "}
                          <Link href="/tilkoeb" className="font-semibold text-[#1e3a2a] hover:underline">Se rådgiverydelser</Link>
                        </p>
                      </div>
                    </div>
                  )}
                  {igangProjekter.map(p => (
                    <div key={p.id} className="py-3 first:pt-0 flex items-start gap-3">
                      <Shield size={20} strokeWidth={1.75} className="flex-shrink-0 mt-0.5 text-[#1e3a2a]/70" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700">Husk: ekstraarbejde aftales skriftligt inden opstart</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">AB-Forbruger § 23 · {p.adresse || projekttypeLabels[p.projekttype] || "dit projekt"}</p>
                        <Link href={`/projekt/${p.id}/ekstraarbejde`} className="text-[10px] font-bold text-[#1e3a2a] hover:underline mt-1 inline-block">
                          Opret seddel
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
