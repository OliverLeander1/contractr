import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export type KontraktRolle = "bygherre" | "haandvaerker";

interface KontraktTilRolletjek {
  bygherre_id: string | null;
  haandvaerker_email: string | null;
}

// Verificerer Bearer JWT og udleder afsenderens rolle på en konkret
// kontrakt — aldrig fra request body. Bygherre-adgang bekræftes mod
// kontraktens bygherre_id, entreprenør-adgang mod verificeret login-email
// sammenlignet med kontraktens haandvaerker_email. Samme mønster som
// /api/kontrakt/[token]/godkend og /api/kontrakt/[token]/forslag.
export async function verificerKontraktRolle(
  req: NextRequest,
  db: ReturnType<typeof createServiceClient>,
  kontrakt: KontraktTilRolletjek
): Promise<{ rolle: KontraktRolle; userId: string } | { fejl: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { fejl: NextResponse.json({ error: "Ikke logget ind" }, { status: 401 }) };
  }
  const accessToken = authHeader.replace("Bearer ", "");

  const { data: { user }, error: authError } = await db.auth.getUser(accessToken);
  if (authError || !user) {
    return { fejl: NextResponse.json({ error: "Ugyldig session" }, { status: 401 }) };
  }

  const erBygherre = user.id === kontrakt.bygherre_id;
  const erHaandvaerker = !!(
    kontrakt.haandvaerker_email &&
    user.email &&
    user.email.trim().toLowerCase() === kontrakt.haandvaerker_email.trim().toLowerCase()
  );

  if (erBygherre && erHaandvaerker) {
    return { fejl: NextResponse.json({ error: "Adgang nægtet" }, { status: 403 }) };
  }
  if (!erBygherre && !erHaandvaerker) {
    return { fejl: NextResponse.json({ error: "Du har ikke adgang til denne kontrakt" }, { status: 403 }) };
  }

  return { rolle: erBygherre ? "bygherre" : "haandvaerker", userId: user.id };
}
