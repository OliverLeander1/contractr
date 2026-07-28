import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { kode } = await req.json();
  const korrektKode = process.env.MAINTENANCE_PASSWORD;

  if (!korrektKode || kode !== korrektKode) {
    return NextResponse.json({ error: "Forkert kode" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("maintenance_bypass", korrektKode, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dage
  });
  return res;
}
