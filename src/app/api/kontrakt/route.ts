import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation } from "@/lib/notifikationer";
import { erV2Dokument, parseV2Sektioner, indeholderKonkretDato } from "@/lib/dokumentV2";

export const runtime = "nodejs";

// Verificerer Bearer JWT og at brugeren har den autoritative rolle "bygherre".
// Ejerskab af det konkrete projekt/kontrakt kontrolleres separat i hver
// handler, da GET og POST har forskellige ressourcer at slå op.
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

// GET /api/kontrakt?projekt_id=xxx  — hent eller opret kontrakt for projekt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projekt_id = searchParams.get("projekt_id");

  if (!projekt_id) {
    return NextResponse.json({ error: "projekt_id mangler" }, { status: 400 });
  }

  const authResult = await verificerBygherre(req);
  if ("error" in authResult) return authResult.error;
  const { db, userId } = authResult;

  const { data: projekt } = await db
    .from("projekter")
    .select("id, bygherre_id, adresse, projekttype, startdato, slutdato, budget")
    .eq("id", projekt_id)
    .maybeSingle();

  if (!projekt) return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
  if (projekt.bygherre_id !== userId) {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  const { data, error } = await db
    .from("kontrakter")
    .select("*, kontraktaendringer(*)")
    .eq("projekt_id", projekt_id)
    .order("oprettet_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Eksisterende kontrakt mangler dato — hent fra projekt og opdater
  if (data && (!data.startdato || !data.slutdato)) {
    if (projekt.startdato || projekt.slutdato) {
      const patch: Record<string, unknown> = {};
      if (!data.startdato && projekt.startdato) patch.startdato = projekt.startdato;
      if (!data.slutdato && projekt.slutdato) patch.slutdato = projekt.slutdato;
      if (Object.keys(patch).length > 0) {
        const { data: opdateret } = await db
          .from("kontrakter")
          .update(patch)
          .eq("id", data.id)
          .select("*, kontraktaendringer(*)")
          .single();
        if (opdateret) return NextResponse.json({ ...opdateret, projekt_adresse: projekt.adresse });
      }
    }
  }

  if (!data) {
    // Præ-udfyld kontrakten fra det allerede verificerede projekt
    const oprettet = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
    const titel = `${projekt.projekttype || "Byggeprojekt"}${projekt.adresse ? ` – ${projekt.adresse}` : ""}`;

    const { data: ny, error: opretFejl } = await db
      .from("kontrakter")
      .insert({
        projekt_id,
        bygherre_id: projekt.bygherre_id,
        status: "udkast",
        titel: titel || null,
        startdato: projekt.startdato || null,
        slutdato: projekt.slutdato || null,
        total_pris: projekt.budget || null,
        vilkaar: "AB-Forbruger 2012 er gældende for denne aftale i sin helhed.",
        beskrivelse: titel ? `NEMBYGGESTYRING\nnembyggestyring.dk\n\nDato\n${oprettet}\n\nUDBUDSDOKUMENT\n\n${titel}\n\nBYGHERRE\n` : null,
      })
      .select()
      .single();

    if (opretFejl) {
      return NextResponse.json({ error: opretFejl.message }, { status: 500 });
    }

    return NextResponse.json({ ...ny, kontraktaendringer: [], projekt_adresse: projekt.adresse });
  }

  return NextResponse.json({ ...data, projekt_adresse: projekt.adresse });
}

// POST /api/kontrakt — opdater kontraktindhold
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // "vilkaar" (AB-Forbruger) læses bevidst ikke fra body her. Det er et låst
  // aftalevilkår og må ikke kunne ændres af bygherre via denne route, samme
  // princip som forslagsruten (se /api/kontrakt/[token]/forslag).
  const { kontrakt_id, titel, beskrivelse, total_pris, betalingsplan, startdato, slutdato, haandvaerker_navn, haandvaerker_email, haandvaerker_firma, haandvaerker_cvr, godkend_tidsplan, godkend_forudsaetninger, afvis_forudsaetninger } = body;

  if (!kontrakt_id) {
    return NextResponse.json({ error: "kontrakt_id mangler" }, { status: 400 });
  }

  const authResult = await verificerBygherre(req);
  if ("error" in authResult) return authResult.error;
  const { db, userId } = authResult;

  const { data: eksisterendeKontrakt } = await db
    .from("kontrakter")
    .select("id, projekt_id")
    .eq("id", kontrakt_id)
    .maybeSingle();

  if (!eksisterendeKontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const { data: projekt } = await db
    .from("projekter")
    .select("bygherre_id")
    .eq("id", eksisterendeKontrakt.projekt_id)
    .maybeSingle();

  if (!projekt) {
    return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
  }
  if (projekt.bygherre_id !== userId) {
    return NextResponse.json({ error: "Adgang afvist" }, { status: 403 });
  }

  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };
  if (titel !== undefined) opdatering.titel = titel;
  if (beskrivelse !== undefined) opdatering.beskrivelse = beskrivelse;
  if (total_pris !== undefined) opdatering.total_pris = total_pris;
  if (betalingsplan !== undefined) opdatering.betalingsplan = betalingsplan;
  if (startdato !== undefined) opdatering.startdato = startdato;
  if (slutdato !== undefined) opdatering.slutdato = slutdato;
  if (haandvaerker_email !== undefined) {
    opdatering.haandvaerker_email = haandvaerker_email;
    opdatering.status = "inviteret";
  }
  if (haandvaerker_navn !== undefined) opdatering.haandvaerker_navn = haandvaerker_navn;
  if (haandvaerker_firma !== undefined) opdatering.haandvaerker_firma = haandvaerker_firma;
  if (haandvaerker_cvr !== undefined) opdatering.haandvaerker_cvr = haandvaerker_cvr;

  // Servervalidering af V2-dokumenter: konkrete kalenderdatoer må ikke gemmes
  // i de redigerbare narrative sektioner. Ligger bevidst før enhver
  // opdatering af kontrakter.beskrivelse. Legacy-dokumenter (uden
  // V2-markøren) rammes ikke af denne kontrol.
  if (typeof beskrivelse === "string" && erV2Dokument(beskrivelse)) {
    const sektioner = parseV2Sektioner(beskrivelse);
    const redigerbartIndhold = [sektioner.arbejdsomfang, sektioner.kravOgOensker, sektioner.praktiskeForhold].join("\n");
    if (indeholderKonkretDato(redigerbartIndhold)) {
      return NextResponse.json({ error: "Datoer ændres i Tidsplan." }, { status: 400 });
    }
  }

  // Bygherre godkender forudsætninger fra håndværker. En godkendelse gør
  // forudsætningen til en del af det aktuelle aftalegrundlag — hvis en af
  // parterne allerede har slutgodkendt, er dette en materiel ændring, og
  // begge godkendelser skal derfor nulstilles (medmindre den reelt ikke
  // ændrer noget, fx et dobbeltklik).
  if (godkend_forudsaetninger === true) {
    const { data: foer } = await db
      .from("kontrakter")
      .select("forudsaetninger_godkendt, bygherre_godkendt_at, haandvaerker_godkendt_at")
      .eq("id", kontrakt_id)
      .single();

    const opdatering: Record<string, unknown> = {
      forudsaetninger_godkendt: true,
      opdateret_at: new Date().toISOString(),
    };
    const erReelAendring = foer?.forudsaetninger_godkendt !== true;
    if (erReelAendring && (foer?.bygherre_godkendt_at || foer?.haandvaerker_godkendt_at)) {
      opdatering.bygherre_godkendt_at = null;
      opdatering.haandvaerker_godkendt_at = null;
    }

    const { data, error } = await db
      .from("kontrakter")
      .update(opdatering)
      .eq("id", kontrakt_id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Bygherre afviser forudsætninger — nulstil så håndværker kan sende nye.
  // Samme princip: fjerner en forudsætning en materiel del af en allerede
  // slutgodkendt aftale, skal begge godkendelser nulstilles.
  if (afvis_forudsaetninger === true) {
    const { data: foer } = await db
      .from("kontrakter")
      .select("forudsaetninger, bygherre_godkendt_at, haandvaerker_godkendt_at")
      .eq("id", kontrakt_id)
      .single();

    const opdatering: Record<string, unknown> = {
      forudsaetninger: null,
      forudsaetninger_sendt_at: null,
      forudsaetninger_godkendt: null,
      opdateret_at: new Date().toISOString(),
    };
    const erReelAendring = !!foer?.forudsaetninger;
    if (erReelAendring && (foer?.bygherre_godkendt_at || foer?.haandvaerker_godkendt_at)) {
      opdatering.bygherre_godkendt_at = null;
      opdatering.haandvaerker_godkendt_at = null;
    }

    const { data, error } = await db
      .from("kontrakter")
      .update(opdatering)
      .eq("id", kontrakt_id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Bygherre godkender tidsplan — opdater kun tidsplan.godkendt_af_bygherre, nulstil IKKE underskrifter
  if (godkend_tidsplan === true) {
    const { data: eksisterende } = await db
      .from("kontrakter").select("tidsplan, titel, haandvaerker_email, haandvaerker_token").eq("id", kontrakt_id).single();
    const nuværendeTidsplan = eksisterende?.tidsplan ?? {};
    const { data, error } = await db
      .from("kontrakter")
      .update({ tidsplan: { ...nuværendeTidsplan, godkendt_af_bygherre: true, godkendt_at: new Date().toISOString() }, opdateret_at: new Date().toISOString() })
      .eq("id", kontrakt_id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notificer håndværker
    if (eksisterende?.haandvaerker_email) {
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
      sendNotifikation("bygherre_godkendt_tidsplan", eksisterende.haandvaerker_email, {
        projekttitel: eksisterende.titel || "projektet",
        link: `${baseUrl}/kontrakt/${eksisterende.haandvaerker_token}`,
      });
    }

    return NextResponse.json(data);
  }

  // Nulstil godkendelser når indhold ændres
  if (Object.keys(opdatering).length > 1) {
    opdatering.bygherre_godkendt_at = null;
    opdatering.haandvaerker_godkendt_at = null;
  }

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .eq("id", kontrakt_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
