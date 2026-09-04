import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

// ─── Betalingsplan-udtræk v1 (eksperimentel, best-effort) ───
// Fuldt isoleret fra prisudtrækket nedenfor: bruger DEN allerede udtrukne
// dokumenttekst (intet nyt parse-kald), laver ét separat Anthropic-kald,
// og kan aldrig få denne route til at fejle eller ændre udtrukketPris —
// enhver fejl her fanges af kaldsstedet og resulterer blot i null.
interface AiBetalingsRate {
  milestone: unknown;
  amount: unknown;
  percentage: unknown;
}

// Largest-remainder-metoden: fordeler `values` proportionalt til andele,
// der summerer til PRÆCIS 100,00 (2 decimaler), uanset afrunding i kilden.
// AI'en leverer kun rå tal fra dokumentet — koden beregner andelen, aldrig AI'en.
function fordelAndeleProportionalt(values: number[]): string[] {
  const total = values.reduce((a, b) => a + b, 0);
  const CENTI = 10000; // 100,00 % udtrykt i hundrededele af en procent
  const raw = values.map((v) => (v / total) * CENTI);
  const gulvet = raw.map((r) => Math.floor(r));
  const rest = CENTI - gulvet.reduce((a, b) => a + b, 0);
  const rækkefølge = raw
    .map((r, i) => ({ i, frac: r - gulvet[i] }))
    .sort((a, b) => b.frac - a.frac);
  const resultat = [...gulvet];
  for (let k = 0; k < rest; k++) {
    resultat[rækkefølge[k % rækkefølge.length].i] += 1;
  }
  return resultat.map((c) => (c / 100).toString());
}

async function udtraekBetalingsplan(
  tekst: string,
  udtrukketPris: number | null,
  anthropicKey: string,
): Promise<{ rater: { milepæl: string; andel: string }[]; samletBeloeb: number | null } | null> {
  if (!tekst.trim()) return null;

  const client = new Anthropic({ apiKey: anthropicKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Find en eventuel BETALINGSPLAN i dette tilbudsdokument - dvs. den sektion, der beskriver, hvornår og hvor meget bygherren skal betale (typisk rater knyttet til byggeriets faser, fx "ved opstart", "efter råinstallationer", "ved aflevering").

VIGTIGT:
- Almindelige delpriser eller fagopdelte priser i selve tilbuddet er IKKE en betalingsplan. Brug KUN den sektion, der eksplicit beskriver betaling/rater/tidspunkt for betaling.
- Opfind ALDRIG rater, beløb eller procenter. Hvis der ikke findes en tydelig betalingsplan, svar found: false.
- Angiv PR. RATE enten "amount" (beløb i hele kroner, uden punktum, komma eller "kr.") ELLER "percentage" (tal uden %-tegn) - alt efter hvad dokumentet faktisk angiver for den pågældende rate. Sæt det felt, der ikke fremgår af dokumentet, til null. Beregn ALDRIG selv en procent eller et beløb - brug kun det, der står direkte i dokumentet.
- "milestone" skal være den korte betingelse/beskrivelse fra dokumentet (fx "Ved accept og opstart"), ikke et gæt.

Svar KUN med gyldig JSON i præcis dette format, uden forklaring eller markdown:
{"found": boolean, "installments": [{"milestone": string, "amount": number|null, "percentage": number|null}], "statedTotal": number|null}

Dokument:
${tekst.slice(0, 8000)}`,
      },
    ],
  });

  const raaSvar = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
  const jsonMatch = raaSvar.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let parsed: { found?: unknown; installments?: unknown };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }

  if (parsed.found !== true || !Array.isArray(parsed.installments) || parsed.installments.length < 2) {
    return null;
  }

  const rows = parsed.installments as AiBetalingsRate[];
  const milestones: string[] = [];
  const amounts: number[] = [];
  const percentages: number[] = [];
  let modus: "amount" | "percentage" | null = null;

  for (const r of rows) {
    const milestone = typeof r.milestone === "string" ? r.milestone.trim() : "";
    if (!milestone) return null;

    const harBeloeb = typeof r.amount === "number" && Number.isFinite(r.amount) && r.amount > 0;
    const harPct = typeof r.percentage === "number" && Number.isFinite(r.percentage) && r.percentage > 0;

    // Præcis ét af felterne skal være gyldigt sat — ingen af dem, begge,
    // eller et skift af type undervejs i dokumentet gør resultatet for
    // usikkert til at tilbyde automatisk (fail conservative).
    if (harBeloeb === harPct) return null;
    if (modus === null) modus = harBeloeb ? "amount" : "percentage";
    if (modus === "amount" && !harBeloeb) return null;
    if (modus === "percentage" && !harPct) return null;

    milestones.push(milestone);
    if (harBeloeb) amounts.push(r.amount as number);
    else percentages.push(r.percentage as number);
  }

  if (modus === "amount") {
    const sum = amounts.reduce((a, b) => a + b, 0);
    // Uden en kendt, allerede fundet tilbudssum kan raternes sum ikke
    // valideres deterministisk — fail conservative frem for at gætte.
    if (udtrukketPris === null) return null;
    // Lille, dokumenteret tolerance for afrunding til hele kroner i
    // kildedokumentet: op til 1 kr. pr. rate, eller 0,1 % af summen.
    const tolerance = Math.max(milestones.length, Math.round(udtrukketPris * 0.001));
    if (Math.abs(sum - udtrukketPris) > tolerance) return null;
    const andele = fordelAndeleProportionalt(amounts);
    return {
      rater: milestones.map((m, i) => ({ milepæl: m, andel: andele[i] })),
      samletBeloeb: sum,
    };
  }

  // modus === "percentage" — dokumentet angiver selv andele. Lille
  // dokumenteret tolerance for kildens egen afrunding (fx 33,3/33,3/33,4).
  const pctSum = percentages.reduce((a, b) => a + b, 0);
  if (Math.abs(pctSum - 100) > 0.5) return null;
  const andele = fordelAndeleProportionalt(percentages);
  return {
    rater: milestones.map((m, i) => ({ milepæl: m, andel: andele[i] })),
    samletBeloeb: udtrukketPris,
  };
}

// POST /api/kontrakt/[token]/tilbud-upload
// Modtager PDF eller Word-fil, udtrækker tekst, finder pris via AI, uploader til Storage
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceClient();

  const { data: kontrakt } = await db
    .from("kontrakter")
    .select("id, titel")
    .eq("haandvaerker_token", token)
    .single();

  if (!kontrakt) {
    return NextResponse.json({ error: "Kontrakt ikke fundet" }, { status: 404 });
  }

  const formData = await req.formData();
  const fil = formData.get("fil") as File | null;

  if (!fil) {
    return NextResponse.json({ error: "Ingen fil modtaget" }, { status: 400 });
  }

  const filNavn = fil.name;
  const filType = fil.type;
  const erPdf = filType === "application/pdf" || filNavn.toLowerCase().endsWith(".pdf");
  const erDocx =
    filType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filNavn.toLowerCase().endsWith(".docx");

  if (!erPdf && !erDocx) {
    return NextResponse.json({ error: "Kun PDF og Word-filer (.docx) er understøttet" }, { status: 400 });
  }

  // Server-side validering — UI'et hævder allerede "maks 10 MB", men det
  // var indtil nu ikke håndhævet server-side. Upload og prisudtræk skal
  // forblive to adskilte udfald: en for stor eller tom fil afvises HER,
  // FØR noget forsøges gemt eller læst.
  const MAX_BYTES = 10 * 1024 * 1024;
  if (fil.size === 0) {
    return NextResponse.json({ error: "Filen er tom." }, { status: 400 });
  }
  if (fil.size > MAX_BYTES) {
    return NextResponse.json({ error: "Filen er for stor. Maks 10 MB." }, { status: 400 });
  }

  const bytes = await fil.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Bugfix — verificér de faktiske bytes, ikke kun filnavn/MIME-type, før
  // filen overhovedet forsøges gemt. En fil, der hedder .pdf, men hvis
  // indhold ikke reelt er en gyldig PDF (fx en afbrudt/korrupt upload),
  // må ikke gemmes som et fungerende tilbudsdokument.
  const erGyldigPdfSignatur = buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  const erGyldigDocxSignatur =
    buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (erPdf && !erGyldigPdfSignatur) {
    return NextResponse.json({ error: "Filen ser ikke ud til at være en gyldig PDF. Prøv at eksportere/gemme den igen, og upload på ny." }, { status: 422 });
  }
  if (erDocx && !erGyldigDocxSignatur) {
    return NextResponse.json({ error: "Filen ser ikke ud til at være en gyldig Word-fil. Prøv at gemme den igen, og upload på ny." }, { status: 422 });
  }

  // Udtræk tekst fra dokumentet
  let tekst = "";
  let tekstFejlede = false;
  try {
    if (erPdf) {
      // pdf-parse v2 API — klassen erstatter den tidligere
      // funktionskaldsstil (pdfParse(buffer)), som hørte til pdf-parse v1
      // og altid kastede en TypeError mod den nu installerede v2.4.5
      // ("pdfParse is not a function"), verificeret ved direkte test.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        tekst = result.text;
      } finally {
        await parser.destroy();
      }
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      tekst = result.value;
    }
  } catch {
    tekstFejlede = true;
  }

  // Find samlet pris via AI
  let udtrukketPris: number | null = null;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });

      let response;
      if (erPdf && (tekstFejlede || !tekst.trim())) {
        // Fallback: send PDF direkte til Claude som dokument (base64)
        const base64 = buffer.toString("base64");
        response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: base64 },
                },
                {
                  type: "text",
                  text: 'Find den samlede tilbudspris i dette tilbudsdokument. Svar KUN med et tal i danske kroner uden punktummer, kommaer eller "kr." - eksempel: 87500. Hvis du ikke kan finde en klar samlet pris, svar med null.',
                },
              ] as import("@anthropic-ai/sdk/resources").ContentBlockParam[],
            },
          ],
        });
        tekstFejlede = false; // Claude kunne læse den
      } else if (tekst.trim()) {
        response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: `Find den samlede tilbudspris i dette tilbudsdokument. Svar KUN med et tal i danske kroner uden punktummer, kommaer eller "kr." - eksempel: 87500. Hvis du ikke kan finde en klar samlet pris, svar med null.\n\nDokument:\n${tekst.slice(0, 6000)}`,
            },
          ],
        });
      }

      if (response) {
        const svar = response.content[0].type === "text" ? response.content[0].text.trim() : "";
        const tal = parseFloat(svar.replace(/[^0-9,.]/g, "").replace(",", "."));
        if (!isNaN(tal) && tal > 0) {
          udtrukketPris = tal;
        }
      }
    } catch {
      // AI fejlede - fortsæt uden pris
    }
  }

  // Afvis kun hvis tekst fejlede OG AI heller ikke hjalp og filen er tom
  if (tekstFejlede && !udtrukketPris && erDocx) {
    return NextResponse.json({ error: "Kunne ikke læse Word-filen. Prøv at gemme som PDF og upload igen." }, { status: 422 });
  }

  // Betalingsplan-udtræk v1 (eksperimentel, best-effort) — kører EFTER og
  // uafhængigt af prisudtrækket. Bruger kun tekstbaserede dokumenter (ingen
  // vision-fallback i v1). Enhver fejl her (netværk, parsing, uklart
  // resultat) giver blot null — påvirker aldrig upload eller udtrukketPris.
  let udtrukketBetalingsplan: { rater: { milepæl: string; andel: string }[]; samletBeloeb: number | null } | null = null;
  if (anthropicKey && !tekstFejlede && tekst.trim()) {
    try {
      udtrukketBetalingsplan = await udtraekBetalingsplan(tekst, udtrukketPris, anthropicKey);
    } catch {
      udtrukketBetalingsplan = null;
    }
  }

  // Upload fil til Supabase Storage. Content-Type sættes ud fra vores egen
  // verificerede filtype (magic bytes ovenfor), ikke det klient-leverede
  // fil.type — som ikke er autoritativt og i sjældne tilfælde kan mangle
  // eller være forkert, hvilket ville få browseren til at hente filen som
  // download i stedet for at vise den som PDF.
  const sti = `tilbud/${kontrakt.id}/${Date.now()}_${filNavn.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const contentType = erPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const { error: uploadFejl } = await db.storage
    .from("tilbudsdokumenter")
    .upload(sti, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadFejl) {
    console.error("Storage upload fejl:", uploadFejl);
    return NextResponse.json({ error: "Filen kunne ikke gemmes. Prøv igen." }, { status: 500 });
  }

  const { data: urlData } = db.storage.from("tilbudsdokumenter").getPublicUrl(sti);
  const dokumentUrl = urlData.publicUrl;

  // Gem på kontrakten
  const { data, error } = await db
    .from("kontrakter")
    .update({
      tilbud_dokument_url: dokumentUrl,
      tilbud_dokument_sti: sti,
      tilbud_dokument_navn: filNavn,
      opdateret_at: new Date().toISOString(),
    })
    .eq("id", kontrakt.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    dokumentUrl,
    filNavn,
    udtrukketPris,
    udtrukketBetalingsplan,
    kontrakt: data,
  });
}
