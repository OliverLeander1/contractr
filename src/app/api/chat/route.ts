import { NextResponse } from "next/server";

const GONE = NextResponse.json(
  { fejl: "Dette endpoint er udgået. Brug /api/chat/samtale og /api/chat/beskeder." },
  { status: 410 }
);

export function GET() { return GONE; }
export function POST() { return GONE; }
