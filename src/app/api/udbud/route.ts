import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ipHits = new Map<string, { count: number; reset: number }>();
const LIMIT = 10;
const WINDOW = 60 * 60 * 1000; // 1 time

// Snæver, deterministisk rettelse af en observeret AI-stavefejl. Prompten
// beder AI'en stave korrekt, men det er ikke tilstrækkeligt alene — denne
// normalisering retter kendte fejlvarianter uafhængigt af AI'ens output.
function bevarForbogstav(match: string, korrekt: string): string {
  return match[0] === match[0].toUpperCase() ? korrekt[0].toUpperCase() + korrekt.slice(1) : korrekt;
}

function normaliserEntreprenoerStavning(tekst: string): string {
  return tekst
    .replace(/entrepreneuren/gi, (m) => bevarForbogstav(m, "entreprenøren"))
    .replace(/entrepreneur/gi, (m) => bevarForbogstav(m, "entreprenør"));
}

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

BINDENDE REGLER FOR "resumé", "dokument", "kravOgOensker" OG "praktiskeForhold":
- Nævn ALDRIG konkrete kalenderdatoer (hverken som "4. september 2026", "04-09-2026", "2026-09-04" eller lignende). Systemet viser start-, slut- og fristdatoer separat fra tidsplanen.
- Det er tilladt at skrive generelt om tid, fx "efter nærmere aftale" eller "inden arbejdets opstart" — men aldrig en konkret dato.
- Stav altid "entreprenør" og "entreprenøren" — aldrig "entrepreneur" eller "entrepreneuren".
- AB-Forbruger er Nembyggestyrings normale aftalegrundlag for private bygherrer. AB 18 er et andet, separat kontraktuelt regelsæt for større/professionelle sager. Du må ALDRIG indsætte AB 18 automatisk, foreslå AB 18 som standard, erklære AB 18 som aftalegrundlag, eller blande AB 18 sammen med AB-Forbruger. Nævn ikke AB 18 overhovedet, medmindre bygherrens egen tekst eksplicit beder om det.
- BR18 (Bygningsreglementet) er noget andet end AB 18 og er IKKE et valgfrit kontraktvilkår. Du må og skal gerne omtale relevante BR18-krav, myndighedskrav for den konkrete opgave, og at entreprenøren skal udføre arbejdet i overensstemmelse med gældende regler. Brug en generel formulering i retning af "Arbejdet skal udføres i overensstemmelse med gældende lovgivning og de krav i BR18, der er relevante for den konkrete opgave." — påstå ALDRIG at samtlige kapitler eller krav i BR18 gælder for enhver opgave.
- Du må og skal gerne omtale relevante DS- og DS/EN-standarder, men du må ALDRIG opfinde standardnumre, påstå at alle DS-standarder er obligatoriske, indsætte en standard der ikke er relevant for den konkrete opgave, eller foretage en skjult juridisk/teknisk vurdering uden kildegrundlag. Skeln, hvor relevant, mellem standarder der er obligatoriske gennem gældende regler, standarder parterne udtrykkeligt aftaler, og standarder der alene er vejledende/dokumentation.
- Er du i tvivl om et juridisk eller teknisk forhold — herunder hvilke BR18-krav eller standarder der reelt er relevante — så skriv at forholdet bør afklares nærmere. Opfind aldrig et krav eller en gældende regel for at virke fyldestgørende.

REGLER FOR "dokument"-feltet:
- KUN projektbeskrivelse og omfang af arbejdet
- Nævn IKKE adressen — systemet viser adressen separat
- Ingen sektionsoverskrifter, ingen nummerering, ingen dividers eller streger
- Brug kun almindelige bindestreger til punktliste: "- opgave"
- Skriv fagligt og professionelt men forståeligt for en privat boligejer
- Skriv altid på dansk

STRUKTUR FOR "dokument":
[2-3 sætninger der introducerer projektet og arbejdets karakter]

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

    for (const felt of ["titel", "resumé", "dokument", "kravOgOensker", "praktiskeForhold"] as const) {
      if (typeof parsed[felt] === "string") {
        parsed[felt] = normaliserEntreprenoerStavning(parsed[felt]);
      }
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
