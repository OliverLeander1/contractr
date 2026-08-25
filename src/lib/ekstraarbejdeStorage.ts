// Delt konfiguration og stihjælpere for aftalesedlers billeder.
// Bucket, MIME-type og størrelsesgrænse skal matche den private
// "aftalesedler"-bucket, som oprettes i
// supabase-migration-ekstraarbejde-kontrakt-id.sql.

export const AFTALESEDLER_BUCKET = "aftalesedler";

// Den eksisterende BilledAnnotering-komponent outputter altid
// image/jpeg (canvas.toDataURL("image/jpeg", 0.85)) — intet andet
// format skal accepteres.
export const AFTALESEDLER_MIME_TYPE = "image/jpeg";

// 20 MB — langt over hvad BilledAnnotering nogensinde producerer
// (canvas skaleret til maks 800px bredde), men uden kunstigt lavere
// teknisk loft. Skal matche bucket'ens file_size_limit i migrationen.
export const AFTALESEDLER_MAX_BYTES = 20 * 1024 * 1024;

// Teknisk loft pr. enkelt upload-urls-kald — ikke en produktmæssig
// grænse på antal billeder pr. aftaleseddel (flere kald kan foretages).
export const AFTALESEDLER_MAX_PR_KALD = 10;

export function genererBilledSti(
  kontraktId: string,
  userId: string,
  uploadSessionId: string,
  fileId: string
): string {
  return `${kontraktId}/${userId}/${uploadSessionId}/${fileId}.jpg`;
}

const BILLED_STI_REGEX =
  /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.jpg$/i;

// Verificerer at en klient-indsendt storage_path faktisk matcher det
// servergenererede stimønster for DEN verificerede kontrakt og bruger.
// Forhindrer at en klient kan referere et andet uploads path (anden
// kontrakt, anden bruger) blot ved at sende en vilkårlig streng.
export function verificerBilledSti(
  storagePath: string,
  forventetKontraktId: string,
  forventetUserId: string
): boolean {
  const match = BILLED_STI_REGEX.exec(storagePath);
  if (!match) return false;
  const [, kontraktId, userId] = match;
  return kontraktId === forventetKontraktId && userId === forventetUserId;
}

export function udledUploadMappe(storagePath: string): string {
  return storagePath.split("/").slice(0, 3).join("/");
}
