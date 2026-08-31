import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation } from "@/lib/notifikationer";
import { erV2Dokument, parseV2Sektioner, indeholderKonkretDato } from "@/lib/dokumentV2";
import { erGodkendtAfNogen } from "@/lib/kontraktGodkendelse";

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
    .select("id, projekt_id, titel, beskrivelse, total_pris, betalingsplan, startdato, slutdato, haandvaerker_email, haandvaerker_navn, haandvaerker_firma, haandvaerker_cvr, status, bygherre_godkendt_at, haandvaerker_godkendt_at")
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

  // Contract approval state coherence v1 — en godkendelse gælder kun det
  // aftalegrundlag, parten faktisk godkendte. Bruger den strengere "mindst
  // én part har godkendt"-regel (ikke kun "begge") for materielle
  // felt-ændringer, så vi aldrig kan producere en selvmodsigende
  // status/tidsstempel-kombination for en delvist godkendt kontrakt (fx
  // status "haandvaerker_godkendt" med et efterfølgende nulstillet
  // tidsstempel). Samme regel som håndværkerens egne mutation-routes
  // allerede håndhæver.
  const erGodkendtAfEnPart = erGodkendtAfNogen(eksisterendeKontrakt);

  // Contract approval state coherence v1 — kun en FAKTISK værdiændring skal
  // indgå i opdateringen, uanset kontraktens livscyklus. Ellers ville et
  // no-op-resend af en allerede gemt værdi udløse "nulstil godkendelser når
  // indhold ændres" nedenfor og lydløst invalidere gyldige underskrifter,
  // selvom intet aftaleindhold reelt ændrede sig.
  const opdatering: Record<string, unknown> = { opdateret_at: new Date().toISOString() };
  if (titel !== undefined && titel !== eksisterendeKontrakt.titel) opdatering.titel = titel;
  if (beskrivelse !== undefined && beskrivelse !== eksisterendeKontrakt.beskrivelse) opdatering.beskrivelse = beskrivelse;
  if (total_pris !== undefined && total_pris !== eksisterendeKontrakt.total_pris) opdatering.total_pris = total_pris;
  if (betalingsplan !== undefined && JSON.stringify(betalingsplan) !== JSON.stringify(eksisterendeKontrakt.betalingsplan)) {
    opdatering.betalingsplan = betalingsplan;
  }
  if (startdato !== undefined && startdato !== eksisterendeKontrakt.startdato) opdatering.startdato = startdato;
  if (slutdato !== undefined && slutdato !== eksisterendeKontrakt.slutdato) opdatering.slutdato = slutdato;
  if (haandvaerker_email !== undefined && haandvaerker_email !== eksisterendeKontrakt.haandvaerker_email) {
    opdatering.haandvaerker_email = haandvaerker_email;
    opdatering.status = "inviteret";
  }
  if (haandvaerker_navn !== undefined && haandvaerker_navn !== eksisterendeKontrakt.haandvaerker_navn) opdatering.haandvaerker_navn = haandvaerker_navn;
  if (haandvaerker_firma !== undefined && haandvaerker_firma !== eksisterendeKontrakt.haandvaerker_firma) opdatering.haandvaerker_firma = haandvaerker_firma;
  if (haandvaerker_cvr !== undefined && haandvaerker_cvr !== eksisterendeKontrakt.haandvaerker_cvr) opdatering.haandvaerker_cvr = haandvaerker_cvr;

  // Contract approval state coherence v1 — en allerede givet godkendelse
  // (af én eller begge parter) må ikke kunne fremstå som fortsat gældende
  // for et aftalegrundlag, der efterfølgende ændres materielt. Alle disse
  // felter er materielle aftalevilkår (indgår i det live-renderede
  // dokument via DokumentRenderer, eller identificerer selve modparten).
  // Der findes i dag intet kontrolleret, brugerforståeligt re-approval-flow
  // for disse felter (UI'et skjuler allerede redigeringskontrollerne, når
  // blot én part har godkendt) — derfor fail-closed: blokér i stedet for
  // at nulstille underskrifter stille i baggrunden, mens status fortsat
  // hævder en godkendelse, der ikke længere gælder. Kun en FAKTISK forsøgt
  // værdiændring blokeres (se opdatering ovenfor).
  const MATERIELLE_FELTER = [
    "titel", "beskrivelse", "total_pris", "betalingsplan",
    "startdato", "slutdato",
    "haandvaerker_email", "haandvaerker_navn", "haandvaerker_firma", "haandvaerker_cvr",
  ] as const;
  if (erGodkendtAfEnPart && MATERIELLE_FELTER.some((felt) => felt in opdatering)) {
    return NextResponse.json(
      { error: "Aftalen er allerede godkendt af en af parterne. Aftalevilkår kan ikke ændres direkte." },
      { status: 409 }
    );
  }

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
    // Contract approval state coherence v1 — en reel forudsætnings-
    // godkendelse er et materielt aftalevilkår. Denne handling er i dag
    // strukturelt kun reachable før nogen part har underskrevet endeligt
    // (håndværkerens indsendelsesrute låser allerede ved ét tidsstempel, og
    // slutgodkendelsen kræver alle uafklarede forudsætninger afgjort), men
    // guardes alligevel her som defense-in-depth mod et direkte API-kald.
    if (erGodkendtAfNogen(foer) && erReelAendring) {
      return NextResponse.json(
        { error: "Aftalen er allerede godkendt af en af parterne. Aftalevilkår kan ikke ændres direkte." },
        { status: 409 }
      );
    }
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
    // Contract approval state coherence v1 — samme defense-in-depth som
    // godkend_forudsaetninger ovenfor: at fjerne en allerede aftalt
    // forudsætning fra en kontrakt, hvor en part allerede har godkendt, er
    // en materiel ændring af aftalegrundlaget.
    if (erGodkendtAfNogen(foer) && erReelAendring) {
      return NextResponse.json(
        { error: "Aftalen er allerede godkendt af en af parterne. Aftalevilkår kan ikke ændres direkte." },
        { status: 409 }
      );
    }
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
    // Signed contract date integrity v1 / Contract approval state
    // coherence v1 — den godkendte tidsplan er (når den findes) selve
    // authority for de canonical kontraktdatoer. En (gen)godkendelse efter
    // at en part allerede har underskrevet kunne derfor ændre eller
    // førstegangsetablere den bindende baseline uden ny fælles aftale.
    // Normal brug godkender altid tidsplanen FØR nogen underskriver
    // endeligt (uændret, urørt af dette) — dette blokerer kun det
    // unødvendige og potentielt utilsigtede tilfælde efter.
    if (erGodkendtAfEnPart) {
      return NextResponse.json(
        { error: "Aftalen er allerede godkendt af en af parterne. Den aftalte tidsplan kan ikke ændres direkte." },
        { status: 409 }
      );
    }

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
