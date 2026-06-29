import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    harNøgle: !!key,
    længde: key?.length ?? 0,
    starter: key?.substring(0, 10) ?? "ikke sat",
    allKeys: Object.keys(process.env).filter(k => k.includes("ANTHROP")),
  });
}
