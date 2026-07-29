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

  const bytes = await fil.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Udtræk tekst fra dokumentet
  let tekst = "";
  try {
    if (erPdf) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const result = await pdfParse(buffer);
      tekst = result.text;
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      tekst = result.value;
    }
  } catch {
    return NextResponse.json({ error: "Kunne ikke læse filen. Prøv at gemme som PDF og upload igen." }, { status: 422 });
  }

  if (!tekst.trim()) {
    return NextResponse.json({ error: "Filen indeholder ingen tekst. Scannet PDF understøttes ikke endnu." }, { status: 422 });
  }

  // Find samlet pris via AI
  let udtrukketPris: number | null = null;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Find den samlede tilbudspris i dette tilbudsdokument. Svar KUN med et tal i danske kroner uden punktummer, kommaer eller "kr." - eksempel: 87500. Hvis du ikke kan finde en klar samlet pris, svar med null.

Dokument:
${tekst.slice(0, 6000)}`,
          },
        ],
      });

      const svar = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      const tal = parseFloat(svar.replace(/[^0-9,.]/g, "").replace(",", "."));
      if (!isNaN(tal) && tal > 0) {
        udtrukketPris = tal;
      }
    } catch {
      // AI fejlede - fortsæt uden pris
    }
  }

  // Upload fil til Supabase Storage
  const sti = `tilbud/${kontrakt.id}/${Date.now()}_${filNavn.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadFejl } = await db.storage
    .from("tilbudsdokumenter")
    .upload(sti, buffer, {
      contentType: filType || "application/octet-stream",
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
