import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { erBesigtigelsePasseret, hentEffektivDatoTid } from "@/lib/besigtigelse";

type SupabaseUser = Awaited<ReturnType<ReturnType<typeof createServiceClient>["auth"]["getUser"]>>["data"]["user"];

interface KontraktRad {
  id: string;
  projekt_id: string;
  bygherre_id: string | null;
  haandvaerker_email: string | null;
}

interface BesigtigelseTidspunktRad {
  id: string;
  besigtigelse_id: string;
  dato: string;
  tidspunkt: string;
  sortering: number;
  oprettet_at: string;
}

interface BesigtigelseRad {
  id: string;
  kontrakt_id: string;
  projekt_id: string;
  dato: string | null;
  tidspunkt: string | null;
  varighed_minutter: number | null;
  valgt_tidspunkt_id: string | null;
  kommentar_bygherre: string | null;
  kommentar_haandvaerker: string | null;
  status: string;
  foreslaaet_af: string;
  oprettet_at: string;
  opdateret_at: string;
}

interface BesigtigelseRadMedTidspunkter extends BesigtigelseRad {
  besigtigelse_tidspunkter: BesigtigelseTidspunktRad[];
}

// -----------------------------------------------------------------------------
// Input-validering — Next.js validerer først for gode brugerfejl. RPC'en
// validerer det samme igen server-side/database-side som endelig kontrol;
// dette er ikke en erstatning for det, kun en hurtigere, pænere fejlbesked.
// -----------------------------------------------------------------------------

const DATO_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TIDSPUNKT_REGEX = /^([0-1][0-9]|2[0-3]):(00|15|30|45)$/;
const VARIGHED_ALLOWLIST = [30, 45, 60, 90, 120] as const;

interface TidspunktInput {
  dato: string;
  tidspunkt: string;
}

function validerTidspunkter(
  raw: unknown,
): { ok: true; tidspunkter: TidspunktInput[] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 3) {
    return { ok: false, error: "Der skal foreslås mellem 1 og 3 tidspunkter." };
  }

  const tidspunkter: TidspunktInput[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Ugyldigt tidspunktselement." };
    }
    const dato = (item as Record<string, unknown>).dato;
    const tidspunkt = (item as Record<string, unknown>).tidspunkt;

    if (typeof dato !== "string" || !DATO_REGEX.test(dato)) {
      return { ok: false, error: "Ugyldigt datoformat. Brug ÅÅÅÅ-MM-DD." };
    }
    if (typeof tidspunkt !== "string" || !TIDSPUNKT_REGEX.test(tidspunkt)) {
      return {
        ok: false,
        error: "Tidspunkt skal være på hele, kvarte, halve eller tre-kvarte timer (fx 08:00, 08:15, 08:30, 08:45).",
      };
    }
    // Reel produktregel (ikke kun UX): besigtigelser kan kun foreslås mellem
    // 07:00 og 18:00. tidspunkt er her allerede verificeret til gyldigt
    // "HH:MM"-format, så en almindelig strengsammenligning er korrekt og nok.
    if (tidspunkt < "07:00" || tidspunkt > "18:00") {
      return { ok: false, error: "Tidspunkt skal ligge mellem 07:00 og 18:00." };
    }
    tidspunkter.push({ dato, tidspunkt });
  }

  const unikke = new Set(tidspunkter.map((t) => `${t.dato}T${t.tidspunkt}`));
  if (unikke.size !== tidspunkter.length) {
    return { ok: false, error: "Samme dato og tidspunkt er foreslået to gange." };
  }

  return { ok: true, tidspunkter };
}

function validerVarighed(raw: unknown): { ok: true; varighed: number } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, varighed: 60 };
  }
  const varighed = Number(raw);
  if (!VARIGHED_ALLOWLIST.includes(varighed as (typeof VARIGHED_ALLOWLIST)[number])) {
    return { ok: false, error: "Ugyldig varighed. Vælg 30 min., 45 min., 1 time, 1½ time eller 2 timer." };
  }
  return { ok: true, varighed };
}

// Oversætter en RPC/database-fejl til en forståelig dansk fejlbesked.
// Ingen rå Postgres-fejltekst vises nogensinde direkte til brugeren.
function mapRpcFejl(error: { message?: string; code?: string }): string {
  if (error.code === "23505") {
    return "Samme dato og tidspunkt er foreslået to gange.";
  }
  if (error.code === "23503") {
    return "Der opstod en fejl med det valgte tidspunkt. Prøv igen.";
  }
  const kendteValideringsfejl = [
    "Ugyldig foreslaaet_af",
    "Ugyldig varighed",
    "p_tidspunkter skal være et JSON-array",
    "Der skal foreslås mellem 1 og 3 tidspunkter",
    "Hvert tidspunktselement skal være et JSON-objekt",
    "Mangler eller ugyldig",
    "dato/tidspunkt må ikke være null",
    "Ugyldigt datoformat",
    "Tidspunkt skal være på hele",
    "Tidspunkt skal ligge mellem",
  ];
  if (error.message && kendteValideringsfejl.some((k) => error.message!.includes(k))) {
    return "Et af de indtastede tidspunkter er ugyldigt. Kontrollér dato og klokkeslæt.";
  }
  return "Der opstod en fejl. Prøv igen.";
}

// -----------------------------------------------------------------------------
// Notifikationer — genbruger den eksisterende public.notifikationer-tabel
// (samme skema som ab-notifikationer/ekstraarbejde skriver til i dag). Ingen ny
// tabel, ingen nye kolonner. Modtageren udledes ALTID her, server-side, af den
// allerede autoritative kontrakt-/rolledata (kontrakt.bygherre_id /
// kontrakt.haandvaerker_email) — aldrig af klientinput.
// -----------------------------------------------------------------------------

// Slår entreprenørens profiler.id op ud fra kontraktens haandvaerker_email.
// bygherre_id kendes allerede direkte via kontrakten og kræver intet opslag.
// Returnerer null, hvis entreprenøren endnu ikke har oprettet en konto med
// den e-mail — i så fald findes intet gyldigt notifikationsmål, og der
// oprettes bevidst ingen notifikation.
async function findBrugerIdVedEmail(
  db: ReturnType<typeof createServiceClient>,
  email: string,
): Promise<string | null> {
  const { data } = await db
    .from("profiler")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();
  return data?.id ?? null;
}

// Simpel dublet-beskyttelse — samme grundmønster som harNyligNotifikation() i
// /api/ab-notifikationer: spring oprettelse over, hvis en identisk
// notifikation (samme bruger/projekt/type) allerede blev oprettet inden for
// de seneste 10 sekunder. Beskytter mod dobbelt-indsendte requests uden en ny
// idempotensarkitektur.
async function harNyligBesigtigelseNotifikation(
  db: ReturnType<typeof createServiceClient>,
  brugerId: string,
  projektId: string,
  type: string,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - 10_000).toISOString();
  const { data } = await db
    .from("notifikationer")
    .select("id")
    .eq("bruger_id", brugerId)
    .eq("projekt_id", projektId)
    .eq("type", type)
    .gte("oprettet_at", cutoff)
    .limit(1);
  return !!data && data.length > 0;
}

// Opretter en besigtigelses-notifikation til modparten. Kaldes ALTID først
// efter en allerede bekræftet, vellykket besigtigelsesskrivning — aldrig før,
// og aldrig hvis skrivningen fejlede. Fejler denne funktion selv (fx intet
// opslag fundet, eller en databasefejl), sluges fejlen bevidst over for
// KLIENTEN — den kaldende route svarer altid succes for selve
// besigtigelseshandlingen uanset notifikationsudfaldet, så brugeren aldrig
// fejlagtigt tror handlingen slog fejl og forsøger at gentage den. Fejlen
// logges derimod altid server-side (console.error), så et reelt
// notifikationsproblem ikke forsvinder sporløst.
async function opretBesigtigelseNotifikation(
  db: ReturnType<typeof createServiceClient>,
  params: {
    modtagerRolle: "bygherre" | "haandvaerker";
    kontrakt: { bygherre_id: string | null; haandvaerker_email: string | null };
    projektId: string;
    type: string;
    titel: string;
    besked: string;
  },
): Promise<void> {
  try {
    const brugerId = params.modtagerRolle === "bygherre"
      ? params.kontrakt.bygherre_id
      : params.kontrakt.haandvaerker_email
        ? await findBrugerIdVedEmail(db, params.kontrakt.haandvaerker_email)
        : null;

    if (!brugerId) return;
    if (await harNyligBesigtigelseNotifikation(db, brugerId, params.projektId, params.type)) return;

    const { error } = await db.from("notifikationer").insert({
      bruger_id: brugerId,
      projekt_id: params.projektId,
      type: params.type,
      titel: params.titel,
      besked: params.besked,
      laest: false,
    });

    if (error) {
      // Supabase-js kaster ikke ved en almindelig forespørgselsfejl — den
      // returneres i stedet i "error" og skal derfor tjekkes eksplicit for
      // overhovedet at blive logget.
      console.error(
        `[besigtigelse-notifikation] Kunne ikke oprette notifikation (type=${params.type}, projekt=${params.projektId}):`,
        error.message,
      );
    }
  } catch (fejl) {
    console.error(
      `[besigtigelse-notifikation] Uventet fejl ved oprettelse af notifikation (type=${params.type}, projekt=${params.projektId}):`,
      fejl,
    );
  }
}

// Kort dansk datoformat til notifikationstekst, fx "13. august" — bevidst
// uden årstal og uden ugedag for at holde beskeden kort og konkret.
function fmtKortDato(dato: string): string {
  return new Date(dato + "T00:00:00").toLocaleDateString("da-DK", { day: "numeric", month: "long" });
}

// Trin 1: verificer JWT — returnerer verified user og db-klient
async function verificerJWT(req: NextRequest): Promise<
  | { ok: true; user: NonNullable<SupabaseUser>; db: ReturnType<typeof createServiceClient> }
  | { ok: false; response: NextResponse }
> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: NextResponse.json({ error: "Ikke logget ind" }, { status: 401 }) };
  }
  const accessToken = authHeader.replace("Bearer ", "");

  const db = createServiceClient();
  const { data: { user }, error: authError } = await db.auth.getUser(accessToken);
  if (authError || !user) {
    return { ok: false, response: NextResponse.json({ error: "Ugyldig session" }, { status: 401 }) };
  }

  return { ok: true, user, db };
}

// Trin 2: bestem rolle ud fra verificeret user og kontrakt_id
async function bestemRolle(
  user: NonNullable<SupabaseUser>,
  kontraktId: string,
  db: ReturnType<typeof createServiceClient>,
): Promise<
  | { ok: true; rolle: "bygherre" | "haandvaerker"; kontrakt: KontraktRad }
  | { ok: false; response: NextResponse }
> {
  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, projekt_id, bygherre_id, haandvaerker_email")
    .eq("id", kontraktId)
    .single();

  if (!kontrakt) {
    return { ok: false, response: NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 }) };
  }

  const erBygherre = kontrakt.bygherre_id && user.id === kontrakt.bygherre_id;
  const erHaandvaerker =
    user.email &&
    kontrakt.haandvaerker_email &&
    user.email.trim().toLowerCase() === kontrakt.haandvaerker_email.trim().toLowerCase();

  if (erBygherre && erHaandvaerker) {
    return { ok: false, response: NextResponse.json({ error: "Tvetydig identitet" }, { status: 403 }) };
  }
  if (erBygherre) {
    return { ok: true, rolle: "bygherre", kontrakt };
  }
  if (erHaandvaerker) {
    return { ok: true, rolle: "haandvaerker", kontrakt };
  }

  return { ok: false, response: NextResponse.json({ error: "Du har ikke adgang til denne kontrakt" }, { status: 403 }) };
}

// GET — hent besigtigelse for en kontrakt (aktuel runde + read-only historik).
// Hver runde inkluderer sine 1-3 tidspunkter (tomt array for legacy-rækker uden
// child-data). dato/tidspunkt på selve runden er legacy-parent-felter og er
// null for alle runder oprettet via det nye multi-tids-flow.
export async function GET(req: NextRequest) {
  // 1. Verificer JWT
  const jwt = await verificerJWT(req);
  if (!jwt.ok) return jwt.response;
  const { user, db } = jwt;

  // 2. Valider query-parameter
  const kontraktId = req.nextUrl.searchParams.get("kontrakt_id");
  if (!kontraktId) {
    return NextResponse.json({ error: "Mangler kontrakt_id" }, { status: 400 });
  }

  // 3. Bestem rolle
  const rolle = await bestemRolle(user, kontraktId, db);
  if (!rolle.ok) return rolle.response;

  // 4. Hent alle besigtigelsesrunder for kontrakten, nyeste først, hver med
  // sine tidspunkter sorteret efter sortering.
  const { data: rækker } = await db
    .from("besigtigelse")
    .select("*, besigtigelse_tidspunkter!besigtigelse_id(*)")
    .eq("kontrakt_id", kontraktId)
    .order("oprettet_at", { ascending: false })
    .order("sortering", { foreignTable: "besigtigelse_tidspunkter", ascending: true });

  if (!rækker || rækker.length === 0) {
    return NextResponse.json(null);
  }

  const formatRunde = (r: BesigtigelseRadMedTidspunkter) => {
    const { besigtigelse_tidspunkter, ...felter } = r;
    return { ...felter, tidspunkter: besigtigelse_tidspunkter ?? [] };
  };

  const [nyesteRaw, ...historikRaw] = rækker as unknown as BesigtigelseRadMedTidspunkter[];
  const nyeste = formatRunde(nyesteRaw);
  const historik = historikRaw.map(formatRunde);

  return NextResponse.json({ ...nyeste, historik });
}

// POST — opret første besigtigelsesrunde (eller genåbn efter afvisning/passeret godkendelse).
// Skriver ALDRIG direkte til besigtigelse — al oprettelse sker atomart via
// RPC'en opret_besigtigelsesrunde, som opretter parent-runden og dens 1-3
// tidspunkter i én transaktion.
export async function POST(req: NextRequest) {
  // 1. Verificer JWT
  const jwt = await verificerJWT(req);
  if (!jwt.ok) return jwt.response;
  const { user, db } = jwt;

  // 2. Læs body
  const body = await req.json();
  const { kontrakt_id, tidspunkter, varighed_minutter, kommentar } = body;

  // 3. Valider påkrævede felter
  if (!kontrakt_id) {
    return NextResponse.json({ error: "Mangler kontrakt_id" }, { status: 400 });
  }
  const tidspunkterRes = validerTidspunkter(tidspunkter);
  if (!tidspunkterRes.ok) {
    return NextResponse.json({ error: tidspunkterRes.error }, { status: 400 });
  }
  const varighedRes = validerVarighed(varighed_minutter);
  if (!varighedRes.ok) {
    return NextResponse.json({ error: varighedRes.error }, { status: 400 });
  }

  // 4. Hent kontrakt og bestem rolle
  const rolleRes = await bestemRolle(user, kontrakt_id, db);
  if (!rolleRes.ok) return rolleRes.response;
  const { rolle, kontrakt } = rolleRes;

  // 5. Kontrollér eksisterende besigtigelse (nyeste runde pr. kontrakt)
  const { data: eksisterende } = await db
    .from("besigtigelse")
    .select("id, status, dato, tidspunkt, valgt_tidspunkt_id, besigtigelse_tidspunkter!besigtigelse_id(id, dato, tidspunkt)")
    .eq("kontrakt_id", kontrakt_id)
    .order("oprettet_at", { ascending: false })
    .limit(1)
    .single();

  if (eksisterende) {
    if (eksisterende.status === "foreslaaet") {
      return NextResponse.json(
        { error: "Der afventes allerede svar på en besigtigelsesanmodning." },
        { status: 409 },
      );
    }
    if (eksisterende.status === "godkendt") {
      const effektiv = hentEffektivDatoTid({
        dato: eksisterende.dato,
        tidspunkt: eksisterende.tidspunkt,
        valgt_tidspunkt_id: eksisterende.valgt_tidspunkt_id,
        tidspunkter: eksisterende.besigtigelse_tidspunkter ?? [],
      });
      if (!effektiv || !erBesigtigelsePasseret(effektiv.dato, effektiv.tidspunkt)) {
        return NextResponse.json(
          { error: "Der er allerede aftalt en besigtigelse." },
          { status: 409 },
        );
      }
      // Godkendt men tidspunktet er passeret — kun haandvaerker må oprette ny anmodning.
      // Den passerede godkendte runde bevares urørt som historik.
      if (rolle !== "haandvaerker") {
        return NextResponse.json(
          { error: "Ny besigtigelsesanmodning skal komme fra entreprenøren." },
          { status: 403 },
        );
      }
    } else {
      // status = "afvist" — kun haandvaerker må starte et nyt forslag.
      // Den afviste runde røres ikke: en helt ny runde oprettes via RPC nedenfor.
      if (rolle !== "haandvaerker") {
        return NextResponse.json(
          { error: "Ny besigtigelsesanmodning skal komme fra entreprenøren." },
          { status: 403 },
        );
      }
    }
  } else {
    // Ingen eksisterende besigtigelse — kun haandvaerker må starte det første forslag
    if (rolle !== "haandvaerker") {
      return NextResponse.json(
        { error: "Besigtigelse skal anmodes af entreprenøren." },
        { status: 403 },
      );
    }
  }

  // 6. Atomar oprettelse af runde + 1-3 tidspunkter via RPC. rolle er her altid
  // "haandvaerker" — alle andre veje er afvist med 403/409 ovenfor. Alle
  // parametre sendes eksplicit — ingen afhængighed af RPC-defaults.
  const { data, error } = await db.rpc("opret_besigtigelsesrunde", {
    p_kontrakt_id: kontrakt_id,
    p_projekt_id: kontrakt.projekt_id,
    p_foreslaaet_af: rolle,
    p_varighed_minutter: varighedRes.varighed,
    p_kommentar_bygherre: null,
    p_kommentar_haandvaerker: kommentar || null,
    p_tidspunkter: tidspunkterRes.tidspunkter,
  });

  if (error) {
    return NextResponse.json({ error: mapRpcFejl(error) }, { status: 500 });
  }

  // Notifikation kun EFTER bekræftet vellykket oprettelse. rolle er her altid
  // "haandvaerker" (se gates ovenfor), så modparten er altid bygherren.
  await opretBesigtigelseNotifikation(db, {
    modtagerRolle: "bygherre",
    kontrakt,
    projektId: kontrakt.projekt_id,
    type: "besigtigelse_ny",
    titel: "Ny besigtigelsesanmodning",
    besked: "Entreprenøren har foreslået tider til besigtigelse.",
  });

  return NextResponse.json(data);
}

// PATCH — svar på anmodning via kontrollerede handlinger
export async function PATCH(req: NextRequest) {
  // 1. Verificer JWT
  const jwt = await verificerJWT(req);
  if (!jwt.ok) return jwt.response;
  const { user, db } = jwt;

  // 2. Læs body og valider påkrævede felter
  const body = await req.json();
  const { id, action, kommentar } = body;

  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  if (!action) return NextResponse.json({ error: "Mangler action" }, { status: 400 });

  const TILLADTE_ACTIONS = ["accept", "counter", "reject"] as const;
  type Action = (typeof TILLADTE_ACTIONS)[number];
  if (!TILLADTE_ACTIONS.includes(action as Action)) {
    return NextResponse.json({ error: "Ugyldig action" }, { status: 400 });
  }

  // 3. Hent besigtigelsesrunden med dens tidspunkter
  const { data: besigtigelse } = await db
    .from("besigtigelse")
    .select("*, besigtigelse_tidspunkter!besigtigelse_id(id, dato, tidspunkt, besigtigelse_id)")
    .eq("id", id)
    .single();

  if (!besigtigelse) {
    return NextResponse.json({ error: "Besigtigelse ikke fundet" }, { status: 404 });
  }

  // 4. Hent kontrakt og bestem rolle ud fra den allerede verificerede user
  const rolleRes = await bestemRolle(user, besigtigelse.kontrakt_id, db);
  if (!rolleRes.ok) return rolleRes.response;
  const { rolle, kontrakt } = rolleRes;

  // 5. Terminale tilstande
  if (besigtigelse.status === "godkendt") {
    return NextResponse.json(
      { error: "En bekræftet besigtigelse kan ikke ændres." },
      { status: 409 },
    );
  }
  if (besigtigelse.status === "afvist") {
    return NextResponse.json(
      { error: "En afvist besigtigelse kan ikke ændres via PATCH. Opret et nyt forslag." },
      { status: 409 },
    );
  }

  // 6. Status er "foreslaaet" — valider handlingen
  const erForslagsstiller = besigtigelse.foreslaaet_af === rolle;

  if (action === "accept") {
    if (erForslagsstiller) {
      return NextResponse.json(
        { error: "Du kan ikke acceptere dit eget forslag." },
        { status: 403 },
      );
    }

    const { valgt_tidspunkt_id } = body;
    if (!valgt_tidspunkt_id) {
      return NextResponse.json({ error: "Mangler valgt_tidspunkt_id" }, { status: 400 });
    }

    // Server-side verificering: det valgte tidspunkt skal faktisk tilhøre
    // DENNE besigtigelsesrunde — stol aldrig alene på klientens id. Databasens
    // composite FK (besigtigelse_valgt_tidspunkt_samme_runde_fk) håndhæver det
    // samme som ekstra defense-in-depth ved selve UPDATE'et nedenfor.
    const tidspunkter = (besigtigelse.besigtigelse_tidspunkter ?? []) as { id: string; dato: string; tidspunkt: string }[];
    const valgtTidspunkt = tidspunkter.find((t) => t.id === valgt_tidspunkt_id);
    if (!valgtTidspunkt) {
      return NextResponse.json(
        { error: "Det valgte tidspunkt tilhører ikke denne besigtigelse." },
        { status: 400 },
      );
    }

    const opdatering: Record<string, unknown> = {
      status: "godkendt",
      valgt_tidspunkt_id: valgtTidspunkt.id,
      opdateret_at: new Date().toISOString(),
    };
    if (kommentar !== undefined) {
      if (rolle === "bygherre") opdatering.kommentar_bygherre = kommentar || null;
      if (rolle === "haandvaerker") opdatering.kommentar_haandvaerker = kommentar || null;
    }

    const { data, error } = await db
      .from("besigtigelse")
      .update(opdatering)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: mapRpcFejl(error) }, { status: 500 });

    // Modtager = den oprindelige forslagsstiller (garanteret modparten til den
    // der accepterer, jf. erForslagsstiller-tjekket ovenfor). Besked bruger den
    // faktiske valgte dato/tid, ikke en generisk tekst.
    await opretBesigtigelseNotifikation(db, {
      modtagerRolle: besigtigelse.foreslaaet_af as "bygherre" | "haandvaerker",
      kontrakt,
      projektId: besigtigelse.projekt_id,
      type: "besigtigelse_godkendt",
      titel: "Besigtigelse godkendt",
      besked: `Besigtigelsen er godkendt til ${fmtKortDato(valgtTidspunkt.dato)} kl. ${valgtTidspunkt.tidspunkt.slice(0, 5)}.`,
    });

    return NextResponse.json(data);
  }

  if (action === "reject") {
    if (erForslagsstiller) {
      return NextResponse.json(
        { error: "Du kan ikke afvise dit eget forslag." },
        { status: 403 },
      );
    }

    const opdatering: Record<string, unknown> = {
      status: "afvist",
      opdateret_at: new Date().toISOString(),
    };
    if (kommentar !== undefined) {
      if (rolle === "bygherre") opdatering.kommentar_bygherre = kommentar || null;
      if (rolle === "haandvaerker") opdatering.kommentar_haandvaerker = kommentar || null;
    }

    const { data, error } = await db
      .from("besigtigelse")
      .update(opdatering)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: mapRpcFejl(error) }, { status: 500 });

    // Modtager = "den anden part", dvs. den oprindelige forslagsstiller
    // (garanteret modparten til den der afviser, jf. erForslagsstiller-tjekket).
    await opretBesigtigelseNotifikation(db, {
      modtagerRolle: besigtigelse.foreslaaet_af as "bygherre" | "haandvaerker",
      kontrakt,
      projektId: besigtigelse.projekt_id,
      type: "besigtigelse_afvist",
      titel: "Besigtigelse afvist",
      besked: "Besigtigelsen er blevet afvist.",
    });

    return NextResponse.json(data);
  }

  // action === "counter" — "Ingen af tiderne passer". Opretter en HELT NY
  // runde atomart via samme RPC som POST. Den eksisterende (aktuelle) runde
  // røres ikke: intet UPDATE, intet DELETE. Historikken bevares dermed urørt.
  if (erForslagsstiller) {
    return NextResponse.json(
      { error: "Du kan ikke fremsætte modforslag på dit eget forslag." },
      { status: 403 },
    );
  }

  const { tidspunkter: nyeTidspunkter, varighed_minutter } = body;
  const tidspunkterRes = validerTidspunkter(nyeTidspunkter);
  if (!tidspunkterRes.ok) {
    return NextResponse.json({ error: tidspunkterRes.error }, { status: 400 });
  }
  const varighedRes = validerVarighed(varighed_minutter);
  if (!varighedRes.ok) {
    return NextResponse.json({ error: varighedRes.error }, { status: 400 });
  }

  const { data, error } = await db.rpc("opret_besigtigelsesrunde", {
    p_kontrakt_id: besigtigelse.kontrakt_id,
    p_projekt_id: besigtigelse.projekt_id,
    p_foreslaaet_af: rolle,
    p_varighed_minutter: varighedRes.varighed,
    p_kommentar_bygherre: rolle === "bygherre" ? (kommentar || null) : null,
    p_kommentar_haandvaerker: rolle === "haandvaerker" ? (kommentar || null) : null,
    p_tidspunkter: tidspunkterRes.tidspunkter,
  });

  if (error) {
    return NextResponse.json({ error: mapRpcFejl(error) }, { status: 500 });
  }

  // Modtager = modparten til den, der fremsætter modforslaget (garanteret
  // forskellig fra rolle, jf. erForslagsstiller-tjekket ovenfor).
  await opretBesigtigelseNotifikation(db, {
    modtagerRolle: rolle === "haandvaerker" ? "bygherre" : "haandvaerker",
    kontrakt,
    projektId: besigtigelse.projekt_id,
    type: "besigtigelse_modforslag",
    titel: "Nye tider foreslået",
    besked: "Der er foreslået nye tider til besigtigelse.",
  });

  return NextResponse.json(data);
}
