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

// PATCH /api/kontrakt/[token] — opdater felter via token (ingen auth, bruges af haandvaerker)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const db = createServiceClient();

  const tilladte = ["total_pris", "startdato", "slutdato", "besigtigelse_dato", "besigtigelse_tid", "besigtigelse_bekraeftet", "forudsaetninger", "forudsaetninger_sendt_at", "forudsaetninger_godkendt"];
  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };

  for (const felt of tilladte) {
    if (felt in body) opdatering[felt] = body[felt];
  }

  // Betalingsplan: særskilt validering og lås-check
  if ("betalingsplan" in body) {
    const { data: eksisterende } = await db
      .from("kontrakter")
      .select("haandvaerker_godkendt_at, bygherre_godkendt_at")
      .eq("haandvaerker_token", token)
      .single();

    if (!eksisterende) {
      return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
    }
    if (eksisterende.haandvaerker_godkendt_at || eksisterende.bygherre_godkendt_at) {
      return NextResponse.json({ error: "Betalingsplan kan ikke ændres efter godkendelse" }, { status: 403 });
    }

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

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .eq("haandvaerker_token", token)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
