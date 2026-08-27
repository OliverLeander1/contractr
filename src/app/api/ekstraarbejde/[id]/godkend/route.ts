import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";
import { sendNotifikation } from "@/lib/notifikationer";
import { erForslagKomplet } from "@/lib/ekstraarbejdeCompleteness";
import { opretEkstraarbejdeNotifikation } from "@/lib/ekstraarbejdeNotifikation";

export const runtime = "nodejs";

// POST /api/ekstraarbejde/[id]/godkend — bygherre godkender aftalesedlen.
// Eneste lovlige overgang: afventer_bygherre -> godkendt.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: sedel } = await db
    .from("ekstraarbejde")
    .select("id, status, kontrakt_id, projekt_id, beskrivelse, haandvaerker_pris_type, haandvaerker_pris, haandvaerker_timepris, haandvaerker_tidsdage, materiale_afregning, materiale_tillaeg_procent")
    .eq("id", id)
    .maybeSingle();

  if (!sedel) {
    return NextResponse.json({ error: "Aftaleseddel ikke fundet" }, { status: 404 });
  }

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, titel, bygherre_id, haandvaerker_email, haandvaerker_token")
    .eq("id", sedel.kontrakt_id)
    .maybeSingle();

  if (!kontrakt) {
    return NextResponse.json({ error: "Aftalesedlens kontrakt findes ikke" }, { status: 404 });
  }

  const partResultat = await verificerKontraktRolle(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;
  if (partResultat.rolle !== "bygherre") {
    return NextResponse.json({ error: "Kun bygherre kan godkende aftalesedlen" }, { status: 403 });
  }

  if (sedel.status !== "afventer_bygherre") {
    return NextResponse.json({ error: "Aftalesedlen kan ikke godkendes i dens nuværende tilstand." }, { status: 409 });
  }

  // Server-side genvalidering — status alene er ikke autoritativ. Et
  // manipuleret request må ikke kunne godkende et økonomisk eller
  // tidsmæssigt uafklaret forslag.
  if (!erForslagKomplet(sedel)) {
    return NextResponse.json(
      { error: "Aftalesedlen kan først godkendes, når pris og tidskonsekvens er tilstrækkeligt afklaret." },
      { status: 409 }
    );
  }

  const { data: profil } = await db.from("profiler").select("navn").eq("id", partResultat.userId).maybeSingle();
  const nu = new Date().toISOString();

  const { data, error } = await db
    .from("ekstraarbejde")
    .update({
      status: "godkendt",
      godkendt_af: partResultat.userId,
      godkendt_at: nu,
      bygherre_godkendt_navn: profil?.navn || null,
      bygherre_godkendt_at: nu,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notifikation til entreprenøren er en secondary side-effect. Den primære
  // handling (statusovergang + digitale underskriftsfelter) er allerede
  // gemt ovenfor og må ikke rulles tilbage, hvis email eller in-app
  // notifikation fejler — samme etablerede princip som i
  // PATCH /api/ekstraarbejde/[id]/svar.
  if (kontrakt.haandvaerker_email) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    sendNotifikation("bygherre_godkendt_ekstraarbejde", kontrakt.haandvaerker_email, {
      projekttitel: kontrakt.titel || "projektet",
      link: `${baseUrl}/haandvaerker/projekt/${sedel.projekt_id}/ekstraarbejde`,
    });
  }

  try {
    await opretEkstraarbejdeNotifikation(db, {
      modtagerRolle: "haandvaerker",
      kontrakt,
      projektId: sedel.projekt_id,
      type: "ekstraarbejde_godkendt",
      titel: "Aftaleseddel godkendt",
      besked: `Bygherren har godkendt aftalesedlen om ${sedel.beskrivelse}. Arbejdet kan udføres som aftalt.`,
    });
  } catch (notifikationsFejl) {
    console.error("Notifikation ved godkendelse af aftaleseddel fejlede:", notifikationsFejl);
  }

  return NextResponse.json(data);
}
