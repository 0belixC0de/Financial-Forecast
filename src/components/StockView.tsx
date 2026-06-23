import { useEffect, useState } from "react";
import { ApiError, getQuote } from "../lib/api";
import { navigate, useWatchlist } from "../lib/store";
import type { Quote } from "../lib/types";
import {
  formatChange,
  formatCompact,
  formatPercent,
  formatPrice,
  formatTime,
} from "../lib/format";
import { PriceChart } from "./PriceChart";
import { ForecastCard } from "./ForecastCard";
import { AlertsPanel } from "./AlertsPanel";

const POLL_MS = 60_000;

export function StockView({
  symbol,
  displayName,
}: {
  symbol: string;
  displayName: string;
}) {
  const micCode = "";
  const [quote, setQuote] = useState<Quote | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { has, add, remove } = useWatchlist();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = await getQuote(symbol);
        if (cancelled) return;
        setQuote(q);
        setUpdated(new Date().toISOString());
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load.");
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  const watching = has(symbol, micCode);
  const name = quote?.name || displayName;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-zinc-500 hover:text-brand-600"
      >
        ← Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{symbol}</h1>
              {quote?.exchange && (
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-white/10">
                  {quote.exchange}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{name}</p>

            {quote ? (
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-extrabold tabular-nums">
                  {formatPrice(quote.price, quote.currency)}
                </span>
                <span
                  className={`pb-1.5 text-sm font-semibold tabular-nums ${
                    quote.changePercent >= 0 ? "pos" : "neg"
                  }`}
                >
                  {formatChange(quote.change)} ({formatPercent(quote.changePercent)})
                </span>
              </div>
            ) : (
              <div className="mt-3 h-10 w-40 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
            )}
            {updated && (
              <p className="mt-1 text-xs text-zinc-400">
                {quote?.isOpen ? "Market open" : "Market closed"} · updated{" "}
                {formatTime(updated)}
              </p>
            )}
          </div>

          <button
            onClick={() =>
              watching ? remove(symbol, micCode) : add({ symbol, micCode, name })
            }
            className={watching ? "btn-ghost" : "btn-primary"}
          >
            {watching ? "★ Watching" : "☆ Add to watchlist"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

        {quote && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Prev close" value={formatPrice(quote.previousClose, quote.currency)} />
            <Stat
              label="Day range"
              value={
                quote.dayLow != null && quote.dayHigh != null
                  ? `${formatPrice(quote.dayLow, quote.currency)} – ${formatPrice(quote.dayHigh, quote.currency)}`
                  : "—"
              }
            />
            <Stat
              label="52-wk range"
              value={
                quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null
                  ? `${formatPrice(quote.fiftyTwoWeekLow, quote.currency)} – ${formatPrice(quote.fiftyTwoWeekHigh, quote.currency)}`
                  : "—"
              }
            />
            <Stat label="Volume" value={formatCompact(quote.volume)} />
          </div>
        )}
      </div>

      <PriceChart symbol={symbol} currency={quote?.currency || "USD"} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ForecastCard symbol={symbol} currency={quote?.currency || "USD"} />
        <AlertsPanel
          symbol={symbol}
          micCode={micCode}
          name={name}
          currency={quote?.currency || "USD"}
          currentPrice={quote?.price}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/[0.03]">
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
