"use client";

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
import type { Forecast } from "@/lib/types";
import { formatDate, formatPrice, formatPercent } from "@/lib/format";

const SENTIMENT_STYLE: Record<string, string> = {
  bullish: "text-green-600 bg-green-100 dark:bg-green-900/40",
  neutral: "text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300",
  bearish: "text-red-600 bg-red-100 dark:bg-red-900/40",
};

export function ForecastCard({ symbol }: { symbol: string }) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/forecast?symbol=${encodeURIComponent(symbol)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Forecast failed");
        return r.json();
      })
      .then((d) => !cancelled && setForecast(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return [
      {
        label: "today",
        mean: forecast.lastClose,
        lower: forecast.lastClose,
        upper: forecast.lastClose,
        band: 0,
      },
      ...forecast.points.map((p) => ({
        label: formatDate(p.date),
        mean: p.mean,
        lower: p.lower,
        upper: p.upper,
        // stacked area trick: render lower as transparent base, band as visible.
        base: p.lower,
        band: p.upper - p.lower,
      })),
    ];
  }, [forecast]);

  if (loading) {
    return (
      <div className="card flex h-64 items-center justify-center text-sm text-zinc-400">
        Building 7-day forecast…
      </div>
    );
  }
  if (error || !forecast) {
    return (
      <div className="card text-sm text-zinc-500">
        Couldn’t build a forecast: {error || "no data"}.
      </div>
    );
  }

  const last = forecast.points[forecast.points.length - 1];
  const expectedPct = ((last.mean - forecast.lastClose) / forecast.lastClose) * 100;
  const cur = forecast.currency;

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">7-day forecast</h2>
        {forecast.sentiment && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SENTIMENT_STYLE[forecast.sentiment]}`}>
            {forecast.sentiment}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-zinc-400">Projected range </span>
          <span className="font-medium">
            {formatPrice(last.lower, cur)} – {formatPrice(last.upper, cur)}
          </span>
        </div>
        <div>
          <span className="text-zinc-400">Midpoint </span>
          <span className={expectedPct >= 0 ? "font-medium text-green-600" : "font-medium text-red-500"}>
            {formatPrice(last.mean, cur)} ({formatPercent(expectedPct)})
          </span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={20} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={56} tickFormatter={(v) => formatPrice(v, cur)} />
            <Tooltip
              formatter={(v: number, name) => [formatPrice(v, cur), name === "mean" ? "Projected" : name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            {/* Confidence band: transparent base + visible band stacked on top. */}
            <Area dataKey="base" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area dataKey="band" stackId="band" stroke="none" fill="#16a34a" fillOpacity={0.15} isAnimationActive={false} />
            <Line dataKey="mean" stroke="#16a34a" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {forecast.summary && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{forecast.summary}</p>
      )}
      {forecast.drivers && forecast.drivers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {forecast.drivers.map((d, i) => (
            <span key={i} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
              {d}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-zinc-100 pt-2 text-xs text-zinc-400 dark:border-zinc-800">
        {forecast.newsEnabled ? (
          forecast.sentiment ? (
            "Statistical model + AI news analysis (Claude)."
          ) : (
            "Statistical model. (News analysis returned nothing this time.)"
          )
        ) : (
          "Statistical model only. Add an ANTHROPIC_API_KEY to enable AI news analysis."
        )}{" "}
        90% confidence band · trend {formatPercent(forecast.trendPerDay * 100)}/day.
        Estimate only — not financial advice.
      </div>
    </div>
  );
}
