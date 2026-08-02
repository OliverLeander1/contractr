import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/kontrakt/[token] — hent kontrakt via håndværker-token (ingen auth)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("kontrakter")
    .select("*, kontraktaendringer(*)")
    .eq("haandvaerker_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/kontrakt/[token] — opdater felter som verificeret håndværker
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // 1. Autentifikation
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

  // 2. Hent kontrakt
  const { data: kontrakt, error: hentFejl } = await db
    .from("kontrakter")
    .select("id, haandvaerker_email, haandvaerker_godkendt_at, bygherre_godkendt_at")
    .eq("haandvaerker_token", token)
    .single();

  if (hentFejl || !kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  // 3. Verificer entreprenør-identitet — kun matchende e-mail gives adgang
  if (
    !kontrakt.haandvaerker_email ||
    !user.email ||
    user.email.trim().toLowerCase() !== kontrakt.haandvaerker_email.trim().toLowerCase()
  ) {
    return NextResponse.json({ error: "Du har ikke adgang til denne kontrakt" }, { status: 403 });
  }

  // 4. Lås-kontrol: afvis ændringer når ét eller begge godkendelsestimestamps er sat
  if (kontrakt.haandvaerker_godkendt_at || kontrakt.bygherre_godkendt_at) {
    return NextResponse.json(
      { error: "Aftalegrundlaget kan ikke ændres, efter det er sendt til godkendelse." },
      { status: 403 }
    );
  }

  // 5. Valider og byg opdatering
  const body = await req.json();
  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };

  // total_pris — validering
  if ("total_pris" in body) {
    const pris = Number(body.total_pris);
    if (!Number.isFinite(pris) || pris <= 0) {
      return NextResponse.json({ error: "Entreprisesum skal være et positivt tal" }, { status: 400 });
    }
    opdatering.total_pris = pris;
  }

  // forudsaetninger — ledsagefelter sættes server-side
  if ("forudsaetninger" in body) {
    opdatering.forudsaetninger = body.forudsaetninger;
    opdatering.forudsaetninger_sendt_at = new Date().toISOString();
    opdatering.forudsaetninger_godkendt = false;
  }

  // Betalingsplan: særskilt validering
  if ("betalingsplan" in body) {
    const rå = body.betalingsplan;

    if (rå === null || (Array.isArray(rå) && rå.length === 0)) {
      opdatering.betalingsplan = null;
    } else if (!Array.isArray(rå)) {
      return NextResponse.json({ error: "betalingsplan skal være null eller et array" }, { status: 400 });
    } else {
      if (rå.length < 2) {
        return NextResponse.json({ error: "Betalingsplan skal have mindst to rækker" }, { status: 400 });
      }
      for (const række of rå) {
        if (typeof række !== "object" || række === null) {
          return NextResponse.json({ error: "Ugyldig betalingsplan-række" }, { status: 400 });
        }
        if (typeof række.milepæl !== "string" || !String(række.milepæl).trim()) {
          return NextResponse.json({ error: "Hver milepæl skal have en ikke-tom beskrivelse" }, { status: 400 });
        }
        const andel = parseFloat(String(række.andel).replace(",", ".").replace("%", "").trim());
        if (!Number.isFinite(andel) || andel <= 0) {
          return NextResponse.json({ error: "Andel skal være en positiv procentværdi" }, { status: 400 });
        }
      }
      const sum = rå.reduce((acc: number, r: { andel: string }) => {
        return acc + parseFloat(String(r.andel).replace(",", ".").replace("%", "").trim());
      }, 0);
      if (Math.abs(sum - 100) > 0.01) {
        return NextResponse.json({ error: "Betalingsplanens andele skal summere til 100 %" }, { status: 400 });
      }
      opdatering.betalingsplan = rå.map((r: { milepæl: string; andel: string }) => ({
        milepæl: String(r.milepæl).trim(),
        andel: String(r.andel).trim(),
      }));
    }
  }

  if (Object.keys(opdatering).length <= 1) {
    return NextResponse.json({ error: "Ingen gyldige felter" }, { status: 400 });
  }

  // 6. Skriv
  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .eq("id", kontrakt.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
