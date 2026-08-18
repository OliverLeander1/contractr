import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Ruter der kræver login OG specifik rolle
const KUN_BYGHERRE = ["/dashboard", "/projekt", "/konto", "/tilkoeb/book"];
const KUN_HAANDVAERKER = ["/haandvaerker/sager", "/haandvaerker/nyt-tilbud", "/haandvaerker/profil", "/haandvaerker/projekt"];
// Kræver login, men er delt mellem begge roller — må IKKE rolle-gates.
// /notifikationer og /chat er begge allerede rolle-bevidste i deres eget
// indhold (egenRolle/linkTil hhv. rollebestemte links fra /api/chat/oversigt).
// Stod tidligere fejlagtigt i KUN_BYGHERRE, hvilket sendte en entreprenør,
// der klikkede på Notifikationer/Samtaler, tilbage til /haandvaerker/sager
// igen — set fra brugeren som "der sker ingenting" ved klik.
const DELT_AUTH = ["/notifikationer", "/chat"];
const BESKYTTEDE = [...KUN_BYGHERRE, ...KUN_HAANDVAERKER, ...DELT_AUTH];

// Ruter der altid er tilgængelige selv under vedligeholdelse
const VEDLIGEHOLDELSE_UNDTAGET = ["/under-vedligeholdelse", "/api/maintenance", "/kontrakt", "/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vedligeholdelsestilstand
  if (process.env.MAINTENANCE_MODE === "true") {
    const erUndtaget = VEDLIGEHOLDELSE_UNDTAGET.some(p => pathname.startsWith(p));
    if (!erUndtaget) {
      const bypass = request.cookies.get("maintenance_bypass")?.value;
      if (bypass !== process.env.MAINTENANCE_PASSWORD) {
        return NextResponse.redirect(new URL("/under-vedligeholdelse", request.url));
      }
    }
  }

  // Logged-in users hitting "/" get sent to their dashboard
  if (pathname === "/") {
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch role to determine destination
      const { data: profil } = await supabase
        .from("profiler")
        .select("rolle")
        .eq("id", user.id)
        .maybeSingle();
      const dest = profil?.rolle === "haandvaerker" ? "/haandvaerker/sager" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return response;
  }

  // Tjek om ruten er beskyttet
  const erBeskyttet = BESKYTTEDE.some((prefix) => pathname.startsWith(prefix));
  if (!erBeskyttet) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Hentes for enhver beskyttet, autentificeret rute (ikke kun rolle-
  // specifikke), så "konto planlagt til sletning"-gaten fortsat gælder
  // /notifikationer og /chat, selvom de ikke længere er rolle-låst.
  const { data: profil } = await supabase
    .from("profiler")
    .select("rolle, slettet_planlagt_at")
    .eq("id", user.id)
    .maybeSingle();

  // Konto er planlagt til sletning — send til gendanningsside
  if (profil?.slettet_planlagt_at && !pathname.startsWith("/konto/gendan")) {
    return NextResponse.redirect(new URL("/konto/gendan", request.url));
  }

  // Tjek rolle hvis ruten er rolle-specifik
  const erKunBygherre = KUN_BYGHERRE.some(p => pathname.startsWith(p));
  const erKunHaandvaerker = KUN_HAANDVAERKER.some(p => pathname.startsWith(p));
  const rolle = profil?.rolle;

  if (erKunBygherre && rolle === "haandvaerker") {
    return NextResponse.redirect(new URL("/haandvaerker/sager", request.url));
  }
  if (erKunHaandvaerker && rolle !== "haandvaerker") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|api/).*)"],
};
