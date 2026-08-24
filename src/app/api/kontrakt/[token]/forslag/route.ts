import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";

export const runtime = "nodejs";

// Felter der må foreslås ændret via forslagsflowet.
// Kun simple tekst- og numeriske felter. JSONB-felter og serverstyrede felter er ikke tilladt.
// "vilkaar" (AB-Forbruger) er bevidst IKKE med her — det aftalevilkår er låst
// og må ikke kunne ændres via den generelle forslagsmekanisme.
const TILLADTE_FELTER = ["titel", "beskrivelse", "total_pris"] as const;
type TilladtFelt = (typeof TILLADTE_FELTER)[number];

function erTilladtFelt(felt: unknown): felt is TilladtFelt {
  return TILLADTE_FELTER.includes(felt as TilladtFelt);
}

type KontraktRolle = "bygherre" | "haandvaerker";

// Verificerer Bearer JWT og udleder afsenderens rolle på DENNE konkrete
// kontrakt — aldrig fra request body. Samme rollemodel som
// /api/kontrakt/[token]/godkend: bygherre via kontraktens bygherre_id,
// entreprenør via verificeret login-email mod kontraktens haandvaerker_email.
async function verificerKontraktPart(
  req: NextRequest,
  db: ReturnType<typeof createServiceClient>,
  kontrakt: { bygherre_id: string | null; haandvaerker_email: string | null }
): Promise<{ rolle: KontraktRolle } | { fejl: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { fejl: NextResponse.json({ error: "Ikke logget ind" }, { status: 401 }) };
  }
  const accessToken = authHeader.replace("Bearer ", "");

  const { data: { user }, error: authError } = await db.auth.getUser(accessToken);
  if (authError || !user) {
    return { fejl: NextResponse.json({ error: "Ugyldig session" }, { status: 401 }) };
  }

  const erBygherre = user.id === kontrakt.bygherre_id;
  const erHaandvaerker = !!(
    kontrakt.haandvaerker_email &&
    user.email &&
    user.email.trim().toLowerCase() === kontrakt.haandvaerker_email.trim().toLowerCase()
  );

  if (erBygherre && erHaandvaerker) {
    return { fejl: NextResponse.json({ error: "Adgang nægtet" }, { status: 403 }) };
  }
  if (!erBygherre && !erHaandvaerker) {
    return { fejl: NextResponse.json({ error: "Du har ikke adgang til denne kontrakt" }, { status: 403 }) };
  }

  return { rolle: erBygherre ? "bygherre" : "haandvaerker" };
}

// POST /api/kontrakt/[token]/forslag — foreslå ændring til et felt
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { felt, ny_vaerdi, forfatter_navn, kommentar } = body;

  if (!felt || ny_vaerdi === undefined || ny_vaerdi === null) {
    return NextResponse.json({ error: "felt og ny_vaerdi er påkrævet" }, { status: 400 });
  }

  if (!erTilladtFelt(felt)) {
    return NextResponse.json(
      { error: `'${felt}' kan ikke foreslås ændret. Tilladte felter: ${TILLADTE_FELTER.join(", ")}` },
      { status: 400 }
    );
  }

  // total_pris valideres inden gemning — afvis ugyldige tal med det samme
  if (felt === "total_pris") {
    const parsed = Number(ny_vaerdi);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "total_pris skal være et positivt tal" }, { status: 400 });
    }
  }

  const db = createServiceClient();

  // Find kontrakt via token
  const { data: kontrakt, error: hentFejl } = await db
    .from("kontrakter")
    .select("id, titel, beskrivelse, total_pris, vilkaar, status, bygherre_id, haandvaerker_email, haandvaerker_navn, projekt_id")
    .eq("haandvaerker_token", token)
    .single();

  if (hentFejl || !kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const partResultat = await verificerKontraktPart(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;
  const forfatter = partResultat.rolle;

  // Hent gammel værdi
  const gammelVaerdi = String(kontrakt[felt] ?? "");

  // Gem forslaget
  const { data: aendring, error: gemFejl } = await db
    .from("kontraktaendringer")
    .insert({
      kontrakt_id: kontrakt.id,
      felt,
      gammel_vaerdi: gammelVaerdi,
      ny_vaerdi: String(ny_vaerdi),
      forfatter,
      forfatter_navn: forfatter_navn || null,
      kommentar: kommentar || null,
      status: "afventer",
    })
    .select()
    .single();

  if (gemFejl) {
    return NextResponse.json({ error: gemFejl.message }, { status: 500 });
  }

  // Opdater kontraktstatus til "forhandling"
  if (kontrakt.status !== "forhandling") {
    await db
      .from("kontrakter")
      .update({ status: "forhandling", opdateret_at: new Date().toISOString() })
      .eq("haandvaerker_token", token);
  }

  // Notificer bygherre om ændringsforslag fra håndværker
  if (forfatter === "haandvaerker" && kontrakt.bygherre_id) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    const { email, notifikationer } = await hentBygherreEmail(kontrakt.bygherre_id, db);
    if (email) {
      sendNotifikation("haandvaerker_forslag_aendring", email, {
        projekttitel: kontrakt.titel || "dit projekt",
        afsenderNavn: forfatter_navn || kontrakt.haandvaerker_navn || "Entreprenøren",
        link: `${baseUrl}/projekt/${kontrakt.projekt_id}/aftale`,
      }, notifikationer);
    }
  }

  return NextResponse.json(aendring);
}

// PATCH /api/kontrakt/[token]/forslag — besvar forslag (accepter/afvis)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { aendring_id, status } = body; // status: 'accepteret' | 'afvist'

  if (!aendring_id || !["accepteret", "afvist"].includes(status)) {
    return NextResponse.json({ error: "aendring_id og status ('accepteret'/'afvist') er påkrævet" }, { status: 400 });
  }

  const db = createServiceClient();

  // Verificer at token tilhører den rigtige kontrakt
  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, titel, beskrivelse, total_pris, betalingsplan, vilkaar, bygherre_id, haandvaerker_email, haandvaerker_navn")
    .eq("haandvaerker_token", token)
    .single();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const partResultat = await verificerKontraktPart(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;
  const { rolle } = partResultat;

  // Hent forslaget FØR det besvares, så vi kan afvise, at forfatteren
  // besvarer sit eget forslag.
  const { data: eksisterendeAendring } = await db
    .from("kontraktaendringer")
    .select("id, felt, ny_vaerdi, forfatter")
    .eq("id", aendring_id)
    .eq("kontrakt_id", kontrakt.id)
    .maybeSingle();

  if (!eksisterendeAendring) {
    return NextResponse.json({ error: "Ændringsforslag ikke fundet" }, { status: 404 });
  }
  if (eksisterendeAendring.forfatter === rolle) {
    return NextResponse.json({ error: "Du kan ikke besvare dit eget forslag" }, { status: 403 });
  }

  // Opdater ændringsforslag
  const { data: aendring, error } = await db
    .from("kontraktaendringer")
    .update({ status, besvaret_at: new Date().toISOString() })
    .eq("id", aendring_id)
    .eq("kontrakt_id", kontrakt.id)
    .select()
    .single();

  if (error || !aendring) {
    return NextResponse.json({ error: "Ændringsforslag ikke fundet" }, { status: 404 });
  }

  // Accepteret: anvend ændringen på kontrakten med eksplicit typed write
  if (status === "accepteret") {
    if (!erTilladtFelt(aendring.felt)) {
      return NextResponse.json(
        { error: `Forslaget refererer til feltet '${aendring.felt}' som ikke længere kan accepteres` },
        { status: 400 }
      );
    }

    let feltVaerdi: string | number;
    if (aendring.felt === "total_pris") {
      const parsed = Number(aendring.ny_vaerdi);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ error: "total_pris i forslaget er ikke et gyldigt positivt tal" }, { status: 400 });
      }
      feltVaerdi = parsed;
    } else {
      // titel, beskrivelse — rene tekstfelter
      feltVaerdi = String(aendring.ny_vaerdi);
    }

    await db
      .from("kontrakter")
      .update({
        [aendring.felt]: feltVaerdi,
        opdateret_at: new Date().toISOString(),
        bygherre_godkendt_at: null,
        haandvaerker_godkendt_at: null,
      })
      .eq("id", kontrakt.id);
  }

  // Notificer håndværker om bygherrens svar
  if (kontrakt.haandvaerker_email) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    const type = status === "accepteret" ? "bygherre_accepteret_forslag" : "bygherre_afvist_forslag";
    sendNotifikation(type, kontrakt.haandvaerker_email, {
      projekttitel: kontrakt.titel || "projektet",
      link: `${baseUrl}/kontrakt/${token}`,
    });
  }

  return NextResponse.json(aendring);
}
