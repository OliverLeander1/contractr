import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";

// GET — hent beskeder for et projekt
export async function GET(req: NextRequest) {
  const projektId = req.nextUrl.searchParams.get("projekt_id");
  if (!projektId) return NextResponse.json({ error: "Mangler projekt_id" }, { status: 400 });

  const db = createServiceClient();

  // Find samtale for projektet
  const { data: samtale } = await db
    .from("chat_samtaler")
    .select("id")
    .eq("projekt_id", projektId)
    .order("oprettet_at", { ascending: true })
    .limit(1)
    .single();

  if (!samtale) return NextResponse.json({ samtaleId: null, beskeder: [] });

  const { data: beskeder } = await db
    .from("chat_beskeder")
    .select("id, afsender_id, afsender_navn, indhold, sendt_at")
    .eq("samtale_id", samtale.id)
    .order("sendt_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ samtaleId: samtale.id, beskeder: beskeder ?? [] });
}

// POST — send besked
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projekt_id, afsender_id, afsender_navn, afsender_rolle, indhold } = body;
  if (!projekt_id || !indhold?.trim()) {
    return NextResponse.json({ error: "Mangler påkrævede felter" }, { status: 400 });
  }

  const db = createServiceClient();

  // Find eller opret samtale
  let { data: samtale } = await db
    .from("chat_samtaler")
    .select("id")
    .eq("projekt_id", projekt_id)
    .order("oprettet_at", { ascending: true })
    .limit(1)
    .single();

  if (!samtale) {
    const modpartRolle = afsender_rolle === "bygherre" ? "haandvaerker" : "bygherre";
    const { data: nySamtale } = await db
      .from("chat_samtaler")
      .insert({
        projekt_id,
        bygherre_id: afsender_id || null,
        modpart_navn: modpartRolle === "haandvaerker" ? "Håndværker" : "Bygherre",
        modpart_rolle: modpartRolle,
      })
      .select()
      .single();
    samtale = nySamtale;
  }

  if (!samtale) return NextResponse.json({ error: "Kunne ikke oprette samtale" }, { status: 500 });

  const { data, error } = await db
    .from("chat_beskeder")
    .insert({
      samtale_id: samtale.id,
      afsender_id: afsender_id || null,
      afsender_navn: afsender_navn || afsender_rolle || "Ukendt",
      indhold: indhold.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificer modparten asynkront
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
  if (afsender_rolle === "haandvaerker") {
    // Hent bygherre_id fra samtale
    const { data: samtaleData } = await db
      .from("chat_samtaler")
      .select("bygherre_id, projekt_id")
      .eq("id", samtale.id)
      .single();
    if (samtaleData?.bygherre_id) {
      const { email, notifikationer } = await hentBygherreEmail(samtaleData.bygherre_id, db);
      if (email) {
        sendNotifikation("ny_chatbesked", email, {
          projekttitel: "dit projekt",
          afsenderNavn: afsender_navn || "Entreprenøren",
          link: `${baseUrl}/projekt/${samtaleData.projekt_id}/chat`,
        }, notifikationer);
      }
    }
  } else if (afsender_rolle === "bygherre") {
    // Hent håndværker email fra kontrakter for projektet
    const { data: samtaleData } = await db
      .from("chat_samtaler")
      .select("projekt_id")
      .eq("id", samtale.id)
      .single();
    if (samtaleData?.projekt_id) {
      const { data: kontrakt } = await db
        .from("kontrakter")
        .select("haandvaerker_email, haandvaerker_token, titel")
        .eq("projekt_id", samtaleData.projekt_id)
        .order("oprettet_at", { ascending: false })
        .limit(1)
        .single();
      if (kontrakt?.haandvaerker_email) {
        sendNotifikation("ny_chatbesked", kontrakt.haandvaerker_email, {
          projekttitel: kontrakt.titel || "projektet",
          afsenderNavn: afsender_navn || "Bygherren",
          link: `${baseUrl}/kontrakt/${kontrakt.haandvaerker_token}`,
        });
      }
    }
  }

  return NextResponse.json(data);
}
