import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/cvr?nr=12345678
export async function GET(req: NextRequest) {
  const nr = req.nextUrl.searchParams.get("nr")?.replace(/\s/g, "");

  if (!nr || !/^\d{8}$/.test(nr)) {
    return NextResponse.json({ error: "Ugyldigt CVR-nummer — skal være 8 cifre" }, { status: 400 });
  }

  try {
    const r = await fetch(
      `https://cvrapi.dk/api?search=${nr}&country=dk`,
      { headers: { "User-Agent": "Contractr/1.0 (oliverleander97@gmail.com)" } }
    );

    if (!r.ok) {
      return NextResponse.json({ error: "CVR-nummer ikke fundet" }, { status: 404 });
    }

    const data = await r.json();

    if (data.error) {
      return NextResponse.json({ error: "CVR-nummer ikke fundet" }, { status: 404 });
    }

    return NextResponse.json({
      cvr: nr,
      navn: data.name || null,
      adresse: [data.address, data.zipcode, data.city].filter(Boolean).join(", "),
      telefon: data.phone || null,
      email: data.email || null,
    });
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente CVR-data" }, { status: 500 });
  }
}
