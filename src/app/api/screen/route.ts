import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { tekst, projekttype } = await req.json();

  if (!tekst || tekst.trim().length < 30) {
    return NextResponse.json({ error: "For lidt tekst til at screene" }, { status: 400 });
  }

  const prompt = `Du er en dansk byggeretsekspert der hjælper private bygherrer med at forstå deres byggeaftaler.

Analyser følgende byggeaftale/tilbud og screen den mod AB-Forbruger 2012. Projekttype: ${projekttype || "renovation"}.

TILBUD/AFTALE:
${tekst}

Returner KUN et JSON-objekt i dette format (ingen markdown, ingen forklaring udenfor JSON):
{
  "samletRisiko": "lav" | "middel" | "høj",
  "resumé": "1-2 sætninger om det overordnede billede på almindeligt dansk",
  "punkter": [
    {
      "id": "unikt_id",
      "kategori": "AB-Forbruger" | "Betalingsplan" | "Tidsplan" | "Pris" | "Ekstraarbejde" | "Mangler" | "Tilladelser" | "Forsikring" | "Andet",
      "status": "ok" | "advarsel" | "fejl",
      "titel": "Kort overskrift",
      "forklaring": "Hvad vi fandt — på almindeligt dansk uden juridisk jargon",
      "anbefaling": "Hvad bygherren bør gøre — eller null hvis status er ok",
      "forslag": "Kopiérbar besked bygherren kan sende til håndværkeren — eller null hvis status er ok"
    }
  ]
}

Regler:
- Screen for MINDST disse emner: AB-Forbruger nævnt, fast pris vs. overslag, betalingsplan koblet til fremdrift, bindende tidsplan med slutdato, procedure for ekstraarbejde, afleverings- og mangelprocedure
- Skriv altid på dansk
- Aldrig juridisk jargon — forklar som til en almindelig boligejer
- Sæt "fejl" hvis noget er klart problematisk (f.eks. 50%+ forudbetaling, ingen slutdato, AB-Forbruger ikke nævnt)
- Sæt "advarsel" hvis noget bør afklares men ikke nødvendigvis er galt
- Sæt "ok" kun hvis punktet faktisk er dækket tilfredsstillende
- Basér alt på hvad der faktisk står i teksten — lav ikke noget op
- Inkludér mindst 4 punkter, typisk 5-8`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text;

  // Parse JSON fra svaret
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Kunne ikke parse svar fra AI" }, { status: 500 });
  }

  const resultat = JSON.parse(jsonMatch[0]);
  return NextResponse.json(resultat);
}
