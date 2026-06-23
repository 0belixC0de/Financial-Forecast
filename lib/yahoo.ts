import "server-only";
import yahooFinance from "yahoo-finance2";
import type { Candle, NewsItem, Quote, SearchResult } from "./types";

/** Search for symbols by company name or ticker. Forgiving of partial input. */
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await yahooFinance.search(q, { quotesCount: 10, newsCount: 0 });
    return (res.quotes || [])
      .filter((x: any) => x.symbol && (x.shortname || x.longname))
      .map((x: any) => ({
        symbol: x.symbol,
        name: x.shortname || x.longname || x.symbol,
        exchange: x.exchDisp || x.exchange || "",
        type: x.quoteType || x.typeDisp || "",
      }));
  } catch {
    return [];
  }
}

/** Latest quote + key stats for a symbol. */
export async function getQuote(symbol: string): Promise<Quote | null> {
  try {
    const q: any = await yahooFinance.quote(symbol);
    if (!q || typeof q.regularMarketPrice !== "number") return null;
    return {
      symbol: q.symbol,
      name: q.longName || q.shortName || q.symbol,
      price: q.regularMarketPrice,
      currency: q.currency || "USD",
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      previousClose: q.regularMarketPreviousClose ?? q.regularMarketPrice,
      marketState: q.marketState || "CLOSED",
      exchange: q.fullExchangeName || q.exchange || "",
      dayHigh: q.regularMarketDayHigh,
      dayLow: q.regularMarketDayLow,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
      marketCap: q.marketCap,
      volume: q.regularMarketVolume,
    };
  } catch {
    return null;
  }
}

export type Range = "1d" | "1w" | "1mo" | "1y" | "5y";

function rangeToParams(range: Range): { period1: Date; interval: any } {
  const now = new Date();
  const start = new Date(now);
  switch (range) {
    case "1d":
      start.setDate(now.getDate() - 1);
      return { period1: start, interval: "5m" };
    case "1w":
      start.setDate(now.getDate() - 7);
      return { period1: start, interval: "30m" };
    case "1mo":
      start.setMonth(now.getMonth() - 1);
      return { period1: start, interval: "1d" };
    case "1y":
      start.setFullYear(now.getFullYear() - 1);
      return { period1: start, interval: "1d" };
    case "5y":
      start.setFullYear(now.getFullYear() - 5);
      return { period1: start, interval: "1wk" };
  }
}

/** Historical candles for charting. */
export async function getHistory(symbol: string, range: Range): Promise<Candle[]> {
  const { period1, interval } = rangeToParams(range);
  try {
    const res: any = await yahooFinance.chart(symbol, { period1, interval });
    const quotes = res?.quotes || [];
    return quotes
      .filter((c: any) => c.close != null && c.date)
      .map((c: any) => ({
        date: new Date(c.date).toISOString(),
        close: c.close,
        open: c.open ?? undefined,
        high: c.high ?? undefined,
        low: c.low ?? undefined,
        volume: c.volume ?? undefined,
      }));
  } catch {
    return [];
  }
}

/** Daily closes for the forecasting model (1 year of data). */
export async function getDailyCloses(symbol: string, days = 365): Promise<Candle[]> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  try {
    const res: any = await yahooFinance.chart(symbol, {
      period1: start,
      interval: "1d",
    });
    return (res?.quotes || [])
      .filter((c: any) => c.close != null && c.date)
      .map((c: any) => ({ date: new Date(c.date).toISOString(), close: c.close }));
  } catch {
    return [];
  }
}

/** Recent news headlines for a symbol. */
export async function getNews(symbol: string, count = 8): Promise<NewsItem[]> {
  try {
    const res = await yahooFinance.search(symbol, { newsCount: count, quotesCount: 0 });
    return (res.news || []).map((n: any) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime).toISOString()
        : undefined,
    }));
  } catch {
    return [];
  }
}
