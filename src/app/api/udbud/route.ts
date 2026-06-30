import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Du er en erfaren byggesagkyndig der hjælper private bygherrer med at beskrive deres projekt professionelt til håndværkere.

Baseret på bygherrens svar skal du skrive et professionelt udbudsdokument på dansk.

Returner KUN et JSON-objekt (ingen markdown uden for JSON):
{
  "titel": "Kort projekttitel fx 'Badeværelsesrenovering, Elmevej 12'",
  "resumé": "2-3 sætninger der opsummerer projektet klart",
  "dokument": "Det fulde udbudsdokument som ren tekst med linjeskift. Inkludér: projektbeskrivelse, ønsker og krav, tidsramme, praktiske forhold, hvad tilbuddet skal indeholde og kontaktoplysninger-placeholder."
}

Regler:
- Skriv professionelt men forståeligt - ikke juridisk jargon
- Udbudsdokumentet skal være struktureret med klare afsnit
- Inkludér altid et afsnit om at AB-Forbruger 2012 ønskes som grundlag
- Inkludér altid hvad tilbuddet skal indeholde (fast pris, tidsplan, betalingsplan)
- Kontaktoplysninger leveres separat og indsættes IKKE i dokumentet af dig - skriv i stedet ___KONTAKT___ præcis der hvor de naturligt skal stå
- Skriv altid på dansk`;

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const body = await req.json();
    const { projekttype, beskrivelse, adresse, navn, kontakt, opstart, slutdato, krav, beboet } = body;

    if (!beskrivelse || beskrivelse.trim().length < 20) {
      return NextResponse.json({ error: "Beskriv projektet mere detaljeret" }, { status: 400 });
    }

    const prompt = `Bygherre ønsker hjælp til at sende projekt i udbud til håndværkere.

Projekttype: ${projekttype || "Renovering"}
Adresse: ${adresse || "Ikke oplyst"}
Projektbeskrivelse: ${beskrivelse}
Ønsket opstart: ${opstart || "Fleksibel"}
Senest færdig: ${slutdato || "Ikke fastsat"}
Særlige krav/ønsker: ${krav || "Ingen særlige krav"}
Beboet under arbejdet: ${beboet === "ja" ? "Ja - hensyn til beboere skal tages" : beboet === "nej" ? "Nej - tom bolig" : "Ikke oplyst"}

Skriv et professionelt udbudsdokument bygherren kan sende til håndværkere for at indhente tilbud.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Kunne ikke generere dokument" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Replace ___KONTAKT___ with real bygherre info
    const kontaktBlok = [
      navn ? `Navn: ${navn}` : null,
      kontakt ? `Kontakt: ${kontakt}` : null,
    ].filter(Boolean).join("\n");

    if (parsed.dokument && kontaktBlok) {
      parsed.dokument = parsed.dokument.replace(/___KONTAKT___/g, kontaktBlok);
    }

    // Pass bygherre info separately so the share page can lock it
    parsed.bygherreNavn = navn || "";
    parsed.bygherreKontakt = kontakt || "";

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
