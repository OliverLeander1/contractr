import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  // Verificer bruger via Authorization header (Supabase JWT)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const db = createServiceClient();

  // Valider token og hent bruger
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });
  }

  // Hent brugerens projekter
  const { data: projekter } = await db
    .from("projekter")
    .select("id")
    .eq("bygherre_id", user.id);

  if (projekter && projekter.length > 0) {
    const ids = projekter.map(p => p.id);
    await db.from("ekstraarbejde").delete().in("projekt_id", ids);
    await db.from("mangler").delete().in("projekt_id", ids);
    await db.from("kontrakter").delete().in("projekt_id", ids);
    await db.from("chat_beskeder").delete().in("projekt_id", ids);
  }

  await db.from("projekter").delete().eq("bygherre_id", user.id);
  await db.from("profiler").delete().eq("id", user.id);

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Kunne ikke slette konto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
