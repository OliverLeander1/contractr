import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";

export const runtime = "nodejs";

// PATCH /api/ekstraarbejde/[id]/svar — håndværker svarer på aftaleseddel
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = createServiceClient();

  const { data, error } = await db
    .from("ekstraarbejde")
    .update({
      haandvaerker_pris: body.haandvaerker_pris ?? null,
      haandvaerker_pris_type: body.haandvaerker_pris_type ?? null,
      haandvaerker_tidsdage: body.haandvaerker_tidsdage ?? null,
      haandvaerker_besked: body.haandvaerker_besked ?? null,
      haandvaerker_navn: body.haandvaerker_navn ?? null,
      haandvaerker_email: body.haandvaerker_email ?? null,
      haandvaerker_udfyldt_at: new Date().toISOString(),
      status: "haandvaerker_udfyldt",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificer bygherre om svar fra håndværker
  if (data.projekt_id) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    const { data: projekt } = await db
      .from("projekter")
      .select("bruger_id, adresse")
      .eq("id", data.projekt_id)
      .single();
    if (projekt?.bruger_id) {
      const { email, notifikationer } = await hentBygherreEmail(projekt.bruger_id, db);
      if (email) {
        sendNotifikation("haandvaerker_ekstraarbejde_svar", email, {
          projekttitel: projekt.adresse || "dit projekt",
          afsenderNavn: body.haandvaerker_navn || "Entreprenøren",
          link: `${baseUrl}/projekt/${data.projekt_id}/ekstraarbejde`,
        }, notifikationer);
      }
    }
  }

  return NextResponse.json(data);
}
