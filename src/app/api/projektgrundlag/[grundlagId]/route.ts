import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// PATCH /api/projektgrundlag/[grundlagId] — opdater ét eksisterende projektgrundlag
//
// Ejerskab verificeres via projektgrundlag.projekt_id → projekter.id →
// projekter.bygherre_id → den verificerede bruger. id, projekt_id og
// oprettet_at kan aldrig ændres — de indgår ikke i allowlisten og læses
// derfor aldrig fra body. Rører aldrig public.kontrakter.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT_FELTER =
  "id, projekt_id, titel, fag, arbejdsomfang, eksisterende_forhold, materialer_kvalitet, tidsramme, adgangsforhold, dokumentationskrav, oevrige_forhold, status, oprettet_at, opdateret_at";

const FRITEKST_FELTER = [
  "arbejdsomfang",
  "eksisterende_forhold",
  "materialer_kvalitet",
  "tidsramme",
  "adgangsforhold",
  "dokumentationskrav",
  "oevrige_forhold",
] as const;

const GYLDIGE_STATUSSER = ["udkast", "klar_til_invitation"] as const;

interface ValideretFelter {
  titel?: string;
  fag?: string | null;
  arbejdsomfang?: string;
  eksisterende_forhold?: string;
  materialer_kvalitet?: string;
  tidsramme?: string;
  adgangsforhold?: string;
  dokumentationskrav?: string;
  oevrige_forhold?: string;
  status?: (typeof GYLDIGE_STATUSSER)[number];
}

// Streng allowlist-validering — identisk regelsæt som i
// /api/projekter/[id]/projektgrundlag (bevidst dupliceret, da de to
// endpoints er selvstændige route-filer uden en delt hjælpefil i denne
// fases tilladte filliste).
function validerFelter(
  body: unknown,
  { krævTitel }: { krævTitel: boolean }
): { ok: true; data: ValideretFelter } | { ok: false; fejl: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, fejl: "Ugyldigt input" };
  }
  const b = body as Record<string, unknown>;
  const data: ValideretFelter = {};

  if ("titel" in b) {
    if (typeof b.titel !== "string") return { ok: false, fejl: "Titel skal være tekst" };
    const t = b.titel.trim();
    if (t.length < 1 || t.length > 120) {
      return { ok: false, fejl: "Titel skal være mellem 1 og 120 tegn" };
    }
    data.titel = t;
  } else if (krævTitel) {
    return { ok: false, fejl: "Titel er påkrævet" };
  }

  if ("fag" in b) {
    if (b.fag !== null && typeof b.fag !== "string") {
      return { ok: false, fejl: "Fag skal være tekst eller tom" };
    }
    const f = typeof b.fag === "string" ? b.fag.trim() : "";
    if (f.length > 100) return { ok: false, fejl: "Fag må maks. være 100 tegn" };
    data.fag = f.length > 0 ? f : null;
  }

  for (const felt of FRITEKST_FELTER) {
    if (felt in b) {
      const v = b[felt];
      if (typeof v !== "string") return { ok: false, fejl: `${felt} skal være tekst` };
      if (v.length > 10000) return { ok: false, fejl: `${felt} er for langt (maks. 10.000 tegn)` };
      data[felt] = v;
    }
  }

  if ("status" in b) {
    if (
      typeof b.status !== "string" ||
      !(GYLDIGE_STATUSSER as readonly string[]).includes(b.status)
    ) {
      return { ok: false, fejl: "Ugyldig status" };
    }
    data.status = b.status as (typeof GYLDIGE_STATUSSER)[number];
  }

  return { ok: true, data };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ grundlagId: string }> }
) {
  const { grundlagId } = await params;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ fejl: "Ikke godkendt" }, { status: 401 });
  }
  if (!UUID_RE.test(grundlagId)) {
    return NextResponse.json({ fejl: "Projektgrundlag ikke fundet" }, { status: 404 });
  }

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ fejl: "Ikke godkendt" }, { status: 401 });
  }

  const { data: eksisterende } = await db
    .from("projektgrundlag")
    .select(SELECT_FELTER)
    .eq("id", grundlagId)
    .maybeSingle();

  if (!eksisterende) {
    return NextResponse.json({ fejl: "Projektgrundlag ikke fundet" }, { status: 404 });
  }

  const { data: projekt } = await db
    .from("projekter")
    .select("bygherre_id")
    .eq("id", eksisterende.projekt_id)
    .maybeSingle();

  if (!projekt || projekt.bygherre_id !== user.id) {
    return NextResponse.json({ fejl: "Adgang afvist" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fejl: "Ugyldig JSON" }, { status: 400 });
  }

  const valideret = validerFelter(body, { krævTitel: false });
  if (!valideret.ok) {
    return NextResponse.json({ fejl: valideret.fejl }, { status: 400 });
  }

  // "klar_til_invitation" kræver som minimum udfyldt titel og
  // arbejdsomfang — vurderet på de EFFEKTIVE værdier (denne opdatering
  // kombineret med det allerede gemte), ikke kun det der indgår i netop
  // dette kald. Dette rammer fx et rent statusskift uden andre felter.
  const nyStatus = valideret.data.status ?? eksisterende.status;
  const effektivTitel = valideret.data.titel ?? eksisterende.titel;
  const effektivArbejdsomfang = valideret.data.arbejdsomfang ?? eksisterende.arbejdsomfang;

  if (nyStatus === "klar_til_invitation") {
    if (!effektivTitel || effektivTitel.trim().length === 0) {
      return NextResponse.json(
        { fejl: "Titel skal være udfyldt for at markere som klar til invitation" },
        { status: 400 }
      );
    }
    if (!effektivArbejdsomfang || effektivArbejdsomfang.trim().length === 0) {
      return NextResponse.json(
        { fejl: "Arbejdsomfang skal være udfyldt for at markere som klar til invitation" },
        { status: 400 }
      );
    }
  }

  const opdatering: Record<string, unknown> = {
    ...valideret.data,
    opdateret_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("projektgrundlag")
    .update(opdatering)
    .eq("id", grundlagId)
    .select(SELECT_FELTER)
    .single();

  if (error) {
    console.error("[projektgrundlag] Kunne ikke opdatere", { code: error.code, message: error.message });
    return NextResponse.json({ fejl: "Kunne ikke gemme ændringer" }, { status: 500 });
  }

  return NextResponse.json(data);
}
