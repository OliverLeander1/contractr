import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation } from "@/lib/notifikationer";

export const runtime = "nodejs";

// GET /api/kontrakt?projekt_id=xxx  — hent eller opret kontrakt for projekt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projekt_id = searchParams.get("projekt_id");
  const bygherre_id = searchParams.get("bygherre_id");

  if (!projekt_id) {
    return NextResponse.json({ error: "projekt_id mangler" }, { status: 400 });
  }

  const db = createServiceClient();
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
    const { data: projekt } = await db
      .from("projekter")
      .select("startdato, slutdato")
      .eq("id", projekt_id)
      .single();
    if (projekt?.startdato || projekt?.slutdato) {
      const patch: Record<string, unknown> = {};
      if (!data.startdato && projekt?.startdato) patch.startdato = projekt.startdato;
      if (!data.slutdato && projekt?.slutdato) patch.slutdato = projekt.slutdato;
      if (Object.keys(patch).length > 0) {
        const { data: opdateret } = await db
          .from("kontrakter")
          .update(patch)
          .eq("id", data.id)
          .select("*, kontraktaendringer(*)")
          .single();
        if (opdateret) return NextResponse.json(opdateret);
      }
    }
  }

  if (!data) {
    // Hent projektdata for at præ-udfylde kontrakten
    const { data: projekt } = await db
      .from("projekter")
      .select("adresse, projekttype, startdato, slutdato, budget")
      .eq("id", projekt_id)
      .single();

    const oprettet = new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
    const titel = projekt
      ? `${projekt.projekttype || "Byggeprojekt"}${projekt.adresse ? ` – ${projekt.adresse}` : ""}`
      : null;

    const { data: ny, error: opretFejl } = await db
      .from("kontrakter")
      .insert({
        projekt_id,
        bygherre_id: bygherre_id || null,
        status: "udkast",
        titel: titel || null,
        startdato: projekt?.startdato || null,
        slutdato: projekt?.slutdato || null,
        total_pris: projekt?.budget || null,
        vilkaar: "AB-Forbruger 2012 er gældende for denne aftale i sin helhed.",
        beskrivelse: titel ? `NEMBYGGESTYRING\nnembyggestyring.dk\n\nDato\n${oprettet}\n\nUDBUDSDOKUMENT\n\n${titel}\n\nBYGHERRE\n` : null,
      })
      .select()
      .single();

    if (opretFejl) {
      return NextResponse.json({ error: opretFejl.message }, { status: 500 });
    }

    return NextResponse.json({ ...ny, kontraktaendringer: [] });
  }

  return NextResponse.json(data);
}

// POST /api/kontrakt — opdater kontraktindhold
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kontrakt_id, bygherre_id, titel, beskrivelse, total_pris, betalingsplan, vilkaar, startdato, slutdato, haandvaerker_navn, haandvaerker_email, haandvaerker_firma, haandvaerker_cvr, godkend_tidsplan, godkend_forudsaetninger, afvis_forudsaetninger } = body;

  if (!kontrakt_id) {
    return NextResponse.json({ error: "kontrakt_id mangler" }, { status: 400 });
  }

  const db = createServiceClient();

  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };
  if (titel !== undefined) opdatering.titel = titel;
  if (beskrivelse !== undefined) opdatering.beskrivelse = beskrivelse;
  if (total_pris !== undefined) opdatering.total_pris = total_pris;
  if (betalingsplan !== undefined) opdatering.betalingsplan = betalingsplan;
  if (vilkaar !== undefined) opdatering.vilkaar = vilkaar;
  if (startdato !== undefined) opdatering.startdato = startdato;
  if (slutdato !== undefined) opdatering.slutdato = slutdato;
  if (haandvaerker_email !== undefined) {
    opdatering.haandvaerker_email = haandvaerker_email;
    opdatering.status = "inviteret";
  }
  if (haandvaerker_navn !== undefined) opdatering.haandvaerker_navn = haandvaerker_navn;
  if (haandvaerker_firma !== undefined) opdatering.haandvaerker_firma = haandvaerker_firma;
  if (haandvaerker_cvr !== undefined) opdatering.haandvaerker_cvr = haandvaerker_cvr;

  // Bygherre godkender forudsætninger fra håndværker
  if (godkend_forudsaetninger === true) {
    const { data, error } = await db
      .from("kontrakter")
      .update({ forudsaetninger_godkendt: true, opdateret_at: new Date().toISOString() })
      .eq("id", kontrakt_id)
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Bygherre afviser forudsætninger — nulstil så håndværker kan sende nye
  if (afvis_forudsaetninger === true) {
    const { data, error } = await db
      .from("kontrakter")
      .update({ forudsaetninger: null, forudsaetninger_sendt_at: null, forudsaetninger_godkendt: null, opdateret_at: new Date().toISOString() })
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

  const where: Record<string, unknown> = { id: kontrakt_id };
  if (bygherre_id) where.bygherre_id = bygherre_id;

  const { data, error } = await db
    .from("kontrakter")
    .update(opdatering)
    .match(where)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
