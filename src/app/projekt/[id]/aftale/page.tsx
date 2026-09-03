"use client";

import { use, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProjektNav from "@/components/ProjektNav";
import { createClient } from "@/lib/supabase";
import DokumentRenderer from "@/components/DokumentRenderer";
import { erV2Dokument, parseV2Sektioner, byggV2Dokument, indeholderKonkretDato } from "@/lib/dokumentV2";
import { fmtBesigtigelseDatoLang, erBesigtigelsePasseret, hentEffektivDatoTid, fmtTidsinterval } from "@/lib/besigtigelse";
import { findUafklaredeForslag } from "@/lib/kontraktGodkendelse";
import { hentOprindeligAftaltSlutdato, hentOprindeligAftaltStartdato } from "@/lib/kontraktSlutdato";
import { beregnKontraktDeadline } from "@/lib/kontraktDeadline";
import { Plus, UserPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type ReviewAendringType, reviewAendringVisningstekst } from "@/lib/reviewAendringVisning";

interface BesigtigelseTidspunktRad {
  id: string;
  dato: string;
  tidspunkt: string;
}

interface Besigtigelse {
  id: string;
  kontrakt_id: string;
  dato: string | null;
  tidspunkt: string | null;
  varighed_minutter: number | null;
  valgt_tidspunkt_id: string | null;
  status: string;
  foreslaaet_af: string;
  kommentar_haandvaerker: string | null;
  kommentar_bygherre: string | null;
  tidspunkter?: BesigtigelseTidspunktRad[];
}

interface Aendring {
  id: string;
  felt: string;
  gammel_vaerdi: string;
  ny_vaerdi: string;
  forfatter: string;
  forfatter_navn: string | null;
  kommentar: string | null;
  status: "afventer" | "accepteret" | "afvist";
  oprettet_at: string;
  besvaret_at?: string | null;
}

// Sektionsbaseret forhandling v1 — REVIEW_TYPE_FOR_KEY er specifik for
// denne sides korte review-id'er (samme id'er som reviewPunkter allerede
// bruger). Selve felt-typerne og deres visningsformatering er delt med
// entreprenørens side via src/lib/reviewAendringVisning.ts, så begge
// sider aldrig kan komme til at fortolke samme ny_vaerdi-JSON forskelligt.
const REVIEW_TYPE_FOR_KEY: Record<string, ReviewAendringType> = {
  pris: "review_total_pris",
  tidsplan: "review_tidsplan",
  betalingsplan: "review_betalingsplan",
  forudsaetninger: "review_forudsaetninger",
};

interface ReviewDraft {
  foreslaaetPris: string;
  startdato: string;
  slutdato: string;
  kommentar: string;
}

const TOM_REVIEW_DRAFT: ReviewDraft = { foreslaaetPris: "", startdato: "", slutdato: "", kommentar: "" };

function reviewDraftGyldig(key: string, draft: ReviewDraft): boolean {
  const kommentar = draft.kommentar.trim();
  if (key === "pris") return !!kommentar || !!draft.foreslaaetPris.trim();
  if (key === "tidsplan") return !!kommentar || !!draft.startdato || !!draft.slutdato;
  return !!kommentar;
}

// Diskret "footer" til et review-kort: åbner et lille kontekstuelt
// inline-draft (klientlokalt, intet sendt til serveren endnu), viser
// enten "Foreslå ændring", et klargjort-udkast med Rediger/Fjern, eller
// den seneste faktisk sendte anmodning og dens status.
function ReviewAendringFooter({
  reviewKey,
  draft,
  redigerer,
  senesteAendring,
  onAabn,
  onSkift,
  onGem,
  onAnnuller,
  onFjern,
}: {
  reviewKey: string;
  draft: ReviewDraft | undefined;
  redigerer: boolean;
  senesteAendring: Aendring | null;
  onAabn: () => void;
  onSkift: (draft: ReviewDraft) => void;
  onGem: () => void;
  onAnnuller: () => void;
  onFjern: () => void;
}) {
  const type = REVIEW_TYPE_FOR_KEY[reviewKey];

  if (redigerer) {
    const d = draft ?? TOM_REVIEW_DRAFT;
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        {type === "review_total_pris" && (
          <input
            type="number"
            placeholder="Foreslået beløb (valgfrit)"
            value={d.foreslaaetPris}
            onChange={(e) => onSkift({ ...d, foreslaaetPris: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
          />
        )}
        {type === "review_tidsplan" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={d.startdato}
              onChange={(e) => onSkift({ ...d, startdato: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
            />
            <input
              type="date"
              value={d.slutdato}
              onChange={(e) => onSkift({ ...d, slutdato: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
            />
          </div>
        )}
        <textarea
          rows={2}
          placeholder={
            type === "review_betalingsplan"
              ? "Fx: Jeg ønsker betaling 50 % ved opstart og 50 % ved aflevering."
              : type === "review_forudsaetninger"
              ? "Fx: Tilføj, at eksisterende inventar afdækkes inden arbejdet starter."
              : "Kommentar (valgfrit)"
          }
          value={d.kommentar}
          onChange={(e) => onSkift({ ...d, kommentar: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
        />
        <div className="flex gap-2">
          <button onClick={onAnnuller} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">
            Annuller
          </button>
          <button
            onClick={onGem}
            disabled={!reviewDraftGyldig(reviewKey, d)}
            className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            Klargør ændringsønske
          </button>
        </div>
      </div>
    );
  }

  if (draft) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-gray-600">Ændringsønske klargjort</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={onAabn} className="text-xs font-semibold text-[#1e3a2a] hover:underline">Rediger</button>
          <button onClick={onFjern} className="text-xs text-gray-400 hover:text-red-500">Fjern</button>
        </div>
      </div>
    );
  }

  if (senesteAendring) {
    const statusTekst =
      senesteAendring.status === "accepteret" ? "Indarbejdet"
      : senesteAendring.status === "afvist" ? "Afvist"
      : "Afventer entreprenør";
    const statusKlasse =
      senesteAendring.status === "accepteret" ? "bg-green-50 text-green-700 border-green-100"
      : senesteAendring.status === "afvist" ? "bg-gray-50 text-gray-500 border-gray-200"
      : "bg-amber-50 text-amber-700 border-amber-100";
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-gray-500">Dit ændringsønske</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusKlasse}`}>{statusTekst}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{reviewAendringVisningstekst(senesteAendring.felt, senesteAendring.ny_vaerdi)}</p>
        {senesteAendring.status !== "afventer" && (
          <button onClick={onAabn} className="mt-2 text-xs font-medium text-gray-400 hover:text-[#1e3a2a] transition-colors">
            Foreslå ny ændring
          </button>
        )}
      </div>
    );
  }

  return (
    <button onClick={onAabn} className="mt-4 pt-4 border-t border-gray-100 w-full text-left text-xs font-medium text-gray-400 hover:text-[#1e3a2a] transition-colors">
      Foreslå ændring
    </button>
  );
}

interface TidsplanFase {
  navn: string;
  startdato: string;
  slutdato: string;
}

interface Tidsplan {
  type: "faser" | "ingen_tidsplan";
  faser?: TidsplanFase[];
  godkendt_af_bygherre: boolean;
  godkendt_at?: string | null;
  indsendt_at?: string;
}

interface Kontrakt {
  id: string;
  titel: string | null;
  beskrivelse: string | null;
  total_pris: number | null;
  betalingsplan: { milepæl: string; andel: string }[] | null;
  vilkaar: string | null;
  startdato: string | null;
  slutdato: string | null;
  haandvaerker_token: string;
  haandvaerker_email: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
  status: string;
  bygherre_godkendt_at: string | null;
  haandvaerker_godkendt_at: string | null;
  kontraktaendringer: Aendring[];
  tidsplan: Tidsplan | null;
  tilbud_dokument_url: string | null;
  tilbud_dokument_navn: string | null;
  besigtigelse_dato: string | null;
  besigtigelse_tid: string | null;
  besigtigelse_bekraeftet: boolean | null;
  forudsaetninger: string | null;
  forudsaetninger_sendt_at: string | null;
  forudsaetninger_godkendt: boolean | null;
  oprettet_at: string;
}

const fmtKr = (n: number) =>
  n.toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " kr.";

// Tidsplan UX cleanup v1 — én delt radkomponent til den samlede
// tidsplanssektion, så "gældende aflevering" kan fremhæves typografisk
// (font weight/størrelse/baggrund) uden skrigende farve, jf. designsystemets
// afdæmpede accentfarve (#f0f7f3), ikke grøn tekst.
function TidsplanDatoRow({ label, værdi, fremhaevet = false }: { label: string; værdi: string; fremhaevet?: boolean }) {
  if (fremhaevet) {
    return (
      <div className="flex items-center justify-between gap-3 bg-[#f0f7f3] rounded-xl px-4 py-3 mt-2">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{label}</p>
        <p className="text-base font-bold text-gray-900">{værdi}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{værdi}</p>
    </div>
  );
}

// Review-/bekræftelsesflow v2 — kontekstuel bekræftelse. I stedet for en
// samlet "indkøbsliste" af checkboxe i sidebaren bekræfter bygherre hvert
// punkt dér, hvor indholdet faktisk vises (nederst i den relevante
// sektion). Ren lokal UX-state, ingen persistence — kun en visuel
// sikkerhedsforanstaltning før selve den juridiske handling
// ("Godkend og indgå aftale"). Bruger den delte Radix-baserede Switch
// (src/components/ui/switch.tsx) for rigtig role="switch"-semantik.
// Label og Switch er forbundet via htmlFor/id (ikke nested), så et klik
// på teksten kun udløser ét enkelt, nativt label→control-klik — ingen
// dobbelt-toggle.
function ReviewBekraeftRow({ id, label, bekraeftet, onToggle }: { id: string; label: string; bekraeftet: boolean; onToggle: (checked: boolean) => void }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
      <label
        htmlFor={id}
        className={`text-[13px] leading-none cursor-pointer select-none transition-colors ${
          bekraeftet ? "font-semibold text-[#1e3a2a]" : "font-medium text-gray-600 hover:text-gray-800"
        }`}
      >
        {label}
      </label>
      <Switch id={id} checked={bekraeftet} onCheckedChange={onToggle} />
    </div>
  );
}

const feltLabels: Record<string, string> = {
  titel: "Projekttitel",
  beskrivelse: "Arbejdets omfang",
  total_pris: "Entreprisesum",
  vilkaar: "Vilkår",
  startdato: "Startdato",
  slutdato: "Slutdato",
};

// Fælles hjælper til autentificerede /api/kontrakt-kald: henter en frisk
// session, sender den som Bearer-token, og oversætter 401/403 til en
// fejltype, så kaldstedet ikke selv skal huske at tjekke det.
async function autentificeretFetch(
  url: string,
  init?: RequestInit
): Promise<{ res: Response } | { fejltype: "session" | "adgang" }> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { fejltype: "session" };
  }
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${session.access_token}` },
  });
  if (res.status === 401) return { fejltype: "session" };
  if (res.status === 403) return { fejltype: "adgang" };
  return { res };
}

function skrivFejlTekst(fejltype: "session" | "adgang"): string {
  return fejltype === "session"
    ? "Din session er udløbet. Log ind igen for at fortsætte."
    : "Du har ikke adgang til denne sag.";
}

export default function Forhandling({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [kontrakt, setKontrakt] = useState<Kontrakt | null | "loading">("loading");
  const [redigererFelt, setRedigererFelt] = useState<string | null>(null);
  const [feltVaerdi, setFeltVaerdi] = useState("");
  const [inviterEmail, setInviterEmail] = useState("");
  const [inviterCvr, setInviterCvr] = useState("");
  const [cvrData, setCvrData] = useState<{ navn: string; adresse: string } | null>(null);
  const [cvrFejl, setCvrFejl] = useState("");
  const [cvrSoeger, setCvrSoeger] = useState(false);
  const [visInviter, setVisInviter] = useState(false);
  const [kopieret, setKopieret] = useState(false);
  const [sender, setSender] = useState(false);
  const [godkender, setGodkender] = useState(false);
  const [godkendFejl, setGodkendFejl] = useState("");
  // Pre-contract lifecycle v2 — "Anmod om ændringer": sekundær handling i
  // bygherres review-fase, genåbner aftalegrundlaget for entreprenøren i
  // stedet for kun at tilbyde et binært "godkend alt / gør ingenting".
  const [visAendringsModal, setVisAendringsModal] = useState(false);
  const [aendringsBesked, setAendringsBesked] = useState("");
  const [senderAendring, setSenderAendring] = useState(false);
  const [aendringsFejl, setAendringsFejl] = useState("");
  // Review-/bekræftelsesflow før endelig godkendelse v1 — ren lokal
  // UX-gate, ingen persistens. Nulstilles bevidst ved genindlæsning, så
  // bygherre aktivt genbekræfter hver gang. Erstatter ikke og skriver
  // ikke til den juridiske kontraktgodkendelse (bygherre_godkendt_at).
  // Sektionsbaseret forhandling v1 (rettelse) — bekræftelserne må ikke
  // overleve til en NY entreprenørgodkendt revision (fx efter et
  // ændringsønske). Rå state gemmer derfor selv den "runde"
  // (kontrakt.haandvaerker_godkendt_at), den blev lavet imod; den
  // faktiske, læste reviewBekraeftet nedenfor er en ren afledt værdi —
  // ingen useEffect nødvendig for at nulstille den.
  const [reviewBekraeftetRunde, setReviewBekraeftetRunde] = useState<{ runde: string | null; bekraeftelser: Record<string, boolean> }>({ runde: null, bekraeftelser: {} });
  // Vises først efter et forsøg på at godkende med manglende review-punkter
  // — listen over manglende punkter selv er altid afledt live af
  // reviewBekraeftet, så den forsvinder automatisk, når alt er bekræftet.
  const [visManglendeReview, setVisManglendeReview] = useState(false);
  // Sektionsbaseret forhandling v1 — lokale, klient-only udkast til
  // konkrete ændringsønsker. Intet sendes til serveren, før bygherre
  // aktivt trykker "Send X ændringsønsker". Nøglen er den samme korte
  // review-id ("pris"/"tidsplan"/"betalingsplan"/"forudsaetninger") som
  // reviewPunkter allerede bruger.
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [aabenDraftEditor, setAabenDraftEditor] = useState<string | null>(null);
  const [senderReviewAendringer, setSenderReviewAendringer] = useState(false);
  const [reviewAendringerFejl, setReviewAendringerFejl] = useState("");
  const [gemmer, setGemmer] = useState(false);
  const [redigererBetalingsplan, setRedigererBetalingsplan] = useState(false);
  const [betalingsplanRækker, setBetalingsplanRækker] = useState<{milepæl: string; andel: string}[]>([]);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [alleKontrakter, setAlleKontrakter] = useState<{ id: string; titel: string | null; status: string; oprettet_at: string }[]>([]);
  const [opretter, setOpretter] = useState(false);
  const [opretFejl, setOpretFejl] = useState("");
  const [besigtigelse, setBesigtigelse] = useState<Besigtigelse | null | "loading" | "error">("loading");
  const [sideFejl, setSideFejl] = useState("");
  const [skrivFejl, setSkrivFejl] = useState("");
  const [projektAdresse, setProjektAdresse] = useState<string | null>(null);
  const [v2Fejl, setV2Fejl] = useState("");
  // Agreement sheet deadline extension v1 — ALLE aftalesedler for hele
  // projektet, hentet én gang, så den eksisterende canonical nummerering
  // (ældste = #1, se ekstraarbejde-siderne) kan genbruges uændret. Kun
  // godkendte sedler for DENNE kontrakt indgår senere i selve
  // fristforlængelses-summen.
  const [alleAftalesedler, setAlleAftalesedler] = useState<{
    id: string; kontrakt_id: string; beskrivelse: string; status: string;
    haandvaerker_tidsdage: number | null; oprettet_at: string; godkendt_at: string | null;
  }[]>([]);

  const hentKontrakt = useCallback(async (kontraktId?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setKontrakt(null);
      setSideFejl(skrivFejlTekst("session"));
      return;
    }

    const url = kontraktId
      ? `/api/kontrakt?projekt_id=${id}&bygherre_id=${user.id}&kontrakt_id=${kontraktId}`
      : `/api/kontrakt?projekt_id=${id}&bygherre_id=${user.id}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (r.status === 401) {
      setKontrakt(null);
      setSideFejl(skrivFejlTekst("session"));
      return;
    }
    if (r.status === 403) {
      setKontrakt(null);
      setSideFejl(skrivFejlTekst("adgang"));
      return;
    }
    const d = await r.json();
    if (!d.error) { setKontrakt(d); setProjektAdresse(d.projekt_adresse ?? null); setSideFejl(""); }
    else setKontrakt(null);

    // Agreement sheet deadline extension v1 — projekt-scoped, ét kald,
    // samme etablerede client-side læsemønster som den eksisterende
    // aftaleseddel-oversigt.
    const { data: sedler } = await supabase
      .from("ekstraarbejde")
      .select("id, kontrakt_id, beskrivelse, status, haandvaerker_tidsdage, oprettet_at, godkendt_at")
      .eq("projekt_id", id)
      .order("oprettet_at", { ascending: false });
    setAlleAftalesedler(sedler ?? []);

    if (session?.access_token) {
      const alleR = await fetch(`/api/projekter/${id}/kontrakter`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (alleR.ok) {
        const alleD = await alleR.json();
        if (Array.isArray(alleD)) setAlleKontrakter(alleD);
      }
    }

    // Hent besigtigelse for den aktuelle kontrakt
    if (d && !d.error && d.id) {
      if (session?.access_token) {
        setBesigtigelse("loading");
        const bRes = await fetch(`/api/besigtigelse?kontrakt_id=${d.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          setBesigtigelse(bData ?? null);
        } else {
          setBesigtigelse("error");
        }
      }
    }

    const { data: profil } = await supabase
      .from("profiler").select("navn").eq("id", user.id).single();
    setBrugerNavn(profil?.navn || user.email?.split("@")[0] || "Bygherre");
  }, [id]);

  useEffect(() => { hentKontrakt(); }, [hentKontrakt]);

  const invitationslink = kontrakt && typeof kontrakt === "object"
    ? `${typeof window !== "undefined" ? window.location.origin : "https://nembyggestyring.dk"}/kontrakt/${kontrakt.haandvaerker_token}`
    : "";

  async function kopierLink() {
    await navigator.clipboard.writeText(invitationslink);
    setKopieret(true);
    setTimeout(() => setKopieret(false), 2500);
  }

  async function gemBetalingsplan() {
    if (!kontrakt || typeof kontrakt !== "object") return;
    const gyldige = betalingsplanRækker.filter(r => r.milepæl.trim() && r.andel.trim());
    setGemmer(true);
    setSkrivFejl("");
    try {
      const resultat = await autentificeretFetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, betalingsplan: gyldige }),
      });
      if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const data = await resultat.res.json();
      if (!data.error) {
        setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
        setRedigererBetalingsplan(false);
      } else {
        setSkrivFejl("Kunne ikke gemme betalingsplanen. Prøv igen.");
      }
    } finally {
      setGemmer(false);
    }
  }

  async function gemFeltOpdatering(felt: string) {
    if (!kontrakt || typeof kontrakt !== "object") return;
    setGemmer(true);
    setSkrivFejl("");
    try {
      const resultat = await autentificeretFetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: kontrakt.id,
          [felt]: felt === "total_pris" ? parseFloat(feltVaerdi) : feltVaerdi,
          // startdato/slutdato sendes som ISO-streng direkte
        }),
      });
      if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const data = await resultat.res.json();
      if (!data.error) {
        setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
        setRedigererFelt(null);
      } else {
        setSkrivFejl("Kunne ikke gemme ændringen. Prøv igen.");
      }
    } finally {
      setGemmer(false);
    }
  }

  async function slaaCvrOp() {
    const nr = inviterCvr.replace(/\s/g, "");
    if (nr.length !== 8) return;
    setCvrSoeger(true);
    setCvrFejl("");
    setCvrData(null);
    try {
      const r = await fetch(`/api/cvr?nr=${nr}`);
      const d = await r.json();
      if (d.error) { setCvrFejl("CVR-nummer ikke fundet"); }
      else { setCvrData({ navn: d.navn, adresse: d.adresse }); }
    } catch {
      setCvrFejl("Kunne ikke hente CVR-data");
    } finally {
      setCvrSoeger(false);
    }
  }

  async function sendInvitation() {
    if (!kontrakt || typeof kontrakt !== "object" || !inviterEmail.trim()) return;
    setSender(true);
    setSkrivFejl("");
    try {
      // Gem håndværkerinfo + email på kontrakten
      const resultat = await autentificeretFetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kontrakt_id: kontrakt.id,
          haandvaerker_email: inviterEmail.trim(),
          ...(cvrData ? { haandvaerker_firma: cvrData.navn } : {}),
          ...(inviterCvr.replace(/\s/g, "").length === 8 ? { haandvaerker_cvr: inviterCvr.replace(/\s/g, "") } : {}),
        }),
      });
      if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const opdateretData = await resultat.res.json();
      if (opdateretData.error) {
        setSkrivFejl("Kunne ikke gemme håndværkerens oplysninger. Prøv igen.");
        return;
      }

      // Send e-mail til håndværker
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: inviterEmail.trim(),
          link: invitationslink,
          firma: cvrData?.navn || null,
          projekttitel: kontrakt.titel || null,
        }),
      });

      setKontrakt(prev => prev && typeof prev === "object"
        ? { ...prev, haandvaerker_email: inviterEmail.trim(), haandvaerker_firma: cvrData?.navn || prev.haandvaerker_firma, status: "inviteret" }
        : prev);
      setVisInviter(false);
      setInviterCvr("");
      setCvrData(null);
    } finally {
      setSender(false);
    }
  }

  async function opretNyKontrakt() {
    if (opretter) return;
    setOpretter(true);
    setOpretFejl("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setOpretFejl("Din session er udløbet. Log ind igen for at oprette en ny sag.");
        return;
      }

      const r = await fetch(`/api/projekter/${id}/kontrakter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      if (r.status === 401) {
        setOpretFejl("Din session er udløbet. Log ind igen for at oprette en ny sag.");
        return;
      }
      if (r.status === 403) {
        setOpretFejl("Du har ikke adgang til denne sag.");
        return;
      }
      const d = await r.json();
      if (!d.error) {
        setKontrakt({ ...d });
        const alleR = await fetch(`/api/projekter/${id}/kontrakter`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (alleR.ok) {
          const alleD = await alleR.json();
          if (Array.isArray(alleD)) setAlleKontrakter(alleD);
        }
      } else {
        setOpretFejl("Kunne ikke oprette ny sag. Prøv igen.");
      }
    } finally {
      setOpretter(false);
    }
  }

  async function sletTilbudsDokument() {
    if (!kontrakt || typeof kontrakt !== "object") return;
    await fetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/tilbud-slet`, { method: "DELETE" });
    setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, tilbud_dokument_url: null, tilbud_dokument_navn: null } : prev);
  }

  async function besvarForslag(aendring_id: string, status: "accepteret" | "afvist") {
    if (!kontrakt || typeof kontrakt !== "object") return;
    setSkrivFejl("");
    const resultat = await autentificeretFetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/forslag`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aendring_id, status }),
    });
    if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
    const data = await resultat.res.json();
    if (!data.error) {
      await hentKontrakt();
    } else {
      setSkrivFejl(data.error);
    }
  }

  async function godkendKontrakt() {
    if (!kontrakt || typeof kontrakt !== "object") return;
    setGodkendFejl("");
    setGodkender(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setGodkendFejl("Du er ikke logget ind. Genindlæs siden og prøv igen.");
        return;
      }
      const r = await fetch(`/api/kontrakt/${kontrakt.haandvaerker_token}/godkend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (data.error) {
        setGodkendFejl(data.error);
      } else {
        setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
      }
    } catch {
      setGodkendFejl("Der opstod en fejl under godkendelsen. Kontrollér din forbindelse, og prøv igen.");
    } finally {
      setGodkender(false);
    }
  }

  // Pre-contract lifecycle v2 — genåbner det entreprenørgodkendte
  // aftalegrundlag for entreprenøren i stedet for et binært
  // godkend-alt/gør-intet-valg. Genbruger den eksisterende
  // /api/kontrakt POST-route (samme mønster som godkend_tidsplan m.fl.).
  async function anmodOmAendringer() {
    if (!kontrakt || typeof kontrakt !== "object" || senderAendring) return;
    if (!aendringsBesked.trim()) {
      setAendringsFejl("Skriv en kort besked om, hvad der skal ændres.");
      return;
    }
    setAendringsFejl("");
    setSenderAendring(true);
    try {
      const resultat = await autentificeretFetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, anmod_om_aendringer: true, besked: aendringsBesked.trim() }),
      });
      if ("fejltype" in resultat) { setAendringsFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const data = await resultat.res.json();
      if (!data.error) {
        setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
        setVisAendringsModal(false);
        setAendringsBesked("");
      } else {
        setAendringsFejl(data.error || "Kunne ikke sende anmodningen. Prøv igen.");
      }
    } finally {
      setSenderAendring(false);
    }
  }

  // Sektionsbaseret forhandling v1 — sender ALLE klargjorte lokale
  // ændringsønsker i ét samlet kald. Fail-closed rækkefølge håndteres
  // server-side (pre-check → batched insert → verificér antal → først
  // derefter genåbnes kontrakten). Klienten venter blot på ét svar og
  // clearer først det lokale udkast-state, når serveren bekræfter succes.
  async function sendReviewAendringer() {
    if (!kontrakt || typeof kontrakt !== "object" || senderReviewAendringer) return;
    const nøgler = Object.keys(reviewDrafts);
    if (nøgler.length === 0) return;

    const review_aendringer = nøgler.map((key) => {
      const draft = reviewDrafts[key];
      const payload: Record<string, unknown> = { type: REVIEW_TYPE_FOR_KEY[key], kommentar: draft.kommentar.trim() || undefined };
      if (key === "pris" && draft.foreslaaetPris.trim()) {
        payload.foreslaaetPris = parseFloat(draft.foreslaaetPris.replace(",", "."));
      }
      if (key === "tidsplan") {
        if (draft.startdato) payload.startdato = draft.startdato;
        if (draft.slutdato) payload.slutdato = draft.slutdato;
      }
      return payload;
    });

    setReviewAendringerFejl("");
    setSenderReviewAendringer(true);
    try {
      const resultat = await autentificeretFetch("/api/kontrakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontrakt_id: kontrakt.id, action: "send_review_aendringer", review_aendringer }),
      });
      if ("fejltype" in resultat) { setReviewAendringerFejl(skrivFejlTekst(resultat.fejltype)); return; }
      const data = await resultat.res.json();
      if (!data.error) {
        setReviewDrafts({});
        setAabenDraftEditor(null);
        await hentKontrakt();
      } else {
        setReviewAendringerFejl(data.error || "Kunne ikke sende ændringsønskerne. Prøv igen.");
      }
    } finally {
      setSenderReviewAendringer(false);
    }
  }

  if (kontrakt === "loading") {
    return (
      <div className="min-h-screen bg-[#f5f3ee]">
        <ProjektNav id={id} />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!kontrakt) {
    return (
      <div className="min-h-screen bg-[#f5f3ee]">
        <ProjektNav id={id} />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-500">{sideFejl || "Kunne ikke hente kontraktdata."}</p>
        </div>
      </div>
    );
  }

  const afventerForslag = kontrakt.kontraktaendringer.filter(a => a.status === "afventer");
  const accepteredeAendringer = kontrakt.kontraktaendringer.filter(a => a.status === "accepteret").length;
  const revision = accepteredeAendringer + 1;
  const erBeggeGodkendt = kontrakt.status === "begge_godkendt";
  const bygherreGodkendt = !!kontrakt.bygherre_godkendt_at;
  const haandvaerkerGodkendt = !!kontrakt.haandvaerker_godkendt_at;
  const uafklaret = findUafklaredeForslag(kontrakt);

  // Review-/bekræftelsesflow før endelig godkendelse v1 — hvilke punkter
  // der reelt findes at gennemgå, afgøres af den samme data/rendering som
  // resten af siden allerede bruger, ikke en ny condition-engine:
  // - Pris: findes altid her — /api/kontrakt/[token]/godkend afviser al
  //   godkendelse (også håndværkerens egen, forud for bygherres) uden
  //   total_pris > 0, og haandvaerkerGodkendt er allerede en forudsætning
  //   for at nå hertil.
  // - Betalingsplan: "Betalingsplan"-kortet nedenfor viser altid reelt
  //   indhold (aftalt/foreslået plan eller default AB-Forbruger §25-tekst,
  //   som også indgår i selve DokumentRenderer-dokumentet).
  // - Forudsætninger: kun hvis forudsaetninger_sendt_at er sat — samme
  //   betingelse som det eksisterende Forudsætninger-kort allerede bruger.
  // Omfang: for V2-dokumenter er det den udtrukne arbejdsomfang-sektion
  // (samme kilde som DokumentRenderer selv bruger til at afgøre om
  // "Arbejdsomfang" vises) der afgør relevans — ikke blot om beskrivelse
  // som helhed er ikke-tom, som ellers kunne dække over et V2-dokument med
  // fx kun krav/praktiske forhold udfyldt.
  const omfangIndhold = erV2Dokument(kontrakt.beskrivelse)
    ? parseV2Sektioner(kontrakt.beskrivelse || "").arbejdsomfang
    : kontrakt.beskrivelse;
  // Tidsplan: samme kilde som DokumentRenderers egen harTidsplan-gate og
  // den canonical dato-helper (kontraktSlutdato.ts) — kontrakt.tidsplan
  // alene er for snævert, fordi den canonical logik bevidst falder tilbage
  // til kontrakt.startdato/slutdato, når der ikke findes en godkendt
  // fasetidsplan. En eksplicit "ingen fast tidsplan"-fravigelse (§12) tæller
  // også som reelt indhold at gennemgå.
  // Pre-contract lifecycle v2 (rettelse): i SAMLET REVIEW er tidsplanen
  // entreprenørens allerede indsendte, men endnu ikke bygherre-godkendte
  // tilbud — samme rå kilde (tidsplan.indsendt_at) som DokumentRenderers
  // offer-view (erUnderBygherreReview) allerede bruger. Uden dette ville
  // reviewpunktet fejlagtigt være skjult, når bygherre hverken havde
  // udfyldt startdato eller slutdato ved oprettelse, selvom dokumentet
  // rent faktisk viser entreprenørens tidsplan.
  const harReviewbarTidsplan = !!(
    kontrakt.tidsplan?.indsendt_at ||
    hentOprindeligAftaltStartdato(kontrakt) ||
    hentOprindeligAftaltSlutdato(kontrakt) ||
    kontrakt.tidsplan?.type === "ingen_tidsplan"
  );
  // Sektionsbaseret forhandling v1 (rettelse) — kontrakt.haandvaerker_godkendt_at
  // ER review-runde-nøglen. Et nyt tidsstempel (efter et ændringsønske og
  // en ny "Godkend og send aftalegrundlag") betyder en ny revision, og alle
  // tidligere "gennemgået"-markeringer skal da tælle som ubekræftede igen
  // — uanset hvilken enkelt sektion der reelt blev ændret (vi forsøger
  // bevidst ikke at diff-beregne det, jf. produktbeslutning). Matcher den
  // gemte runde ikke længere kontraktens aktuelle værdi, læses
  // bekræftelserne simpelthen som tomme.
  const reviewRunde = kontrakt.haandvaerker_godkendt_at ?? null;
  const reviewBekraeftet = reviewBekraeftetRunde.runde === reviewRunde ? reviewBekraeftetRunde.bekraeftelser : {};
  function setReviewBekraeftet(updater: (prev: Record<string, boolean>) => Record<string, boolean>) {
    setReviewBekraeftetRunde({ runde: reviewRunde, bekraeftelser: updater(reviewBekraeftet) });
  }

  const reviewPunkter = [
    { id: "omfang", label: "Arbejdsomfang", vis: !!omfangIndhold?.trim() },
    { id: "pris", label: "Pris", vis: true },
    { id: "betalingsplan", label: "Betalingsplan", vis: true },
    { id: "tidsplan", label: "Tidsplan", vis: harReviewbarTidsplan },
    { id: "forudsaetninger", label: "Forudsætninger", vis: !!kontrakt.forudsaetninger_sendt_at },
  ].filter((p) => p.vis);
  const alleReviewpunkterBekraeftet = reviewPunkter.every((p) => reviewBekraeftet[p.id]);
  // Afledt live af reviewBekraeftet — forsvinder automatisk fra visningen,
  // efterhånden som bygherre bekræfter punkterne kontekstuelt.
  const manglendeReviewPunkter = reviewPunkter.filter((p) => !reviewBekraeftet[p.id]);
  const antalLokaleDrafts = Object.keys(reviewDrafts).length;
  const harLokaleDrafts = antalLokaleDrafts > 0;
  // Reviewsektionen giver kun mening, når bygherre reelt står ved det
  // sidste skridt — ellers ville den vises, mens knappen af helt andre
  // grunde (afventer håndværker, uafklarede forslag) alligevel ikke kan
  // aktiveres, hvilket ville føles som en meningsløs forhindring.
  const klarTilBygherreGodkendelse = !bygherreGodkendt && haandvaerkerGodkendt && uafklaret.length === 0;

  // Sektionsbaseret forhandling v1 — den senest oprettede review_*-række
  // for et givet felt, uanset status. Bruges til at vise "Dit
  // ændringsønske" diskret ved den relevante sektion, uden at gøre den
  // til et fuldt revisionshistorik-feed (kun seneste vises, jf. produktkrav).
  // Kopieret til en lokal, allerede narrowet const, da TypeScripts
  // null-narrowing af kontrakt ikke bevares ind i en indlejret funktion.
  const kontraktaendringerListe = kontrakt.kontraktaendringer;
  function senesteReviewAendring(felt: ReviewAendringType): Aendring | null {
    const rows = kontraktaendringerListe.filter((a) => a.felt === felt);
    if (rows.length === 0) return null;
    return rows.reduce((nyeste, r) => (new Date(r.oprettet_at) > new Date(nyeste.oprettet_at) ? r : nyeste));
  }

  function reviewAendringFooterProps(key: string) {
    return {
      reviewKey: key,
      draft: reviewDrafts[key],
      redigerer: aabenDraftEditor === key,
      senesteAendring: senesteReviewAendring(REVIEW_TYPE_FOR_KEY[key]),
      onAabn: () => { setAabenDraftEditor(key); setReviewDrafts((prev) => ({ ...prev, [key]: prev[key] ?? { ...TOM_REVIEW_DRAFT } })); },
      onSkift: (draft: ReviewDraft) => setReviewDrafts((prev) => ({ ...prev, [key]: draft })),
      onGem: () => setAabenDraftEditor(null),
      // Luk formularen. Fjern kun udkastet, hvis det reelt er tomt/ugyldigt
      // (brugeren åbnede "Foreslå ændring" og fortrød uden at skrive noget)
      // — et allerede gyldigt, tidligere klargjort udkast bevares.
      onAnnuller: () => {
        setAabenDraftEditor(null);
        const current = reviewDrafts[key];
        if (!current || !reviewDraftGyldig(key, current)) {
          setReviewDrafts((prev) => {
            const resten = { ...prev };
            delete resten[key];
            return resten;
          });
        }
      },
      onFjern: () => setReviewDrafts((prev) => {
        const resten = { ...prev };
        delete resten[key];
        return resten;
      }),
    };
  }

  // Agreement sheet deadline extension v1 (korrektion) — beregnet ÉN gang
  // her og genbrugt både af selve dokumentvisningen (DokumentRenderer §5,
  // nedenfor) og af den samlede tidsplanssektion i "Tidsplan"-kortet
  // længere nede, så de aldrig kan vise forskellige tal for samme kontrakt.
  // Baseline (kontrakt.startdato/slutdato/tidsplan) læses uændret og
  // muteres ikke — kun denne afledte visning tilføjes.
  const { samletFristforlaengelseDage, gaeldendeAflevering } = beregnKontraktDeadline(kontrakt, alleAftalesedler, kontrakt.id);
  const bidragydendeAftalesedler = alleAftalesedler
    .map((s, i) => ({ ...s, nummer: alleAftalesedler.length - i }))
    .filter((s) => s.kontrakt_id === kontrakt.id && s.status === "godkendt" && typeof s.haandvaerker_tidsdage === "number" && s.haandvaerker_tidsdage > 0)
    .sort((a, b) => new Date(a.godkendt_at ?? a.oprettet_at).getTime() - new Date(b.godkendt_at ?? b.oprettet_at).getTime());
  const bidragydendeAftaleseddelNumre = bidragydendeAftalesedler.map((s) => s.nummer);

  const statusTekst: Record<string, string> = {
    udkast: "Udkast",
    inviteret: "Invitation sendt",
    forhandling: "Under forhandling",
    bygherre_godkendt: "Du har godkendt",
    haandvaerker_godkendt: "Håndværker har godkendt",
    begge_godkendt: "Begge har godkendt",
  };

  const statusFarve: Record<string, string> = {
    udkast: "bg-gray-100 text-gray-600",
    inviteret: "bg-blue-100 text-blue-700",
    forhandling: "bg-amber-100 text-amber-700",
    bygherre_godkendt: "bg-blue-100 text-blue-700",
    haandvaerker_godkendt: "bg-green-100 text-green-700",
    begge_godkendt: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <ProjektNav id={id} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header — samme redaktionelle masthead-mønster som dashboardet:
            serif-overskrift, rolig hierarki, status som tekst-badge. */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-2 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusFarve[kontrakt.status] || "bg-gray-100 text-gray-600"}`}>
                {statusTekst[kontrakt.status] || kontrakt.status}
              </span>
              {afventerForslag.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  {afventerForslag.length} forslag afventer svar
                </span>
              )}
            </div>
            <h1 className="font-serif text-[28px] md:text-[34px] font-normal text-[#16241c] leading-[1.15] tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Aftalegrundlag
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 break-words">
              {kontrakt.titel || "Kontraktudkast"} · <span className="font-medium text-gray-700">Rev. {revision}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/opret")}
              className="flex items-center gap-1.5 border border-[#e0ddd6] text-gray-600 text-sm font-semibold px-3 py-2.5 min-h-11 rounded-xl hover:bg-white transition-colors"
            >
              <Plus size={16} strokeWidth={1.75} />
              Opret ny sag
            </button>
            {!erBeggeGodkendt && !kontrakt.haandvaerker_email && (
              <button
                onClick={() => setVisInviter(true)}
                className="flex items-center gap-2 bg-[#1e3a2a] text-white text-sm font-bold px-4 py-2.5 min-h-11 rounded-xl hover:opacity-90 transition-opacity"
              >
                <UserPlus size={16} strokeWidth={1.75} />
                Inviter håndværker
              </button>
            )}
          </div>
        </div>

        {/* Liste over alle kontrakter — vises kun hvis der er mere end 1 */}
        {alleKontrakter.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {alleKontrakter.map(k => (
              <button
                key={k.id}
                onClick={() => hentKontrakt(k.id)}
                className={`max-w-full break-words text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  typeof kontrakt === "object" && kontrakt?.id === k.id
                    ? "bg-[#1e3a2a] text-white border-[#1e3a2a]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a2a]/40"
                }`}
              >
                {k.titel || "Aftalegrundlag"} · {statusTekst[k.status] || k.status}
              </button>
            ))}
          </div>
        )}
        {opretFejl && (
          <p className="text-xs text-red-600 mb-5 font-medium">{opretFejl}</p>
        )}
        {skrivFejl && (
          <p className="text-xs text-red-600 mb-5 font-medium">{skrivFejl}</p>
        )}

        {/* Invitation-modal */}
        {visInviter && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="font-bold text-gray-900 mb-1">Inviter håndværker</h2>
              <p className="text-sm text-gray-400 mb-5">Håndværkeren modtager et direkte link til forhandlingsrummet. Ingen konto krævet for at se og kommentere.</p>

              {/* CVR-opslag */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CVR-nummer (valgfrit)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviterCvr}
                    onChange={e => { setInviterCvr(e.target.value); setCvrData(null); setCvrFejl(""); }}
                    onBlur={slaaCvrOp}
                    placeholder="12345678"
                    maxLength={8}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                  />
                  <button
                    type="button"
                    onClick={slaaCvrOp}
                    disabled={cvrSoeger || inviterCvr.replace(/\s/g, "").length !== 8}
                    className="px-4 py-3 text-sm font-semibold text-[#1e3a2a] border border-[#1e3a2a]/20 bg-[#1e3a2a]/5 hover:bg-[#1e3a2a]/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cvrSoeger ? "..." : "Slå op"}
                  </button>
                </div>
                {cvrData && (
                  <div className="mt-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm font-semibold text-green-900">{cvrData.navn}</p>
                    {cvrData.adresse && <p className="text-xs text-green-700 mt-0.5">{cvrData.adresse}</p>}
                  </div>
                )}
                {cvrFejl && <p className="mt-1.5 text-xs text-red-600">{cvrFejl}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Håndværkerens e-mail</label>
                <input
                  type="email"
                  value={inviterEmail}
                  onChange={e => setInviterEmail(e.target.value)}
                  placeholder="thomas@tmbyg.dk"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-2">Eller kopiér link og send det selv</p>
                <div className="flex gap-2">
                  <input readOnly value={invitationslink} className="flex-1 text-base md:text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-500 truncate" />
                  <button
                    onClick={kopierLink}
                    className="flex-shrink-0 text-xs font-semibold text-[#1e3a2a] border border-[#1e3a2a]/20 bg-[#1e3a2a]/5 hover:bg-[#1e3a2a]/10 px-3 py-2 rounded-lg transition-colors"
                  >
                    {kopieret ? "Kopieret ✓" : "Kopiér"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setVisInviter(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
                  Luk
                </button>
                <button
                  onClick={sendInvitation}
                  disabled={sender || !inviterEmail.trim()}
                  className="flex-1 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                >
                  {sender ? "Sender..." : "Send invitation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Anmod om ændringer-modal — pre-contract lifecycle v2 */}
        {visAendringsModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="font-bold text-gray-900 mb-1">Anmod om ændringer</h2>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                Aftalegrundlaget sendes tilbage til entreprenøren, som kan revidere det og sende en ny version til godkendelse.
              </p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hvad skal ændres?</label>
                <textarea
                  value={aendringsBesked}
                  onChange={e => setAendringsBesked(e.target.value)}
                  rows={4}
                  placeholder="Beskriv kort, hvad du ønsker ændret"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                  autoFocus
                />
              </div>

              {aendringsFejl && (
                <p className="text-xs text-red-600 font-medium mb-4">{aendringsFejl}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setVisAendringsModal(false); setAendringsFejl(""); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
                >
                  Annuller
                </button>
                <button
                  onClick={anmodOmAendringer}
                  disabled={senderAendring || !aendringsBesked.trim()}
                  className="flex-1 py-3 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                >
                  {senderAendring ? "Sender..." : "Send anmodning"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Besigtigelse-handlingsboks — vises kun ved aktiv selvstændig besigtigelse */}
        {besigtigelse === "error" && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-5">
            Besigtigelsesstatus kunne ikke hentes. Opdater siden for at prøve igen.
          </p>
        )}
        {besigtigelse !== "loading" && besigtigelse !== null && besigtigelse !== "error" && (() => {
          // Ingen enkelt dato for en aktiv multi-tids-runde (1-3 ligeværdige
          // alternativer, intet valgt endnu) — vis i stedet et antal. Aldrig
          // "Mulighed 1" fremstillet som en aftalt dato. For legacy-rækker
          // (uden tidspunkter-array) vises den oprindelige dato/tid uændret.
          const antalTider = besigtigelse.tidspunkter?.length ?? 0;
          const forslagTekst = antalTider > 0
            ? `${antalTider} ${antalTider === 1 ? "tidspunkt" : "tidspunkter"} foreslået`
            : null;

          if (besigtigelse.status === "foreslaaet" && besigtigelse.foreslaaet_af === "haandvaerker") {
            return (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">Entreprenøren har foreslået en besigtigelse</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {antalTider > 0 ? forslagTekst : (
                        <>
                          {besigtigelse.dato && fmtBesigtigelseDatoLang(besigtigelse.dato)}
                          {besigtigelse.tidspunkt && <span className="ml-2 font-semibold">kl. {besigtigelse.tidspunkt.slice(0, 5)}</span>}
                        </>
                      )}
                    </p>
                    {besigtigelse.kommentar_haandvaerker && (
                      <p className="text-xs text-amber-700 mt-1.5 italic">&ldquo;{besigtigelse.kommentar_haandvaerker}&rdquo;</p>
                    )}
                  </div>
                </div>
                <a
                  href={`/projekt/${id}#besigtigelse`}
                  className="inline-flex items-center gap-2 bg-amber-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Se og besvar besigtigelse
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </div>
            );
          }

          if (besigtigelse.status === "foreslaaet" && besigtigelse.foreslaaet_af === "bygherre") {
            return (
              <div className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Dit forslag til besigtigelse afventer entreprenørens svar</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {antalTider > 0 ? forslagTekst : (
                      <>
                        {besigtigelse.dato && fmtBesigtigelseDatoLang(besigtigelse.dato)}
                        {besigtigelse.tidspunkt && <span className="ml-2 font-semibold">kl. {besigtigelse.tidspunkt.slice(0, 5)}</span>}
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          }

          if (besigtigelse.status === "godkendt") {
            // Den aftalte tid: valgt_tidspunkt_id → child for nye runder, ellers
            // parentens egne dato/tidspunkt for legacy-rækker. Passeret tidspunkt
            // vises ikke som aktuel kommende begivenhed.
            const effektiv = hentEffektivDatoTid(besigtigelse);
            if (!effektiv || erBesigtigelsePasseret(effektiv.dato, effektiv.tidspunkt)) return null;
            return (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900">Besigtigelse aftalt</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {fmtBesigtigelseDatoLang(effektiv.dato)}
                    {effektiv.tidspunkt && (
                      <span className="ml-2 font-semibold">kl. {fmtTidsinterval(effektiv.tidspunkt, besigtigelse.varighed_minutter)}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Kontraktindhold */}
          <div className="lg:col-span-2 space-y-4">

            {/* Projekttitel */}
            {(["titel", "total_pris", "startdato", "slutdato", "vilkaar"] as const).map((felt) => {
              const vaerdi = felt === "total_pris"
                ? (kontrakt.total_pris ? fmtKr(kontrakt.total_pris) : null)
                : (felt === "startdato" || felt === "slutdato")
                ? (kontrakt[felt] ? new Date(kontrakt[felt]!).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" }) : null)
                : kontrakt[felt as keyof Kontrakt] as string | null;

              const afventendeFeltForslag = kontrakt.kontraktaendringer.filter(
                a => a.felt === felt && a.status === "afventer"
              );
              const erAktiv = redigererFelt === felt;
              const harForslag = afventendeFeltForslag.length > 0;
              const erLaast = felt === "vilkaar";
              // total_pris: bygherre kan ikke redigere efter invitation (contractor udfylder)
              // startdato/slutdato: bygherre kan redigere indtil begge godkender
              // titel: bygherre kan redigere indtil contractor godkender
              const erRedigerbar = !erBeggeGodkendt && !erAktiv && !erLaast && (
                felt === "total_pris"
                  ? !kontrakt.haandvaerker_email
                  : !haandvaerkerGodkendt
              );

              return (
                <div key={felt} id={felt === "total_pris" ? "review-pris" : undefined} className={`bg-white rounded-2xl border overflow-hidden transition-all ${harForslag ? "border-amber-200" : "border-[#e0ddd6]"}`}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{feltLabels[felt]}</p>
                        {erLaast && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e3a2a] bg-[#1e3a2a]/8 px-1.5 py-0.5 rounded">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Låst · AB-Forbruger 2012
                          </span>
                        )}
                      </div>
                      {erRedigerbar && (
                        <button
                          onClick={() => {
                            setRedigererFelt(felt);
                            setFeltVaerdi(vaerdi ? String(vaerdi).replace(" kr.", "").replace(/\./g, "").replace(",", ".") : "");
                          }}
                          className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors p-2 -m-2 inline-block"
                        >
                          Rediger
                        </button>
                      )}
                    </div>
                    {erAktiv ? (
                      <div>
                        {felt === "total_pris" ? (
                          <input type="number" value={feltVaerdi} onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        ) : (felt === "startdato" || felt === "slutdato") ? (
                          <input type="date" value={feltVaerdi} onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10" />
                        ) : (
                          <textarea rows={3} value={feltVaerdi} onChange={e => setFeltVaerdi(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none" />
                        )}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setRedigererFelt(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                          <button onClick={() => gemFeltOpdatering(felt)} disabled={gemmer} className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400">
                            {gemmer ? "Gemmer..." : "Gem"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {vaerdi || (
                          <span className="text-gray-400 italic">
                            {felt === "total_pris"
                              ? "Udfyldes af entreprenøren"
                              : felt === "startdato" || felt === "slutdato"
                              ? "Afventer afklaring med entreprenøren"
                              : "Ikke udfyldt"}
                          </span>
                        )}
                      </p>
                    )}
                    {felt === "total_pris" && !erAktiv && klarTilBygherreGodkendelse && (
                      <>
                        <ReviewBekraeftRow
                          id="review-pris-toggle"
                          label="Pris gennemgået"
                          bekraeftet={!!reviewBekraeftet.pris}
                          onToggle={(checked) => setReviewBekraeftet((prev) => ({ ...prev, pris: checked }))}
                        />
                        <ReviewAendringFooter {...reviewAendringFooterProps("pris")} />
                      </>
                    )}
                  </div>
                  {afventendeFeltForslag.map(a => (
                    <div key={a.id} className="border-t border-amber-100 bg-amber-50 px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                          {a.forfatter_navn || "Håndværker"} foreslår
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(a.oprettet_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Original</p>
                          <p className="text-sm text-gray-500 line-through leading-relaxed">{a.gammel_vaerdi || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">Forslag</p>
                          <p className="text-sm text-green-800 font-medium leading-relaxed">{a.ny_vaerdi}</p>
                        </div>
                      </div>
                      {a.kommentar && <p className="text-xs text-amber-700 italic mb-3">&ldquo;{a.kommentar}&rdquo;</p>}
                      <div className="flex gap-2">
                        <button onClick={() => besvarForslag(a.id, "accepteret")} className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Acceptér ændring</button>
                        <button onClick={() => besvarForslag(a.id, "afvist")} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Afvis</button>
                      </div>
                    </div>
                  ))}
                  {kontrakt.kontraktaendringer.filter(a => a.felt === felt && a.status !== "afventer").map(a => (
                    <div key={a.id} className="border-t border-gray-100 px-5 py-2.5 flex items-center gap-2 bg-gray-50">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${a.status === "accepteret" ? "bg-green-100" : "bg-red-100"}`}>
                        {a.status === "accepteret"
                          ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      </div>
                      <p className="text-xs text-gray-400">Forslag fra {a.forfatter_navn || a.forfatter} {a.status === "accepteret" ? "accepteret" : "afvist"}</p>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Arbejdets omfang — vises som professionelt dokument.
                V2-dokumenter (ny, stabil struktur) og legacy-dokumenter
                (gammel, sammenhængende fritekst) redigeres forskelligt. */}
            {(() => {
              const beskrivelse = kontrakt.beskrivelse;
              const afventende = kontrakt.kontraktaendringer.filter(a => a.felt === "beskrivelse" && a.status === "afventer");
              const erV2 = erV2Dokument(beskrivelse);

              let indhold: ReactNode;

              if (erV2) {
                const v2 = parseV2Sektioner(beskrivelse || "");
                const redigererV2 = redigererFelt === "v2_arbejdsomfang" || redigererFelt === "v2_krav" || redigererFelt === "v2_praktisk";

                const gemV2Sektion = async () => {
                  if (indeholderKonkretDato(feltVaerdi)) {
                    setV2Fejl("Datoer ændres i Tidsplan.");
                    return;
                  }
                  const nyBeskrivelse = byggV2Dokument({
                    arbejdsomfang: redigererFelt === "v2_arbejdsomfang" ? feltVaerdi : v2.arbejdsomfang,
                    kravOgOensker: redigererFelt === "v2_krav" ? feltVaerdi : v2.kravOgOensker,
                    praktiskeForhold: redigererFelt === "v2_praktisk" ? feltVaerdi : v2.praktiskeForhold,
                  });
                  setGemmer(true);
                  setSkrivFejl("");
                  setV2Fejl("");
                  try {
                    const resultat = await autentificeretFetch("/api/kontrakt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ kontrakt_id: kontrakt.id, beskrivelse: nyBeskrivelse }),
                    });
                    if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
                    const data = await resultat.res.json();
                    if (!data.error) {
                      setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
                      setRedigererFelt(null);
                    } else {
                      setV2Fejl(data.error);
                    }
                  } finally {
                    setGemmer(false);
                  }
                };

                indhold = (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aftaledokument</p>
                      {!erBeggeGodkendt && !redigererV2 && !kontrakt.haandvaerker_email && (
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={() => { setRedigererFelt("v2_arbejdsomfang"); setFeltVaerdi(v2.arbejdsomfang); setV2Fejl(""); }} className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors p-2 -m-2 inline-block">Rediger arbejdsomfang</button>
                          <button onClick={() => { setRedigererFelt("v2_krav"); setFeltVaerdi(v2.kravOgOensker); setV2Fejl(""); }} className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors p-2 -m-2 inline-block">Rediger krav og ønsker</button>
                          <button onClick={() => { setRedigererFelt("v2_praktisk"); setFeltVaerdi(v2.praktiskeForhold); setV2Fejl(""); }} className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors p-2 -m-2 inline-block">Rediger praktiske forhold</button>
                        </div>
                      )}
                    </div>

                    {redigererV2 ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
                          {redigererFelt === "v2_arbejdsomfang" && "Du redigerer arbejdsomfanget. "}
                          {redigererFelt === "v2_krav" && "Du redigerer krav og ønsker. "}
                          {redigererFelt === "v2_praktisk" && "Du redigerer praktiske forhold. "}
                          Overskrifter og datoer redigeres ikke her — datoer ændres i Tidsplan.
                        </p>
                        <textarea
                          rows={Math.max(10, feltVaerdi.split("\n").length + 2)}
                          value={feltVaerdi}
                          onChange={e => setFeltVaerdi(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm text-gray-700 leading-relaxed focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                          autoFocus
                        />
                        {v2Fejl && <p className="text-xs text-red-600 mt-2 font-medium">{v2Fejl}</p>}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setRedigererFelt(null); setV2Fejl(""); }} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                          <button
                            onClick={gemV2Sektion}
                            disabled={gemmer}
                            className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {gemmer ? "Gemmer..." : "Gem"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <DokumentRenderer
                        tekst={beskrivelse || undefined}
                        titel={kontrakt.titel || undefined}
                        adresse={projektAdresse || undefined}
                        oprettetAt={kontrakt.oprettet_at || undefined}
                        bygherreNavn={brugerNavn}
                        totalPris={kontrakt.total_pris}
                        startdato={kontrakt.startdato}
                        slutdato={kontrakt.slutdato}
                        betalingsplan={kontrakt.betalingsplan}
                        forudsaetninger={kontrakt.forudsaetninger}
                        forudsaetningerGodkendt={kontrakt.forudsaetninger_godkendt}
                        tidsplan={kontrakt.tidsplan}
                        vilkaar={kontrakt.vilkaar}
                        haandvaerkerNavn={kontrakt.haandvaerker_navn}
                        haandvaerkerFirma={kontrakt.haandvaerker_firma}
                        erAftaleEndeligtGodkendt={erBeggeGodkendt}
                        erUnderBygherreReview={haandvaerkerGodkendt && !bygherreGodkendt}
                        samletFristforlaengelseDage={samletFristforlaengelseDage}
                        gaeldendeAflevering={gaeldendeAflevering}
                        bidragydendeAftaleseddelNumre={bidragydendeAftaleseddelNumre}
                      />
                    )}
                  </>
                );
              } else {
                // ---- Legacy (uændret adfærd) ----
                const erAktiv = redigererFelt === "beskrivelse";
                const linjer = (beskrivelse || "").split("\n");
                const bodyStart = linjer.findIndex(l => /^\d+\.\s+[A-ZÆØÅ]/.test(l.trim()) && l.trim().length > 3);
                const beskrivelseBody = bodyStart === -1 ? (beskrivelse || "") : linjer.slice(bodyStart).join("\n");
                const beskrivelseHeader = bodyStart === -1 ? "" : linjer.slice(0, bodyStart).join("\n");

                indhold = (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Arbejdets omfang</p>
                      {!erBeggeGodkendt && !erAktiv && !kontrakt.haandvaerker_email && (
                        <button
                          onClick={() => { setRedigererFelt("beskrivelse"); setFeltVaerdi(beskrivelseBody); }}
                          className="text-xs text-gray-400 hover:text-[#1e3a2a] transition-colors p-2 -m-2 inline-block"
                        >
                          Rediger
                        </button>
                      )}
                    </div>

                    {erAktiv ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
                          Du redigerer indholdet fra og med afsnit 1. Overskrift og bygherre-oplysninger opdateres ikke her.
                        </p>
                        <textarea
                          rows={Math.max(20, beskrivelseBody.split("\n").length + 2)}
                          value={feltVaerdi}
                          onChange={e => setFeltVaerdi(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base md:text-sm font-mono text-gray-700 leading-relaxed focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setRedigererFelt(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                          <button
                            onClick={async () => {
                              const nyBeskrivelse = beskrivelseHeader ? beskrivelseHeader + "\n" + feltVaerdi : feltVaerdi;
                              setGemmer(true);
                              setSkrivFejl("");
                              try {
                                const resultat = await autentificeretFetch("/api/kontrakt", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ kontrakt_id: kontrakt.id, beskrivelse: nyBeskrivelse }),
                                });
                                if ("fejltype" in resultat) { setSkrivFejl(skrivFejlTekst(resultat.fejltype)); return; }
                                const data = await resultat.res.json();
                                if (!data.error) {
                                  setKontrakt(prev => prev && typeof prev === "object" ? { ...prev, ...data } : prev);
                                  setRedigererFelt(null);
                                } else {
                                  setSkrivFejl("Kunne ikke gemme ændringen. Prøv igen.");
                                }
                              } finally {
                                setGemmer(false);
                              }
                            }}
                            disabled={gemmer}
                            className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {gemmer ? "Gemmer..." : "Gem"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <DokumentRenderer
                        tekst={beskrivelse || undefined}
                        titel={kontrakt.titel || undefined}
                        bygherreNavn={brugerNavn}
                        totalPris={kontrakt.total_pris}
                        startdato={kontrakt.startdato}
                        slutdato={kontrakt.slutdato}
                        betalingsplan={kontrakt.betalingsplan}
                        forudsaetninger={kontrakt.forudsaetninger}
                        forudsaetningerGodkendt={kontrakt.forudsaetninger_godkendt}
                        tidsplan={kontrakt.tidsplan}
                        vilkaar={kontrakt.vilkaar}
                        haandvaerkerNavn={kontrakt.haandvaerker_navn}
                        haandvaerkerFirma={kontrakt.haandvaerker_firma}
                        erAftaleEndeligtGodkendt={erBeggeGodkendt}
                        erUnderBygherreReview={haandvaerkerGodkendt && !bygherreGodkendt}
                        samletFristforlaengelseDage={samletFristforlaengelseDage}
                        gaeldendeAflevering={gaeldendeAflevering}
                        bidragydendeAftaleseddelNumre={bidragydendeAftaleseddelNumre}
                      />
                    )}
                  </>
                );
              }

              return (
                <div id="review-omfang" className={`bg-white rounded-2xl border overflow-hidden ${afventende.length > 0 ? "border-amber-200" : "border-[#e0ddd6]"}`}>
                  <div className="px-5 py-4">
                    {indhold}
                    {!!omfangIndhold?.trim() && klarTilBygherreGodkendelse && (
                      <ReviewBekraeftRow
                        id="review-omfang-toggle"
                        label="Arbejdsomfang gennemgået"
                        bekraeftet={!!reviewBekraeftet.omfang}
                        onToggle={(checked) => setReviewBekraeftet((prev) => ({ ...prev, omfang: checked }))}
                      />
                    )}
                  </div>

                  {afventende.map(a => (
                    <div key={a.id} className="border-t border-amber-100 bg-amber-50 px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                          {a.forfatter_navn || "Håndværker"} foreslår ændring
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => besvarForslag(a.id, "accepteret")} className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Acceptér ændring</button>
                        <button onClick={() => besvarForslag(a.id, "afvist")} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Afvis</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Forudsætninger fra entreprenøren — pre-contract lifecycle v2:
                indhold i entreprenørens tilbud, ikke en individuel
                godkendelsesanmodning. Gennemgås og accepteres samlet ved
                bygherres endelige godkendelse (review-checkboxene
                nedenfor), ikke via separate acceptér/afvis-knapper her. */}
            {kontrakt.forudsaetninger_sendt_at && (
              <div id="review-forudsaetninger" className="bg-white rounded-2xl border border-[#e0ddd6] overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Forudsætninger</p>
                    {kontrakt.forudsaetninger_godkendt && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">Godkendt</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    {kontrakt.forudsaetninger_godkendt
                      ? "Del af det godkendte aftalegrundlag."
                      : "Indgår i aftalegrundlaget. Gennemgås og godkendes samlet."}
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{kontrakt.forudsaetninger}</p>
                  {klarTilBygherreGodkendelse && (
                    <>
                      <ReviewBekraeftRow
                        id="review-forudsaetninger-toggle"
                        label="Forudsætninger gennemgået"
                        bekraeftet={!!reviewBekraeftet.forudsaetninger}
                        onToggle={(checked) => setReviewBekraeftet((prev) => ({ ...prev, forudsaetninger: checked }))}
                      />
                      <ReviewAendringFooter {...reviewAendringFooterProps("forudsaetninger")} />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Betalingsplan */}
            <div id="review-betalingsplan" className="bg-white rounded-2xl border border-[#e0ddd6] overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0
                        ? (erBeggeGodkendt ? "Aftalt betalingsplan" : "Foreslået betalingsplan")
                        : "Betalingsplan"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0
                        ? "Milepælsplan jf. AB-Forbruger § 26"
                        : "Betaling ved aflevering jf. AB-Forbruger § 25"}
                    </p>
                  </div>
                </div>

                {redigererBetalingsplan ? (
                  <div>
                    <div className="space-y-2 mb-3">
                      {betalingsplanRækker.map((r, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            placeholder="Milepæl (fx Opstart)"
                            value={r.milepæl}
                            onChange={e => {
                              const ny = [...betalingsplanRækker];
                              ny[i] = { ...ny[i], milepæl: e.target.value };
                              setBetalingsplanRækker(ny);
                            }}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                          />
                          <input
                            placeholder="%"
                            value={r.andel}
                            onChange={e => {
                              const ny = [...betalingsplanRækker];
                              ny[i] = { ...ny[i], andel: e.target.value };
                              setBetalingsplanRækker(ny);
                            }}
                            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-base md:text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-1 focus:ring-[#1e3a2a]/10"
                          />
                          <button
                            onClick={() => setBetalingsplanRækker(prev => prev.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-400 transition-colors p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setBetalingsplanRækker(prev => [...prev, { milepæl: "", andel: "" }])}
                      className="text-xs text-[#1e3a2a] font-semibold hover:underline mb-4 block"
                    >
                      + Tilføj milepæl
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setRedigererBetalingsplan(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">Annuller</button>
                      <button onClick={gemBetalingsplan} disabled={gemmer} className="flex-1 py-2 bg-[#1e3a2a] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-400">
                        {gemmer ? "Gemmer..." : "Gem"}
                      </button>
                    </div>
                  </div>
                ) : kontrakt.betalingsplan && kontrakt.betalingsplan.length > 0 ? (
                  <div className="space-y-0">
                    {kontrakt.betalingsplan.map((b, i) => {
                      const pct = parseFloat(b.andel);
                      const beloeb = kontrakt.total_pris && !isNaN(pct)
                        ? fmtKr(kontrakt.total_pris * (pct / 100))
                        : null;
                      return (
                        <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
                          <p className="text-sm text-gray-700 mb-0.5">{b.milepæl}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {b.andel} %{beloeb ? ` · ${beloeb}` : ""}
                          </p>
                        </div>
                      );
                    })}
                    {kontrakt.total_pris && (
                      <div className="pt-2.5 mt-1 border-t border-gray-200">
                        <p className="text-xs text-gray-400 mb-0.5">Samlet</p>
                        <p className="text-sm font-bold text-gray-900">
                          100 % · {fmtKr(kontrakt.total_pris)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Betaling ved aflevering</p>
                      <p className="text-xs text-gray-400 mt-0.5">Standardvilkår jf. AB-Forbruger § 25. En anden betalingsplan skal foreslås af entreprenøren og godkendes af bygherre som del af det samlede aftalegrundlag.</p>
                    </div>
                  </div>
                )}
                {!redigererBetalingsplan && klarTilBygherreGodkendelse && (
                  <>
                    <ReviewBekraeftRow
                      id="review-betalingsplan-toggle"
                      label="Betalingsplan gennemgået"
                      bekraeftet={!!reviewBekraeftet.betalingsplan}
                      onToggle={(checked) => setReviewBekraeftet((prev) => ({ ...prev, betalingsplan: checked }))}
                    />
                    <ReviewAendringFooter {...reviewAendringFooterProps("betalingsplan")} />
                  </>
                )}
              </div>
            </div>
            {/* Tidsplan */}
            {(() => {
              const tp = kontrakt.tidsplan;
              const fmtDatoKort = (iso: string) =>
                new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
              // Vises nederst i uanset hvilken af de fire tidsplan-varianter der
              // aktuelt renderes nedenfor — samme kontekstuelle bekræftelse ét sted.
              const tidsplanReviewToggle = klarTilBygherreGodkendelse && harReviewbarTidsplan ? (
                <ReviewBekraeftRow
                  id="review-tidsplan-toggle"
                  label="Tidsplan gennemgået"
                  bekraeftet={!!reviewBekraeftet.tidsplan}
                  onToggle={(checked) => setReviewBekraeftet((prev) => ({ ...prev, tidsplan: checked }))}
                />
              ) : null;
              const tidsplanAendringFooter = klarTilBygherreGodkendelse && harReviewbarTidsplan ? (
                <ReviewAendringFooter {...reviewAendringFooterProps("tidsplan")} />
              ) : null;

              if (!tp) {
                return (
                  <div id="review-tidsplan" className="bg-white rounded-2xl border border-[#e0ddd6] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aftalte datoer</p>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">AB-Forbruger § 12</span>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Afventer bekræftelse fra entreprenøren</p>
                        <p className="text-xs text-gray-400 mt-0.5">Entreprenøren skal bekræfte eller foreslå andre start- og slutdatoer</p>
                      </div>
                    </div>
                    {tidsplanReviewToggle}
                    {tidsplanAendringFooter}
                  </div>
                );
              }

              const godkendt = tp.godkendt_af_bygherre;
              // Canonical, allerede godkendt start-/slutdato — bruges kun til
              // selve visningen af de endeligt aftalte datoer (senere i dette
              // afsnit). Bruger tidligste/seneste dato blandt ALLE faser,
              // ikke kun faser[0], for korrekt multi-fase-understøttelse.
              const canonicalStartdato = hentOprindeligAftaltStartdato(kontrakt);
              const canonicalSlutdato = hentOprindeligAftaltSlutdato(kontrakt);

              // Tjek om entreprenøren har foreslået andre datoer end bygherre ønskede
              const fase = tp.faser?.[0];
              const entStartdato = fase?.startdato ?? null;
              const entSlutdato = fase?.slutdato ?? null;
              const bygStartdato = kontrakt.startdato;
              const bygSlutdato = kontrakt.slutdato;
              const startAendret = entStartdato && bygStartdato && entStartdato !== bygStartdato;
              const slutAendret = entSlutdato && bygSlutdato && entSlutdato !== bygSlutdato;
              const harAendringer = startAendret || slutAendret;
              const harBemaerkning = fase?.navn && fase.navn !== "Aftalt periode" && fase.navn !== "Foreslået af entreprenør";

              // Pre-contract lifecycle v2 — SAMLET REVIEW: entreprenøren har
              // godkendt og sendt sit samlede tilbud, bygherre er nu ved at
              // gennemgå det inden sin egen, endelige, samlede godkendelse.
              // Tidsplanen er her entreprenørens indhold i tilbuddet, IKKE
              // en individuel godkendelsesanmodning — derfor ingen "Godkend
              // datoerne"-knap og intet "Afventer din godkendelse"-badge i
              // dette vindue. Viser bevidst entreprenørens FAKTISKE
              // indsendte fase-data (offer-view), ikke canonical/effective
              // værdier — de bliver først retvisende efter bygherres
              // samlede godkendelse (som atomisk sætter
              // tidsplan.godkendt_af_bygherre, se /godkend-routen).
              if (haandvaerkerGodkendt && !bygherreGodkendt) {
                const visStart = entStartdato ?? bygStartdato;
                const visSlut = entSlutdato ?? bygSlutdato;
                return (
                  <div id="review-tidsplan" className="bg-white rounded-2xl border border-[#e0ddd6] overflow-hidden">
                    <div className="px-5 py-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tidsplan</p>
                      <p className="text-xs text-gray-400 mb-4">Indgår i aftalegrundlaget. Gennemgås og godkendes samlet.</p>

                      {tp.type === "ingen_tidsplan" ? (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Entreprenøren har foreslået at arbejde uden en fast tidsplan — en fravigelse af AB-Forbruger § 12.
                        </p>
                      ) : (
                        <div>
                          <TidsplanDatoRow label="Aftalt opstart" værdi={visStart ? fmtDatoKort(visStart) : "—"} />
                          <TidsplanDatoRow label="Aftalt aflevering" værdi={visSlut ? fmtDatoKort(visSlut) : "—"} />
                        </div>
                      )}
                      {tidsplanReviewToggle}
                      {tidsplanAendringFooter}
                    </div>
                  </div>
                );
              }

              // Tidsplan UX cleanup v1 — når tidsplanen er godkendt (den
              // almindelige, faseopdelte sag), merges den tidligere separate
              // "Tidsplan godkendt"-boks og "Efterfølgende godkendte
              // ændringer"-boks til ÉN sammenhængende tidsplanssektion.
              // Ingen ændring af selve tidsplan- eller
              // fristforlængelsesdata — kun præsentation. Godkendt +
              // "ingen_tidsplan" (fravigelse af § 12) er en separat, sjælden
              // kombination uden datoer at samle og beholder derfor uændret
              // den eksisterende visning nedenfor.
              if (godkendt && tp.type === "faser") {
                const harExtension = samletFristforlaengelseDage > 0 && !!gaeldendeAflevering;
                return (
                  <div id="review-tidsplan" className="bg-white rounded-2xl border border-[#e0ddd6] overflow-hidden">
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tidsplan</p>
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">Godkendt</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-4">
                        {erBeggeGodkendt
                          ? "Tidsplanen er en del af det godkendte aftalegrundlag."
                          : "Tidsplanen er godkendt. Aftalegrundlaget afventer stadig endelig godkendelse."}
                      </p>

                      <div>
                        <TidsplanDatoRow label="Aftalt opstart" værdi={canonicalStartdato ? fmtDatoKort(canonicalStartdato) : "—"} />
                        {harExtension ? (
                          <>
                            <TidsplanDatoRow label="Oprindeligt aftalt aflevering" værdi={canonicalSlutdato ? fmtDatoKort(canonicalSlutdato) : "—"} />
                            <TidsplanDatoRow label="Gældende aflevering" værdi={fmtDatoKort(gaeldendeAflevering as string)} fremhaevet />
                          </>
                        ) : (
                          <TidsplanDatoRow label="Aftalt aflevering" værdi={canonicalSlutdato ? fmtDatoKort(canonicalSlutdato) : "—"} />
                        )}
                      </div>

                      {harExtension && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                            {bidragydendeAftalesedler.length > 1 ? "Efterfølgende ændringer" : "Efterfølgende ændring"}
                          </p>
                          <div className="space-y-2 mb-3">
                            {bidragydendeAftalesedler.map((s) => (
                              <div key={s.id} className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-700 truncate">Aftaleseddel #{s.nummer}</p>
                                  <p className="text-xs text-gray-400 truncate">{s.beskrivelse}</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                                  +{s.haandvaerker_tidsdage} {s.haandvaerker_tidsdage === 1 ? "kalenderdag" : "kalenderdage"}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">Samlet fristforlængelse</p>
                            <p className="text-sm font-bold text-gray-900">+{samletFristforlaengelseDage} kalenderdage</p>
                          </div>
                        </div>
                      )}

                      {tp.godkendt_at && (
                        <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
                          Tidsplan godkendt {new Date(tp.godkendt_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                      {tidsplanReviewToggle}
                      {tidsplanAendringFooter}
                    </div>
                  </div>
                );
              }

              return (
                <div id="review-tidsplan" className={`rounded-2xl overflow-hidden border ${godkendt ? "border-green-100" : harAendringer ? "border-[#1e3a2a]/30" : "border-amber-200"}`}>
                  {/* Header */}
                  <div className="px-5 py-4 flex items-center justify-between bg-[#111c17]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AB-Forbruger § 12</p>
                        <p className="text-sm font-bold text-white">
                          {godkendt
                            ? "Tidsplan godkendt"
                            : tp.type === "ingen_tidsplan"
                              ? "Ingen fast dato — entreprenøren fraviger § 12"
                              : harAendringer
                                ? "Entreprenøren foreslår andre datoer"
                                : "Datoer bekræftet af entreprenøren"}
                        </p>
                      </div>
                    </div>
                    {godkendt ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/20">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Godkendt
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
                        Udkast
                      </span>
                    )}
                  </div>

                  <div className="bg-white px-5 py-4">
                    {tp.type === "ingen_tidsplan" ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                        <p className="text-xs font-bold text-amber-800 mb-1">Fravigelse af AB-Forbruger § 12</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Entreprenøren ønsker at arbejde uden en aftalt afleveringsdato{godkendt ? "." : " — indgår i aftalegrundlaget."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {/* Startdato */}
                        <div className={`rounded-xl px-4 py-3 border ${startAendret && !godkendt ? "bg-[#f0f7f3] border-[#1e3a2a]/20" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{godkendt ? "Aftalt opstart" : "Opstart"}</p>
                            {startAendret && !godkendt && (
                              <span className="text-[10px] font-bold text-[#1e3a2a] bg-[#1e3a2a]/10 px-2 py-0.5 rounded-full">Ændret</span>
                            )}
                          </div>
                          {startAendret && !godkendt ? (
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 line-through">{bygStartdato ? fmtDatoKort(bygStartdato) : "—"}</span>
                                <span className="text-xs text-gray-400">Din ønskede dato</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#1e3a2a]">{entStartdato ? fmtDatoKort(entStartdato) : "—"}</span>
                                <span className="text-xs font-semibold text-[#1e3a2a]/70">Entreprenørens forslag</span>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-sm font-bold mt-1 ${godkendt ? "text-green-700" : "text-gray-900"}`}>
                              {godkendt
                                ? (canonicalStartdato ? fmtDatoKort(canonicalStartdato) : "—")
                                : (entStartdato ? fmtDatoKort(entStartdato) : (bygStartdato ? fmtDatoKort(bygStartdato) : "—"))}
                            </p>
                          )}
                        </div>

                        {/* Slutdato / aflevering */}
                        <div className={`rounded-xl px-4 py-3 border ${slutAendret && !godkendt ? "bg-[#f0f7f3] border-[#1e3a2a]/20" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{godkendt ? "Aftalt aflevering" : "Aflevering"}</p>
                            {slutAendret && !godkendt && (
                              <span className="text-[10px] font-bold text-[#1e3a2a] bg-[#1e3a2a]/10 px-2 py-0.5 rounded-full">Ændret</span>
                            )}
                          </div>
                          {slutAendret && !godkendt ? (
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 line-through">{bygSlutdato ? fmtDatoKort(bygSlutdato) : "—"}</span>
                                <span className="text-xs text-gray-400">Din ønskede dato</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#1e3a2a]">{entSlutdato ? fmtDatoKort(entSlutdato) : "—"}</span>
                                <span className="text-xs font-semibold text-[#1e3a2a]/70">Entreprenørens forslag</span>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-sm font-bold mt-1 ${godkendt ? "text-green-700" : "text-gray-900"}`}>
                              {godkendt
                                ? (canonicalSlutdato ? fmtDatoKort(canonicalSlutdato) : "—")
                                : (entSlutdato ? fmtDatoKort(entSlutdato) : (bygSlutdato ? fmtDatoKort(bygSlutdato) : "—"))}
                            </p>
                          )}
                        </div>

                        {/* Bemærkning fra entreprenøren */}
                        {harBemaerkning && !godkendt && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Bemærkning fra entreprenøren</p>
                            <p className="text-sm text-blue-900 leading-relaxed">{fase!.navn}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!godkendt && (
                      <p className="text-xs text-gray-400 text-center leading-relaxed">
                        Del af entreprenørens udkast. Indgår i det foreløbige aftalegrundlag.
                      </p>
                    )}

                    {godkendt && (
                      <div className="bg-[#f0f7f3] border border-[#1e3a2a]/15 rounded-xl px-4 py-3 text-center">
                        {tp.godkendt_at && (
                          <p className="text-xs text-[#1e3a2a] font-semibold mb-1">
                            Godkendt {new Date(tp.godkendt_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                        <p className="text-xs text-[#1e3a2a]/70 leading-relaxed">
                          {erBeggeGodkendt
                            ? "Tidsplanen er en del af det godkendte aftalegrundlag."
                            : "Tidsplanen er godkendt. Aftalegrundlaget afventer stadig endelig godkendelse."}
                        </p>
                      </div>
                    )}
                    {tidsplanReviewToggle}
                    {tidsplanAendringFooter}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Status */}
            <div className="bg-white rounded-2xl border border-[#e0ddd6] p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Godkendelsesstatus</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bygherreGodkendt ? "bg-green-100" : "bg-gray-100"}`}>
                    {bygherreGodkendt
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{brugerNavn || "Bygherre"}</p>
                    <p className="text-xs text-gray-400">
                      {bygherreGodkendt
                        ? "Godkendt"
                        : haandvaerkerGodkendt
                        ? "Afventer din godkendelse"
                        : "Ingen handling endnu"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${haandvaerkerGodkendt ? "bg-green-100" : "bg-gray-100"}`}>
                    {haandvaerkerGodkendt
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{kontrakt.haandvaerker_navn || "Håndværker"}</p>
                    <p className="text-xs text-gray-400">
                      {haandvaerkerGodkendt
                        ? (bygherreGodkendt ? "Godkendt" : "Indsendt til godkendelse")
                        : bygherreGodkendt
                        ? "Afventer entreprenørens godkendelse"
                        : kontrakt.haandvaerker_email
                        ? "Udarbejder aftalegrundlaget"
                        : "Ikke inviteret endnu"}
                    </p>
                  </div>
                </div>
              </div>

              {erBeggeGodkendt ? (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-sm font-bold text-gray-900">Kontrakt underskrevet</p>
                  <p className="text-xs text-gray-400 mt-1">Begge parter har godkendt</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {klarTilBygherreGodkendelse && harLokaleDrafts ? (
                      <>
                        <button
                          onClick={sendReviewAendringer}
                          disabled={senderReviewAendringer}
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all bg-[#1e3a2a] text-white hover:opacity-90 disabled:opacity-60"
                        >
                          {senderReviewAendringer
                            ? "Sender..."
                            : antalLokaleDrafts === 1
                            ? "Send 1 ændringsønske"
                            : `Send ${antalLokaleDrafts} ændringsønsker`}
                        </button>
                        <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                          Du har ændringsønsker, der endnu ikke er sendt. &ldquo;Godkend og indgå aftale&rdquo; er tilgængelig igen, når de er sendt eller fjernet.
                        </p>
                        {reviewAendringerFejl && (
                          <p className="mt-2 text-xs text-red-600 text-center leading-snug">{reviewAendringerFejl}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (klarTilBygherreGodkendelse && !alleReviewpunkterBekraeftet) {
                              setVisManglendeReview(true);
                              return;
                            }
                            setVisManglendeReview(false);
                            godkendKontrakt();
                          }}
                          disabled={godkender || bygherreGodkendt || !haandvaerkerGodkendt || uafklaret.length > 0}
                          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                            bygherreGodkendt || !haandvaerkerGodkendt || uafklaret.length > 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-[#1e3a2a] text-white hover:opacity-90"
                          }`}
                        >
                          {godkender
                            ? "Godkender..."
                            : bygherreGodkendt
                            ? "Du har accepteret"
                            : !haandvaerkerGodkendt
                            ? (kontrakt.haandvaerker_email ? "Afventer samlet grundlag" : "Ingen håndværker inviteret")
                            : uafklaret.length > 0
                            ? `${uafklaret.length} forslag mangler at blive afklaret`
                            : "Godkend og indgå aftale"}
                        </button>
                        {klarTilBygherreGodkendelse && visManglendeReview && manglendeReviewPunkter.length > 0 && (
                          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            Du mangler at gennemgå {manglendeReviewPunkter.length === 1 ? "1 punkt" : `${manglendeReviewPunkter.length} punkter`} før aftalen kan godkendes:{" "}
                            {manglendeReviewPunkter.map((p, i) => (
                              <span key={p.id}>
                                <a href={`#review-${p.id}`} className="font-semibold text-[#1e3a2a] hover:underline underline-offset-2">
                                  {p.label}
                                </a>
                                {i < manglendeReviewPunkter.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </p>
                        )}
                        {godkendFejl && (
                          <p className="mt-3 text-xs text-red-600 text-center leading-snug">{godkendFejl}</p>
                        )}
                      </>
                    )}
                  </div>
                  {klarTilBygherreGodkendelse && !harLokaleDrafts && (
                    <button
                      onClick={() => { setVisAendringsModal(true); setAendringsFejl(""); }}
                      className="w-full mt-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors"
                    >
                      Anmod om ændringer
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Chat med håndværker */}
            <div className="bg-white rounded-2xl border border-[#e0ddd6] p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Chat med håndværker</h3>
              {kontrakt.haandvaerker_email ? (
                <Link
                  href={`/projekt/${id}/chat/${kontrakt.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#1e3a2a] text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Åbn chat
                </Link>
              ) : (
                <p className="text-sm text-gray-400 leading-relaxed">
                  Chat er tilgængeligt, når håndværkerens e-mail er registreret på kontrakten.
                </p>
              )}
            </div>

            {/* Tilbudsdokument fra entreprenor */}
            {kontrakt.tilbud_dokument_url && (
              <div className="bg-white rounded-2xl border border-[#e0ddd6] p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Tilbud fra entreprenoren</h3>
                <div className="flex items-center justify-between bg-[#f5f3ee] rounded-xl px-4 py-3 border border-gray-200 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2" className="flex-shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <a href={kontrakt.tilbud_dokument_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#1e3a2a] truncate hover:underline">
                      {kontrakt.tilbud_dokument_navn || "Tilbudsdokument"}
                    </a>
                  </div>
                  <a href={kontrakt.tilbud_dokument_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#1e3a2a] ml-3 hover:underline flex-shrink-0">
                    Abn
                  </a>
                </div>
                <button
                  onClick={sletTilbudsDokument}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Slet dokument (GDPR)
                </button>
              </div>
            )}

            {/* Status-banner hvis haandvaerker har sendt tilbud men bygherre ikke godkendt endnu */}
            {haandvaerkerGodkendt && !bygherreGodkendt && !erBeggeGodkendt && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Tilbud modtaget</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      {kontrakt.haandvaerker_navn || "Entreprenoren"} har sendt sit tilbud. Gennemse det og godkend kontrakten nedenfor naar du er klar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AB-Forbruger */}
            <div className="bg-white rounded-2xl border border-[#e0ddd6] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#1e3a2a] text-white text-[10px] font-bold px-2 py-0.5 rounded">AB-Forbruger</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Alle ændringer i kontrakten dokumenteres med tidsstempel og forfatter. Det er din juridiske dokumentation hvis der opstår uenighed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
