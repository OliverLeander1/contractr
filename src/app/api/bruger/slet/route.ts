import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const db = createServiceClient();

  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });
  }

  const userEmail = user.email ?? "";

  // Hent rolle fra profil
  const { data: profil } = await db.from("profiler").select("rolle").eq("id", user.id).single();
  const rolle = profil?.rolle ?? user.user_metadata?.brugerType ?? "bygherre";

  if (rolle === "haandvaerker") {
    // Find alle kontrakter tilknyttet denne entreprenør via email
    const { data: kontrakter } = await db
      .from("kontrakter")
      .select("id, projekt_id, titel, bygherre_id, status")
      .eq("haandvaerker_email", userEmail);

    if (kontrakter && kontrakter.length > 0) {
      for (const k of kontrakter) {
        // Sæt kontrakten som annulleret og anonymiser entreprenørens data
        await db.from("kontrakter").update({
          status: "annulleret",
          haandvaerker_navn: null,
          haandvaerker_firma: null,
          haandvaerker_email: null,
          haandvaerker_token: null,
          opdateret_at: new Date().toISOString(),
        }).eq("id", k.id);

        // Notificer bygherre hvis kontrakten var aktiv
        if (k.status !== "annulleret" && k.bygherre_id) {
          const { email: bygherreEmail, notifikationer } = await hentBygherreEmail(k.bygherre_id, db);
          if (bygherreEmail) {
            await sendNotifikation(
              "haandvaerker_trukket_sig",
              bygherreEmail,
              {
                projekttitel: k.titel ?? "dit projekt",
                link: `${process.env.NEXT_PUBLIC_URL}/projekt/${k.projekt_id}/aftale`,
                ekstraInfo: "Entreprenøren har slettet sin konto og er ikke længere tilknyttet dette projekt. Du kan sende projektet i udbud igen eller kontakte en ny entreprenør.",
              },
              notifikationer,
            );
          }
        }
      }
    }

    // Slet profil
    await db.from("profiler").delete().eq("id", user.id);

  } else {
    // Bygherre: slet alle projekter og tilhørende data
    const { data: projekter } = await db
      .from("projekter")
      .select("id")
      .eq("bygherre_id", user.id);

    if (projekter && projekter.length > 0) {
      const ids = projekter.map(p => p.id);
      await db.from("ekstraarbejde").delete().in("projekt_id", ids);
      await db.from("mangler").delete().in("projekt_id", ids);
      await db.from("kontrakter").delete().in("projekt_id", ids);
      await db.from("chat_beskeder").delete().in("projekt_id", ids);
      await db.from("projekter").delete().in("id", ids);
    }

    await db.from("profiler").delete().eq("id", user.id);
  }

  // Slet auth-bruger
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Kunne ikke slette konto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
