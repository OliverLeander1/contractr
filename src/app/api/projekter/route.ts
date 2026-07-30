import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// POST /api/projekter — opret nyt projekt
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { bygherre_id, projekttype, adresse, navn, kontakt, startdato, slutdato } = body;

  if (!bygherre_id) return NextResponse.json({ error: "bygherre_id mangler" }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("projekter")
    .insert({
      bygherre_id,
      projekttype: projekttype || "andet",
      adresse: adresse || null,
      navn: navn || null,
      kontakt: kontakt || null,
      startdato: startdato || null,
      slutdato: slutdato || null,
      status: "tilbud",
      ab_forbruger: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
