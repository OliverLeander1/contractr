import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// POST /api/kontrakt/[token]/forslag — foreslå ændring til et felt
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { felt, ny_vaerdi, forfatter, forfatter_navn, kommentar } = body;

  if (!felt || !ny_vaerdi || !forfatter) {
    return NextResponse.json({ error: "felt, ny_vaerdi og forfatter er påkrævet" }, { status: 400 });
  }

  const db = createServiceClient();

  // Find kontrakt via token
  const { data: kontrakt, error: hentFejl } = await db
    .from("kontrakter")
    .select("id, titel, beskrivelse, total_pris, betalingsplan, vilkaar, status")
    .eq("haandvaerker_token", token)
    .single();

  if (hentFejl || !kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  // Hent gammel værdi
  const gammelVaerdi = String(kontrakt[felt as keyof typeof kontrakt] ?? "");

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
    .select("id, titel, beskrivelse, total_pris, betalingsplan, vilkaar")
    .eq("haandvaerker_token", token)
    .single();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
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

  // Accepteret: anvend ændringen på kontrakten
  if (status === "accepteret") {
    await db
      .from("kontrakter")
      .update({
        [aendring.felt]: aendring.ny_vaerdi,
        opdateret_at: new Date().toISOString(),
        bygherre_godkendt_at: null,
        haandvaerker_godkendt_at: null,
      })
      .eq("id", kontrakt.id);
  }

  return NextResponse.json(aendring);
}
