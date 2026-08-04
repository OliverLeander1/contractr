import { NextRequest, NextResponse } from "next/server";
import { verifyUser, determineRolle, type ChatRole } from "@/lib/chatAuthorization";
import { createServiceClient } from "@/lib/supabase-server";

const PREVIEW_MAX_LAENGDE = 140;

interface KontraktRow {
  id: string;
  projekt_id: string;
  titel: string | null;
  haandvaerker_email: string | null;
  haandvaerker_navn: string | null;
  haandvaerker_firma: string | null;
}

interface ProjektRow {
  id: string;
  bygherre_id: string;
}

interface AutoriseretKontrakt {
  kontrakt: KontraktRow;
  projekt: ProjektRow;
  rolle: ChatRole;
}

function forkortPreview(indhold: string): string {
  const trimmet = indhold.trim();
  if (trimmet.length <= PREVIEW_MAX_LAENGDE) return trimmet;
  return `${trimmet.slice(0, PREVIEW_MAX_LAENGDE).trimEnd()}…`;
}

function byggLink(rolle: ChatRole, projektId: string, kontraktId: string): string {
  return rolle === "bygherre"
    ? `/projekt/${projektId}/chat/${kontraktId}`
    : `/haandvaerker/projekt/${projektId}/chat/${kontraktId}`;
}

export async function GET(req: NextRequest) {
  const userResult = await verifyUser(req);
  if ("error" in userResult) return userResult.error;
  const { user } = userResult;

  const supabase = createServiceClient();

  try {
    // ------------------------------------------------------------------
    // 1. Find kandidatkontrakter ad to uafhængige veje:
    //    a) bygherre: projekter brugeren ejer
    //    b) håndværker: kontrakter hvor brugerens verificerede email matcher
    //       haandvaerker_email (case-insensitivt, ILIKE-metategn escapet så
    //       "_" og "%" i en emailadresse ikke opfører sig som wildcards)
    // ------------------------------------------------------------------
    const { data: ejedeProjekter, error: projektFejl } = await supabase
      .from("projekter")
      .select("id")
      .eq("bygherre_id", user.id);

    if (projektFejl) {
      console.error("[chat/oversigt] Kunne ikke hente projekter", { code: projektFejl.code });
      return NextResponse.json({ fejl: "Kunne ikke hente oversigt" }, { status: 500 });
    }

    const ejedeProjektIds = (ejedeProjekter ?? []).map((p) => p.id as string);

    const kandidatMap = new Map<string, KontraktRow>();

    if (ejedeProjektIds.length > 0) {
      const inListe = `(${ejedeProjektIds.map((id) => `"${id}"`).join(",")})`;
      const { data: bygherreKontrakter, error: bygherreFejl } = await supabase
        .from("kontrakter")
        .select("id, projekt_id, titel, haandvaerker_email, haandvaerker_navn, haandvaerker_firma")
        .filter("projekt_id::text", "in", inListe);

      if (bygherreFejl) {
        console.error("[chat/oversigt] Kunne ikke hente kontrakter (bygherre)", {
          code: bygherreFejl.code,
        });
        return NextResponse.json({ fejl: "Kunne ikke hente oversigt" }, { status: 500 });
      }

      for (const k of bygherreKontrakter ?? []) {
        kandidatMap.set(k.id, k as KontraktRow);
      }
    }

    if (user.email) {
      const escapedEmail = user.email.replace(/[%_\\]/g, (m) => `\\${m}`);
      const { data: haandvaerkerKontrakter, error: haandvaerkerFejl } = await supabase
        .from("kontrakter")
        .select("id, projekt_id, titel, haandvaerker_email, haandvaerker_navn, haandvaerker_firma")
        .filter("haandvaerker_email", "ilike", escapedEmail);

      if (haandvaerkerFejl) {
        console.error("[chat/oversigt] Kunne ikke hente kontrakter (håndværker)", {
          code: haandvaerkerFejl.code,
        });
        return NextResponse.json({ fejl: "Kunne ikke hente oversigt" }, { status: 500 });
      }

      for (const k of haandvaerkerKontrakter ?? []) {
        kandidatMap.set(k.id, k as KontraktRow);
      }
    }

    const kandidater = Array.from(kandidatMap.values());
    if (kandidater.length === 0) {
      return NextResponse.json({ samtaler: [], ulaest_samlet: 0 });
    }

    // ------------------------------------------------------------------
    // 2. Slå den kanoniske projekt-række op for hver unikke projekt_id på
    //    samme sikre måde som resolveAccess (kontrakter.projekt_id kan ikke
    //    antages at være samme kolonnetype som projekter.id — cast til text
    //    på begge sider af sammenligningen for at undgå ugyldige uuid-fejl).
    // ------------------------------------------------------------------
    const unikkeProjektIds = Array.from(new Set(kandidater.map((k) => k.projekt_id)));
    const projektMap = new Map<string, ProjektRow>();

    await Promise.all(
      unikkeProjektIds.map(async (projektIdRaa) => {
        const { data: projekt } = await supabase
          .from("projekter")
          .select("id, bygherre_id")
          .filter("id::text", "eq", projektIdRaa)
          .maybeSingle();
        if (projekt?.bygherre_id) {
          projektMap.set(projektIdRaa, projekt as ProjektRow);
        }
      })
    );

    // ------------------------------------------------------------------
    // 3. Anvend nøjagtig samme rolleregel som resolveAccess: begge-match
    //    eller intet-match udelukkes. Kontrakter med ukendt/slettet projekt
    //    kan ikke autoriseres og udelades.
    // ------------------------------------------------------------------
    const autoriserede: AutoriseretKontrakt[] = [];
    for (const kontrakt of kandidater) {
      const projekt = projektMap.get(kontrakt.projekt_id);
      if (!projekt) continue;

      const erBygherre = projekt.bygherre_id === user.id;
      const erHaandvaerker =
        !!user.email &&
        !!kontrakt.haandvaerker_email &&
        kontrakt.haandvaerker_email.toLowerCase() === user.email.toLowerCase();

      const rolle = determineRolle(erBygherre, erHaandvaerker);
      if (!rolle) continue;

      autoriserede.push({ kontrakt, projekt, rolle });
    }

    if (autoriserede.length === 0) {
      return NextResponse.json({ samtaler: [], ulaest_samlet: 0 });
    }

    // ------------------------------------------------------------------
    // 4. Find eksisterende samtaler for de autoriserede kontrakter.
    //    Legacy-samtaler med kontrakt_id = NULL kan aldrig matche her,
    //    fordi vi udelukkende slår op på konkrete kontrakt-id'er.
    // ------------------------------------------------------------------
    const kontraktIds = autoriserede.map((a) => a.kontrakt.id);
    const { data: samtaleRows, error: samtaleFejl } = await supabase
      .from("chat_samtaler")
      .select("id, kontrakt_id")
      .in("kontrakt_id", kontraktIds);

    if (samtaleFejl) {
      console.error("[chat/oversigt] Kunne ikke hente samtaler", { code: samtaleFejl.code });
      return NextResponse.json({ fejl: "Kunne ikke hente oversigt" }, { status: 500 });
    }

    const samtaleMap = new Map<string, { id: string }>();
    for (const s of samtaleRows ?? []) {
      if (s.kontrakt_id) samtaleMap.set(s.kontrakt_id as string, { id: s.id as string });
    }

    const medSamtale = autoriserede
      .map((a) => ({ ...a, samtaleId: samtaleMap.get(a.kontrakt.id) }))
      .filter(
        (a): a is AutoriseretKontrakt & { samtaleId: { id: string } } => a.samtaleId !== undefined
      );

    if (medSamtale.length === 0) {
      return NextResponse.json({ samtaler: [], ulaest_samlet: 0 });
    }

    // ------------------------------------------------------------------
    // 5. Modpartsnavn for håndværker-rollen kræver bygherrens profil.
    //    Håndværkerens navn ligger allerede direkte på kontraktrækken.
    // ------------------------------------------------------------------
    const bygherreIdsForOpslag = Array.from(
      new Set(
        medSamtale.filter((a) => a.rolle === "haandvaerker").map((a) => a.projekt.bygherre_id)
      )
    );

    const bygherreNavnMap = new Map<string, string>();
    if (bygherreIdsForOpslag.length > 0) {
      const { data: profiler } = await supabase
        .from("profiler")
        .select("id, navn")
        .in("id", bygherreIdsForOpslag);
      for (const p of profiler ?? []) {
        if (p.navn) bygherreNavnMap.set(p.id as string, p.navn as string);
      }
    }

    // ------------------------------------------------------------------
    // 6. Pr. samtale: seneste besked (til preview) og ulæst-antal for den
    //    verificerede bruger. Korrekthed prioriteres over antal DB-kald i
    //    denne fase — se skaleringsgæld i rapporten.
    // ------------------------------------------------------------------
    const samtaleResultater = await Promise.all(
      medSamtale.map(async (a) => {
        const samtaleId = a.samtaleId.id;

        const [{ data: senesteBesked }, { data: laesestatus }] = await Promise.all([
          supabase
            .from("chat_beskeder")
            .select("id, afsender_id, afsender_navn, indhold, sendt_at")
            .eq("samtale_id", samtaleId)
            .order("sendt_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("chat_laesestatus")
            .select("senest_laeste_besked_id, sidst_laest_at")
            .eq("samtale_id", samtaleId)
            .eq("bruger_id", user.id)
            .maybeSingle(),
        ]);

        let ulaestQuery = supabase
          .from("chat_beskeder")
          .select("id", { count: "exact", head: true })
          .eq("samtale_id", samtaleId)
          .or(`afsender_id.is.null,afsender_id.neq.${user.id}`);

        if (laesestatus) {
          if (laesestatus.senest_laeste_besked_id) {
            ulaestQuery = ulaestQuery.or(
              `sendt_at.gt.${laesestatus.sidst_laest_at},and(sendt_at.eq.${laesestatus.sidst_laest_at},id.gt.${laesestatus.senest_laeste_besked_id})`
            );
          } else {
            // Ankerbeskeden er slettet (ON DELETE SET NULL) — falder tilbage
            // til ren sidst_laest_at-sammenligning. Ved identisk sendt_at
            // uden id-anker regnes beskeden som allerede set (ikke ulæst).
            ulaestQuery = ulaestQuery.gt("sendt_at", laesestatus.sidst_laest_at);
          }
        }

        const { count: ulaestAntal, error: ulaestFejl } = await ulaestQuery;
        if (ulaestFejl) {
          console.error("[chat/oversigt] Kunne ikke beregne ulæst-antal", {
            code: ulaestFejl.code,
          });
        }

        const kontraktTitel = a.kontrakt.titel?.trim() || "Kontrakt";
        const modpartNavn =
          a.rolle === "bygherre"
            ? a.kontrakt.haandvaerker_firma ||
              a.kontrakt.haandvaerker_navn ||
              a.kontrakt.haandvaerker_email ||
              "Håndværker"
            : bygherreNavnMap.get(a.projekt.bygherre_id) || "Bygherre";

        return {
          samtale_id: samtaleId,
          kontrakt_id: a.kontrakt.id,
          projekt_id: a.projekt.id,
          kontrakt_titel: kontraktTitel,
          modpart_navn: modpartNavn,
          seneste_besked_id: senesteBesked?.id ?? null,
          seneste_besked_preview: senesteBesked ? forkortPreview(senesteBesked.indhold) : null,
          seneste_afsender_id: senesteBesked?.afsender_id ?? null,
          seneste_afsender_navn: senesteBesked?.afsender_navn ?? null,
          seneste_sendt_at: senesteBesked?.sendt_at ?? null,
          ulaest_antal: ulaestAntal ?? 0,
          link: byggLink(a.rolle, a.projekt.id, a.kontrakt.id),
        };
      })
    );

    samtaleResultater.sort((a, b) => {
      if (a.seneste_sendt_at === null && b.seneste_sendt_at === null) return 0;
      if (a.seneste_sendt_at === null) return 1;
      if (b.seneste_sendt_at === null) return -1;
      return b.seneste_sendt_at.localeCompare(a.seneste_sendt_at);
    });

    const ulaestSamlet = samtaleResultater.reduce((sum, s) => sum + s.ulaest_antal, 0);

    return NextResponse.json({ samtaler: samtaleResultater, ulaest_samlet: ulaestSamlet });
  } catch (err) {
    console.error("[chat/oversigt] Uventet fejl", err instanceof Error ? err.message : err);
    return NextResponse.json({ fejl: "Kunne ikke hente oversigt" }, { status: 500 });
  }
}
