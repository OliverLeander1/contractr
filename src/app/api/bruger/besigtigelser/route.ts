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

  // varighed_minutter/valgt_tidspunkt_id/besigtigelse_tidspunkter er nødvendige for,
  // at dashboardets statustekst kan afgøre en aftalt tid (via valgt_tidspunkt_id) eller
  // vise et antal foreslåede tider — uden nogensinde at fremstille "Mulighed 1" som en
  // aftalt dato for en aktiv, endnu ikke besvaret multi-tids-runde.
  //
  // besigtigelse_tidspunkter!besigtigelse_id — det eksplicitte FK-hint er PÅKRÆVET:
  // migrationen opretter to foreign keys mellem besigtigelse og
  // besigtigelse_tidspunkter (den almindelige child→parent besigtigelse_id-FK, samt
  // den composite valgt_tidspunkt_id-FK for "valgt tidspunkt tilhører samme runde").
  // Med to FK'er mellem samme tabelpar kan PostgREST ikke længere selv afgøre hvilken
  // relation et ukvalificeret besigtigelse_tidspunkter(...)-embed skal bruge, og
  // returnerer i stedet en fejl ("more than one relationship was found") — det var
  // den faktiske årsag til, at denne route fejlede i produktion.
  const { data: besigtigelser, error: besigtigelserFejl } = await db
    .from("besigtigelse")
    .select(
      "id, kontrakt_id, projekt_id, dato, tidspunkt, varighed_minutter, valgt_tidspunkt_id, status, foreslaaet_af, kommentar_haandvaerker, kommentar_bygherre, besigtigelse_tidspunkter!besigtigelse_id(id, dato, tidspunkt)",
    )
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

  // Fladgør nested besigtigelse_tidspunkter til det fælles feltnavn "tidspunkter",
  // så BesigtigelseData-formen matches uden en separat type i dashboardet.
  const resultat = unikke.map(({ besigtigelse_tidspunkter, ...felter }) => ({
    ...felter,
    tidspunkter: besigtigelse_tidspunkter ?? [],
  }));

  return NextResponse.json(resultat);
}
