export interface Instrument {
  symbol: string;
  name: string;
  exchange: string;
  micCode: string;
  country: string;
  currency?: string;
  type: string;
}

export interface Quote {
  symbol: string;
  micCode: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  previousClose: number;
  exchange: string;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  isOpen?: boolean;
}

export interface Candle {
  date: string; // ISO
  close: number;
}

export interface ForecastPoint {
  date: string;
  mean: number;
  lower: number;
  upper: number;
}

export type Sentiment = "bullish" | "neutral" | "bearish";

export interface Forecast {
  symbol: string;
  horizonDays: number;
  generatedAt: string;
  lastClose: number;
  currency: string;
  points: ForecastPoint[];
  trendPerDay: number;
  dailyVolatility: number;
  sentiment: Sentiment;
  sentimentReason: string;
}
