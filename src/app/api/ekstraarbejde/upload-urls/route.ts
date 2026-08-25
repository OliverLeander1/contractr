import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";
import { AFTALESEDLER_BUCKET, AFTALESEDLER_MAX_PR_KALD, genererBilledSti } from "@/lib/ekstraarbejdeStorage";

export const runtime = "nodejs";

// POST /api/ekstraarbejde/upload-urls — udsteder kortlivede, serverautoriserede
// signed upload-URLs til den private "aftalesedler"-bucket. Browseren uploader
// derefter filbytes direkte til Storage — billed-bytes/base64 sendes aldrig
// gennem denne eller nogen anden Next.js-route.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { kontrakt_id, antal } = body;

  if (!kontrakt_id || !Number.isInteger(antal) || antal < 1 || antal > AFTALESEDLER_MAX_PR_KALD) {
    return NextResponse.json(
      { error: `antal skal være et heltal mellem 1 og ${AFTALESEDLER_MAX_PR_KALD}` },
      { status: 400 }
    );
  }

  const db = createServiceClient();

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, bygherre_id, haandvaerker_email")
    .eq("id", kontrakt_id)
    .maybeSingle();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const partResultat = await verificerKontraktRolle(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;
  const { userId } = partResultat;

  const uploadSessionId = randomUUID();
  const uploads: { path: string; token: string; signedUrl: string }[] = [];

  for (let i = 0; i < antal; i++) {
    const fileId = randomUUID();
    const path = genererBilledSti(kontrakt.id, userId, uploadSessionId, fileId);
    const { data, error } = await db.storage.from(AFTALESEDLER_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json({ error: "Kunne ikke oprette upload-adgang. Prøv igen." }, { status: 500 });
    }
    uploads.push({ path: data.path, token: data.token, signedUrl: data.signedUrl });
  }

  return NextResponse.json({ upload_session_id: uploadSessionId, uploads });
}
