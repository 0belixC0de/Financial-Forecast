import { NextRequest, NextResponse } from "next/server";
import { getHistory, Range } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const VALID: Range[] = ["1d", "1w", "1mo", "1y", "5y"];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  const range = (req.nextUrl.searchParams.get("range") || "1mo") as Range;
  if (!symbol) return NextResponse.json({ candles: [] });
  const r = VALID.includes(range) ? range : "1mo";
  const candles = await getHistory(symbol, r);
  return NextResponse.json({ candles });
}
