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
    subject: `En kunde har valgt dig til et nyt byggeprojekt`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="margin-bottom: 28px;">
          <span style="font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1e3a2a;">nembyggestyring</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; line-height: 1.3;">En bygherre inviterer dig til at gennemse et aftalegrundlag</h1>
        <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.6;">
          Hej ${modtagerNavn},<br><br>
          En bygherre har oprettet et aftalegrundlag for <strong>${titel}</strong> og ønsker at gennemgå det sammen med dig inden arbejdet går i gang.<br><br>
          Du kan åbne og gennemse aftalegrundlaget uden konto. Hvis du vil sende tilbud, foreslå ændringer eller godkende aftalegrundlaget, logger du ind med din e-mail. Det sikrer, at svar og godkendelser bliver dokumenteret korrekt.
        </p>

        <a href="${link}" style="display: inline-block; background: #1e3a2a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 32px;">
          Åbn aftalegrundlag →
        </a>

        <div style="background: #f8f8f6; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
          <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px 0;">Som håndværker får du med det her projekt:</p>
          <ul style="margin: 0; padding-left: 18px; color: #4b5563; font-size: 13px; line-height: 2;">
            <li>Et klart aftalegrundlag uden misforståelser</li>
            <li>Ét samlet sted til dokumenter, billeder og kommunikation</li>
            <li>En fælles tidsplan som både du og kunden kan følge</li>
            <li>Digital registrering af ændringsarbejder og ekstraarbejde</li>
            <li>Dokumentation for aftaler og godkendelser</li>
            <li>Mulighed for hurtigere betaling når arbejdet er godkendt</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
          Linket er personligt og gælder for dette projekt. Har du spørgsmål, er du velkommen til at svare direkte til din kunde.
        </p>

        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;">
        <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">Nembyggestyring skaber rammerne for det gode projekt</p>
        <p style="font-size: 12px; color: #d1d5db;">nembyggestyring.dk</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend fejl:", error);
    return NextResponse.json({ error: "Kunne ikke sende e-mail" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
