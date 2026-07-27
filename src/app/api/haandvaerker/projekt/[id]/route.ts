import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/haandvaerker/projekt/[id]?email=... — hent projekt-data for håndværker
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email mangler" }, { status: 400 });

  const db = createServiceClient();

  const [{ data: kontrakt, error: kErr }, { data: sedler }, { data: mangler }] = await Promise.all([
    db.from("kontrakter")
      .select("id, projekt_id, titel, beskrivelse, total_pris, status, haandvaerker_navn, haandvaerker_email, haandvaerker_token, startdato, slutdato, betalingsplan, tidsplan, oprettet_at, haandvaerker_godkendt_at, bygherre_godkendt_at")
      .eq("projekt_id", id)
      .ilike("haandvaerker_email", email)
      .single(),
    db.from("ekstraarbejde")
      .select("*")
      .eq("projekt_id", id)
      .ilike("haandvaerker_email", email)
      .order("oprettet_at", { ascending: false }),
    db.from("mangler")
      .select("id, beskrivelse, alvorlighed, status, oprettet_at, billeder")
      .eq("projekt_id", id)
      .order("oprettet_at", { ascending: false }),
  ]);

  if (kErr) return NextResponse.json({ error: kErr.message }, { status: 500 });
  return NextResponse.json({ kontrakt, sedler: sedler ?? [], mangler: mangler ?? [] });
}
