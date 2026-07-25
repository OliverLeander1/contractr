import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/kontrakt/[token] — hent kontrakt via håndværker-token (ingen auth)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("kontrakter")
    .select("*, kontraktaendringer(*)")
    .eq("haandvaerker_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  return NextResponse.json(data);
}
