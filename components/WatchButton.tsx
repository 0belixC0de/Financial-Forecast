"use client";

import { useWatchlist } from "@/lib/store";

export function WatchButton({ symbol }: { symbol: string }) {
  const { has, add, remove } = useWatchlist();
  const watching = has(symbol);
  return (
    <button
      onClick={() => (watching ? remove(symbol) : add(symbol))}
      className={watching ? "btn-ghost" : "btn-primary"}
    >
      {watching ? "★ Watching" : "☆ Add to watchlist"}
    </button>
  );
}
