import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ipHits = new Map<string, { count: number; reset: number }>();
const LIMIT = 10;
const WINDOW = 60 * 60 * 1000; // 1 time

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.reset) {
    ipHits.set(ip, { count: 1, reset: now + WINDOW });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

const SYSTEM = `Du er en erfaren byggesagkyndig der hjælper private bygherrer med at beskrive deres projekt professionelt til håndværkere.

Baseret på bygherrens svar skal du skrive et professionelt udbudsdokument på dansk OG en tilbudsliste med forventede opgaveposter.

Returner KUN et JSON-objekt (ingen markdown uden for JSON):
{
  "titel": "Kort projekttitel fx 'Badeværelsesrenovering, Elmevej 12'",
  "resumé": "2-3 sætninger der opsummerer projektet klart",
  "dokument": "Det fulde udbudsdokument — se skabelon nedenfor",
  "tilbudsposter": [
    { "id": "1", "beskrivelse": "Konkret opgavebeskrivelse fx 'Nedtagning og bortskaffelse af eksisterende toilet'", "enhed": "stk" },
    { "id": "2", "beskrivelse": "Næste post", "enhed": "stk" }
  ]
}

Dokumentet skal ALTID følge præcis denne skabelon med disse overskrifter i denne rækkefølge — ingen overskrifter må tilføjes, fjernes eller omdøbes:

1. Projektbeskrivelse
[Beskriv hvad projektet går ud på — 2-4 sætninger baseret på bygherrens input]

2. Ønsker og krav
[Beskriv bygherrens specifikke ønsker og krav til udførelsen]

3. Praktiske forhold
[Adgang, parkering, beboet under arbejdet, affaldsplads, særlige hensyn]

4. Tidsramme
[Ønsket opstartstidspunkt og seneste afleveringsdato]

5. Kontraktgrundlag
Entreprisen udføres i henhold til AB-Forbruger 2012. Tilbud bedes specificeret med faste priser ekskl. moms. Ekstraarbejder aftales skriftligt inden udførelse.

Regler:
- Brug præcis disse 5 overskrifter med nummering — aldrig flere, aldrig færre
- Skriv professionelt men forståeligt — ikke juridisk jargon
- Skriv IKKE bygherrens kontaktoplysninger ind i dokumentet
- Skriv altid på dansk

Regler for tilbudsposter:
- Lav 4-10 konkrete og realistiske opgaveposter baseret på projektbeskrivelsen
- Beskriv hver post præcist og fagligt, så entreprenøren ved hvad der menes
- Enhed er typisk "stk", "m²", "m", "time" eller "samlet"
- Inkludér altid en post til "Afrydning og bortskaffelse af byggeaffald"
- Den sidste post skal altid være "Uforudsete arbejder" med enhed "samlet"`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "For mange forsøg. Prøv igen om en time." }, { status: 429 });
  }

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
