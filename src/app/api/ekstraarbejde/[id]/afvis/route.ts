import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";

export const runtime = "nodejs";

// POST /api/ekstraarbejde/[id]/afvis — bygherre afviser aftalesedlen.
// Eneste lovlige overgang: afventer_bygherre -> afvist.
// En sag, der stadig står afventer_entreprenoer (dvs. bygherrens egen
// anmodning, som entreprenøren endnu ikke har svaret på), kan bevidst
// IKKE afvises her — det er semantisk en "annullering" af egen anmodning,
// ikke en afvisning, og det flow er ikke bygget endnu (se produktrevision).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: sedel } = await db
    .from("ekstraarbejde")
    .select("id, status, kontrakt_id")
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
  if (partResultat.rolle !== "bygherre") {
    return NextResponse.json({ error: "Kun bygherre kan afvise aftalesedlen" }, { status: 403 });
  }

  if (sedel.status !== "afventer_bygherre") {
    return NextResponse.json({ error: "Aftalesedlen kan ikke afvises i dens nuværende tilstand." }, { status: 409 });
  }

  const { data, error } = await db
    .from("ekstraarbejde")
    .update({ status: "afvist" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
