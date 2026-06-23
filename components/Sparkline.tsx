"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({ symbol, up }: { symbol: string; up: boolean }) {
  const [data, setData] = useState<{ v: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=1mo`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setData((d.candles || []).map((c: { close: number }) => ({ v: c.close })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (data.length === 0) return <div className="h-10 w-24" />;

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={up ? "#22c55e" : "#ef4444"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
