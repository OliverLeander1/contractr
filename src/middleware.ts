import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Ruter der kræver login
const BESKYTTEDE = ["/dashboard", "/projekt", "/konto", "/notifikationer", "/haandvaerker/sager", "/haandvaerker/nyt-tilbud", "/haandvaerker/profil", "/haandvaerker/projekt", "/tilkoeb/book"];

// Ruter der altid er tilgængelige selv under vedligeholdelse
const VEDLIGEHOLDELSE_UNDTAGET = ["/under-vedligeholdelse", "/api/maintenance"];

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|api/).*)"],
};
