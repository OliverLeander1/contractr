import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projekt_id = searchParams.get("projekt_id");
  if (!projekt_id) return NextResponse.json({ error: "projekt_id mangler" }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("logbog")
    .select("*")
    .eq("projekt_id", projekt_id)
    .order("oprettet_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const db = createServiceClient();
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });

  const { projekt_id, tekst, billede_url, forfatter_navn } = await req.json();
  if (!projekt_id || !tekst?.trim()) {
    return NextResponse.json({ error: "projekt_id og tekst er påkrævet" }, { status: 400 });
  }

  const { data, error } = await db
    .from("logbog")
    .insert({
      projekt_id,
      forfatter_id: user.id,
      forfatter_navn: forfatter_navn || user.email?.split("@")[0] || "Bygherre",
      tekst: tekst.trim(),
      billede_url: billede_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const db = createServiceClient();
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id mangler" }, { status: 400 });

  const { error } = await db
    .from("logbog")
    .delete()
    .eq("id", id)
    .eq("forfatter_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
