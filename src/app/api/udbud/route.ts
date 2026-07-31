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
  "dokument": "Ren projektbeskrivelse med omfang — se regler nedenfor",
  "kravOgOensker": "Krav og ønsker til materialer og udførelse — se regler nedenfor",
  "praktiskeForhold": "Praktiske forhold — se regler nedenfor"
}

REGLER FOR "dokument"-feltet:
- KUN projektbeskrivelse og omfang af arbejdet
- Ingen sektionsoverskrifter, ingen nummerering, ingen dividers eller streger
- Brug kun almindelige bindestreger til punktliste: "- opgave"
- Skriv fagligt og professionelt men forståeligt for en privat boligejer
- Skriv altid på dansk

STRUKTUR FOR "dokument":
[2-3 sætninger der introducerer projektet og adressen]

Omfanget af arbejdet er:

- [konkret faglig opgave]
[4-10 opgaver i alt, fagligt og præcist formuleret]
- Afrydning og bortskaffelse af byggeaffald
- Uforudsete arbejder (samlet)

[1 sætning om at entreprenøren straks melder til bygherre hvis der opdages yderligere arbejde]

Entreprenøren bedes afgive et fast tilbud med specificeret prisliste, oplysning om tilbudte materialer og produkter, eventuelle underentreprenører og referencer fra tilsvarende arbejder. Alle priser opgives inkl. moms.

REGLER FOR "kravOgOensker"-feltet:
- Bygherrens specifikke ønsker og krav til materialer, produkter og udførelse
- Løbende tekst, ingen overskrifter
- Afslut med at alt arbejde skal udføres håndværksmæssigt korrekt og i overensstemmelse med gældende love, normer og branchestandarder
- Hvis der ikke er specifikke krav: skriv at bygherre ønsker materialer af god og dokumenteret kvalitet

REGLER FOR "praktiskeForhold"-feltet:
- Beboet eller tom bolig under arbejdet
- Adgangsforhold og nøgleaftaler
- Parkering og varetilkørsel
- Eventuelle forsyningsafbrydelser der skal koordineres
- Anbefaling om besigtigelse inden tilbud afgives
- Skriv som korte sætninger eller punktliste med "- punkt"`;


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
