"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/types";
import {
  formatChange,
  formatCompact,
  formatPercent,
  formatPrice,
  formatTime,
} from "@/lib/format";
import { WatchButton } from "./WatchButton";

const POLL_MS = 45_000;

export function StockHeader({ initialQuote }: { initialQuote: Quote }) {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [updated, setUpdated] = useState<string>(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/quote?symbols=${encodeURIComponent(initialQuote.symbol)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.quotes?.[0]) {
          setQuote(data.quotes[0]);
          setUpdated(new Date().toISOString());
        }
      } catch {
        /* keep last good */
      }
    }
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [initialQuote.symbol]);

  const up = quote.changePercent >= 0;

  const stats: { label: string; value: string }[] = [
    { label: "Open / Prev close", value: formatPrice(quote.previousClose, quote.currency) },
    { label: "Day range", value: quote.dayLow != null && quote.dayHigh != null ? `${formatPrice(quote.dayLow, quote.currency)} – ${formatPrice(quote.dayHigh, quote.currency)}` : "—" },
    { label: "52-week range", value: quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null ? `${formatPrice(quote.fiftyTwoWeekLow, quote.currency)} – ${formatPrice(quote.fiftyTwoWeekHigh, quote.currency)}` : "—" },
    { label: "Volume", value: formatCompact(quote.volume) },
    { label: "Market cap", value: formatCompact(quote.marketCap) },
  ];

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{quote.symbol}</h1>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
              {quote.exchange}
            </span>
          </div>
          <p className="text-sm text-zinc-500">{quote.name}</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(quote.price, quote.currency)}</span>
            <span className={up ? "pb-1 text-green-600" : "pb-1 text-red-500"}>
              {formatChange(quote.change)} ({formatPercent(quote.changePercent)})
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {quote.marketState} · updated {formatTime(updated)} · ~15 min delayed
          </p>
        </div>
        <WatchButton symbol={quote.symbol} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50">
            <div className="text-[11px] uppercase tracking-wide text-zinc-400">{s.label}</div>
            <div className="text-sm font-medium">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
