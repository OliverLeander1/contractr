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

const DIVIDER = "─────────────────────────────────────";

const SYSTEM = `Du er en erfaren byggesagkyndig der skriver professionelle udbudsdokumenter for private bygherrer i Danmark.

Returner KUN et JSON-objekt uden markdown-wrapper:
{
  "titel": "Projekttitel fx 'Badeværelsesrenovering – Elmevej 12, 2500 Valby'",
  "resumé": "2 sætninger der opsummerer projektet",
  "dokument": "Det fulde udbudsdokument — se præcis skabelon nedenfor"
}

SKABELON — dokumentet skal ALTID se præcis sådan ud. Brug nøjagtigt disse dividers, overskrifter og struktur:

UDBUDSDOKUMENT

{titel}


${DIVIDER}

1. PROJEKTBESKRIVELSE

${DIVIDER}

[2-3 sætninger der introducerer projektet og adressen]

Omfanget af arbejdet er:

- [konkret opgave 1]
- [konkret opgave 2]
- [konkret opgave 3]
[... 4-10 opgaver i alt, fagligt og præcist formuleret]
- Afrydning og bortskaffelse af byggeaffald
- Uforudsete arbejder (samlet)

[1 sætning om forudsætninger for arbejdet — hvad der forventes at være i orden ved opstart, og at entreprenøren straks skal melde til bygherre hvis der opdages forhold der kræver yderligere arbejde]


${DIVIDER}

2. KRAV OG ØNSKER

${DIVIDER}

[Beskriv bygherrens specifikke ønsker og krav til materialer, mærker, udførelse og kvalitet. Skriv i løbende tekst med konkrete detaljer. Inkludér et afsnit om at alt arbejde skal udføres håndværksmæssigt korrekt og i overensstemmelse med gældende love og standarder.]


${DIVIDER}

3. TIDSRAMME

${DIVIDER}

Ønsket opstart:     [dato eller "Fleksibel — aftales nærmere"]
Senest færdig:      [dato eller "Ikke fastsat"]

[1-2 sætninger om at entreprenøren i sit tilbud skal angive sin forventede tidsplan, og at arbejdet inkl. oprydning skal være afsluttet inden fristen]


${DIVIDER}

4. PRAKTISKE FORHOLD

${DIVIDER}

- [Om boligen er beboet eller tom under arbejdet]
- [Adgang til ejendommen]
- [Etage/ejendomstype og særlige transportforhold for materialer og affald]
- [Parkering og adgangsforhold]
- [Vandafspærring, el-afbrydelse eller andre forsyningsforhold]

[Afslut med anbefaling om besigtigelse inden tilbud afgives]


${DIVIDER}

5. TILBUD OG KONTRAKTGRUNDLAG

${DIVIDER}

Entreprenøren bedes afgive et fast tilbud på baggrund af ovenstående beskrivelse. Tilbuddet skal indeholde:

- Specificeret prisliste for de enkelte arbejder
- Oplysning om tilbudte materialer og produkter
- Oplysning om eventuelle underentreprenører
- Referencer fra tilsvarende arbejder

Alle priser opgives inkl. moms.

Kontraktgrundlag:
AB-Forbruger 2012 (Almindelige Betingelser for arbejder og leverancer i bygge- og anlægsvirksomhed for forbrugeraftaler, 2012) lægges til grund for entreprisen i sin helhed. Ved modstrid mellem nærværende udbudsdokument og AB-Forbruger 2012 har udbudsdokumentet forrang, med mindre andet er aftalt skriftligt.

REGLER:
- Følg skabelonen PRÆCIS — brug nøjagtigt de samme dividers og overskriftsformat
- Skriv IKKE bygherrens kontaktoplysninger ind i dokumentet
- Skriv fagligt og professionelt — men forståeligt for en privat boligejer
- Skriv altid på dansk
- Opgaverne under "Omfanget af arbejdet er:" skal være konkrete og fagligt korrekte
- Altid inkluder "Afrydning og bortskaffelse af byggeaffald" og "Uforudsete arbejder" som de to sidste opgavepunkter`;

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
