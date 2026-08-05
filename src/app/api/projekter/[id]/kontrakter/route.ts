import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Verificerer Bearer JWT og at brugeren har den autoritative rolle "bygherre".
// Ejerskab af det konkrete projekt kontrolleres separat i hver handler, da
// GET og POST har brug for forskellige projektfelter.
async function verificerBygherre(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ error: "Ikke godkendt" }, { status: 401 }) } as const;
  }

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return { error: NextResponse.json({ error: "Ikke godkendt" }, { status: 401 }) } as const;
  }

  const { data: profil } = await db
    .from("profiler")
    .select("rolle")
    .eq("id", user.id)
    .maybeSingle();

  if (profil?.rolle !== "bygherre") {
    return { error: NextResponse.json({ error: "Adgang afvist" }, { status: 403 }) } as const;
  }

  return { db, userId: user.id } as const;
}

// GET /api/projekter/[id]/kontrakter — hent alle kontrakter for et projekt
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await verificerBygherre(req);
  if ("error" in authResult) return authResult.error;
  const { db, userId } = authResult;

  const { data: projekt } = await db
    .from("projekter")
    .select("id, bygherre_id")
    .eq("id", id)
    .maybeSingle();

  if (!projekt) return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
  if (projekt.bygherre_id !== userId) {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  const { data, error } = await db
    .from("kontrakter")
    .select("id, titel, haandvaerker_email, haandvaerker_navn, haandvaerker_token, status, oprettet_at, total_pris")
    .eq("projekt_id", id)
    .order("oprettet_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/projekter/[id]/kontrakter — opret ny kontrakt for projektet
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await verificerBygherre(req);
  if ("error" in authResult) return authResult.error;
  const { db, userId } = authResult;

  const body = await req.json().catch(() => ({}));

  const { data: projekt } = await db
    .from("projekter")
    .select("adresse, projekttype, startdato, slutdato, budget, bygherre_id")
    .eq("id", id)
    .maybeSingle();

  if (!projekt) return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
  if (projekt.bygherre_id !== userId) {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  const oprettet = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  const baseTitel = projekt.projekttype || "Byggeprojekt";
  const adresseDel = projekt.adresse ? ` – ${projekt.adresse}` : "";
  const labelDel = body.label ? ` (${body.label})` : "";
  const titel = `${baseTitel}${adresseDel}${labelDel}`;

  const { data: ny, error } = await db
    .from("kontrakter")
    .insert({
      projekt_id: id,
      bygherre_id: projekt.bygherre_id || null,
      status: "udkast",
      titel,
      startdato: projekt.startdato || null,
      slutdato: projekt.slutdato || null,
      total_pris: projekt.budget || null,
      vilkaar: "AB-Forbruger 2012 er gældende for denne aftale i sin helhed.",
      beskrivelse: `NEMBYGGESTYRING\nnembyggestyring.dk\n\nDato\n${oprettet}\n\nUDBUDSDOKUMENT\n\n${titel}\n\nBYGHERRE\n`,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...ny, kontraktaendringer: [] });
}
