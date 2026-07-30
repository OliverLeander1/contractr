import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: { user } } = await db.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });

  // Verificer at projektet tilhører denne bygherre
  const { data: projekt } = await db
    .from("projekter")
    .select("id, bygherre_id")
    .eq("id", id)
    .eq("bygherre_id", user.id)
    .single();

  if (!projekt) return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });

  await db.from("ekstraarbejde").delete().eq("projekt_id", id);
  await db.from("mangler").delete().eq("projekt_id", id);
  await db.from("chat_beskeder").delete().eq("projekt_id", id);
  await db.from("kontrakter").delete().eq("projekt_id", id);
  await db.from("projekter").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
