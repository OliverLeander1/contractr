import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

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
  return NextResponse.json(data);
}
