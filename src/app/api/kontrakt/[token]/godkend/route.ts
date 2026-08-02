import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";

export const runtime = "nodejs";

// POST /api/kontrakt/[token]/godkend — part godkender kontrakten
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

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

  const { data: kontrakt, error: hentFejl } = await db
    .from("kontrakter")
    .select("id, bygherre_id, bygherre_godkendt_at, haandvaerker_godkendt_at, haandvaerker_email, status, total_pris")
    .eq("haandvaerker_token", token)
    .single();

  if (hentFejl || !kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  // Bestem rolle server-side ud fra verificeret bruger
  const erBygherre = user.id === kontrakt.bygherre_id;
  const erHaandvaerker = !!(
    kontrakt.haandvaerker_email &&
    user.email &&
    user.email.trim().toLowerCase() === kontrakt.haandvaerker_email.trim().toLowerCase()
  );

  if (erBygherre && erHaandvaerker) {
    return NextResponse.json({ error: "Adgang nægtet" }, { status: 403 });
  }
  if (!erBygherre && !erHaandvaerker) {
    return NextResponse.json({ error: "Du har ikke adgang til denne kontrakt" }, { status: 403 });
  }

  const rolle = erBygherre ? "bygherre" : "haandvaerker";

  if (!kontrakt.total_pris || kontrakt.total_pris <= 0) {
    return NextResponse.json({ error: "Entreprisesum skal være udfyldt inden godkendelse" }, { status: 422 });
  }

  const body = await req.json();
  const { haandvaerker_navn, haandvaerker_firma } = body;

  const nu = new Date().toISOString();
  const opdatering: Record<string, unknown> = { opdateret_at: nu };

  if (rolle === "bygherre") {
    opdatering.bygherre_godkendt_at = nu;
  } else {
    opdatering.haandvaerker_godkendt_at = nu;
    if (haandvaerker_navn) opdatering.haandvaerker_navn = haandvaerker_navn;
    if (haandvaerker_firma) opdatering.haandvaerker_firma = haandvaerker_firma;
  }

  // Tjek om begge nu har godkendt
  const bygherreGodkendt = rolle === "bygherre" || !!kontrakt.bygherre_godkendt_at;
  const haandvaerkerGodkendt = rolle === "haandvaerker" || !!kontrakt.haandvaerker_godkendt_at;

  if (bygherreGodkendt && haandvaerkerGodkendt) {
    opdatering.status = "begge_godkendt";
  } else if (rolle === "bygherre") {
    opdatering.status = "bygherre_godkendt";
  } else {
    opdatering.status = "haandvaerker_godkendt";
  }

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .eq("haandvaerker_token", token)
    .select("*, projekter(adresse, projekttype)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send notifikation asynkront efter response
  const projekttitel = data.titel || (data as Record<string, unknown> & { projekter?: { adresse?: string } })?.projekter?.adresse || "dit projekt";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";

  if (rolle === "haandvaerker") {
    let bygherreId = data.bygherre_id as string | null;
    if (!bygherreId && data.projekt_id) {
      const { data: proj } = await db.from("projekter").select("bygherre_id").eq("id", data.projekt_id).single();
      bygherreId = proj?.bygherre_id ?? null;
    }

    if (bygherreId) {
      const { email, notifikationer } = await hentBygherreEmail(bygherreId, db);
      if (email) {
        const type = opdatering.status === "begge_godkendt" ? "begge_godkendt_kontrakt" : "haandvaerker_godkendt_kontrakt";
        sendNotifikation(type, email, {
          projekttitel,
          afsenderNavn: haandvaerker_navn || data.haandvaerker_navn || "Entreprenøren",
          link: `${baseUrl}/projekt/${data.projekt_id}/aftale`,
        }, notifikationer);
      }
    }
  }

  if (rolle === "bygherre" && data.haandvaerker_email) {
    const type = opdatering.status === "begge_godkendt" ? "begge_godkendt_kontrakt" : "bygherre_godkendt_kontrakt";
    sendNotifikation(type, data.haandvaerker_email, {
      projekttitel,
      link: `${baseUrl}/kontrakt/${token}`,
    });
  }

  return NextResponse.json(data);
}
