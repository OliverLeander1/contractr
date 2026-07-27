import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// PATCH /api/kontrakt/[token]/tidsplan — håndværker indsender tidsplan
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const { tidsplan } = body;

  if (!tidsplan) {
    return NextResponse.json({ error: "tidsplan mangler" }, { status: 400 });
  }

  const db = createServiceClient();

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, status")
    .eq("haandvaerker_token", token)
    .single();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const payload = {
    ...tidsplan,
    indsendt_at: new Date().toISOString(),
    godkendt_af_bygherre: false,
    godkendt_at: null,
  };

  const { data, error } = await db
    .from("kontrakter")
    .update({ tidsplan: payload, opdateret_at: new Date().toISOString() })
    .eq("id", kontrakt.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
