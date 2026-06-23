"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SearchResult } from "@/lib/types";

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced fuzzy search against Yahoo's autocomplete.
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(symbol: string) {
    setOpen(false);
    setQ("");
    router.push(`/stock/${encodeURIComponent(symbol)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active].symbol);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        className="input"
        placeholder="Search a stock — name or symbol (e.g. apple, BMW.DE)"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-500">No matches.</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${i}`}
              onClick={() => go(r.symbol)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                i === active ? "bg-zinc-100 dark:bg-zinc-800" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="font-medium">{r.symbol}</span>
                <span className="ml-2 truncate text-zinc-500">{r.name}</span>
              </span>
              <span className="ml-2 shrink-0 text-xs text-zinc-400">
                {r.exchange}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
