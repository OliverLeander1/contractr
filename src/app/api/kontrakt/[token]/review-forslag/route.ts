import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Sektionsbaseret forhandling v1 — dedikeret, isoleret resolve-route for
// bygherres review_*-ændringsønsker (kontraktaendringer med
// felt ∈ {review_total_pris, review_tidsplan, review_betalingsplan,
// review_forudsaetninger}). Bevidst adskilt fra den gamle bilaterale
// /api/kontrakt/[token]/forslag-route: DENNE route må ALDRIG skrive til
// noget materielt kontraktfelt (total_pris/tidsplan/betalingsplan/
// forudsaetninger) — den ændrer udelukkende selve
// kontraktaendringer-rækkens status/besvaret_at. Entreprenøren indarbejder
// selv sin revision via de eksisterende, uændrede write-routes
// (/api/kontrakt/[token], /api/kontrakt/[token]/tidsplan); denne route
// bekræfter eller afviser bagefter, at ønsket er behandlet.
const REVIEW_FELTER = [
  "review_total_pris",
  "review_tidsplan",
  "review_betalingsplan",
  "review_forudsaetninger",
] as const;

// PATCH /api/kontrakt/[token]/review-forslag — entreprenøren markerer et
// bygherre-ændringsønske som indarbejdet eller afvist.
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

  // 2. Hent kontrakt via token
  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, bygherre_id, haandvaerker_email")
    .eq("haandvaerker_token", token)
    .single();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  // 3. Kun entreprenøren (verificeret login-email mod kontraktens
  // haandvaerker_email) må resolve bygherres review-anmodninger. Samme
  // defense-in-depth-tjek som /api/kontrakt/[token]/forslag: en bruger,
  // der (usædvanligt) matcher BEGGE roller på denne kontrakt, må ikke
  // kunne besvare sit eget ændringsønske.
  const erHaandvaerker = !!(
    kontrakt.haandvaerker_email &&
    user.email &&
    user.email.trim().toLowerCase() === kontrakt.haandvaerker_email.trim().toLowerCase()
  );
  const erBygherre = user.id === kontrakt.bygherre_id;
  if (!erHaandvaerker || erBygherre) {
    return NextResponse.json({ error: "Du har ikke adgang til denne kontrakt" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { aendring_id, handling } = body;

  if (!aendring_id || typeof aendring_id !== "string") {
    return NextResponse.json({ error: "aendring_id mangler" }, { status: 400 });
  }
  if (handling !== "indarbejdet" && handling !== "afvist") {
    return NextResponse.json({ error: "handling skal være 'indarbejdet' eller 'afvist'" }, { status: 400 });
  }

  // 4. Hent selve ændringsrækken og verificér i samme kald, at den
  // tilhører DENNE kontrakt (aldrig en anden kontrakt bag samme eller et
  // andet token), er forfattet af bygherre, og er et review_*-felt — en
  // gammel bilateral titel/beskrivelse/total_pris-forslagsrække kan aldrig
  // resolves via denne route.
  const { data: aendring } = await db
    .from("kontraktaendringer")
    .select("id, kontrakt_id, felt, forfatter, status")
    .eq("id", aendring_id)
    .eq("kontrakt_id", kontrakt.id)
    .eq("forfatter", "bygherre")
    .maybeSingle();

  if (!aendring || !(REVIEW_FELTER as readonly string[]).includes(aendring.felt)) {
    return NextResponse.json({ error: "Ændringsønske ikke fundet" }, { status: 404 });
  }

  // 5. Idempotent/fail-safe: hvis requesten allerede er besvaret (fx et
  // dobbeltklik, eller en anden fane), omskriv IKKE historikken — returnér
  // den aktuelle tilstand som en tydelig konflikt.
  if (aendring.status !== "afventer") {
    return NextResponse.json(
      { error: `Dette ændringsønske er allerede ${aendring.status === "accepteret" ? "markeret som indarbejdet" : "afvist"}.`, aendring },
      { status: 409 }
    );
  }

  const nyStatus = handling === "indarbejdet" ? "accepteret" : "afvist";

  // 6. Ren audit-opdatering. Ingen skrivning til kontrakter-tabellen sker
  // nogensinde i denne route — det er hele pointen med at holde den
  // adskilt fra den gamle /forslag-routes accept-og-anvend-semantik.
  const { data, error } = await db
    .from("kontraktaendringer")
    .update({ status: nyStatus, besvaret_at: new Date().toISOString() })
    .eq("id", aendring_id)
    .eq("status", "afventer")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Ændringsønsket blev ændret af en anden handling. Genindlæs siden, og prøv igen." },
      { status: 409 }
    );
  }

  return NextResponse.json(data);
}
