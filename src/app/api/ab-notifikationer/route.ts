import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Kørende AB-Forbruger notifikationsmotor
// Tjek om projekter har manglende eller forfaldne AB-forpligtelser og indsæt notifikationer

type ServiceClient = ReturnType<typeof createServiceClient>;

interface Projekt {
  id: string;
  bruger_id: string;
  titel: string;
  budget: number | null;
  status: string;
  startdato: string | null;
  slutdato: string | null;
  oprettet_at: string;
  levering_dato: string | null;
}

async function harNyligNotifikation(
  supabase: ServiceClient,
  bruger_id: string,
  projekt_id: string,
  type: string,
  dage: number
): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - dage);
  const { data } = await supabase
    .from("notifikationer")
    .select("id")
    .eq("bruger_id", bruger_id)
    .eq("projekt_id", projekt_id)
    .eq("type", "ab_forbruger")
    .ilike("titel", `%${type}%`)
    .gte("oprettet_at", cutoff.toISOString())
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function opretNotifikation(
  supabase: ServiceClient,
  bruger_id: string,
  projekt_id: string,
  titel: string,
  besked: string,
  ab_paragraf: string
) {
  await supabase.from("notifikationer").insert({
    bruger_id,
    projekt_id,
    type: "ab_forbruger",
    titel,
    besked,
    ab_paragraf,
    laest: false,
  });
}

export async function POST(req: NextRequest) {
  // Autentificér med service role — kun kaldt fra cron eller intern API
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: projekter } = await supabase
    .from("projekter")
    .select("id, bruger_id, titel, budget, status, startdato, slutdato, oprettet_at, levering_dato")
    .in("status", ["aktiv", "igang", "afventer"]);

  if (!projekter || projekter.length === 0) {
    return NextResponse.json({ besked: "Ingen aktive projekter", behandlet: 0 });
  }

  let notifikationsCount = 0;
  const nu = new Date();

  for (const projekt of projekter as Projekt[]) {
    const { id, bruger_id, titel, budget, startdato, slutdato, levering_dato } = projekt;

    // --- §12: Tidsplan ---
    // Hvis projektet er aktivt men ingen slutdato — påmind om at kræve tidsplan
    if (!slutdato && startdato) {
      const start = new Date(startdato);
      const dageEfterStart = Math.floor((nu.getTime() - start.getTime()) / 86400000);
      if (dageEfterStart >= 3 && !(await harNyligNotifikation(supabase, bruger_id, id, "§12", 14))) {
        await opretNotifikation(
          supabase, bruger_id, id,
          `${titel}: Tidsplan mangler`,
          "Ifølge AB-Forbruger § 12 bør start- og slutdato fremgå af aftalen. Vi anbefaler at du beder håndværkeren om en skriftlig tidsplan.",
          "§ 12"
        );
        notifikationsCount++;
      }
    }

    // --- §23: Ekstraarbejde ---
    // Tjek om der er ubehandlede ekstraarbejde-sedler (status sendt i mere end 3 dage)
    const { data: gamleEkstra } = await supabase
      .from("ekstraarbejde")
      .select("id, oprettet_at")
      .eq("projekt_id", id)
      .eq("status", "sendt");

    for (const ekstra of gamleEkstra || []) {
      const age = Math.floor((nu.getTime() - new Date(ekstra.oprettet_at).getTime()) / 86400000);
      if (age >= 3 && !(await harNyligNotifikation(supabase, bruger_id, id, "§23", 7))) {
        await opretNotifikation(
          supabase, bruger_id, id,
          `${titel}: Ekstraarbejde afventer svar`,
          "Du har en aftaleseddel om ekstraarbejde der stadig afventer håndværkerens udfyldelse. AB-Forbruger § 23 anbefaler skriftlig aftale inden opstart.",
          "§ 23"
        );
        notifikationsCount++;
        break;
      }
    }

    // --- §38: Afleveringsforretning ---
    // Hvis slutdato er passeret med mere end 0 dage og ingen levering er registreret
    if (slutdato && !levering_dato) {
      const slut = new Date(slutdato);
      const dageEfterSlut = Math.floor((nu.getTime() - slut.getTime()) / 86400000);
      if (dageEfterSlut >= 0 && !(await harNyligNotifikation(supabase, bruger_id, id, "§38", 7))) {
        await opretNotifikation(
          supabase, bruger_id, id,
          `${titel}: Afleveringsforretning bør gennemføres`,
          "Projektets slutdato er passeret. AB-Forbruger § 38 anbefaler en formel afleveringsforretning, hvor mangler registreres skriftligt inden du overtager arbejdet.",
          "§ 38"
        );
        notifikationsCount++;
      }
    }

    // --- §58: 1-års eftersyn ---
    // Trigger: levering_dato sat + budget-grænse
    if (levering_dato) {
      const levering = new Date(levering_dato);
      const dageEfterLevering = Math.floor((nu.getTime() - levering.getTime()) / 86400000);

      // Budget over 500.000 kr. = obligatorisk eftersyn
      if (budget && budget >= 500000) {
        // Påmind 30 dage FØR 1-årsfristen (dvs. dag 335)
        if (dageEfterLevering >= 335 && dageEfterLevering <= 365 &&
          !(await harNyligNotifikation(supabase, bruger_id, id, "§58", 14))) {
          await opretNotifikation(
            supabase, bruger_id, id,
            `${titel}: 1-års eftersyn nærmer sig (obligatorisk)`,
            `Dit projekt er over 500.000 kr. og 1-årseftersynet er obligatorisk ifølge AB-Forbruger § 58. Fristen udløber om ca. ${365 - dageEfterLevering} dage — book eftersynet nu.`,
            "§ 58"
          );
          notifikationsCount++;
        }
      } else {
        // Under 500.000 kr. = valgfrit, men bygherre skal informeres inden 1 år
        if (dageEfterLevering >= 300 && dageEfterLevering <= 365 &&
          !(await harNyligNotifikation(supabase, bruger_id, id, "§58", 30))) {
          await opretNotifikation(
            supabase, bruger_id, id,
            `${titel}: Mulighed for 1-års eftersyn`,
            `Dit projekt er under 500.000 kr., så 1-årseftersynet er valgfrit. Men du kan kræve det inden for ét år fra afleveringen (AB-Forbruger § 58). Fristen udløber om ca. ${365 - dageEfterLevering} dage.`,
            "§ 58"
          );
          notifikationsCount++;
        }
      }
    }
  }

  return NextResponse.json({
    besked: `AB-notifikationsmotor afsluttet`,
    behandlet: projekter.length,
    notifikationer_oprettet: notifikationsCount,
  });
}

// GET er tilgængeligt til test (ingen auth krævet i dev)
export async function GET() {
  return NextResponse.json({
    motor: "AB-Forbruger notifikationsmotor",
    paragraffer: ["§ 12 (tidsplan)", "§ 23 (ekstraarbejde)", "§ 38 (afleveringsforretning)", "§ 58 (1-års eftersyn)"],
    kald_med: "POST med Authorization: Bearer <CRON_SECRET>",
  });
}
