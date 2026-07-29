import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const db = createServiceClient();
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Ugyldig session" }, { status: 401 });

  const { kontrakt_id, besked, ny_frist } = await req.json();
  if (!kontrakt_id || !besked?.trim()) {
    return NextResponse.json({ error: "kontrakt_id og besked er påkrævet" }, { status: 400 });
  }

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("haandvaerker_email, haandvaerker_navn, haandvaerker_firma, titel, projekt_id, haandvaerker_token, slutdato")
    .eq("id", kontrakt_id)
    .single();

  if (!kontrakt) return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  if (!kontrakt.haandvaerker_email) return NextResponse.json({ error: "Ingen e-mail på entreprenøren" }, { status: 422 });

  // Gem påkrav i logbog som dokumentation
  const { data: profil } = await db.from("profiler").select("navn").eq("id", user.id).single();
  const bygherreNavn = profil?.navn || user.email?.split("@")[0] || "Bygherre";

  await db.from("logbog").insert({
    projekt_id: kontrakt.projekt_id,
    forfatter_id: user.id,
    forfatter_navn: bygherreNavn,
    tekst: `PÅKRAV SENDT\n\n${besked}${ny_frist ? `\n\nNy frist sat til: ${ny_frist}` : ""}`,
  });

  // Send e-mail til entreprenøren
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const resend = new Resend(apiKey);
  const projekttitel = kontrakt.titel || "byggeprojektet";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://nembyggestyring.dk";
  const link = `${baseUrl}/kontrakt/${kontrakt.haandvaerker_token}`;

  const datoFormateret = kontrakt.slutdato
    ? new Date(kontrakt.slutdato).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const nyFristFormateret = ny_frist
    ? new Date(ny_frist).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const { error } = await resend.emails.send({
    from: "NemByggestyring <noreply@nembyggestyring.dk>",
    to: [kontrakt.haandvaerker_email],
    subject: `Påkrav vedr. forsinkelse — ${projekttitel}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="margin-bottom: 28px;">
          <span style="font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1e3a2a;">nembyggestyring</span>
        </div>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1px;">Påkrav — officielt dokument</p>
        </div>

        <p style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${projekttitel}</p>

        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 16px; line-height: 1.3; color: #111827;">
          Påkrav om overholdelse af aftalt afleveringsdato
        </h1>

        <div style="background: #f8f8f6; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; border-left: 3px solid #dc2626;">
          <p style="margin: 0; font-size: 15px; color: #1a1a1a; line-height: 1.8; white-space: pre-wrap;">${besked.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>

        ${datoFormateret ? `
        <div style="background: #f8f8f6; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Aftalt afleveringsdato (overskredet)</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #dc2626;">${datoFormateret}</p>
        </div>
        ` : ""}

        ${nyFristFormateret ? `
        <div style="background: #f0f7f3; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 1px;">Ny frist</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #166534;">${nyFristFormateret}</p>
        </div>
        ` : ""}

        <a href="${link}" style="display: inline-block; background: #1e3a2a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 28px;">
          Åbn aftalegrundlag →
        </a>

        <p style="font-size: 13px; color: #6b7280; line-height: 1.7;">
          Dette påkrav er sendt via nembyggestyring.dk og registreret med tidsstempel som dokumentation i henhold til AB-Forbruger 2012.
        </p>

        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;">
        <p style="font-size: 12px; color: #d1d5db; margin: 0;">nembyggestyring.dk</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend fejl (påkrav):", error);
    return NextResponse.json({ error: "Kunne ikke sende e-mail" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
