import type { Candle, Instrument, Quote } from "./types";

const BASE = "https://api.twelvedata.com";
const KEY_STORAGE = "sf.apikey";

export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_STORAGE) || "";
}

export function setApiKey(key: string) {
  window.localStorage.setItem(KEY_STORAGE, key.trim());
  window.dispatchEvent(new Event("sf-apikey"));
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

async function td<T = any>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const key = getApiKey();
  if (!key) throw new ApiError("Add your free Twelve Data API key to load data.", 401);

  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("apikey", key);

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new ApiError("Network error reaching Twelve Data.", 0);
  }

  const data = await res.json().catch(() => null);
  if (data && data.status === "error") {
    const code = Number(data.code) || res.status;
    if (code === 401) throw new ApiError("Invalid API key. Check it in Settings.", 401);
    if (code === 429)
      throw new ApiError("Rate limit reached (free tier: 8 calls/min). Wait a moment.", 429);
    throw new ApiError(data.message || "Twelve Data request failed.", code);
  }
  if (!res.ok) throw new ApiError(`Request failed (${res.status}).`, res.status);
  return data as T;
}

/** Fuzzy symbol search — returns matches across global exchanges. */
export async function searchSymbols(query: string): Promise<Instrument[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await td<{ data: any[] }>("symbol_search", { symbol: q, outputsize: 12 });
  const seen = new Set<string>();
  return (data.data || [])
    .map((x) => ({
      symbol: x.symbol,
      name: x.instrument_name,
      exchange: x.exchange,
      micCode: x.mic_code,
      country: x.country,
      currency: x.currency,
      type: x.instrument_type,
    }))
    .filter((x) => {
      const k = `${x.symbol}|${x.micCode}`;
      if (seen.has(k) || !x.symbol) return false;
      seen.add(k);
      return true;
    });
}

function num(v: any): number | undefined {
  const n = parseFloat(v);
  return isFinite(n) ? n : undefined;
}

/** Latest quote for one instrument. */
export async function getQuote(symbol: string, micCode?: string): Promise<Quote> {
  const q = await td<any>("quote", { symbol, mic_code: micCode });
  return {
    symbol: q.symbol || symbol,
    micCode: q.mic_code || micCode || "",
    name: q.name || symbol,
    price: num(q.close) ?? 0,
    currency: q.currency || "USD",
    change: num(q.change) ?? 0,
    changePercent: num(q.percent_change) ?? 0,
    previousClose: num(q.previous_close) ?? num(q.close) ?? 0,
    exchange: q.exchange || "",
    dayHigh: num(q.high),
    dayLow: num(q.low),
    fiftyTwoWeekHigh: num(q.fifty_two_week?.high),
    fiftyTwoWeekLow: num(q.fifty_two_week?.low),
    volume: num(q.volume),
    isOpen: q.is_market_open,
  };
}

export type Range = "1d" | "1w" | "1mo" | "1y" | "5y";

const RANGE_PARAMS: Record<Range, { interval: string; outputsize: number }> = {
  "1d": { interval: "5min", outputsize: 78 },
  "1w": { interval: "30min", outputsize: 80 },
  "1mo": { interval: "1day", outputsize: 22 },
  "1y": { interval: "1day", outputsize: 252 },
  "5y": { interval: "1week", outputsize: 260 },
};

/** Historical candles for charting a given range. */
export async function getHistory(
  symbol: string,
  range: Range,
  micCode?: string,
): Promise<Candle[]> {
  const { interval, outputsize } = RANGE_PARAMS[range];
  const data = await td<{ values: any[] }>("time_series", {
    symbol,
    mic_code: micCode,
    interval,
    outputsize,
  });
  return (data.values || [])
    .map((v) => ({ date: new Date(v.datetime).toISOString(), close: num(v.close) ?? 0 }))
    .filter((c) => c.close > 0)
    .reverse(); // Twelve Data returns newest-first
}

/** Daily closes for the forecast model. */
export async function getDailyCloses(symbol: string, micCode?: string): Promise<Candle[]> {
  const data = await td<{ values: any[] }>("time_series", {
    symbol,
    mic_code: micCode,
    interval: "1day",
    outputsize: 180,
  });
  return (data.values || [])
    .map((v) => ({ date: new Date(v.datetime).toISOString(), close: num(v.close) ?? 0 }))
    .filter((c) => c.close > 0)
    .reverse();
}
