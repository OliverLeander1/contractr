import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";
import { sendNotifikation } from "@/lib/notifikationer";
import { opretEkstraarbejdeNotifikation } from "@/lib/ekstraarbejdeNotifikation";

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
    .select("id, status, kontrakt_id, projekt_id, beskrivelse")
    .eq("id", id)
    .maybeSingle();

  if (!sedel) {
    return NextResponse.json({ error: "Aftaleseddel ikke fundet" }, { status: 404 });
  }

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, titel, bygherre_id, haandvaerker_email")
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

  // Notifikation og email til entreprenøren er secondary side-effects af den
  // allerede gemte statusovergang ovenfor — samme etablerede princip som i
  // PATCH /api/ekstraarbejde/[id]/svar og POST .../godkend.
  if (kontrakt.haandvaerker_email) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    sendNotifikation("bygherre_afvist_ekstraarbejde", kontrakt.haandvaerker_email, {
      projekttitel: kontrakt.titel || "projektet",
      link: `${baseUrl}/haandvaerker/projekt/${sedel.projekt_id}/ekstraarbejde`,
    });
  }

  try {
    await opretEkstraarbejdeNotifikation(db, {
      modtagerRolle: "haandvaerker",
      kontrakt,
      projektId: sedel.projekt_id,
      type: "ekstraarbejde_afvist",
      titel: "Aftaleseddel afvist",
      besked: `Bygherren har afvist aftalesedlen om ${sedel.beskrivelse}.`,
    });
  } catch (notifikationsFejl) {
    console.error("Notifikation ved afvisning af aftaleseddel fejlede:", notifikationsFejl);
  }

  return NextResponse.json(data);
}
