import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/haandvaerker/sager — hent alle kontrakter for den verificerede
// entreprenør. Emailen udledes udelukkende af den verificerede JWT — et
// evt. klientsendt ?email=-parameter ignoreres fuldstændigt og påvirker
// aldrig hvilke sager der returneres.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Ikke godkendt" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: "Ikke godkendt" }, { status: 401 });
  }

  const { data: profil } = await db
    .from("profiler")
    .select("rolle")
    .eq("id", user.id)
    .maybeSingle();

  if (profil?.rolle !== "haandvaerker") {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  // Normaliser (trim + lowercase), og escap ILIKE-metategn så et "_" eller
  // "%" i emailadressen ikke opfører sig som wildcard i sammenligningen.
  const normaliseretEmail = user.email.trim().toLowerCase();
  const escapedEmail = normaliseretEmail.replace(/[%_\\]/g, (m) => `\\${m}`);

  const { data, error } = await db
    .from("kontrakter")
    .select("id, projekt_id, titel, haandvaerker_navn, total_pris, status, oprettet_at, haandvaerker_godkendt_at")
    .ilike("haandvaerker_email", escapedEmail)
    .order("oprettet_at", { ascending: false });

  if (error) {
    console.error("[haandvaerker/sager] Kunne ikke hente sager", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json({ error: "Kunne ikke hente sager" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
