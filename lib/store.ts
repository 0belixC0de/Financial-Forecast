"use client";

import { useCallback, useEffect, useState } from "react";

const WATCHLIST_KEY = "sf.watchlist";
const ALERTS_KEY = "sf.alerts";

export interface Alert {
  id: string;
  symbol: string;
  type: "above" | "below";
  price: number;
  createdAt: string;
  triggeredAt?: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Notify other hook instances in the same tab.
    window.dispatchEvent(new CustomEvent("sf-store", { detail: key }));
  } catch {
    /* ignore quota errors */
  }
}

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    const load = () => setSymbols(read<string[]>(WATCHLIST_KEY, []));
    load();
    const onStore = (e: Event) => {
      if ((e as CustomEvent).detail === WATCHLIST_KEY) load();
    };
    window.addEventListener("sf-store", onStore);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("sf-store", onStore);
      window.removeEventListener("storage", load);
    };
  }, []);

  const add = useCallback((symbol: string) => {
    setSymbols((prev) => {
      if (prev.includes(symbol)) return prev;
      const next = [...prev, symbol];
      write(WATCHLIST_KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const next = prev.filter((s) => s !== symbol);
      write(WATCHLIST_KEY, next);
      return next;
    });
  }, []);

  const has = useCallback((symbol: string) => symbols.includes(symbol), [symbols]);

  return { symbols, add, remove, has };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = () => setAlerts(read<Alert[]>(ALERTS_KEY, []));
    load();
    const onStore = (e: Event) => {
      if ((e as CustomEvent).detail === ALERTS_KEY) load();
    };
    window.addEventListener("sf-store", onStore);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("sf-store", onStore);
      window.removeEventListener("storage", load);
    };
  }, []);

  const add = useCallback((a: Omit<Alert, "id" | "createdAt">) => {
    setAlerts((prev) => {
      const next: Alert[] = [
        ...prev,
        { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ];
      write(ALERTS_KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      write(ALERTS_KEY, next);
      return next;
    });
  }, []);

  const markTriggered = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, triggeredAt: new Date().toISOString() } : a,
      );
      write(ALERTS_KEY, next);
      return next;
    });
  }, []);

  return { alerts, add, remove, markTriggered };
}
