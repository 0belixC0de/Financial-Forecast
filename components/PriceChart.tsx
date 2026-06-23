"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Candle } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const RANGES: { key: string; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1mo", label: "1M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

export function PriceChart({ symbol, currency }: { symbol: string; currency: string }) {
  const [range, setRange] = useState("1mo");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCandles(d.candles || []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  const data = useMemo(
    () =>
      candles.map((c) => ({
        t: c.date,
        close: c.close,
        label:
          range === "1d" || range === "1w"
            ? new Date(c.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" })
            : new Date(c.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: range === "5y" ? "2-digit" : undefined }),
      })),
    [candles, range],
  );

  const up = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const color = up ? "#22c55e" : "#ef4444";

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Price history</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                range === r.key
                  ? "bg-brand text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        {loading && data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Loading chart…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No data for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888822" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={40} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                width={60}
                tickFormatter={(v) => formatPrice(v, currency)}
              />
              <Tooltip
                formatter={(v: number) => [formatPrice(v, currency), "Close"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
