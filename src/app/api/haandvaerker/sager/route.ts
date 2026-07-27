import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/haandvaerker/sager?email=... — hent alle kontrakter for en håndværker
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email mangler" }, { status: 400 });

  const db = createServiceClient();

  const { data, error } = await db
    .from("kontrakter")
    .select("id, projekt_id, titel, haandvaerker_navn, total_pris, status, oprettet_at, haandvaerker_godkendt_at")
    .ilike("haandvaerker_email", email)
    .order("oprettet_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
