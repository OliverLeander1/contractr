import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/bruger/projekter?ids=id1,id2,... — batched opslag af adresse og
// projekttype for et lille sæt projekter (bruges til at vise sagsnavn på
// /notifikationer uden en query pr. kort). ids i forespørgslen kan aldrig
// udvide adgangen: bygherre-grenen er filtreret på projekter.bygherre_id,
// entreprenør-grenen på kontrakter.haandvaerker_email — begge udledt
// udelukkende af den verificerede JWT, aldrig af klientdata. Et projekt-id,
// brugeren ikke selv har adgang til, udelades blot fra svaret.
const MAX_IDS = 50;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Ikke godkendt" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Ikke godkendt" }, { status: 401 });
  }

  const raaIds = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = Array.from(new Set(raaIds.split(",").map((s) => s.trim()).filter(Boolean))).slice(0, MAX_IDS);
  if (ids.length === 0) {
    return NextResponse.json({});
  }

  const { data: profil } = await db
    .from("profiler")
    .select("rolle")
    .eq("id", user.id)
    .maybeSingle();

  const projektMap: Record<string, { adresse: string | null; projekttype: string | null }> = {};

  if (profil?.rolle === "haandvaerker") {
    if (!user.email) return NextResponse.json({});
    // Normaliser (trim + lowercase) og escap ILIKE-metategn, samme mønster
    // som /api/haandvaerker/sager.
    const escapedEmail = user.email.trim().toLowerCase().replace(/[%_\\]/g, (m) => `\\${m}`);

    const { data: kontrakter } = await db
      .from("kontrakter")
      .select("projekt_id")
      .ilike("haandvaerker_email", escapedEmail)
      .in("projekt_id", ids);

    const autoriserede = Array.from(
      new Set((kontrakter ?? []).map((k) => k.projekt_id).filter((v): v is string => !!v))
    );

    if (autoriserede.length > 0) {
      const { data: projekter } = await db
        .from("projekter")
        .select("id, adresse, projekttype")
        .in("id", autoriserede);
      for (const p of projekter ?? []) projektMap[p.id] = { adresse: p.adresse, projekttype: p.projekttype };
    }
  } else {
    const { data: projekter } = await db
      .from("projekter")
      .select("id, adresse, projekttype")
      .eq("bygherre_id", user.id)
      .in("id", ids);
    for (const p of projekter ?? []) projektMap[p.id] = { adresse: p.adresse, projekttype: p.projekttype };
  }

  return NextResponse.json(projektMap);
}
