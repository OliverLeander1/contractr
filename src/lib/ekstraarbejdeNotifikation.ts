import { createServiceClient } from "@/lib/supabase-server";

interface KontraktTilNotifikation {
  bygherre_id: string | null;
  haandvaerker_email: string | null;
}

// Alle typer, denne helper i dag kan skrive til public.notifikationer.type.
// En snæver union frem for en vilkårlig string, så et nyt kaldested ikke ved
// en fejl kan indsætte en type, notifikationscenteret ikke kender.
export type EkstraarbejdeNotifikationsType =
  | "ekstraarbejde_oprettet"
  | "haandvaerker_ekstraarbejde_svar"
  | "ekstraarbejde_godkendt"
  | "ekstraarbejde_afvist";

// Slår entreprenørens profiler.id op ud fra kontraktens haandvaerker_email.
// Samme mønster og samme dokumenterede begrundelse som findBrugerIdVedEmail i
// /api/besigtigelse/route.ts: profiler.email er ikke en fuldt autoritativ,
// altid-opdateret kilde, men det er fortsat det korrekte opslagsgrundlag,
// fordi kontrakt.haandvaerker_email allerede er den kilde, hele resten af
// sikkerhedsmodellen (verificerKontraktRolle) bruger til at autorisere
// entreprenøren. 0 eller >1 matchende rækker er begge reelle fejltilstande
// og må aldrig stille afgøres ved at gætte en modtager — begge logges i
// stedet, så et reelt mismatch kan spores i produktionslogs.
async function findBrugerIdVedEmail(
  db: ReturnType<typeof createServiceClient>,
  email: string,
): Promise<string | null> {
  const escapedEmail = email.trim().toLowerCase().replace(/[%_\\]/g, (m) => `\\${m}`);
  const { data, error } = await db
    .from("profiler")
    .select("id")
    .ilike("email", escapedEmail);

  if (error) {
    console.error("[ekstraarbejde-notifikation] Kunne ikke slå bruger op via email:", error.message);
    return null;
  }
  if (!data || data.length === 0) {
    console.error(
      `[ekstraarbejde-notifikation] Ingen profil matcher kontraktens haandvaerker_email (${email.trim()}) — springer notifikation over.`,
    );
    return null;
  }
  if (data.length > 1) {
    console.error(
      `[ekstraarbejde-notifikation] ${data.length} profiler matcher samme email (${email.trim()}) — springer notifikation over i stedet for at gætte modtager.`,
    );
    return null;
  }
  return data[0]?.id ?? null;
}

// Opretter en in-app notifikation (public.notifikationer) til modparten, når
// en aftaleseddel er oprettet. Modtageren udledes altid her, server-side, af
// den allerede autoritative kontraktdata (kontrakt.bygherre_id /
// kontrakt.haandvaerker_email) — aldrig af klientinput.
//
// Skal ALTID kaldes efter en allerede bekræftet, atomisk gennemført
// oprettelse af aftaleseddel + billedmetadata (den atomiske RPC skal være
// lykkedes) — aldrig før, og aldrig hvis den skrivning fejlede. Fejler denne
// funktion selv, sluges fejlen bevidst over for klienten — aftalesedlen og
// dens billeder består uanset notifikationsudfaldet — men logges altid
// server-side.
export async function opretEkstraarbejdeNotifikation(
  db: ReturnType<typeof createServiceClient>,
  params: {
    modtagerRolle: "bygherre" | "haandvaerker";
    kontrakt: KontraktTilNotifikation;
    projektId: string;
    type: EkstraarbejdeNotifikationsType;
    titel: string;
    besked: string;
  },
): Promise<void> {
  try {
    const brugerId = params.modtagerRolle === "bygherre"
      ? params.kontrakt.bygherre_id
      : params.kontrakt.haandvaerker_email
        ? await findBrugerIdVedEmail(db, params.kontrakt.haandvaerker_email)
        : null;

    if (!brugerId) return;

    const { error } = await db.from("notifikationer").insert({
      bruger_id: brugerId,
      projekt_id: params.projektId,
      type: params.type,
      titel: params.titel,
      besked: params.besked,
      ab_paragraf: "§ 23",
      laest: false,
    });

    if (error) {
      // Supabase-js kaster ikke ved en almindelig forespørgselsfejl — den
      // returneres i "error" og skal derfor tjekkes eksplicit for
      // overhovedet at blive logget.
      console.error(
        `[ekstraarbejde-notifikation] Kunne ikke oprette notifikation (projekt=${params.projektId}):`,
        error.message,
      );
    }
  } catch (e) {
    console.error("[ekstraarbejde-notifikation] Uventet fejl:", e);
  }
}
