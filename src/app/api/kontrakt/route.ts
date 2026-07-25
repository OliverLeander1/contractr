import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/kontrakt?projekt_id=xxx  — hent eller opret kontrakt for projekt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projekt_id = searchParams.get("projekt_id");
  const bygherre_id = searchParams.get("bygherre_id");

  if (!projekt_id) {
    return NextResponse.json({ error: "projekt_id mangler" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("kontrakter")
    .select("*, kontraktaendringer(*)")
    .eq("projekt_id", projekt_id)
    .order("oprettet_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    // Opret tom kontrakt
    const { data: ny, error: opretFejl } = await db
      .from("kontrakter")
      .insert({
        projekt_id,
        bygherre_id: bygherre_id || null,
        status: "udkast",
      })
      .select()
      .single();

    if (opretFejl) {
      return NextResponse.json({ error: opretFejl.message }, { status: 500 });
    }

    return NextResponse.json({ ...ny, kontraktaendringer: [] });
  }

  return NextResponse.json(data);
}

// POST /api/kontrakt — opdater kontraktindhold
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kontrakt_id, bygherre_id, titel, beskrivelse, total_pris, betalingsplan, vilkaar, haandvaerker_email } = body;

  if (!kontrakt_id) {
    return NextResponse.json({ error: "kontrakt_id mangler" }, { status: 400 });
  }

  const db = createServiceClient();

  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };
  if (titel !== undefined) opdatering.titel = titel;
  if (beskrivelse !== undefined) opdatering.beskrivelse = beskrivelse;
  if (total_pris !== undefined) opdatering.total_pris = total_pris;
  if (betalingsplan !== undefined) opdatering.betalingsplan = betalingsplan;
  if (vilkaar !== undefined) opdatering.vilkaar = vilkaar;
  if (haandvaerker_email !== undefined) {
    opdatering.haandvaerker_email = haandvaerker_email;
    opdatering.status = "inviteret";
  }

  // Nulstil godkendelser når indhold ændres
  if (Object.keys(opdatering).length > 1) {
    opdatering.bygherre_godkendt_at = null;
    opdatering.haandvaerker_godkendt_at = null;
  }

  const where: Record<string, unknown> = { id: kontrakt_id };
  if (bygherre_id) where.bygherre_id = bygherre_id;

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .match(where)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
