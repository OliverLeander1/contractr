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

const SYSTEM = `Du er en erfaren byggesagkyndig der skriver professionelle projektbeskrivelser for private bygherrer i Danmark.

Returner KUN et JSON-objekt uden markdown-wrapper:
{
  "titel": "Projekttitel fx 'Badeværelsesrenovering, Elmevej 12, 2500 Valby'",
  "resumé": "2 sætninger der opsummerer projektet",
  "dokument": "Ren projektbeskrivelse — se regler nedenfor"
}

REGLER FOR "dokument"-feltet:
- Ingen sektionsoverskrifter, ingen nummerering, ingen dividers eller streger
- Ingen overskrifter som "PROJEKTBESKRIVELSE", "KRAV OG ØNSKER" osv.
- Strukturen er: indledning, derefter punktliste med opgaver, derefter løbende tekst om krav og praktiske forhold
- Brug kun almindelige bindestreger til punktliste: "- opgave"
- Skriv fagligt og professionelt men forståeligt for en privat boligejer
- Skriv altid på dansk

STRUKTUR (følg rækkefølgen men brug ingen overskrifter):

[2-3 sætninger der introducerer projektet og adressen]

Omfanget af arbejdet er:

- [konkret faglig opgave]
- [konkret faglig opgave]
[4-10 opgaver i alt, fagligt og præcist formuleret]
- Afrydning og bortskaffelse af byggeaffald
- Uforudsete arbejder (samlet)

[1 sætning om forudsætninger ved opstart og at entreprenøren straks melder til bygherre hvis der opdages yderligere arbejde]

[Bygherrens specifikke ønsker og krav til materialer og udførelse. Skriv i løbende tekst. Afslut med at alt arbejde skal udføres håndværksmæssigt korrekt og i overensstemmelse med gældende love og standarder.]

[Praktiske forhold: beboet/tom, adgangsforhold, parkering, forsyningsafbrydelser — skriv som korte sætninger eller punkter]

[Anbefaling om besigtigelse inden tilbud afgives]

Entreprenøren bedes afgive et fast tilbud med specificeret prisliste, oplysning om tilbudte materialer og produkter, eventuelle underentreprenører og referencer fra tilsvarende arbejder. Alle priser opgives inkl. moms.`;

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
