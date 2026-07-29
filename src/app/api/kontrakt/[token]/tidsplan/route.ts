import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";

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
    .select("id, status, titel, bygherre_id, haandvaerker_navn, projekt_id")
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

  // Notificer bygherre om indsendt tidsplan
  if (kontrakt.bygherre_id) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    const { email, notifikationer } = await hentBygherreEmail(kontrakt.bygherre_id, db);
    if (email) {
      sendNotifikation("haandvaerker_indsendt_tidsplan", email, {
        projekttitel: kontrakt.titel || "dit projekt",
        afsenderNavn: kontrakt.haandvaerker_navn || "Entreprenøren",
        link: `${baseUrl}/projekt/${kontrakt.projekt_id}/aftale`,
      }, notifikationer);
    }
  }

  return NextResponse.json(data);
}
