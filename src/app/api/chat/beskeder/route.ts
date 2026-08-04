import { NextRequest, NextResponse } from "next/server";
import { resolveAccess } from "@/lib/chatAuthorization";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kontraktId = searchParams.get("kontrakt_id") ?? "";

  const result = await resolveAccess(req, kontraktId);
  if ("error" in result) return result.error;

  const supabase = createServiceClient();

  const { data: samtale } = await supabase
    .from("chat_samtaler")
    .select("id")
    .eq("kontrakt_id", kontraktId)
    .maybeSingle();

  if (!samtale) {
    return NextResponse.json({ beskeder: [] });
  }

  const { data: beskeder, error } = await supabase
    .from("chat_beskeder")
    .select("id, afsender_id, afsender_navn, indhold, sendt_at")
    .eq("samtale_id", samtale.id)
    .order("sendt_at", { ascending: true });

  if (error) {
    console.error("[chat] Kunne ikke hente beskeder", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({ fejl: "Kunne ikke hente beskeder" }, { status: 500 });
  }

  return NextResponse.json({ beskeder: beskeder ?? [] });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fejl: "Ugyldig JSON" }, { status: 400 });
  }

  const b = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const kontraktId = typeof b.kontrakt_id === "string" ? b.kontrakt_id : "";
  const indhold = typeof b.indhold === "string" ? b.indhold.trim() : "";

  if (!indhold) {
    return NextResponse.json({ fejl: "indhold må ikke være tomt" }, { status: 400 });
  }

  const result = await resolveAccess(req, kontraktId);
  if ("error" in result) return result.error;

  const supabase = createServiceClient();

  const { data: samtale } = await supabase
    .from("chat_samtaler")
    .select("id")
    .eq("kontrakt_id", kontraktId)
    .maybeSingle();

  if (!samtale) {
    return NextResponse.json({ fejl: "Samtale ikke oprettet endnu — åbn chatten først" }, { status: 404 });
  }

  const { data: profil } = await supabase
    .from("profiler")
    .select("navn")
    .eq("id", result.ctx.userId)
    .maybeSingle();

  const afsenderNavn =
    profil?.navn ||
    (result.ctx.rolle === "bygherre" ? "Bygherre" : "Håndværker");

  const { error: insertError } = await supabase
    .from("chat_beskeder")
    .insert({
      samtale_id: samtale.id,
      afsender_id: result.ctx.userId,
      afsender_navn: afsenderNavn,
      indhold,
    });

  if (insertError) {
    console.error("[chat] Kunne ikke sende besked", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    return NextResponse.json({ fejl: "Kunne ikke sende besked" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
