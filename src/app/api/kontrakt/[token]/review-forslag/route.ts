import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import {
  effektivTidsplanDatoer,
  prisErUaendret,
  tidsplanErUaendret,
  betalingsplanErUaendret,
  forudsaetningerErUaendret,
} from "@/lib/reviewAendringVisning";

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

// Bugfix-runde v1 — "behandlet" (klientvendt handling) betyder: "sektionen
// er faktisk revideret siden ønsket blev oprettet". Internt bruges fortsat
// status "accepteret" (ingen migration), men handling-værdien hedder nu
// "behandlet" (ikke "indarbejdet"), fordi entreprenørens nye værdi ikke
// nødvendigvis er identisk med bygherres foreslåede værdi — kun at
// sektionen ER redigeret siden.
type Handling = "behandlet" | "afvist";

function erGyldigHandling(v: unknown): v is Handling {
  return v === "behandlet" || v === "afvist";
}

// PATCH /api/kontrakt/[token]/review-forslag — entreprenøren markerer et
// bygherre-ændringsønske som behandlet eller afvist.
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

  // 2. Hent kontrakt via token — inkl. de materielle felter, der kan
  // være relevante for sammenligningen nedenfor. Én select er billigere
  // end at slå kontrakten op igen senere, og alle felter er allerede
  // dokumenteret nødvendige for én eller flere review_*-typer.
  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, bygherre_id, haandvaerker_email, total_pris, tidsplan, startdato, slutdato, betalingsplan, forudsaetninger")
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
  if (!erGyldigHandling(handling)) {
    return NextResponse.json({ error: "handling skal være 'behandlet' eller 'afvist'" }, { status: 400 });
  }

  // 4. Hent selve ændringsrækken og verificér i samme kald, at den
  // tilhører DENNE kontrakt (aldrig en anden kontrakt bag samme eller et
  // andet token), er forfattet af bygherre, og er et review_*-felt — en
  // gammel bilateral titel/beskrivelse/total_pris-forslagsrække kan aldrig
  // resolves via denne route.
  const { data: aendring } = await db
    .from("kontraktaendringer")
    .select("id, kontrakt_id, felt, forfatter, status, gammel_vaerdi")
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
      { error: `Dette ændringsønske er allerede ${aendring.status === "accepteret" ? "markeret som behandlet" : "afvist"}.`, aendring },
      { status: 409 }
    );
  }

  // 6. Server-side guard (bugfix v1) — "behandlet" må kun lykkes, hvis den
  // relevante sektion FAKTISK er ændret siden requestens gemte
  // gammel_vaerdi-snapshot. Ellers ville UI'et kunne vise "Ændringsønske
  // behandlet", mens kontraktværdien reelt stod uændret. Dette er en
  // fail-closed server-kontrol, ikke kun client-UX. "Afvist" kræver ingen
  // sammenligning — entreprenøren kan altid afvise uden at redigere noget.
  if (handling === "behandlet") {
    let gammelVaerdi: Record<string, unknown> = {};
    try {
      gammelVaerdi = JSON.parse(aendring.gammel_vaerdi ?? "{}");
    } catch {
      gammelVaerdi = {};
    }

    let uaendret = false;
    let sektionsFejl = "Der er endnu ikke foretaget en ændring i denne sektion.";

    if (aendring.felt === "review_total_pris") {
      uaendret = prisErUaendret(gammelVaerdi.pris as number | null | undefined, kontrakt.total_pris);
      sektionsFejl = "Der er endnu ikke foretaget en ændring i entreprisesummen.";
    } else if (aendring.felt === "review_tidsplan") {
      const aktuel = effektivTidsplanDatoer(kontrakt.tidsplan, kontrakt.startdato, kontrakt.slutdato);
      uaendret = tidsplanErUaendret(
        { startdato: gammelVaerdi.startdato as string | null | undefined, slutdato: gammelVaerdi.slutdato as string | null | undefined },
        aktuel.startdato,
        aktuel.slutdato,
      );
      sektionsFejl = "Der er endnu ikke foretaget en ændring i tidsplanen.";
    } else if (aendring.felt === "review_betalingsplan") {
      uaendret = betalingsplanErUaendret(
        gammelVaerdi.betalingsplan as { milepæl: string; andel: string }[] | null | undefined,
        kontrakt.betalingsplan as { milepæl: string; andel: string }[] | null | undefined,
      );
      sektionsFejl = "Der er endnu ikke foretaget en ændring i betalingsplanen.";
    } else {
      // review_forudsaetninger
      uaendret = forudsaetningerErUaendret(gammelVaerdi.tekst as string | null | undefined, kontrakt.forudsaetninger);
      sektionsFejl = "Der er endnu ikke foretaget en ændring i forudsætningerne.";
    }

    if (uaendret) {
      return NextResponse.json({ error: sektionsFejl }, { status: 409 });
    }
  }

  const nyStatus = handling === "behandlet" ? "accepteret" : "afvist";

  // 7. Ren audit-opdatering. Ingen skrivning til kontrakter-tabellen sker
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
