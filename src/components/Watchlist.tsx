import { useCallback, useEffect, useState } from "react";
import { getQuote, hasApiKey } from "../lib/api";
import { navigate, useWatchlist } from "../lib/store";
import type { Quote } from "../lib/types";
import { formatChange, formatPercent, formatPrice, formatTime } from "../lib/format";

const POLL_MS = 90_000;

export function Watchlist() {
  const { items, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [updated, setUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (items.length === 0 || !hasApiKey()) return;
    setLoading(true);
    const next: Record<string, Quote> = {};
    // Sequential to stay within the free tier's per-minute limit.
    for (const it of items) {
      try {
        next[`${it.symbol}|${it.micCode}`] = await getQuote(it.symbol, it.micCode);
      } catch {
        /* skip this one */
      }
    }
    setQuotes(next);
    setUpdated(new Date().toISOString());
    setLoading(false);
  }, [items]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-1 py-10 text-center">
        <div className="text-3xl">⭐</div>
        <p className="font-semibold">Your watchlist is empty</p>
        <p className="text-sm text-zinc-500">
          Search for a stock above and add it to track price and forecasts here.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Watchlist</h2>
        <span className="text-xs text-zinc-400">
          {loading ? "Updating…" : updated ? `Updated ${formatTime(updated)}` : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const key = `${it.symbol}|${it.micCode}`;
          const q = quotes[key];
          const up = (q?.changePercent ?? 0) >= 0;
          return (
            <div
              key={key}
              className="group flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white/60 p-3 transition-colors hover:border-brand-500/50 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <button
                onClick={() =>
                  navigate(
                    `/stock/${encodeURIComponent(it.symbol)}?mic=${it.micCode}&name=${encodeURIComponent(it.name)}`,
                  )
                }
                className="min-w-0 flex-1 text-left"
              >
                <div className="font-semibold">{it.symbol}</div>
                <div className="truncate text-xs text-zinc-500">{it.name}</div>
              </button>
              <div className="px-3 text-right">
                {q ? (
                  <>
                    <div className="font-semibold tabular-nums">
                      {formatPrice(q.price, q.currency)}
                    </div>
                    <div className={`text-xs tabular-nums ${up ? "pos" : "neg"}`}>
                      {formatChange(q.change)} ({formatPercent(q.changePercent)})
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-zinc-400">…</div>
                )}
              </div>
              <button
                onClick={() => remove(it.symbol, it.micCode)}
                aria-label={`Remove ${it.symbol}`}
                className="ml-1 rounded-lg px-2 py-1 text-zinc-400 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
