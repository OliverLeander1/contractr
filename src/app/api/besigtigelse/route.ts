import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

type SupabaseUser = Awaited<ReturnType<ReturnType<typeof createServiceClient>["auth"]["getUser"]>>["data"]["user"];

interface KontraktRad {
  id: string;
  projekt_id: string;
  bygherre_id: string | null;
  haandvaerker_email: string | null;
}

interface BesigtigelseRad {
  id: string;
  kontrakt_id: string;
  projekt_id: string;
  dato: string;
  tidspunkt: string | null;
  kommentar_bygherre: string | null;
  kommentar_haandvaerker: string | null;
  status: string;
  foreslaaet_af: string;
  oprettet_at: string;
  opdateret_at: string;
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

// GET — hent besigtigelse for en kontrakt
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

  // 4. Hent besigtigelse
  const { data } = await db
    .from("besigtigelse")
    .select("*")
    .eq("kontrakt_id", kontraktId)
    .order("oprettet_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(data ?? null);
}

// POST — opret besigtigelsesanmodning
export async function POST(req: NextRequest) {
  // 1. Verificer JWT
  const jwt = await verificerJWT(req);
  if (!jwt.ok) return jwt.response;
  const { user, db } = jwt;

  // 2. Læs body
  const body = await req.json();
  const { kontrakt_id, dato, tidspunkt, kommentar } = body;

  // 3. Valider påkrævede felter
  if (!kontrakt_id) {
    return NextResponse.json({ error: "Mangler kontrakt_id" }, { status: 400 });
  }
  if (!dato) {
    return NextResponse.json({ error: "Mangler dato" }, { status: 400 });
  }

  // 4. Hent kontrakt og bestem rolle
  const rolleRes = await bestemRolle(user, kontrakt_id, db);
  if (!rolleRes.ok) return rolleRes.response;
  const { rolle, kontrakt } = rolleRes;

  // 5. Kontrollér eksisterende besigtigelse
  const { data: eksisterende } = await db
    .from("besigtigelse")
    .select("id, status")
    .eq("kontrakt_id", kontrakt_id)
    .order("oprettet_at", { ascending: false })
    .limit(1)
    .single() as { data: { id: string; status: string } | null };

  if (eksisterende) {
    if (eksisterende.status === "foreslaaet") {
      return NextResponse.json(
        { error: "Der afventes allerede svar på en besigtigelsesanmodning." },
        { status: 409 },
      );
    }
    if (eksisterende.status === "godkendt") {
      return NextResponse.json(
        { error: "Der er allerede aftalt en besigtigelse." },
        { status: 409 },
      );
    }
    // status = "afvist" — genbrug rækken via UPDATE, ingen DELETE
    const genbrugOpdatering: Record<string, unknown> = {
      dato,
      tidspunkt: tidspunkt || null,
      status: "foreslaaet",
      foreslaaet_af: rolle,
      opdateret_at: new Date().toISOString(),
      // Nulstil begge kommentarfelter, sæt derefter kun den verificerede brugers
      kommentar_bygherre: null,
      kommentar_haandvaerker: null,
    };
    if (rolle === "bygherre") genbrugOpdatering.kommentar_bygherre = kommentar || null;
    if (rolle === "haandvaerker") genbrugOpdatering.kommentar_haandvaerker = kommentar || null;

    const { data, error } = await db
      .from("besigtigelse")
      .update(genbrugOpdatering)
      .eq("id", eksisterende.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // 6. Ingen eksisterende — INSERT nyt forslag
  const indsæt: Record<string, unknown> = {
    kontrakt_id,
    projekt_id: kontrakt.projekt_id,
    dato,
    tidspunkt: tidspunkt || null,
    status: "foreslaaet",
    foreslaaet_af: rolle,
    kommentar_bygherre: rolle === "bygherre" ? (kommentar || null) : null,
    kommentar_haandvaerker: rolle === "haandvaerker" ? (kommentar || null) : null,
  };

  const { data, error } = await db
    .from("besigtigelse")
    .insert(indsæt)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  const { id, action, kommentar, ny_dato, ny_tidspunkt } = body;

  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  if (!action) return NextResponse.json({ error: "Mangler action" }, { status: 400 });

  const TILLADTE_ACTIONS = ["accept", "counter"] as const;
  type Action = (typeof TILLADTE_ACTIONS)[number];
  if (!TILLADTE_ACTIONS.includes(action as Action)) {
    return NextResponse.json({ error: "Ugyldig action" }, { status: 400 });
  }

  // 3. Hent besigtigelsesrækken
  const { data: besigtigelse } = await db
    .from("besigtigelse")
    .select("*")
    .eq("id", id)
    .single() as { data: BesigtigelseRad | null };

  if (!besigtigelse) {
    return NextResponse.json({ error: "Besigtigelse ikke fundet" }, { status: 404 });
  }

  // 4. Hent kontrakt og bestem rolle ud fra den allerede verificerede user
  const rolleRes = await bestemRolle(user, besigtigelse.kontrakt_id, db);
  if (!rolleRes.ok) return rolleRes.response;
  const { rolle } = rolleRes;

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

    const opdatering: Record<string, unknown> = {
      status: "godkendt",
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // action === "counter"
  if (erForslagsstiller) {
    return NextResponse.json(
      { error: "Du kan ikke fremsætte modforslag på dit eget forslag." },
      { status: 403 },
    );
  }
  if (!ny_dato) {
    return NextResponse.json({ error: "Mangler ny_dato til modforslag" }, { status: 400 });
  }

  const opdatering: Record<string, unknown> = {
    dato: ny_dato,
    tidspunkt: ny_tidspunkt || null,
    status: "foreslaaet",
    foreslaaet_af: rolle,
    opdateret_at: new Date().toISOString(),
  };
  if (rolle === "bygherre") opdatering.kommentar_bygherre = kommentar || null;
  if (rolle === "haandvaerker") opdatering.kommentar_haandvaerker = kommentar || null;

  const { data, error } = await db
    .from("besigtigelse")
    .update(opdatering)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
