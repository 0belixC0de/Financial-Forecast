import { NextRequest, NextResponse } from "next/server";
import { getDailyCloses, getNews, getQuote } from "@/lib/yahoo";
import { computeForecast, sentimentToBias } from "@/lib/forecast";
import { analyzeNews, isNewsEnabled } from "@/lib/news-ai";
import type { Forecast } from "@/lib/types";

export const dynamic = "force-dynamic";

const HORIZON = 7;

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const [closes, quote] = await Promise.all([
    getDailyCloses(symbol),
    getQuote(symbol),
  ]);

  if (closes.length === 0) {
    return NextResponse.json(
      { error: "No historical data for that symbol." },
      { status: 404 },
    );
  }

  const newsEnabled = isNewsEnabled();
  let sentiment;
  let summary;
  let drivers;
  let news;

  if (newsEnabled) {
    const items = await getNews(symbol);
    news = items;
    const analysis = await analyzeNews(symbol, quote?.name || symbol, items);
    if (analysis) {
      sentiment = analysis.sentiment;
      summary = analysis.summary;
      drivers = analysis.drivers;
    }
  }

  const math = computeForecast(closes, HORIZON, sentimentToBias(sentiment));

  const forecast: Forecast = {
    symbol,
    horizonDays: HORIZON,
    generatedAt: new Date().toISOString(),
    lastClose: math.lastClose,
    currency: quote?.currency || "USD",
    points: math.points,
    trendPerDay: math.trendPerDay,
    dailyVolatility: math.dailyVolatility,
    newsEnabled,
    sentiment,
    summary,
    drivers,
    news,
  };

  return NextResponse.json(forecast);
}
