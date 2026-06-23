"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlist } from "@/lib/store";
import type { Quote } from "@/lib/types";
import { formatChange, formatPercent, formatPrice, formatTime } from "@/lib/format";
import { Sparkline } from "./Sparkline";

const POLL_MS = 45_000;

export function Watchlist() {
  const { symbols, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [updated, setUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (symbols.length === 0) {
      setQuotes({});
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/quote?symbols=${symbols.join(",")}`);
        const data = await res.json();
        if (cancelled) return;
        const map: Record<string, Quote> = {};
        for (const q of data.quotes || []) map[q.symbol] = q;
        setQuotes(map);
        setUpdated(new Date().toISOString());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbols]);

  if (symbols.length === 0) {
    return (
      <div className="card text-center text-sm text-zinc-500">
        Your watchlist is empty. Search for a stock above and add it to start
        tracking.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Watchlist</h2>
        <span className="text-xs text-zinc-500">
          {loading ? "Updating…" : updated ? `Updated ${formatTime(updated)}` : ""}
          <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            ~15 min delayed
          </span>
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {symbols.map((s) => {
          const q = quotes[s];
          const up = (q?.changePercent ?? 0) >= 0;
          return (
            <div key={s} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/stock/${encodeURIComponent(s)}`} className="font-medium hover:underline">
                  {s}
                </Link>
                <div className="truncate text-xs text-zinc-500">
                  {q?.name || "…"}
                </div>
              </div>
              <Sparkline symbol={s} up={up} />
              <div className="w-28 text-right">
                {q ? (
                  <>
                    <div className="font-medium">{formatPrice(q.price, q.currency)}</div>
                    <div className={up ? "text-xs text-green-600" : "text-xs text-red-500"}>
                      {formatChange(q.change)} ({formatPercent(q.changePercent)})
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-zinc-400">—</div>
                )}
              </div>
              <button
                onClick={() => remove(s)}
                aria-label={`Remove ${s}`}
                className="btn-ghost !px-2 text-zinc-400"
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
