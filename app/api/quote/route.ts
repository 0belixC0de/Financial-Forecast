import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get("symbols") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 25);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const quotes = (await Promise.all(symbols.map((s) => getQuote(s)))).filter(
    (q) => q !== null,
  );
  return NextResponse.json({ quotes });
}
