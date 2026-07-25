import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

// POST /api/email — send invitation til håndværker
export async function POST(req: NextRequest) {
  const { to, link, firma, navn, projekttitel } = await req.json();

  if (!to || !link) {
    return NextResponse.json({ error: "to og link er påkrævet" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Returnér 200 uden at sende — nøgle mangler
    console.warn("RESEND_API_KEY ikke konfigureret — invitation sendes ikke");
    return NextResponse.json({ ok: true, skipped: true });
  }

  const resend = new Resend(apiKey);

  const modtagerNavn = navn || firma || "håndværker";
  const titel = projekttitel || "dit byggeprojekt";

  const { error } = await resend.emails.send({
    from: "NemByggestyring <noreply@nembyggestyring.dk>",
    to: [to],
    subject: `Du er inviteret til at gennemse et aftalegrundlag`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 18px; font-weight: 700; letter-spacing: 2px; color: #1e3a2a;">nembyggestyring</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Du er inviteret til at gennemse et aftalegrundlag</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Kære ${modtagerNavn},<br><br>
          En bygherre har oprettet et aftalegrundlag for <strong>${titel}</strong> og inviterer dig til at gennemse det.
          Du kan foreslå ændringer til vilkår, pris og tidsplan direkte i systemet — ingen konto kræves.
        </p>

        <a href="${link}" style="display: inline-block; background: #1e3a2a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 28px;">
          Åbn aftalegrundlag →
        </a>

        <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
          Linket er personligt og gælder for dette projekt. Du kan dele det med dine kolleger. Har du spørgsmål, svar direkte til bygherren.
        </p>

        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;">
        <p style="font-size: 12px; color: #d1d5db;">
          NemByggestyring · Digital tryghedsplatform for private bygherrer i Danmark
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend fejl:", error);
    return NextResponse.json({ error: "Kunne ikke sende e-mail" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
