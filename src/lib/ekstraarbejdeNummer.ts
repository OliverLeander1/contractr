import { createServiceClient } from "@/lib/supabase-server";

// Udleder det aftaleseddelnummer, bygherre og entreprenør allerede ser i
// UI'et (fx "Aftaleseddel #2") for en konkret aftaleseddel. Nummeret er ikke
// gemt i databasen — det beregnes her efter nøjagtig samme regel som
// allerede bruges i src/app/projekt/[id]/ekstraarbejde/page.tsx og
// src/app/haandvaerker/projekt/[id]/ekstraarbejde/page.tsx: projektets
// aftalesedler i kronologisk oprettelsesrækkefølge, ældste = #1. Returnerer
// null hvis nummeret undtagelsesvist ikke kan udledes (fx forespørgselsfejl)
// — kaldested skal falde tilbage til tekst uden nummer, aldrig gætte.
export async function hentAftaleseddelNummer(
  db: ReturnType<typeof createServiceClient>,
  projektId: string,
  sedelId: string,
): Promise<number | null> {
  const { data, error } = await db
    .from("ekstraarbejde")
    .select("id")
    .eq("projekt_id", projektId)
    .order("oprettet_at", { ascending: true });

  if (error || !data) return null;

  const index = data.findIndex((r) => r.id === sedelId);
  return index === -1 ? null : index + 1;
}
