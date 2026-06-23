import { useEffect, useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDailyCloses } from "../lib/api";
import { computeForecast, momentumSentiment, sentimentToBias } from "../lib/forecast";
import type { Forecast } from "../lib/types";
import { formatDate, formatPercent, formatPrice } from "../lib/format";

const HORIZON = 7;

const SENTIMENT_STYLE: Record<string, string> = {
  bullish: "pos bg-emerald-500/10",
  neutral: "text-zinc-500 bg-zinc-500/10",
  bearish: "neg bg-rose-500/10",
};

export function ForecastCard({
  symbol,
  currency,
}: {
  symbol: string;
  currency: string;
}) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDailyCloses(symbol)
      .then((closes) => {
        if (cancelled) return;
        if (closes.length < 5) {
          setError("Not enough history to forecast this symbol.");
          return;
        }
        const mood = momentumSentiment(closes);
        const math = computeForecast(closes, HORIZON, sentimentToBias(mood.sentiment));
        setForecast({
          symbol,
          horizonDays: HORIZON,
          generatedAt: new Date().toISOString(),
          lastClose: math.lastClose,
          currency,
          points: math.points,
          trendPerDay: math.trendPerDay,
          dailyVolatility: math.dailyVolatility,
          sentiment: mood.sentiment,
          sentimentReason: mood.reason,
        });
      })
      .catch((e) => !cancelled && setError(e?.message || "Forecast failed."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, currency]);

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return [
      { label: "now", mean: forecast.lastClose, base: forecast.lastClose, band: 0 },
      ...forecast.points.map((p) => ({
        label: formatDate(p.date),
        mean: p.mean,
        base: p.lower,
        band: p.upper - p.lower,
      })),
    ];
  }, [forecast]);

  if (loading) {
    return (
      <div className="card flex h-72 items-center justify-center text-sm text-zinc-400">
        Building 7-day forecast…
      </div>
    );
  }
  if (error || !forecast) {
    return <div className="card text-sm text-zinc-500">{error || "No forecast."}</div>;
  }

  const last = forecast.points[forecast.points.length - 1];
  const expectedPct = ((last.mean - forecast.lastClose) / forecast.lastClose) * 100;
  const cur = forecast.currency;

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">7-day forecast</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SENTIMENT_STYLE[forecast.sentiment]}`}
        >
          {forecast.sentiment}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-zinc-400">Range </span>
          <span className="font-semibold tabular-nums">
            {formatPrice(last.lower, cur)} – {formatPrice(last.upper, cur)}
          </span>
        </div>
        <div>
          <span className="text-zinc-400">Midpoint </span>
          <span className={`font-semibold tabular-nums ${expectedPct >= 0 ? "pos" : "neg"}`}>
            {formatPrice(last.mean, cur)} ({formatPercent(expectedPct)})
          </span>
        </div>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              width={60}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatPrice(v, cur)}
            />
            <Tooltip
              formatter={(v: number, n) => [formatPrice(v, cur), n === "mean" ? "Projected" : n]}
              contentStyle={{ fontSize: 12, borderRadius: 12, border: "none" }}
            />
            <Area dataKey="base" stackId="b" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area dataKey="band" stackId="b" stroke="none" fill="#10b981" fillOpacity={0.16} isAnimationActive={false} />
            <Line dataKey="mean" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        <span className="font-medium capitalize">{forecast.sentiment} momentum.</span>{" "}
        {forecast.sentimentReason}
      </p>

      <div className="mt-3 border-t border-zinc-200/70 pt-2 text-xs text-zinc-400 dark:border-white/10">
        Trend-and-volatility model with a 90% confidence band, nudged by a
        price-based momentum signal. Trend {formatPercent(forecast.trendPerDay * 100)}/day.
        Estimate only — not financial advice.
      </div>
    </div>
  );
}
