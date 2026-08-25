import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";
import { AFTALESEDLER_BUCKET } from "@/lib/ekstraarbejdeStorage";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SEKUNDER = 300;

// GET /api/ekstraarbejde/[id]/billeder — udsteder kortlivede signed read-URLs
// for en aftaleseddels billeder, kun til legitime parter på kontrakten.
// Signed URLs gemmes aldrig — de genereres on-demand ved hvert kald.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: sedel } = await db
    .from("ekstraarbejde")
    .select("id, kontrakt_id")
    .eq("id", id)
    .maybeSingle();

  if (!sedel) {
    return NextResponse.json({ error: "Aftaleseddel ikke fundet" }, { status: 404 });
  }

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, bygherre_id, haandvaerker_email")
    .eq("id", sedel.kontrakt_id)
    .maybeSingle();

  if (!kontrakt) {
    return NextResponse.json({ error: "Aftalesedlens kontrakt findes ikke" }, { status: 404 });
  }

  const partResultat = await verificerKontraktRolle(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;

  const { data: billeder, error } = await db
    .from("ekstraarbejde_billeder")
    .select("id, storage_path, billedtekst, oprettet_at")
    .eq("ekstraarbejde_id", id)
    .order("oprettet_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!billeder || billeder.length === 0) {
    return NextResponse.json({ billeder: [] });
  }

  const { data: signerede, error: signFejl } = await db.storage
    .from(AFTALESEDLER_BUCKET)
    .createSignedUrls(billeder.map((b) => b.storage_path), SIGNED_URL_TTL_SEKUNDER);

  if (signFejl || !signerede) {
    return NextResponse.json({ error: "Kunne ikke hente billeder." }, { status: 500 });
  }

  const resultat = billeder.map((b, i) => ({
    id: b.id,
    billedtekst: b.billedtekst,
    oprettet_at: b.oprettet_at,
    url: signerede[i]?.signedUrl ?? null,
  }));

  return NextResponse.json({ billeder: resultat });
}
