import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation } from "@/lib/notifikationer";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://nembyggestyring.dk";

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
    .select("id, bygherre_id, adresse, projekttype")
    .eq("id", id)
    .eq("bygherre_id", user.id)
    .single();

  if (!projekt) return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });

  // Find alle tilknyttede kontrakter med entreprenør-emails inden vi sletter
  const { data: kontrakter } = await db
    .from("kontrakter")
    .select("haandvaerker_email, titel, status")
    .eq("projekt_id", id)
    .not("haandvaerker_email", "is", null)
    .neq("status", "annulleret");

  // Slet alt data
  await db.from("ekstraarbejde").delete().eq("projekt_id", id);
  await db.from("mangler").delete().eq("projekt_id", id);
  await db.from("chat_beskeder").delete().eq("projekt_id", id);
  await db.from("kontrakter").delete().eq("projekt_id", id);
  await db.from("projekter").delete().eq("id", id);

  // Notificer alle tilknyttede entreprenører
  for (const k of kontrakter ?? []) {
    if (k.haandvaerker_email) {
      await sendNotifikation(
        "bygherre_slettet_projekt",
        k.haandvaerker_email,
        {
          projekttitel: k.titel ?? projekt.adresse ?? "et projekt",
          link: `${BASE_URL}/haandvaerker/sager`,
          ekstraInfo: "Bygherren har slettet projektet. Sagen er ikke længere tilgængelig.",
        },
        true,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
