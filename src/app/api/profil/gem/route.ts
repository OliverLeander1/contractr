import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const db = createServiceClient();
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });
  }

  const body = await req.json();
  const tilladte = ["navn", "virksomhed", "cvr", "telefon", "fag", "postnummer", "by", "tilgaengelig", "standby"];
  const opdatering: Record<string, unknown> = { id: user.id };
  for (const felt of tilladte) {
    if (felt in body) opdatering[felt] = body[felt];
  }

  const { data, error } = await db
    .from("profiler")
    .upsert(opdatering, { onConflict: "id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
