import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// POST /api/projekter — opret nyt projekt
export async function POST(req: NextRequest) {
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

  const { data: profil } = await db
    .from("profiler")
    .select("rolle")
    .eq("id", user.id)
    .maybeSingle();

  if (profil?.rolle !== "bygherre") {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { projekttype, adresse, navn, kontakt, startdato, slutdato, budget } = body;

  const { data, error } = await db
    .from("projekter")
    .insert({
      bygherre_id: user.id,
      projekttype: projekttype || "andet",
      adresse: adresse || null,
      navn: navn || null,
      kontakt: kontakt || null,
      startdato: startdato || null,
      slutdato: slutdato || null,
      budget: budget || null,
      status: "tilbud",
      ab_forbruger: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
