import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Du er en dansk byggeretsekspert der hjælper private bygherrer med at forstå deres byggeaftaler.

Analyser byggeaftalen/tilbuddet og screen den mod AB-Forbruger 2012.

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
      "forklaring": "Hvad vi fandt - på almindeligt dansk uden juridisk jargon",
      "anbefaling": "Hvad bygherren bør gøre - eller null hvis status er ok",
      "forslag": "Kopiérbar besked bygherren kan sende til håndværkeren - eller null hvis status er ok"
    }
  ]
}

Regler:
- Screen for MINDST disse emner: AB-Forbruger nævnt, fast pris vs. overslag, betalingsplan koblet til fremdrift, bindende tidsplan med slutdato, procedure for ekstraarbejde, afleverings- og mangelprocedure
- Skriv altid på dansk
- Aldrig juridisk jargon - forklar som til en almindelig boligejer
- Sæt "fejl" hvis noget er klart problematisk (fx 50%+ forudbetaling, ingen slutdato, AB-Forbruger ikke nævnt)
- Sæt "advarsel" hvis noget bør afklares men ikke nødvendigvis er galt
- Sæt "ok" kun hvis punktet faktisk er dækket tilfredsstillende
- Basér alt på hvad der faktisk står - lav ikke noget op
- Inkludér mindst 4 punkter, typisk 5-8`;

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const body = await req.json();
    const { tekst, projekttype, pdfBase64 } = body;

    if (!tekst && !pdfBase64) {
      return NextResponse.json({ error: "Intet indhold at screene" }, { status: 400 });
    }
    if (!pdfBase64 && (!tekst || tekst.trim().length < 30)) {
      return NextResponse.json({ error: "For lidt tekst til at screene" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = pdfBase64
      ? [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: `Projekttype: ${projekttype || "renovation"}. Screen dette tilbud/denne aftale mod AB-Forbruger og returner JSON som beskrevet i system-prompten.`,
          },
        ]
      : [
          {
            type: "text",
            text: `Projekttype: ${projekttype || "renovation"}.\n\nTILBUD/AFTALE:\n${tekst}`,
          },
        ];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Kunne ikke parse svar fra AI" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Forsøg at reparere JSON ved at fjerne trailing incomplete entries
      const txt = jsonMatch[0];
      const lastValid = txt.lastIndexOf('},');
      if (lastValid > 0) {
        try {
          parsed = JSON.parse(txt.slice(0, lastValid) + '}]}');
        } catch {
          return NextResponse.json({ error: "Kunne ikke parse svar fra AI - prøv igen" }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Kunne ikke parse svar fra AI - prøv igen" }, { status: 500 });
      }
    }

    // Gem screening i Supabase hvis bruger og projekt er angivet
    const { bruger_id, projekt_id } = body;
    if (bruger_id && parsed) {
      try {
        const db = createServiceClient();

        // Opret projekt hvis ikke angivet
        let aktivProjektId = projekt_id;
        if (!aktivProjektId) {
          const { data: nytProjekt } = await db
            .from("projekter")
            .insert({
              bygherre_id: bruger_id,
              projekttype: body.projekttype || "andet",
              adresse: body.adresse || null,
              navn: body.navn || null,
              kontakt: body.kontakt || null,
              status: body.status || "tilbud",
              ab_forbruger: true,
            })
            .select("id")
            .single();
          aktivProjektId = nytProjekt?.id;
        }

        if (aktivProjektId) {
          // Gem screening
          const { data: screening } = await db
            .from("screeninger")
            .insert({
              projekt_id: aktivProjektId,
              samlet_risiko: parsed.samletRisiko,
              status: "færdig",
              model_version: "v1",
            })
            .select("id")
            .single();

          // Gem risikopunkter
          if (screening?.id && parsed.punkter?.length) {
            await db.from("risiko_punkter").insert(
              parsed.punkter.map((p: { kategori: string; status: string; forklaring: string; anbefaling: string | null; titel?: string }, i: number) => ({
                screening_id: screening.id,
                kategori: p.kategori,
                status: p.status,
                forklaring: p.forklaring,
                anbefaling: p.anbefaling,
                alvorlighed: p.status === "fejl" ? "høj" : p.status === "advarsel" ? "middel" : "lav",
                sorteret_index: i,
              }))
            );
          }

          parsed._projekt_id = aktivProjektId;
          parsed._screening_id = screening?.id;
        }
      } catch {
        // Gem fejl må ikke blokere bruger — fortsæt uden
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
