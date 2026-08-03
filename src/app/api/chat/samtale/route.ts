import { NextRequest, NextResponse } from "next/server";
import { resolveAccess, ensureConversation } from "@/lib/chatAuthorization";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fejl: "Ugyldig JSON" }, { status: 400 });
  }

  const kontraktId =
    body !== null && typeof body === "object" && "kontrakt_id" in body
      ? String((body as Record<string, unknown>).kontrakt_id)
      : "";

  if (!kontraktId) {
    return NextResponse.json({ fejl: "kontrakt_id mangler" }, { status: 400 });
  }

  const result = await resolveAccess(req, kontraktId);
  if ("error" in result) return result.error;

  const samtaleResult = await ensureConversation(result.ctx);
  if ("error" in samtaleResult) return samtaleResult.error;

  return NextResponse.json({ samtale_id: samtaleResult.samtaleId, rolle: result.ctx.rolle });
}
