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
import { getHistory, Range } from "../lib/api";
import type { Candle } from "../lib/types";
import { formatPrice } from "../lib/format";

const RANGES: { key: Range; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1mo", label: "1M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

export function PriceChart({
  symbol,
  micCode,
  currency,
}: {
  symbol: string;
  micCode: string;
  currency: string;
}) {
  const [range, setRange] = useState<Range>("1mo");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getHistory(symbol, range, micCode)
      .then((c) => !cancelled && setCandles(c))
      .catch((e) => !cancelled && setError(e?.message || "Failed to load chart."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, micCode, range]);

  const data = useMemo(
    () =>
      candles.map((c) => ({
        close: c.close,
        label:
          range === "1d" || range === "1w"
            ? new Date(c.date).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
              })
            : new Date(c.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: range === "5y" ? "2-digit" : undefined,
              }),
      })),
    [candles, range],
  );

  const up = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const color = up ? "#10b981" : "#f43f5e";

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Price history</h2>
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                range === r.key
                  ? "bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        {loading && data.length === 0 ? (
          <Centered>Loading chart…</Centered>
        ) : error ? (
          <Centered className="text-rose-500">{error}</Centered>
        ) : data.length === 0 ? (
          <Centered>No data for this range.</Centered>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pcFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#8888881f" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={44} tickLine={false} axisLine={false} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11 }}
                width={64}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatPrice(v, currency)}
              />
              <Tooltip
                formatter={(v: number) => [formatPrice(v, currency), "Close"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#pcFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Centered({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex h-full items-center justify-center text-sm text-zinc-400 ${className}`}>
      {children}
    </div>
  );
}
