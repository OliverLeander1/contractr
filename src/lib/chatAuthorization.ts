import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export type ChatRole = "bygherre" | "haandvaerker";

export interface AccessContext {
  userId: string;
  kontraktId: string;
  rolle: ChatRole;
  bygherreId: string;
  haandvaerkerEmail: string;
  haandvaerkerNavn: string;
  projektId: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(s: unknown): s is string {
  return typeof s === "string" && UUID_RE.test(s);
}

export async function resolveAccess(
  req: NextRequest,
  kontraktId: string
): Promise<{ ctx: AccessContext } | { error: NextResponse }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ fejl: "Ikke godkendt" }, { status: 401 }) };
  }

  if (!isUUID(kontraktId)) {
    return { error: NextResponse.json({ fejl: "Ugyldig kontrakt_id" }, { status: 422 }) };
  }

  const supabase = createServiceClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { error: NextResponse.json({ fejl: "Ikke godkendt" }, { status: 401 }) };
  }

  const { data: kontrakt } = await supabase
    .from("kontrakter")
    .select("id, projekt_id, haandvaerker_email, haandvaerker_navn, haandvaerker_firma")
    .eq("id", kontraktId)
    .maybeSingle();

  if (!kontrakt) {
    return { error: NextResponse.json({ fejl: "Kontrakt ikke fundet" }, { status: 404 }) };
  }

  if (!kontrakt.haandvaerker_email) {
    return { error: NextResponse.json({ fejl: "Kontrakt mangler håndværker-email" }, { status: 422 }) };
  }

  // kontrakter.projekt_id is TEXT; projekter.id is UUID — filter by text cast
  const { data: projekt } = await supabase
    .from("projekter")
    .select("id, bygherre_id")
    .filter("id::text", "eq", kontrakt.projekt_id)
    .maybeSingle();

  if (!projekt?.bygherre_id) {
    return { error: NextResponse.json({ fejl: "Projekt ikke fundet eller mangler ejer" }, { status: 422 }) };
  }

  const canonicalBygherreId = projekt.bygherre_id;

  const erBygherre = user.id === canonicalBygherreId;
  const erHaandvaerker =
    !!user.email &&
    kontrakt.haandvaerker_email.toLowerCase() === user.email.toLowerCase();

  if (erBygherre === erHaandvaerker) {
    // Both true (same person) or both false (no access)
    return { error: NextResponse.json({ fejl: "Adgang afvist" }, { status: 403 }) };
  }

  return {
    ctx: {
      userId: user.id,
      kontraktId,
      rolle: erBygherre ? "bygherre" : "haandvaerker",
      bygherreId: canonicalBygherreId,
      haandvaerkerEmail: kontrakt.haandvaerker_email,
      haandvaerkerNavn: kontrakt.haandvaerker_firma || kontrakt.haandvaerker_navn || kontrakt.haandvaerker_email,
      projektId: projekt.id,
    },
  };
}

export async function ensureConversation(
  ctx: AccessContext
): Promise<{ samtaleId: string } | { error: NextResponse }> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("chat_samtaler")
    .select("id")
    .eq("kontrakt_id", ctx.kontraktId)
    .maybeSingle();

  if (existing) {
    return { samtaleId: existing.id };
  }

  const { data: ny, error: insertError } = await supabase
    .from("chat_samtaler")
    .insert({
      projekt_id: ctx.projektId,
      bygherre_id: ctx.bygherreId,
      modpart_navn: ctx.haandvaerkerNavn,
      modpart_email: ctx.haandvaerkerEmail,
      modpart_rolle: "Entreprenør",
      kontrakt_id: ctx.kontraktId,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raceRow } = await supabase
        .from("chat_samtaler")
        .select("id")
        .eq("kontrakt_id", ctx.kontraktId)
        .maybeSingle();

      if (raceRow) return { samtaleId: raceRow.id };
    }
    console.error("[chat] Kunne ikke oprette samtale", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    return { error: NextResponse.json({ fejl: "Kunne ikke oprette samtale" }, { status: 500 }) };
  }

  return { samtaleId: ny.id };
}
