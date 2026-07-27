import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const GODKENDTE_STATUSSER = [
  "godkendt", "accepteret", "aktiv",
  "begge_godkendt", "haandvaerker_godkendt", "bygherre_godkendt",
];

// GET /api/projekter/[id]/kontrakter — hent alle godkendte kontrakter for et projekt
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("kontrakter")
    .select("id, haandvaerker_email, haandvaerker_navn, status")
    .eq("projekt_id", id)
    .in("status", GODKENDTE_STATUSSER);

  if (error) return NextResponse.json({ debug_error: error.message, debug_code: error.code }, { status: 500 });
  return NextResponse.json(data ?? []);
}
