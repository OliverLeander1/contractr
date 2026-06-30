import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADGANGSKODE = "contractr2025";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Giv adgang hvis cookie er sat
  const harAdgang = request.cookies.get("adgang")?.value === ADGANGSKODE;
  if (harAdgang) return NextResponse.next();

  // Hemmelig adgangs-URL: /adgang?kode=contractr2025
  if (pathname === "/adgang") {
    const kode = request.nextUrl.searchParams.get("kode");
    if (kode === ADGANGSKODE) {
      const response = NextResponse.redirect(new URL("/hub", request.url));
      response.cookies.set("adgang", ADGANGSKODE, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 dage
        path: "/",
      });
      return response;
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Tillad forsiden, API-ruter og offentlige udbudsdokumenter (håndværkere har ikke adgangskoden)
  if (pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/udbud/")) return NextResponse.next();

  // Alt andet → forsiden
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)"],
};
