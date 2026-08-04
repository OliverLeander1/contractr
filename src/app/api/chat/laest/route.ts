import { NextRequest, NextResponse } from "next/server";
import { resolveAccess, isUUID } from "@/lib/chatAuthorization";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fejl: "Ugyldig JSON" }, { status: 400 });
  }

  const b = body !== null && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const kontraktId = typeof b.kontrakt_id === "string" ? b.kontrakt_id : "";
  const senestVisteBeskedId =
    typeof b.senest_viste_besked_id === "string" ? b.senest_viste_besked_id : "";

  if (!isUUID(kontraktId) || !isUUID(senestVisteBeskedId)) {
    return NextResponse.json(
      { fejl: "kontrakt_id eller senest_viste_besked_id mangler eller er ugyldig" },
      { status: 400 }
    );
  }

  const accessResult = await resolveAccess(req, kontraktId);
  if ("error" in accessResult) return accessResult.error;
  const { ctx } = accessResult;

  const supabase = createServiceClient();

  const { data: samtale } = await supabase
    .from("chat_samtaler")
    .select("id")
    .eq("kontrakt_id", ctx.kontraktId)
    .maybeSingle();

  if (!samtale) {
    return NextResponse.json({ fejl: "Samtale ikke fundet" }, { status: 404 });
  }

  // Beskeden skal både eksistere og tilhøre den fundne, autoriserede samtale.
  const { data: besked } = await supabase
    .from("chat_beskeder")
    .select("id, sendt_at")
    .eq("id", senestVisteBeskedId)
    .eq("samtale_id", samtale.id)
    .maybeSingle();

  if (!besked) {
    return NextResponse.json(
      { fejl: "Beskeden findes ikke i den autoriserede samtale" },
      { status: 422 }
    );
  }

  // Monoton opdatering uden ny SQL-funktion:
  // 1) forsøg INSERT (første markering for denne bruger/samtale)
  // 2) ved unique conflict (23505): betinget UPDATE der kun rykker markøren
  //    frem hvis (sendt_at, id) for den nye besked er senere end den
  //    aktuelt lagrede række — evalueret atomisk af Postgres i WHERE-klausulen
  //    på selve UPDATE'et, ikke ud fra en tidligere SELECT.
  const { error: insertError } = await supabase.from("chat_laesestatus").insert({
    samtale_id: samtale.id,
    bruger_id: ctx.userId,
    senest_laeste_besked_id: besked.id,
    sidst_laest_at: besked.sendt_at,
  });

  if (!insertError) {
    return NextResponse.json({ ok: true });
  }

  if (insertError.code !== "23505") {
    console.error("[chat] Kunne ikke oprette læsestatus", {
      code: insertError.code,
      message: insertError.message,
    });
    return NextResponse.json({ fejl: "Kunne ikke gemme læsestatus" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("chat_laesestatus")
    .update({
      senest_laeste_besked_id: besked.id,
      sidst_laest_at: besked.sendt_at,
      opdateret_at: new Date().toISOString(),
    })
    .eq("samtale_id", samtale.id)
    .eq("bruger_id", ctx.userId)
    .or(
      `sidst_laest_at.lt.${besked.sendt_at},and(sidst_laest_at.eq.${besked.sendt_at},senest_laeste_besked_id.lt.${besked.id})`
    );

  if (updateError) {
    console.error("[chat] Kunne ikke opdatere læsestatus", {
      code: updateError.code,
      message: updateError.message,
    });
    return NextResponse.json({ fejl: "Kunne ikke gemme læsestatus" }, { status: 500 });
  }

  // Guarden matcher ikke, hvis en nyere eller identisk markør allerede er gemt —
  // det er ikke en fejl, markøren skal bare ikke flyttes.
  return NextResponse.json({ ok: true });
}
