import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";
import { erGyldigMaterialeAfregning, erForslagKomplet } from "@/lib/ekstraarbejdeCompleteness";
import { opretEkstraarbejdeNotifikation } from "@/lib/ekstraarbejdeNotifikation";

export const runtime = "nodejs";

// PATCH /api/ekstraarbejde/[id]/svar — entreprenøren (fær­dig)gør et forslag.
// Eneste lovlige overgang: afventer_entreprenoer -> afventer_bygherre.
// Denne route bruges både til at besvare en bygherre-anmodning og til at
// færdiggøre entreprenørens egen, ufuldstændige registrering.
// Status går kun til afventer_bygherre, hvis forslaget rent faktisk er
// komplet efter den fælles regel — ellers forbliver sagen afventer_entreprenoer,
// så entreprenøren kan vende tilbage og færdiggøre det senere.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const {
    haandvaerker_pris_type, haandvaerker_pris, haandvaerker_timepris,
    materiale_afregning, materiale_tillaeg_procent, haandvaerker_prisoverslag,
    haandvaerker_tidsdage, haandvaerker_besked,
  } = body;

  if (haandvaerker_pris_type !== "fast" && haandvaerker_pris_type !== "medgaaet_tid") {
    return NextResponse.json({ error: "haandvaerker_pris_type skal være 'fast' eller 'medgaaet_tid'" }, { status: 400 });
  }

  const opdatering: Record<string, unknown> = {
    haandvaerker_pris_type,
    haandvaerker_pris: null,
    haandvaerker_timepris: null,
    materiale_afregning: null,
    materiale_tillaeg_procent: null,
    haandvaerker_prisoverslag: null,
  };

  if (haandvaerker_pris_type === "fast") {
    const pris = Number(haandvaerker_pris);
    if (!Number.isFinite(pris) || pris < 0) {
      return NextResponse.json({ error: "haandvaerker_pris skal være 0 eller positiv" }, { status: 400 });
    }
    opdatering.haandvaerker_pris = pris;
  } else {
    const timepris = Number(haandvaerker_timepris);
    if (!Number.isFinite(timepris) || timepris < 0) {
      return NextResponse.json({ error: "haandvaerker_timepris skal være 0 eller positiv" }, { status: 400 });
    }
    if (!erGyldigMaterialeAfregning(materiale_afregning)) {
      return NextResponse.json({ error: "materiale_afregning har en ugyldig værdi" }, { status: 400 });
    }
    opdatering.haandvaerker_timepris = timepris;
    opdatering.materiale_afregning = materiale_afregning;

    if (materiale_afregning === "dokumenteret_pris_med_tillaeg") {
      const tillaeg = Number(materiale_tillaeg_procent);
      if (!Number.isFinite(tillaeg) || tillaeg < 0) {
        return NextResponse.json({ error: "materiale_tillaeg_procent skal være 0 eller positiv, når materialer faktureres med tillæg" }, { status: 400 });
      }
      opdatering.materiale_tillaeg_procent = tillaeg;
    }

    if (haandvaerker_prisoverslag !== undefined && haandvaerker_prisoverslag !== null && haandvaerker_prisoverslag !== "") {
      const overslag = Number(haandvaerker_prisoverslag);
      if (!Number.isFinite(overslag) || overslag < 0) {
        return NextResponse.json({ error: "haandvaerker_prisoverslag skal være 0 eller positiv" }, { status: 400 });
      }
      opdatering.haandvaerker_prisoverslag = overslag;
    }
  }

  const tidsdage = Number(haandvaerker_tidsdage);
  if (!Number.isFinite(tidsdage) || tidsdage < 0) {
    return NextResponse.json({ error: "haandvaerker_tidsdage skal være 0 eller positiv" }, { status: 400 });
  }
  opdatering.haandvaerker_tidsdage = tidsdage;

  const db = createServiceClient();

  const { data: sedel } = await db
    .from("ekstraarbejde")
    .select("id, status, kontrakt_id, projekt_id")
    .eq("id", id)
    .maybeSingle();

  if (!sedel) {
    return NextResponse.json({ error: "Aftaleseddel ikke fundet" }, { status: 404 });
  }

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, bygherre_id, haandvaerker_email")
    .eq("id", sedel.kontrakt_id)
    .maybeSingle();

  if (!kontrakt) {
    return NextResponse.json({ error: "Aftalesedlens kontrakt findes ikke" }, { status: 404 });
  }

  const partResultat = await verificerKontraktRolle(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;
  if (partResultat.rolle !== "haandvaerker") {
    return NextResponse.json({ error: "Kun entreprenøren kan svare på aftalesedlen" }, { status: 403 });
  }

  if (sedel.status !== "afventer_entreprenoer") {
    return NextResponse.json({ error: "Aftalesedlen kan ikke længere besvares." }, { status: 409 });
  }

  const { data: profil } = await db.from("profiler").select("navn").eq("id", partResultat.userId).maybeSingle();
  opdatering.haandvaerker_navn = profil?.navn || null;
  opdatering.haandvaerker_udfyldt_at = new Date().toISOString();
  opdatering.haandvaerker_besked = typeof haandvaerker_besked === "string" ? (haandvaerker_besked.trim() || null) : null;

  opdatering.status = erForslagKomplet({
    haandvaerker_pris_type: opdatering.haandvaerker_pris_type as string,
    haandvaerker_pris: opdatering.haandvaerker_pris as number | null,
    haandvaerker_timepris: opdatering.haandvaerker_timepris as number | null,
    haandvaerker_tidsdage: opdatering.haandvaerker_tidsdage as number,
    materiale_afregning: opdatering.materiale_afregning as string | null,
    materiale_tillaeg_procent: opdatering.materiale_tillaeg_procent as number | null,
  })
    ? "afventer_bygherre"
    : "afventer_entreprenoer";

  const { data, error } = await db
    .from("ekstraarbejde")
    .update(opdatering)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notifikationer til bygherre sker kun når forslaget rent faktisk er klar
  // til beslutning, og kun én gang — guarden ovenfor (sedel.status !==
  // "afventer_entreprenoer" -> 409) forhindrer allerede, at en aftaleseddel,
  // der allerede er "afventer_bygherre", kan patches igen, så denne blok kan
  // aldrig nås to gange for samme overgang. En fejlet notifikation (email
  // eller in-app) må ikke rulle det allerede gemte svar tilbage — samme
  // etablerede princip som i POST /api/ekstraarbejde.
  if (opdatering.status === "afventer_bygherre" && kontrakt.bygherre_id && sedel.projekt_id) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
      const afsenderNavn = profil?.navn || "Entreprenøren";
      const { data: projekt } = await db.from("projekter").select("adresse").eq("id", sedel.projekt_id).maybeSingle();
      const { email, notifikationer } = await hentBygherreEmail(kontrakt.bygherre_id, db);
      if (email) {
        sendNotifikation("haandvaerker_ekstraarbejde_svar", email, {
          projekttitel: projekt?.adresse || "dit projekt",
          afsenderNavn,
          link: `${baseUrl}/projekt/${sedel.projekt_id}/ekstraarbejde`,
        }, notifikationer);
      }
      await opretEkstraarbejdeNotifikation(db, {
        modtagerRolle: "bygherre",
        kontrakt,
        projektId: sedel.projekt_id,
        type: "haandvaerker_ekstraarbejde_svar",
        titel: "Aftaleseddel klar til din godkendelse",
        besked: `${afsenderNavn} har angivet pris og tid for aftalesedlen. Gennemgå og tag stilling.`,
      });
    } catch (notifikationsFejl) {
      console.error("Notifikation ved svar på aftaleseddel fejlede:", notifikationsFejl);
    }
  }

  return NextResponse.json(data);
}
