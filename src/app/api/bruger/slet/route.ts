import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendNotifikation, hentBygherreEmail } from "@/lib/notifikationer";
import { Resend } from "resend";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://nembyggestyring.dk";

async function sendSletningsBekraeftelse(email: string, dage: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const slettesDato = new Date(Date.now() + dage * 24 * 60 * 60 * 1000)
    .toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  await resend.emails.send({
    from: "NemByggestyring <noreply@nembyggestyring.dk>",
    to: [email],
    subject: "Din konto er planlagt til sletning",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="margin-bottom: 28px;">
          <span style="font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1e3a2a;">nembyggestyring</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 16px; color: #111827;">Din konto slettes den ${slettesDato}</h1>
        <p style="color: #6b7280; margin-bottom: 28px; line-height: 1.7; font-size: 15px;">
          Vi har modtaget din anmodning om sletning. Alle dine projekter og data slettes automatisk den <strong>${slettesDato}</strong>.
          Hvis du fortryder, kan du logge ind og gendanne din konto inden da.
        </p>
        <a href="${BASE_URL}/konto/gendan" style="display: inline-block; background: #1e3a2a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 32px;">
          Fortryd sletning →
        </a>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;">
        <p style="font-size: 12px; color: #d1d5db; margin: 0;">Hvis du ikke selv har anmodet om dette, kontakt os på support@nembyggestyring.dk</p>
      </div>
    `,
  }).catch(() => {});
}

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
  const { data: profil } = await db.from("profiler").select("rolle").eq("id", user.id).single();
  const rolle = profil?.rolle ?? user.user_metadata?.brugerType ?? "bygherre";

  if (rolle === "haandvaerker") {
    // Håndværker: hard delete med det samme — kontrakter anonymiseres, bygherre notificeres
    const { data: kontrakter } = await db
      .from("kontrakter")
      .select("id, projekt_id, titel, bygherre_id, status")
      .eq("haandvaerker_email", userEmail);

    if (kontrakter && kontrakter.length > 0) {
      for (const k of kontrakter) {
        await db.from("kontrakter").update({
          status: "annulleret",
          haandvaerker_navn: null,
          haandvaerker_firma: null,
          haandvaerker_email: null,
          haandvaerker_token: null,
          opdateret_at: new Date().toISOString(),
        }).eq("id", k.id);

        if (k.status !== "annulleret" && k.bygherre_id) {
          const { email: bygherreEmail, notifikationer } = await hentBygherreEmail(k.bygherre_id, db);
          if (bygherreEmail) {
            await sendNotifikation("haandvaerker_trukket_sig", bygherreEmail, {
              projekttitel: k.titel ?? "dit projekt",
              link: `${BASE_URL}/projekt/${k.projekt_id}/aftale`,
              ekstraInfo: "Entreprenøren har slettet sin konto og er ikke længere tilknyttet dette projekt.",
            }, notifikationer);
          }
        }
      }
    }

    await db.from("profiler").delete().eq("id", user.id);
    await db.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: true, type: "hard" });

  } else {
    // Bygherre: soft delete — marker konto til sletning om 30 dage
    const slettesDato = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.from("profiler").update({
      slettet_planlagt_at: slettesDato,
    }).eq("id", user.id);

    // Notificer alle tilknyttede håndværkere på aktive kontrakter
    const { data: projekter } = await db
      .from("projekter")
      .select("id")
      .eq("bygherre_id", user.id);

    if (projekter && projekter.length > 0) {
      const ids = projekter.map(p => p.id);
      const { data: kontrakter } = await db
        .from("kontrakter")
        .select("id, titel, haandvaerker_email, status")
        .in("projekt_id", ids)
        .neq("status", "annulleret");

      for (const k of kontrakter ?? []) {
        if (k.haandvaerker_email) {
          await sendNotifikation("bygherre_slettet_konto", k.haandvaerker_email, {
            projekttitel: k.titel ?? "et projekt",
            link: `${BASE_URL}/haandvaerker/sager`,
            ekstraInfo: `Bygherren har anmodet om sletning af sin konto. Projektet og alle tilhørende data slettes automatisk den ${new Date(slettesDato).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}.`,
          }, true);
        }
      }
    }

    // Send bekræftelse til bygherre
    await sendSletningsBekraeftelse(userEmail, 30);

    return NextResponse.json({ ok: true, type: "soft", slettesDato });
  }
}

// Gendan konto — fortryd sletning inden karenstiden udløber
export async function POST(req: NextRequest) {
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

  await db.from("profiler").update({ slettet_planlagt_at: null }).eq("id", user.id);
  return NextResponse.json({ ok: true });
}
