import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// DELETE /api/kontrakt/[token]/tilbud-slet — slet tilbudsdokument (GDPR)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceClient();

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, tilbud_dokument_sti")
    .eq("haandvaerker_token", token)
    .single();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  // Slet fra Storage hvis sti er gemt
  if (kontrakt.tilbud_dokument_sti) {
    await db.storage.from("tilbudsdokumenter").remove([kontrakt.tilbud_dokument_sti]);
  }

  // Nulstil felter på kontrakten
  const { data, error } = await db
    .from("kontrakter")
    .update({
      tilbud_dokument_url: null,
      tilbud_dokument_sti: null,
      tilbud_dokument_navn: null,
      opdateret_at: new Date().toISOString(),
    })
    .eq("id", kontrakt.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, kontrakt: data });
}
