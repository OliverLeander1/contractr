import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET  /api/projekter/[id]/projektgrundlag — liste over et projekts projektgrundlag
// POST /api/projekter/[id]/projektgrundlag — opret ét nyt projektgrundlag under projektet
//
// Projektgrundlag er en selvstændig pre-contract-entitet — intet her må
// læse, skrive eller oprette i public.kontrakter. GET har ingen
// sideeffekt (opretter aldrig en række, i modsætning til det eksisterende
// mønster i GET /api/kontrakt?projekt_id=).

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

// Streng allowlist-validering. Ukendte felter i body ignoreres stille —
// kun de eksplicit understøttede felter kan nogensinde nå frem til en
// databaseoperation.
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

async function verificerEjerskab(req: NextRequest, projektId: string) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ fejl: "Ikke godkendt" }, { status: 401 }) };
  }
  if (!UUID_RE.test(projektId)) {
    return { error: NextResponse.json({ fejl: "Adgang afvist" }, { status: 403 }) };
  }

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return { error: NextResponse.json({ fejl: "Ikke godkendt" }, { status: 401 }) };
  }

  const { data: projekt } = await db
    .from("projekter")
    .select("id, bygherre_id")
    .eq("id", projektId)
    .maybeSingle();

  if (!projekt || projekt.bygherre_id !== user.id) {
    return { error: NextResponse.json({ fejl: "Adgang afvist" }, { status: 403 }) };
  }

  return { db };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultat = await verificerEjerskab(req, id);
  if ("error" in resultat) return resultat.error;
  const { db } = resultat;

  const { data, error } = await db
    .from("projektgrundlag")
    .select(SELECT_FELTER)
    .eq("projekt_id", id)
    .order("opdateret_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[projektgrundlag] Kunne ikke hente liste", { code: error.code, message: error.message });
    return NextResponse.json({ fejl: "Kunne ikke hente projektgrundlag" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultat = await verificerEjerskab(req, id);
  if ("error" in resultat) return resultat.error;
  const { db } = resultat;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fejl: "Ugyldig JSON" }, { status: 400 });
  }

  const valideret = validerFelter(body, { krævTitel: true });
  if (!valideret.ok) {
    return NextResponse.json({ fejl: valideret.fejl }, { status: 400 });
  }

  // projekt_id kommer udelukkende fra den verificerede route — et evt.
  // projekt_id i body læses aldrig. Status sættes altid til "udkast" ved
  // oprettelse, uanset hvad body måtte indeholde.
  const { data, error } = await db
    .from("projektgrundlag")
    .insert({
      projekt_id: id,
      titel: valideret.data.titel,
      fag: valideret.data.fag ?? null,
      arbejdsomfang: valideret.data.arbejdsomfang ?? "",
      eksisterende_forhold: valideret.data.eksisterende_forhold ?? "",
      materialer_kvalitet: valideret.data.materialer_kvalitet ?? "",
      tidsramme: valideret.data.tidsramme ?? "",
      adgangsforhold: valideret.data.adgangsforhold ?? "",
      dokumentationskrav: valideret.data.dokumentationskrav ?? "",
      oevrige_forhold: valideret.data.oevrige_forhold ?? "",
      status: "udkast",
    })
    .select(SELECT_FELTER)
    .single();

  if (error) {
    console.error("[projektgrundlag] Kunne ikke oprette", { code: error.code, message: error.message });
    return NextResponse.json({ fejl: "Kunne ikke oprette projektgrundlag" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
