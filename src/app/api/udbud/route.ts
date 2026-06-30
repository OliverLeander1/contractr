import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Du er en erfaren byggesagkyndig der hjælper private bygherrer med at beskrive deres projekt professionelt til håndværkere.

Baseret på bygherrens svar skal du skrive et professionelt udbudsdokument på dansk OG en tilbudsliste med forventede opgaveposter.

Returner KUN et JSON-objekt (ingen markdown uden for JSON):
{
  "titel": "Kort projekttitel fx 'Badeværelsesrenovering, Elmevej 12'",
  "resumé": "2-3 sætninger der opsummerer projektet klart",
  "dokument": "Det fulde udbudsdokument som ren tekst med linjeskift. Inkludér: projektbeskrivelse, ønsker og krav, tidsramme, praktiske forhold og AB-Forbruger 2012 som grundlag. IKKE kontaktoplysninger.",
  "tilbudsposter": [
    { "id": "1", "beskrivelse": "Konkret opgavebeskrivelse fx 'Nedtagning og bortskaffelse af eksisterende toilet'", "enhed": "stk" },
    { "id": "2", "beskrivelse": "Næste post", "enhed": "stk" }
  ]
}

Regler for dokumentet:
- Skriv professionelt men forståeligt - ikke juridisk jargon
- Struktureret med klare afsnit
- Inkludér altid AB-Forbruger 2012 som kontraktgrundlag
- Skriv IKKE bygherrens kontaktoplysninger ind i dokumentet
- Skriv altid på dansk

Regler for tilbudsposter:
- Lav 4-10 konkrete og realistiske opgaveposter baseret på projektbeskrivelsen
- Beskriv hver post præcist og fagligt, så entreprenøren ved hvad der menes
- Enhed er typisk "stk", "m²", "m", "time" eller "samlet"
- Inkludér altid en post til "Afrydning og borskaffelse af byggeaffald"
- Den sidste post skal altid være "Uforudsete arbejder" med enhed "samlet"`;

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

Skriv udbudsdokument og tilbudsliste.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Kunne ikke generere dokument" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Kunne ikke parse svar fra AI - prøv igen" }, { status: 500 });
    }

    parsed.bygherreNavn = navn || "";
    parsed.bygherreKontakt = kontakt || "";
    if (!parsed.tilbudsposter) parsed.tilbudsposter = [];

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
