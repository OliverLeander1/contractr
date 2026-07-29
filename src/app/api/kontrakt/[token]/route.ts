import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/kontrakt/[token] — hent kontrakt via håndværker-token (ingen auth)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("kontrakter")
    .select("*, kontraktaendringer(*)")
    .eq("haandvaerker_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/kontrakt/[token] — opdater felter via token (ingen auth, bruges af haandvaerker)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const db = createServiceClient();

  const tilladte = ["total_pris", "startdato", "slutdato", "besigtigelse_dato", "besigtigelse_tid", "besigtigelse_bekraeftet", "forudsaetninger", "forudsaetninger_sendt_at", "forudsaetninger_godkendt"];
  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };

  for (const felt of tilladte) {
    if (felt in body) opdatering[felt] = body[felt];
  }

  if (Object.keys(opdatering).length <= 1) {
    return NextResponse.json({ error: "Ingen gyldige felter" }, { status: 400 });
  }

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .eq("haandvaerker_token", token)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
