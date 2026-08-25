import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { verificerKontraktRolle } from "@/lib/kontraktRolle";
import { erGyldigMaterialeAfregning, erForslagKomplet } from "@/lib/ekstraarbejdeCompleteness";
import {
  AFTALESEDLER_BUCKET, AFTALESEDLER_MIME_TYPE, AFTALESEDLER_MAX_BYTES,
  verificerBilledSti, udledUploadMappe,
} from "@/lib/ekstraarbejdeStorage";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";
import { opretEkstraarbejdeNotifikation } from "@/lib/ekstraarbejdeNotifikation";

export const runtime = "nodejs";

interface BilledeReference {
  storage_path: string;
  billedtekst?: string | null;
}

// Verificerer at hver indsendte billedreference: (1) matcher det
// servergenererede sti-mønster for DEN verificerede kontrakt/bruger, og
// (2) faktisk findes i Storage med korrekt MIME-type og størrelse —
// aldrig blot klientens egen påstand. Returnerer et array klar til
// insert i ekstraarbejde_billeder, eller en fejlbesked.
async function verificerBilleder(
  db: ReturnType<typeof createServiceClient>,
  referencer: BilledeReference[],
  kontraktId: string,
  userId: string
): Promise<{ rows: { storage_path: string; billedtekst: string | null; mime_type: string; filstoerrelse_bytes: number }[] } | { fejl: string }> {
  for (const ref of referencer) {
    if (typeof ref.storage_path !== "string" || !verificerBilledSti(ref.storage_path, kontraktId, userId)) {
      return { fejl: "Et eller flere billeder har en ugyldig reference." };
    }
  }

  const mapper = Array.from(new Set(referencer.map((r) => udledUploadMappe(r.storage_path))));
  const metadata = new Map<string, { mimetype?: string; size?: number }>();

  for (const mappe of mapper) {
    const { data: objekter, error } = await db.storage.from(AFTALESEDLER_BUCKET).list(mappe);
    if (error) {
      return { fejl: "Kunne ikke verificere uploadede billeder." };
    }
    for (const obj of objekter ?? []) {
      metadata.set(`${mappe}/${obj.name}`, {
        mimetype: (obj.metadata as { mimetype?: string } | null)?.mimetype,
        size: (obj.metadata as { size?: number } | null)?.size,
      });
    }
  }

  const rows: { storage_path: string; billedtekst: string | null; mime_type: string; filstoerrelse_bytes: number }[] = [];
  for (const ref of referencer) {
    const meta = metadata.get(ref.storage_path);
    if (
      !meta ||
      meta.mimetype !== AFTALESEDLER_MIME_TYPE ||
      typeof meta.size !== "number" ||
      meta.size <= 0 ||
      meta.size > AFTALESEDLER_MAX_BYTES
    ) {
      return { fejl: "Et eller flere billeder kunne ikke bekræftes i Storage." };
    }
    rows.push({
      storage_path: ref.storage_path,
      billedtekst: typeof ref.billedtekst === "string" ? (ref.billedtekst.trim().slice(0, 200) || null) : null,
      mime_type: meta.mimetype,
      filstoerrelse_bytes: meta.size,
    });
  }

  return { rows };
}

// POST /api/ekstraarbejde — opret en aftaleseddel på en konkret kontrakt.
// Begge parter kan initiere:
//   - Bygherre opretter med kun beskrivelse (+ evt. billeder) → altid afventer_entreprenoer
//   - Entreprenør kan registrere forholdet straks, uden at kende pris/tid
//     endnu — prisfelterne er valgfrie ved oprettelse. Status afgøres af
//     den fælles completeness-regel.
// Billeder sendes IKKE som base64 — kun som referencer til allerede
// uploadede Storage-objekter (se POST /api/ekstraarbejde/upload-urls),
// som denne route selv verificerer, før noget gemmes i databasen.
// Serveren udleder identitet, rolle og status alene — intet af dette
// accepteres fra klienten.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    kontrakt_id, beskrivelse, billeder,
    haandvaerker_pris_type, haandvaerker_pris, haandvaerker_timepris,
    materiale_afregning, materiale_tillaeg_procent, haandvaerker_prisoverslag,
    haandvaerker_tidsdage, haandvaerker_besked,
  } = body;

  if (!kontrakt_id || typeof beskrivelse !== "string" || !beskrivelse.trim()) {
    return NextResponse.json({ error: "kontrakt_id og beskrivelse er påkrævet" }, { status: 400 });
  }

  const billedeReferencer: BilledeReference[] = Array.isArray(billeder) ? billeder : [];

  const db = createServiceClient();

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, projekt_id, bygherre_id, haandvaerker_email, haandvaerker_navn, haandvaerker_token, titel")
    .eq("id", kontrakt_id)
    .maybeSingle();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const partResultat = await verificerKontraktRolle(req, db, kontrakt);
  if ("fejl" in partResultat) return partResultat.fejl;
  const { rolle, userId } = partResultat;

  let billedeRows: { storage_path: string; billedtekst: string | null; mime_type: string; filstoerrelse_bytes: number }[] = [];
  if (billedeReferencer.length > 0) {
    const verificeret = await verificerBilleder(db, billedeReferencer, kontrakt.id, userId);
    if ("fejl" in verificeret) {
      return NextResponse.json({ error: verificeret.fejl }, { status: 400 });
    }
    billedeRows = verificeret.rows;
  }

  const { data: profil } = await db.from("profiler").select("navn").eq("id", userId).maybeSingle();

  const opdatering: Record<string, unknown> = {
    projekt_id: kontrakt.projekt_id,
    kontrakt_id: kontrakt.id,
    oprettet_af: userId,
    oprettet_af_navn: profil?.navn || null,
    beskrivelse: beskrivelse.trim(),
  };

  if (rolle === "bygherre") {
    opdatering.status = "afventer_entreprenoer";
  } else {
    // Entreprenøren kan registrere forholdet straks, uden pris/tid endnu.
    // Alle prisfelter er derfor valgfrie her — kun det, der faktisk gives,
    // valideres og gemmes.
    if (haandvaerker_pris_type !== undefined && haandvaerker_pris_type !== null) {
      if (haandvaerker_pris_type !== "fast" && haandvaerker_pris_type !== "medgaaet_tid") {
        return NextResponse.json({ error: "haandvaerker_pris_type skal være 'fast' eller 'medgaaet_tid'" }, { status: 400 });
      }
      opdatering.haandvaerker_pris_type = haandvaerker_pris_type;

      if (haandvaerker_pris_type === "fast") {
        if (haandvaerker_pris !== undefined && haandvaerker_pris !== null && haandvaerker_pris !== "") {
          const pris = Number(haandvaerker_pris);
          if (!Number.isFinite(pris) || pris < 0) {
            return NextResponse.json({ error: "haandvaerker_pris skal være 0 eller positiv" }, { status: 400 });
          }
          opdatering.haandvaerker_pris = pris;
        }
      } else {
        if (haandvaerker_timepris !== undefined && haandvaerker_timepris !== null && haandvaerker_timepris !== "") {
          const timepris = Number(haandvaerker_timepris);
          if (!Number.isFinite(timepris) || timepris < 0) {
            return NextResponse.json({ error: "haandvaerker_timepris skal være 0 eller positiv" }, { status: 400 });
          }
          opdatering.haandvaerker_timepris = timepris;
        }
        if (materiale_afregning !== undefined && materiale_afregning !== null) {
          if (!erGyldigMaterialeAfregning(materiale_afregning)) {
            return NextResponse.json({ error: "materiale_afregning har en ugyldig værdi" }, { status: 400 });
          }
          opdatering.materiale_afregning = materiale_afregning;
          if (materiale_afregning === "dokumenteret_pris_med_tillaeg") {
            const tillaeg = Number(materiale_tillaeg_procent);
            if (!Number.isFinite(tillaeg) || tillaeg < 0) {
              return NextResponse.json({ error: "materiale_tillaeg_procent skal være 0 eller positiv, når materialer faktureres med tillæg" }, { status: 400 });
            }
            opdatering.materiale_tillaeg_procent = tillaeg;
          }
        }
        if (haandvaerker_prisoverslag !== undefined && haandvaerker_prisoverslag !== null && haandvaerker_prisoverslag !== "") {
          const overslag = Number(haandvaerker_prisoverslag);
          if (!Number.isFinite(overslag) || overslag < 0) {
            return NextResponse.json({ error: "haandvaerker_prisoverslag skal være 0 eller positiv" }, { status: 400 });
          }
          opdatering.haandvaerker_prisoverslag = overslag;
        }
      }
    }

    if (haandvaerker_tidsdage !== undefined && haandvaerker_tidsdage !== null && haandvaerker_tidsdage !== "") {
      const tidsdage = Number(haandvaerker_tidsdage);
      if (!Number.isFinite(tidsdage) || tidsdage < 0) {
        return NextResponse.json({ error: "haandvaerker_tidsdage skal være 0 eller positiv" }, { status: 400 });
      }
      opdatering.haandvaerker_tidsdage = tidsdage;
    }

    if (typeof haandvaerker_besked === "string" && haandvaerker_besked.trim()) {
      opdatering.haandvaerker_besked = haandvaerker_besked.trim();
    }

    opdatering.haandvaerker_navn = profil?.navn || null;
    opdatering.haandvaerker_udfyldt_at = new Date().toISOString();

    opdatering.status = erForslagKomplet({
      haandvaerker_pris_type: (opdatering.haandvaerker_pris_type as string | undefined) ?? null,
      haandvaerker_pris: (opdatering.haandvaerker_pris as number | undefined) ?? null,
      haandvaerker_timepris: (opdatering.haandvaerker_timepris as number | undefined) ?? null,
      haandvaerker_tidsdage: (opdatering.haandvaerker_tidsdage as number | undefined) ?? null,
      materiale_afregning: (opdatering.materiale_afregning as string | undefined) ?? null,
      materiale_tillaeg_procent: (opdatering.materiale_tillaeg_procent as number | undefined) ?? null,
    })
      ? "afventer_bygherre"
      : "afventer_entreprenoer";
  }

  // Genvalidering umiddelbart før den atomiske skrivning: ingen af de
  // indsendte storage_paths må allerede være bundet til en anden
  // (tidligere oprettet) aftaleseddel. Tabellens egen UNIQUE-constraint på
  // storage_path er det endelige, database-håndhævede sikkerhedsnet — dette
  // forudgående tjek giver blot en klar 409 i stedet for en rå constraint-fejl.
  if (billedeRows.length > 0) {
    const { data: bestaaende, error: bestaaendeFejl } = await db
      .from("ekstraarbejde_billeder")
      .select("storage_path")
      .in("storage_path", billedeRows.map((r) => r.storage_path));

    if (bestaaendeFejl) {
      return NextResponse.json({ error: "Kunne ikke verificere uploadede billeder." }, { status: 500 });
    }
    if (bestaaende && bestaaende.length > 0) {
      return NextResponse.json({ error: "Et eller flere billeder er allerede knyttet til en anden aftaleseddel." }, { status: 409 });
    }
  }

  // Atomisk oprettelse: aftaleseddel og billedmetadata indsættes i én
  // databasetransaktion via RPC'en opret_ekstraarbejde_med_billeder
  // (se supabase-migration-ekstraarbejde-kontrakt-id.sql). Fejler
  // billedindsættelsen, ruller Postgres automatisk hele kaldet tilbage —
  // der kan aldrig opstå en aftaleseddel uden dens tilhørende billeder.
  const { data, error } = await db.rpc("opret_ekstraarbejde_med_billeder", {
    p_projekt_id: opdatering.projekt_id,
    p_kontrakt_id: opdatering.kontrakt_id,
    p_oprettet_af: opdatering.oprettet_af,
    p_oprettet_af_navn: opdatering.oprettet_af_navn,
    p_beskrivelse: opdatering.beskrivelse,
    p_status: opdatering.status,
    p_haandvaerker_pris_type: opdatering.haandvaerker_pris_type ?? null,
    p_haandvaerker_pris: opdatering.haandvaerker_pris ?? null,
    p_haandvaerker_timepris: opdatering.haandvaerker_timepris ?? null,
    p_materiale_afregning: opdatering.materiale_afregning ?? null,
    p_materiale_tillaeg_procent: opdatering.materiale_tillaeg_procent ?? null,
    p_haandvaerker_prisoverslag: opdatering.haandvaerker_prisoverslag ?? null,
    p_haandvaerker_tidsdage: opdatering.haandvaerker_tidsdage ?? null,
    p_haandvaerker_besked: opdatering.haandvaerker_besked ?? null,
    p_haandvaerker_navn: opdatering.haandvaerker_navn ?? null,
    p_haandvaerker_udfyldt_at: opdatering.haandvaerker_udfyldt_at ?? null,
    p_billeder: billedeRows.length > 0
      ? billedeRows.map((r) => ({
          storage_path: r.storage_path,
          billedtekst: r.billedtekst,
          mime_type: r.mime_type,
          filstoerrelse_bytes: r.filstoerrelse_bytes,
        }))
      : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notifikationer til modparten sker først efter succesfuld, atomisk write
  // af både aftaleseddel og billedmetadata (data.id findes nu). En fejlet
  // notifikation (email eller in-app) må ikke rulle brugerflowet tilbage —
  // aftalesedlen og dens billeder består uanset notifikationsudfaldet.
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
    const afsenderNavn = profil?.navn || (rolle === "bygherre" ? "Bygherren" : (kontrakt.haandvaerker_navn || "Entreprenøren"));
    const beskrivelseUddrag = beskrivelse.trim().slice(0, 80);

    if (rolle === "bygherre" && kontrakt.haandvaerker_email) {
      sendNotifikation("ekstraarbejde_oprettet", kontrakt.haandvaerker_email, {
        projekttitel: kontrakt.titel || "projektet",
        afsenderNavn,
        link: `${baseUrl}/kontrakt/${kontrakt.haandvaerker_token}`,
      });
      await opretEkstraarbejdeNotifikation(db, {
        modtagerRolle: "haandvaerker",
        kontrakt,
        projektId: kontrakt.projekt_id,
        titel: "Ny aftaleseddel til udfyldelse",
        besked: `${afsenderNavn} har sendt en anmodning om ekstraarbejde: "${beskrivelseUddrag}"`,
      });
    } else if (rolle === "haandvaerker" && kontrakt.bygherre_id) {
      const { email, notifikationer } = await hentBygherreEmail(kontrakt.bygherre_id, db);
      if (email) {
        sendNotifikation("ekstraarbejde_oprettet", email, {
          projekttitel: kontrakt.titel || "dit projekt",
          afsenderNavn,
          link: `${baseUrl}/projekt/${kontrakt.projekt_id}/ekstraarbejde`,
        }, notifikationer);
      }
      await opretEkstraarbejdeNotifikation(db, {
        modtagerRolle: "bygherre",
        kontrakt,
        projektId: kontrakt.projekt_id,
        titel: "Ny aftaleseddel oprettet",
        besked: `${afsenderNavn} har oprettet en aftaleseddel om ekstraarbejde: "${beskrivelseUddrag}"`,
      });
    }
  } catch (notifikationsFejl) {
    console.error("Notifikation ved oprettelse af aftaleseddel fejlede:", notifikationsFejl);
  }

  return NextResponse.json(data);
}
