export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  previousClose: number;
  marketState: string;
  exchange: string;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  volume?: number;
}

export interface Candle {
  date: string; // ISO date
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface ForecastPoint {
  date: string;
  mean: number;
  lower: number;
  upper: number;
}

export type Sentiment = "bullish" | "neutral" | "bearish";

export interface NewsItem {
  title: string;
  publisher?: string;
  link?: string;
  publishedAt?: string;
}

export interface Forecast {
  symbol: string;
  horizonDays: number;
  generatedAt: string;
  lastClose: number;
  currency: string;
  points: ForecastPoint[];
  // Annualised-ish drift/volatility figures used, for transparency.
  trendPerDay: number;
  dailyVolatility: number;
  // News layer (only populated when an Anthropic key is configured).
  newsEnabled: boolean;
  sentiment?: Sentiment;
  summary?: string;
  drivers?: string[];
  news?: NewsItem[];
}
