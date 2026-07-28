import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// GET — hent besigtigelse for en kontrakt
export async function GET(req: NextRequest) {
  const kontraktId = req.nextUrl.searchParams.get("kontrakt_id");
  if (!kontraktId) return NextResponse.json({ error: "Mangler kontrakt_id" }, { status: 400 });

  const db = createServiceClient();
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
  const body = await req.json();
  const { kontrakt_id, projekt_id, dato, tidspunkt, kommentar, foreslaaet_af } = body;
  if (!kontrakt_id || !projekt_id || !dato) {
    return NextResponse.json({ error: "Mangler påkrævede felter" }, { status: 400 });
  }

  const db = createServiceClient();

  // Slet eventuel eksisterende
  await db.from("besigtigelse").delete().eq("kontrakt_id", kontrakt_id);

  const { data, error } = await db.from("besigtigelse").insert({
    kontrakt_id,
    projekt_id,
    dato,
    tidspunkt: tidspunkt || null,
    kommentar_bygherre: foreslaaet_af === "bygherre" ? (kommentar || null) : null,
    kommentar_haandvaerker: foreslaaet_af === "haandvaerker" ? (kommentar || null) : null,
    status: "foreslaaet",
    foreslaaet_af,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — svar på anmodning (godkend/afvis/ny dato + tilføj kommentar)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, kommentar, rolle, ny_dato, ny_tidspunkt } = body;
  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });

  const db = createServiceClient();

  const opdatering: Record<string, unknown> = { status, opdateret_at: new Date().toISOString() };
  if (rolle === "bygherre" && kommentar !== undefined) opdatering.kommentar_bygherre = kommentar;
  if (rolle === "haandvaerker" && kommentar !== undefined) opdatering.kommentar_haandvaerker = kommentar;
  if (ny_dato) { opdatering.dato = ny_dato; opdatering.status = "foreslaaet"; opdatering.foreslaaet_af = rolle; }
  if (ny_tidspunkt !== undefined) opdatering.tidspunkt = ny_tidspunkt || null;

  const { data, error } = await db
    .from("besigtigelse")
    .update(opdatering)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
