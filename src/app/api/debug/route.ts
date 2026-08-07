import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Ingen kendte kaldssteder i tracked kode. Endpointet eksponerede tidligere
// dele af ANTHROPIC_API_KEY og relaterede miljøvariabelnavne — lukket helt
// i stedet for at bygge et separat auth-lag til en enkelt debug-route.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
