import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/haandvaerker/projekt/[id] — hent projekt-data for håndværker.
// Emailen udledes udelukkende af den verificerede JWT — et evt. klientsendt
// ?email=-parameter læses ikke længere og påvirker aldrig hvis data der
// returneres (samme mønster som /api/haandvaerker/sager).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Ikke godkendt" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: "Ikke godkendt" }, { status: 401 });
  }

  const { data: profil } = await db
    .from("profiler")
    .select("rolle")
    .eq("id", user.id)
    .maybeSingle();

  if (profil?.rolle !== "haandvaerker") {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  // Normaliser (trim + lowercase) og escap ILIKE-metategn, samme mønster
  // som /api/haandvaerker/sager.
  const escapedEmail = user.email.trim().toLowerCase().replace(/[%_\\]/g, (m) => `\\${m}`);

  const [{ data: kontrakt, error: kErr }, { data: sedler }, { data: mangler }] = await Promise.all([
    db.from("kontrakter")
      .select("id, projekt_id, titel, beskrivelse, total_pris, status, haandvaerker_navn, haandvaerker_email, haandvaerker_token, startdato, slutdato, betalingsplan, tidsplan, oprettet_at, haandvaerker_godkendt_at, bygherre_godkendt_at, besigtigelse_dato, besigtigelse_tid, besigtigelse_bekraeftet")
      .eq("projekt_id", id)
      .ilike("haandvaerker_email", escapedEmail)
      .single(),
    db.from("ekstraarbejde")
      .select("*")
      .eq("projekt_id", id)
      .ilike("haandvaerker_email", escapedEmail)
      .order("oprettet_at", { ascending: false }),
    db.from("mangler")
      .select("id, beskrivelse, alvorlighed, status, oprettet_at, billeder")
      .eq("projekt_id", id)
      .order("oprettet_at", { ascending: false }),
  ]);

  if (kErr) return NextResponse.json({ error: kErr.message }, { status: 500 });
  return NextResponse.json({ kontrakt, sedler: sedler ?? [], mangler: mangler ?? [] });
}
