import type { Candle, Instrument, Quote } from "./types";

// Yahoo Finance has no public CORS headers, so a static (browser-only) site must
// reach it through a CORS proxy. allorigins is free and needs no key; it's
// occasionally flaky, so every call retries, and the proxy is user-overridable.
const DEFAULT_PROXY = "https://api.allorigins.win/raw?url=";
const PROXY_STORAGE = "sf.proxy";
const Y1 = "https://query1.finance.yahoo.com";

export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export function getProxy(): string {
  if (typeof window === "undefined") return DEFAULT_PROXY;
  return window.localStorage.getItem(PROXY_STORAGE) || DEFAULT_PROXY;
}

export function setProxy(url: string) {
  const v = url.trim();
  if (v) window.localStorage.setItem(PROXY_STORAGE, v);
  else window.localStorage.removeItem(PROXY_STORAGE);
  window.dispatchEvent(new Event("sf-proxy"));
}

export function isDefaultProxy(): boolean {
  return getProxy() === DEFAULT_PROXY;
}

export { DEFAULT_PROXY };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function yget<T = any>(path: string, attempts = 3): Promise<T> {
  const target = `${Y1}${path}`;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(getProxy() + encodeURIComponent(target));
      if (!res.ok) throw new ApiError(`Upstream error (${res.status}).`, res.status);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(500 * (i + 1));
    }
  }
  throw lastErr instanceof ApiError
    ? lastErr
    : new ApiError("Couldn’t reach the data proxy. Try again in a moment.", 0);
}

/** Fuzzy symbol search across global exchanges (US, EU, …). */
export async function searchSymbols(query: string): Promise<Instrument[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await yget<{ quotes?: any[] }>(
    `/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`,
  );
  return (data.quotes || [])
    .filter((x) => x.symbol && (x.shortname || x.longname))
    .map((x) => ({
      symbol: x.symbol,
      name: x.shortname || x.longname || x.symbol,
      exchange: x.exchDisp || x.exchange || "",
      micCode: "",
      country: "",
      currency: undefined,
      type: x.typeDisp || x.quoteType || "",
    }));
}

interface ChartResult {
  meta: any;
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

async function chart(symbol: string, range: string, interval: string): Promise<ChartResult> {
  const data = await yget<{ chart: { result?: ChartResult[]; error?: any } }>(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
  );
  if (data.chart?.error) {
    throw new ApiError(data.chart.error.description || "Symbol not found.", 404);
  }
  const result = data.chart?.result?.[0];
  if (!result) throw new ApiError("No data for that symbol.", 404);
  return result;
}

/** Latest quote + key stats, derived from the chart endpoint's metadata. */
export async function getQuote(symbol: string): Promise<Quote> {
  const { meta } = await chart(symbol, "1d", "1d");
  const price = meta.regularMarketPrice ?? 0;
  const prev = meta.previousClose ?? meta.chartPreviousClose ?? price;
  const change = price - prev;
  return {
    symbol: meta.symbol || symbol,
    micCode: "",
    name: meta.longName || meta.shortName || symbol,
    price,
    currency: meta.currency || "USD",
    change,
    changePercent: prev ? (change / prev) * 100 : 0,
    previousClose: prev,
    exchange: meta.fullExchangeName || meta.exchangeName || "",
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    volume: meta.regularMarketVolume,
    isOpen: undefined,
  };
}

export type Range = "1d" | "1w" | "1mo" | "1y" | "5y";

const RANGE_PARAMS: Record<Range, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "1w": { range: "5d", interval: "30m" },
  "1mo": { range: "1mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
};

function toCandles(r: ChartResult): Candle[] {
  const ts = r.timestamp || [];
  const closes = r.indicators?.quote?.[0]?.close || [];
  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c != null && isFinite(c)) {
      out.push({ date: new Date(ts[i] * 1000).toISOString(), close: c });
    }
  }
  return out;
}

/** Historical candles for charting a given range. */
export async function getHistory(symbol: string, range: Range): Promise<Candle[]> {
  const { range: r, interval } = RANGE_PARAMS[range];
  return toCandles(await chart(symbol, r, interval));
}

/** ~6 months of daily closes for the forecast model. */
export async function getDailyCloses(symbol: string): Promise<Candle[]> {
  return toCandles(await chart(symbol, "6mo", "1d"));
}
