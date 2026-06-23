import type { Candle, ForecastPoint, Sentiment } from "./types";

export interface ForecastMath {
  points: ForecastPoint[];
  lastClose: number;
  trendPerDay: number;
  dailyVolatility: number;
}

/**
 * Produce a forward price projection from historical daily closes.
 *
 * Approach (explainable, not a black box):
 *  - Fit a linear trend to log-prices over a recent window -> daily drift.
 *  - Estimate daily volatility from the standard deviation of log-returns.
 *  - Project the mean forward by the drift, and widen a confidence band
 *    proportional to volatility * sqrt(days) (random-walk spreading).
 *
 * `sentimentBias` (from the optional news layer) gently nudges the drift:
 * bullish = +, bearish = -. It only adjusts, never dominates, the math.
 */
export function computeForecast(
  closes: Candle[],
  horizonDays: number,
  sentimentBias = 0,
): ForecastMath {
  const series = closes
    .map((c) => c.close)
    .filter((v) => typeof v === "number" && v > 0);

  const lastClose = series[series.length - 1] ?? 0;

  if (series.length < 5 || lastClose <= 0) {
    // Not enough data: flat projection with a nominal band.
    const points: ForecastPoint[] = [];
    for (let d = 1; d <= horizonDays; d++) {
      points.push({ date: futureDate(d), mean: lastClose, lower: lastClose, upper: lastClose });
    }
    return { points, lastClose, trendPerDay: 0, dailyVolatility: 0 };
  }

  // Use up to the last 90 observations for trend estimation.
  const window = series.slice(-90);
  const logs = window.map((v) => Math.log(v));

  // Linear regression of log-price on time index -> slope = daily log drift.
  const n = logs.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = logs.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (logs[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  let slope = den === 0 ? 0 : num / den; // log-return per day

  // Daily volatility from log-returns.
  const returns: number[] = [];
  for (let i = 1; i < logs.length; i++) returns.push(logs[i] - logs[i - 1]);
  const meanR = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance =
    returns.reduce((a, b) => a + (b - meanR) ** 2, 0) / (returns.length || 1);
  const vol = Math.sqrt(variance);

  // Apply a small sentiment nudge to the drift (capped to half a daily sigma).
  const bias = clamp(sentimentBias, -1, 1) * (vol * 0.5);
  slope += bias;

  const points: ForecastPoint[] = [];
  for (let d = 1; d <= horizonDays; d++) {
    const meanLog = Math.log(lastClose) + slope * d;
    const spread = 1.645 * vol * Math.sqrt(d); // ~90% band
    points.push({
      date: futureDate(d),
      mean: Math.exp(meanLog),
      lower: Math.exp(meanLog - spread),
      upper: Math.exp(meanLog + spread),
    });
  }

  return {
    points,
    lastClose,
    trendPerDay: Math.expm1(slope), // approx % per day
    dailyVolatility: vol,
  };
}

export function sentimentToBias(s: Sentiment | undefined): number {
  if (s === "bullish") return 1;
  if (s === "bearish") return -1;
  return 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}
