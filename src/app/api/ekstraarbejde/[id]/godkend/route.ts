import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation } from "@/lib/notifikationer";

export const runtime = "nodejs";

// POST /api/ekstraarbejde/[id]/godkend — bygherre godkender aftaleseddel og notificerer håndværker
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { haandvaerker_token } = body;

  if (!haandvaerker_token) {
    return NextResponse.json({ ok: true }); // Silent — notifikation er optional
  }

  const db = createServiceClient();

  const { data: sedel } = await db
    .from("ekstraarbejde")
    .select("titel, projekt_id")
    .eq("id", id)
    .single();

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("haandvaerker_email, titel")
    .eq("haandvaerker_token", haandvaerker_token)
    .single();

  if (kontrakt?.haandvaerker_email) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    sendNotifikation("bygherre_godkendt_ekstraarbejde", kontrakt.haandvaerker_email, {
      projekttitel: kontrakt.titel || sedel?.titel || "projektet",
      link: `${baseUrl}/kontrakt/${haandvaerker_token}`,
    });
  }

  return NextResponse.json({ ok: true });
}
