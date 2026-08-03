import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/bruger/besigtigelser — hent nyeste besigtigelse pr. kontrakt for den autentificerede bygherre
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const accessToken = authHeader.replace("Bearer ", "");

  const db = createServiceClient();
  const { data: { user }, error: authError } = await db.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });
  }

  const { data: kontrakter, error: kontrakterFejl } = await db
    .from("kontrakter")
    .select("id")
    .eq("bygherre_id", user.id);

  if (kontrakterFejl) {
    return NextResponse.json({ error: "Intern fejl" }, { status: 500 });
  }
  if (!kontrakter || kontrakter.length === 0) {
    return NextResponse.json([]);
  }

  const kontraktIds = kontrakter.map((k) => k.id);

  const { data: besigtigelser, error: besigtigelserFejl } = await db
    .from("besigtigelse")
    .select("id, kontrakt_id, projekt_id, dato, tidspunkt, status, foreslaaet_af, kommentar_haandvaerker, kommentar_bygherre")
    .in("kontrakt_id", kontraktIds)
    .order("oprettet_at", { ascending: false });

  if (besigtigelserFejl) {
    return NextResponse.json({ error: "Intern fejl" }, { status: 500 });
  }
  if (!besigtigelser || besigtigelser.length === 0) return NextResponse.json([]);

  // Returnér kun den nyeste pr. kontrakt
  const set = new Set<string>();
  const unikke = besigtigelser.filter((b) => {
    if (set.has(b.kontrakt_id)) return false;
    set.add(b.kontrakt_id);
    return true;
  });

  return NextResponse.json(unikke);
}
