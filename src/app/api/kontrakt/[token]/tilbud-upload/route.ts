import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

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
    kontrakt: data,
  });
}
