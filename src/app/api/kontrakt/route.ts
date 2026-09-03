import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation } from "@/lib/notifikationer";
import { erV2Dokument, parseV2Sektioner, indeholderKonkretDato } from "@/lib/dokumentV2";
import { erGodkendtAfNogen } from "@/lib/kontraktGodkendelse";
import { erGyldigDatoOnly } from "@/lib/kontraktSlutdato";

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
  const { kontrakt_id, titel, beskrivelse, total_pris, betalingsplan, startdato, slutdato, haandvaerker_navn, haandvaerker_email, haandvaerker_firma, haandvaerker_cvr, godkend_tidsplan, godkend_forudsaetninger, afvis_forudsaetninger, anmod_om_aendringer, besked, action, review_aendringer } = body;

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

  // Pre-contract lifecycle v2 — bygherre anmoder om ændringer til det
  // entreprenørgodkendte aftalegrundlag. Genåbner kontrakten for
  // entreprenøren i stedet for at kræve chat/uden-for-systemet-kontakt.
  // Genbruger den eksisterende /api/kontrakt POST-arkitektur (auth/
  // ownership allerede verificeret ovenfor) — ingen ny route, ingen ny
  // datamodel. Se docs-note: dette er IKKE et fuldt revisions-/
  // snapshot-system — den præcise tidligere tilbudsversion kan ikke
  // nødvendigvis rekonstrueres, når entreprenøren efterfølgende redigerer.
  if (anmod_om_aendringer === true) {
    const { data: foer } = await db
      .from("kontrakter")
      .select("haandvaerker_godkendt_at, bygherre_godkendt_at, haandvaerker_email, haandvaerker_token, titel, projekt_id")
      .eq("id", kontrakt_id)
      .single();

    if (!foer?.haandvaerker_godkendt_at) {
      return NextResponse.json(
        { error: "Entreprenøren har ikke godkendt aftalegrundlaget endnu." },
        { status: 409 }
      );
    }
    if (foer.bygherre_godkendt_at) {
      return NextResponse.json(
        { error: "Aftalen er allerede endeligt godkendt og kan ikke genåbnes ad denne vej." },
        { status: 409 }
      );
    }
    const beskedTekst = typeof besked === "string" ? besked.trim() : "";
    if (!beskedTekst) {
      return NextResponse.json(
        { error: "Skriv en kort besked om, hvad der skal ændres." },
        { status: 400 }
      );
    }

    const tidligereGodkendtAt = foer.haandvaerker_godkendt_at;

    const { data, error } = await db
      .from("kontrakter")
      .update({
        haandvaerker_godkendt_at: null,
        status: "forhandling",
        opdateret_at: new Date().toISOString(),
      })
      .eq("id", kontrakt_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notificér entreprenøren — in-app (public.notifikationer, den
    // eneste MVP-audit-historik vi har for denne handling lige nu) og
    // via mail. En fejl her må ikke rulle den allerede gennemførte
    // genåbning tilbage, samme etablerede princip som andre
    // notifikationskald i kodebasen.
    try {
      if (foer.haandvaerker_email) {
        const escapedEmail = foer.haandvaerker_email.trim().toLowerCase().replace(/[%_\\]/g, (m: string) => `\\${m}`);
        const { data: profiler } = await db
          .from("profiler")
          .select("id")
          .ilike("email", escapedEmail);
        if (profiler && profiler.length === 1 && foer.projekt_id) {
          await db.from("notifikationer").insert({
            bruger_id: profiler[0].id,
            projekt_id: foer.projekt_id,
            type: "bygherre_anmodet_om_aendringer",
            titel: "Bygherre har anmodet om ændringer",
            // Tidligere godkendelsestidspunkt gemmes i beskeden som minimal
            // audit-oplysning — ikke et versioneret snapshot af selve
            // tilbuddet, kun hvornår det tidligere blev godkendt.
            besked: `${beskedTekst}\n\n(Tidligere godkendt af entreprenøren: ${new Date(tidligereGodkendtAt).toLocaleString("da-DK")})`,
            laest: false,
          });
        }
        const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
        sendNotifikation("bygherre_anmodet_om_aendringer", foer.haandvaerker_email, {
          projekttitel: foer.titel || "projektet",
          link: `${baseUrl}/kontrakt/${foer.haandvaerker_token}`,
          ekstraInfo: beskedTekst,
        });
      }
    } catch (e) {
      console.error("[anmod-om-aendringer] Notifikation fejlede:", e);
    }

    return NextResponse.json(data);
  }

  // Pre-contract lifecycle v2 — sektionsbaseret forhandling. Bygherre kan i
  // ÉT samlet klik oprette 1-N konkrete, sektionsspecifikke ændringsønsker
  // til det entreprenørgodkendte tilbud. Genbruger kontraktaendringer, men
  // med egne felt-navne (review_*), der ALDRIG må optræde i den gamle
  // bilaterale TILLADTE_FELTER-allowlist i /api/kontrakt/[token]/forslag —
  // de har en anden semantik og resolves udelukkende via den dedikerede
  // route /api/kontrakt/[token]/review-forslag, som aldrig skriver til et
  // kontraktfelt. Ingen reel cross-request DB-transaktion findes i denne
  // arkitektur uden en ny RPC/migration — rækkefølgen nedenfor er bevidst
  // fail-closed: pre-check → ét batched insert → verificér antal → først
  // DEREFTER genåbnes kontraktens lifecycle.
  if (action === "send_review_aendringer") {
    const REVIEW_TILLADTE_TYPER = [
      "review_total_pris",
      "review_tidsplan",
      "review_betalingsplan",
      "review_forudsaetninger",
    ] as const;
    type ReviewType = (typeof REVIEW_TILLADTE_TYPER)[number];

    if (!Array.isArray(review_aendringer) || review_aendringer.length === 0) {
      return NextResponse.json({ error: "Vælg mindst ét ændringsønske." }, { status: 400 });
    }

    const typer = new Set<string>();
    for (const r of review_aendringer) {
      if (!r || typeof r !== "object" || typeof (r as { type?: unknown }).type !== "string") {
        return NextResponse.json({ error: "Ugyldigt ændringsønske." }, { status: 400 });
      }
      const type = (r as { type: string }).type;
      if (!(REVIEW_TILLADTE_TYPER as readonly string[]).includes(type)) {
        return NextResponse.json({ error: `'${type}' er ikke en gyldig ændringstype.` }, { status: 400 });
      }
      if (typer.has(type)) {
        return NextResponse.json({ error: "Samme sektion er angivet flere gange i samme anmodning." }, { status: 400 });
      }
      typer.add(type);
    }

    // Frisk, fuld kontraktdata — det generelle select ovenfor indeholder
    // ikke tidsplan/betalingsplan/forudsaetninger.
    const { data: kt } = await db
      .from("kontrakter")
      .select("id, projekt_id, titel, total_pris, tidsplan, betalingsplan, forudsaetninger, startdato, slutdato, haandvaerker_godkendt_at, bygherre_godkendt_at, haandvaerker_email, haandvaerker_token")
      .eq("id", kontrakt_id)
      .single();

    if (!kt) {
      return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
    }
    if (!kt.haandvaerker_godkendt_at) {
      return NextResponse.json(
        { error: "Entreprenøren har ikke sendt et samlet aftalegrundlag endnu." },
        { status: 409 }
      );
    }
    if (kt.bygherre_godkendt_at) {
      return NextResponse.json(
        { error: "Aftalen er allerede endeligt godkendt og kan ikke genåbnes ad denne vej." },
        { status: 409 }
      );
    }

    // Byg og validér hver anmodning server-side. Klienten leverer aldrig
    // det autoritative "gammel_vaerdi"-snapshot.
    const nyeRækker: Record<string, unknown>[] = [];

    for (const raa of review_aendringer as {
      type: ReviewType;
      foreslaaetPris?: unknown;
      startdato?: unknown;
      slutdato?: unknown;
      kommentar?: unknown;
    }[]) {
      const kommentar = typeof raa.kommentar === "string" ? raa.kommentar.trim().slice(0, 2000) : "";

      if (raa.type === "review_total_pris") {
        let foreslaaetPris: number | null = null;
        if (raa.foreslaaetPris !== undefined && raa.foreslaaetPris !== null && raa.foreslaaetPris !== "") {
          const parsed = Number(raa.foreslaaetPris);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            return NextResponse.json({ error: "Det foreslåede beløb skal være et positivt tal." }, { status: 400 });
          }
          foreslaaetPris = parsed;
        }
        if (foreslaaetPris === null && !kommentar) {
          return NextResponse.json({ error: "Angiv et foreslået beløb eller en kommentar til prisen." }, { status: 400 });
        }
        nyeRækker.push({
          kontrakt_id: kt.id,
          felt: "review_total_pris",
          gammel_vaerdi: JSON.stringify({ pris: kt.total_pris ?? null }),
          ny_vaerdi: JSON.stringify({ foreslaaetPris, kommentar: kommentar || null }),
          forfatter: "bygherre",
          status: "afventer",
        });
      } else if (raa.type === "review_tidsplan") {
        const startdatoNy = erGyldigDatoOnly(raa.startdato) ? raa.startdato : null;
        const slutdatoNy = erGyldigDatoOnly(raa.slutdato) ? raa.slutdato : null;
        if (!startdatoNy && !slutdatoNy && !kommentar) {
          return NextResponse.json(
            { error: "Foreslå mindst én ny dato eller skriv en kommentar til tidsplanen." },
            { status: 400 }
          );
        }
        // Samme offer/review-datokilde som resten af aftalesiden allerede
        // bruger under bygherres review (entreprenørens faktisk indsendte
        // tilbud) — opfinder bevidst ingen tredje datokilde.
        const tp = kt.tidsplan as { faser?: { startdato?: string; slutdato?: string }[] } | null;
        const effektivStart = tp?.faser?.[0]?.startdato ?? kt.startdato ?? null;
        const effektivSlut = tp?.faser?.[0]?.slutdato ?? kt.slutdato ?? null;
        nyeRækker.push({
          kontrakt_id: kt.id,
          felt: "review_tidsplan",
          gammel_vaerdi: JSON.stringify({ startdato: effektivStart, slutdato: effektivSlut }),
          ny_vaerdi: JSON.stringify({ startdato: startdatoNy, slutdato: slutdatoNy, kommentar: kommentar || null }),
          forfatter: "bygherre",
          status: "afventer",
        });
      } else if (raa.type === "review_betalingsplan") {
        if (!kommentar) {
          return NextResponse.json({ error: "Skriv en kommentar til den ønskede betalingsplan." }, { status: 400 });
        }
        nyeRækker.push({
          kontrakt_id: kt.id,
          felt: "review_betalingsplan",
          gammel_vaerdi: JSON.stringify({ betalingsplan: kt.betalingsplan ?? null }),
          ny_vaerdi: JSON.stringify({ kommentar }),
          forfatter: "bygherre",
          status: "afventer",
        });
      } else {
        // review_forudsaetninger
        if (!kommentar) {
          return NextResponse.json({ error: "Skriv en kommentar til forudsætningerne." }, { status: 400 });
        }
        nyeRækker.push({
          kontrakt_id: kt.id,
          felt: "review_forudsaetninger",
          gammel_vaerdi: JSON.stringify({ tekst: kt.forudsaetninger ?? null }),
          ny_vaerdi: JSON.stringify({ kommentar }),
          forfatter: "bygherre",
          status: "afventer",
        });
      }
    }

    const { data: eksisterendeAfventer } = await db
      .from("kontraktaendringer")
      .select("felt")
      .eq("kontrakt_id", kt.id)
      .eq("forfatter", "bygherre")
      .eq("status", "afventer")
      .in("felt", Array.from(typer));

    if (eksisterendeAfventer && eksisterendeAfventer.length > 0) {
      return NextResponse.json(
        { error: "Der findes allerede et afventende ændringsønske for en af de valgte sektioner." },
        { status: 409 }
      );
    }

    const { data: indsatte, error: insertFejl } = await db
      .from("kontraktaendringer")
      .insert(nyeRækker)
      .select("id");

    if (insertFejl || !indsatte || indsatte.length !== nyeRækker.length) {
      return NextResponse.json({ error: "Kunne ikke gemme ændringsønskerne. Prøv igen." }, { status: 500 });
    }

    const { data: opdateretKontrakt, error: opdateringFejl } = await db
      .from("kontrakter")
      .update({
        haandvaerker_godkendt_at: null,
        status: "forhandling",
        opdateret_at: new Date().toISOString(),
      })
      .eq("id", kt.id)
      .select()
      .single();

    if (opdateringFejl) {
      return NextResponse.json({ error: opdateringFejl.message }, { status: 500 });
    }

    // Notifikation/email er best-effort EFTER lifecycle er korrekt gemt —
    // en fejl her må ikke rulle den allerede gennemførte genåbning tilbage.
    try {
      if (kt.haandvaerker_email) {
        const escapedEmail = kt.haandvaerker_email.trim().toLowerCase().replace(/[%_\\]/g, (m: string) => `\\${m}`);
        const { data: profiler } = await db.from("profiler").select("id").ilike("email", escapedEmail);
        const SEKTIONS_LABELS: Record<string, string> = {
          review_total_pris: "Pris",
          review_tidsplan: "Tidsplan",
          review_betalingsplan: "Betalingsplan",
          review_forudsaetninger: "Forudsætninger",
        };
        const sektionsListe = Array.from(typer).map((t) => SEKTIONS_LABELS[t] ?? t).join(", ");
        if (profiler && profiler.length === 1 && kt.projekt_id) {
          await db.from("notifikationer").insert({
            bruger_id: profiler[0].id,
            projekt_id: kt.projekt_id,
            type: "bygherre_oensker_sektionsaendring",
            titel: "Bygherre ønsker ændringer til aftalegrundlaget",
            besked: `Bygherre har foreslået ændringer til: ${sektionsListe}.`,
            laest: false,
          });
        }
        const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
        sendNotifikation("bygherre_oensker_sektionsaendring", kt.haandvaerker_email, {
          projekttitel: kt.titel || "projektet",
          link: `${baseUrl}/kontrakt/${kt.haandvaerker_token}`,
          ekstraInfo: sektionsListe,
        });
      }
    } catch (e) {
      console.error("[send-review-aendringer] Notifikation fejlede:", e);
    }

    return NextResponse.json(opdateretKontrakt);
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
