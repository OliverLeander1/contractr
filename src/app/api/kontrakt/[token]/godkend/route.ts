import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// POST /api/kontrakt/[token]/godkend — part godkender kontrakten
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { forfatter, haandvaerker_navn, haandvaerker_firma } = body;

  if (!forfatter || !["bygherre", "haandvaerker"].includes(forfatter)) {
    return NextResponse.json({ error: "forfatter skal være 'bygherre' eller 'haandvaerker'" }, { status: 400 });
  }

  const db = createServiceClient();

  const { data: kontrakt, error: hentFejl } = await db
    .from("kontrakter")
    .select("id, bygherre_godkendt_at, haandvaerker_godkendt_at, status")
    .eq("haandvaerker_token", token)
    .single();

  if (hentFejl || !kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const nu = new Date().toISOString();
  const opdatering: Record<string, unknown> = { opdateret_at: nu };

  if (forfatter === "bygherre") {
    opdatering.bygherre_godkendt_at = nu;
  } else {
    opdatering.haandvaerker_godkendt_at = nu;
    if (haandvaerker_navn) opdatering.haandvaerker_navn = haandvaerker_navn;
    if (haandvaerker_firma) opdatering.haandvaerker_firma = haandvaerker_firma;
  }

  // Tjek om begge nu har godkendt
  const bygherreGodkendt = forfatter === "bygherre" || !!kontrakt.bygherre_godkendt_at;
  const haandvaerkerGodkendt = forfatter === "haandvaerker" || !!kontrakt.haandvaerker_godkendt_at;

  if (bygherreGodkendt && haandvaerkerGodkendt) {
    opdatering.status = "begge_godkendt";
  } else if (forfatter === "bygherre") {
    opdatering.status = "bygherre_godkendt";
  } else {
    opdatering.status = "haandvaerker_godkendt";
  }

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .eq("haandvaerker_token", token)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
