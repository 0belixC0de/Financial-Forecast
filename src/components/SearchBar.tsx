import { useEffect, useRef, useState } from "react";
import { searchSymbols } from "../lib/api";
import { navigate } from "../lib/store";
import type { Instrument } from "../lib/types";

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Instrument[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const r = await searchSymbols(term);
        setResults(r);
        setActive(0);
        setOpen(true);
      } catch (e: any) {
        setError(e?.message || "Search failed.");
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(it: Instrument) {
    setOpen(false);
    setQ("");
    navigate(
      `/stock/${encodeURIComponent(it.symbol)}?name=${encodeURIComponent(it.name)}`,
    );
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
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          🔎
        </span>
        <input
          className="input !pl-11 !py-3 text-base shadow-sm"
          placeholder="Search any stock — e.g. Apple, Lufthansa, BMW…"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => (results.length || error) && setOpen(true)}
        />
      </div>

      {open && (
        <div className="scroll-thin absolute z-20 mt-2 max-h-80 w-full animate-fade-in overflow-auto rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Searching…</div>
          )}
          {error && <div className="px-4 py-3 text-sm text-rose-500">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">No matches.</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.symbol}-${r.micCode}-${i}`}
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                i === active ? "bg-brand-50 dark:bg-white/5" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="font-semibold">{r.symbol}</span>
                <span className="ml-2 text-sm text-zinc-500">{r.name}</span>
              </span>
              <span className="shrink-0 text-xs text-zinc-400">
                {r.exchange}
                {r.country ? ` · ${r.country}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
