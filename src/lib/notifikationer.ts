import { Resend } from "resend";

export type NotifikationsType =
  | "haandvaerker_godkendt_kontrakt"
  | "bygherre_godkendt_kontrakt"
  | "begge_godkendt_kontrakt"
  | "haandvaerker_forslag_aendring"
  | "bygherre_accepteret_forslag"
  | "bygherre_afvist_forslag"
  | "haandvaerker_indsendt_tidsplan"
  | "bygherre_godkendt_tidsplan"
  | "ny_chatbesked"
  | "haandvaerker_ekstraarbejde_svar"
  | "bygherre_godkendt_ekstraarbejde"
  | "bygherre_ny_mangel"
  | "haandvaerker_udbedret_mangel"
  | "haandvaerker_trukket_sig"
  | "bygherre_slettet_konto"
  | "bygherre_slettet_projekt";

interface NotifikationsData {
  projekttitel?: string;
  afsenderNavn?: string;
  link: string;
  ekstraInfo?: string;
}

function emailHtml(overskrift: string, brødtekst: string, knapTekst: string, data: NotifikationsData) {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <div style="margin-bottom: 28px;">
        <span style="font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1e3a2a;">nembyggestyring</span>
      </div>

      ${data.projekttitel ? `<p style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${data.projekttitel}</p>` : ""}

      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 16px; line-height: 1.3; color: #111827;">${overskrift}</h1>
      <p style="color: #6b7280; margin-bottom: 28px; line-height: 1.7; font-size: 15px;">${brødtekst}</p>

      ${data.ekstraInfo ? `<div style="background: #f8f8f6; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; border-left: 3px solid #1e3a2a;">
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${data.ekstraInfo}</p>
      </div>` : ""}

      <a href="${data.link}" style="display: inline-block; background: #1e3a2a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 32px;">
        ${knapTekst} →
      </a>

      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;">
      <p style="font-size: 12px; color: #d1d5db; margin: 0;">
        Du modtager denne mail fordi du er part i et projekt på nembyggestyring.dk.
        <a href="${data.link.split("/projekt")[0]}/konto" style="color: #9ca3af;">Administrer notifikationer</a>
      </p>
    </div>
  `;
}

const beskeder: Record<NotifikationsType, (data: NotifikationsData) => { emne: string; overskrift: string; brødtekst: string; knapTekst: string }> = {
  haandvaerker_godkendt_kontrakt: (d) => ({
    emne: `${d.afsenderNavn || "Entreprenøren"} har godkendt aftalegrundlaget`,
    overskrift: `${d.afsenderNavn || "Entreprenøren"} har godkendt aftalegrundlaget`,
    brødtekst: `Aftalegrundlaget for <strong>${d.projekttitel || "dit projekt"}</strong> er nu godkendt af entreprenøren. Gå ind og giv din endelige godkendelse for at sætte projektet i gang.`,
    knapTekst: "Se aftalegrundlag",
  }),
  bygherre_godkendt_kontrakt: (d) => ({
    emne: `Bygherren har godkendt aftalegrundlaget`,
    overskrift: `Bygherren har godkendt aftalegrundlaget`,
    brødtekst: `Bygherren har givet sin godkendelse af aftalegrundlaget for <strong>${d.projekttitel || "projektet"}</strong>. Giv din godkendelse for at gøre aftalen bindende.`,
    knapTekst: "Se aftalegrundlag",
  }),
  begge_godkendt_kontrakt: (d) => ({
    emne: `Aftalen er nu underskrevet af begge parter`,
    overskrift: `Aftalen er nu underskrevet`,
    brødtekst: `Begge parter har godkendt aftalegrundlaget for <strong>${d.projekttitel || "projektet"}</strong>. Aftalen er juridisk bindende og projektet kan gå i gang.`,
    knapTekst: "Se projektet",
  }),
  haandvaerker_forslag_aendring: (d) => ({
    emne: `${d.afsenderNavn || "Entreprenøren"} foreslår en ændring i kontrakten`,
    overskrift: `${d.afsenderNavn || "Entreprenøren"} foreslår en ændring`,
    brødtekst: `Der er kommet et ændringsforslag til aftalegrundlaget for <strong>${d.projekttitel || "dit projekt"}</strong>. Gennemgå forslaget og acceptér eller afvis det.`,
    knapTekst: "Se ændringsforslag",
  }),
  bygherre_accepteret_forslag: (d) => ({
    emne: `Bygherren har accepteret dit ændringsforslag`,
    overskrift: `Dit ændringsforslag er accepteret`,
    brødtekst: `Bygherren har accepteret dit forslag til <strong>${d.projekttitel || "aftalegrundlaget"}</strong>. Kontrakten er opdateret og begges godkendelse er nulstillet.`,
    knapTekst: "Se opdateret aftale",
  }),
  bygherre_afvist_forslag: (d) => ({
    emne: `Bygherren har afvist dit ændringsforslag`,
    overskrift: `Dit ændringsforslag er afvist`,
    brødtekst: `Bygherren har afvist dit forslag til <strong>${d.projekttitel || "aftalegrundlaget"}</strong>. Du kan sende et nyt forslag eller kontakte bygherren direkte.`,
    knapTekst: "Se aftalegrundlag",
  }),
  haandvaerker_indsendt_tidsplan: (d) => ({
    emne: `${d.afsenderNavn || "Entreprenøren"} har indsendt en tidsplan`,
    overskrift: `Tidsplan er indsendt til godkendelse`,
    brødtekst: `${d.afsenderNavn || "Entreprenøren"} har indsendt en faseopdelt tidsplan for <strong>${d.projekttitel || "dit projekt"}</strong> jf. AB-Forbruger § 12. Gennemgå og godkend den.`,
    knapTekst: "Se tidsplan",
  }),
  bygherre_godkendt_tidsplan: (d) => ({
    emne: `Bygherren har godkendt tidsplanen`,
    overskrift: `Tidsplanen er godkendt`,
    brødtekst: `Bygherren har godkendt den indsendte tidsplan for <strong>${d.projekttitel || "projektet"}</strong>. Tidsplanen er nu en del af aftalen.`,
    knapTekst: "Se projektet",
  }),
  ny_chatbesked: (d) => ({
    emne: `Ny besked fra ${d.afsenderNavn || "din samarbejdspartner"}`,
    overskrift: `Ny besked fra ${d.afsenderNavn || "din samarbejdspartner"}`,
    brødtekst: `Du har modtaget en ny besked i projektet <strong>${d.projekttitel || ""}</strong>.`,
    knapTekst: "Åbn beskeder",
  }),
  haandvaerker_ekstraarbejde_svar: (d) => ({
    emne: `${d.afsenderNavn || "Entreprenøren"} har besvaret en aftaleseddel`,
    overskrift: `Aftaleseddel besvaret`,
    brødtekst: `${d.afsenderNavn || "Entreprenøren"} har besvaret en aftaleseddel for ekstraarbejde på <strong>${d.projekttitel || "dit projekt"}</strong>. Gennemgå svaret og godkend eller afvis.`,
    knapTekst: "Se aftaleseddel",
  }),
  bygherre_godkendt_ekstraarbejde: (d) => ({
    emne: `Bygherren har godkendt ekstraarbejdet`,
    overskrift: `Ekstraarbejde godkendt`,
    brødtekst: `Bygherren har godkendt aftaleseddelen for ekstraarbejde på <strong>${d.projekttitel || "projektet"}</strong>.`,
    knapTekst: "Se aftaleseddel",
  }),
  bygherre_ny_mangel: (d) => ({
    emne: `Bygherren har registreret en mangel`,
    overskrift: `Ny mangel registreret`,
    brødtekst: `Bygherren har registreret en mangel på <strong>${d.projekttitel || "projektet"}</strong>. Gennemgå manglen og meld tilbage om udbedring.`,
    knapTekst: "Se mangel",
  }),
  haandvaerker_udbedret_mangel: (d) => ({
    emne: `${d.afsenderNavn || "Entreprenøren"} har meldt en mangel som udbedret`,
    overskrift: `Mangel meldt som udbedret`,
    brødtekst: `${d.afsenderNavn || "Entreprenøren"} har meldt en mangel som udbedret på <strong>${d.projekttitel || "dit projekt"}</strong>. Verificér at manglen er afhjulpet.`,
    knapTekst: "Se mangel",
  }),
  bygherre_slettet_projekt: (d) => ({
    emne: `Bygherren har slettet projektet`,
    overskrift: `Projektet er slettet af bygherren`,
    brødtekst: `Bygherren har slettet <strong>${d.projekttitel || "projektet"}</strong>. Sagen er ikke længere tilgængelig og alle tilknyttede data er fjernet. Kontakt bygherren direkte hvis du har spørgsmål.`,
    knapTekst: "Se mine sager",
  }),
  bygherre_slettet_konto: (d) => ({
    emne: `Bygherren har anmodet om sletning af sin konto`,
    overskrift: `Projektet lukkes inden for 30 dage`,
    brødtekst: `Bygherren på <strong>${d.projekttitel || "et projekt"}</strong> har anmodet om sletning af sin konto. Projektet og alle tilknyttede data slettes automatisk inden for 30 dage. Tag kontakt til bygherren direkte hvis du har spørgsmål.`,
    knapTekst: "Se mine sager",
  }),
  haandvaerker_trukket_sig: (d) => ({
    emne: `Entreprenøren har trukket sig fra ${d.projekttitel || "dit projekt"}`,
    overskrift: `Entreprenøren er ikke længere tilknyttet projektet`,
    brødtekst: `Entreprenøren på <strong>${d.projekttitel || "dit projekt"}</strong> har slettet sin konto og er ikke længere tilknyttet projektet. Du kan sende projektet i udbud igen eller kontakte en ny entreprenør direkte.`,
    knapTekst: "Gå til projektet",
  }),
};

export async function sendNotifikation(
  type: NotifikationsType,
  til: string,
  data: NotifikationsData,
  skalSende = true,
): Promise<void> {
  if (!skalSende) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const b = beskeder[type](data);
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: "NemByggestyring <noreply@nembyggestyring.dk>",
      to: [til],
      subject: b.emne,
      html: emailHtml(b.overskrift, b.brødtekst, b.knapTekst, data),
    });
  } catch {
    // Log fejl men blokér ikke response
    console.error("Notifikations-email fejlede:", type, til);
  }
}

// Henter modtager-email og præference — tjekker profiler først, falder tilbage til auth.users
export async function hentBygherreEmail(
  bygherre_id: string,
  db: ReturnType<typeof import("@/lib/supabase-server").createServiceClient>,
): Promise<{ email: string | null; notifikationer: boolean }> {
  const { data: profil } = await db
    .from("profiler")
    .select("email, email_notifikationer")
    .eq("id", bygherre_id)
    .single();

  let email = profil?.email ?? null;

  // Fald tilbage til auth.users hvis profil ikke har email
  if (!email) {
    const { data: { user } } = await db.auth.admin.getUserById(bygherre_id);
    email = user?.email ?? null;
  }

  return {
    email,
    notifikationer: profil?.email_notifikationer !== false,
  };
}
