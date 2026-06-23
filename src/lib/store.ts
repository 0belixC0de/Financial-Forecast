import { useCallback, useEffect, useState } from "react";
import { getApiKey } from "./api";

const WATCHLIST_KEY = "sf.watchlist";
const ALERTS_KEY = "sf.alerts";

export interface WatchedInstrument {
  symbol: string;
  micCode: string;
  name: string;
}

export interface Alert {
  id: string;
  symbol: string;
  micCode: string;
  name: string;
  type: "above" | "below";
  price: number;
  createdAt: string;
  triggeredAt?: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("sf-store", { detail: key }));
  } catch {
    /* ignore */
  }
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const load = () => setValue(read<T>(key, fallback));
    load();
    const onStore = (e: Event) => {
      if ((e as CustomEvent).detail === key) load();
    };
    window.addEventListener("sf-store", onStore);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("sf-store", onStore);
      window.removeEventListener("storage", load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, setValue] as const;
}

export function useWatchlist() {
  const [items] = useStored<WatchedInstrument[]>(WATCHLIST_KEY, []);

  const add = useCallback((it: WatchedInstrument) => {
    const cur = read<WatchedInstrument[]>(WATCHLIST_KEY, []);
    if (cur.some((x) => x.symbol === it.symbol && x.micCode === it.micCode)) return;
    write(WATCHLIST_KEY, [...cur, it]);
  }, []);

  const remove = useCallback((symbol: string, micCode: string) => {
    const cur = read<WatchedInstrument[]>(WATCHLIST_KEY, []);
    write(
      WATCHLIST_KEY,
      cur.filter((x) => !(x.symbol === symbol && x.micCode === micCode)),
    );
  }, []);

  const has = useCallback(
    (symbol: string, micCode: string) =>
      items.some((x) => x.symbol === symbol && x.micCode === micCode),
    [items],
  );

  return { items, add, remove, has };
}

export function useAlerts() {
  const [alerts] = useStored<Alert[]>(ALERTS_KEY, []);

  const add = useCallback((a: Omit<Alert, "id" | "createdAt">) => {
    const cur = read<Alert[]>(ALERTS_KEY, []);
    write(ALERTS_KEY, [
      ...cur,
      { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    const cur = read<Alert[]>(ALERTS_KEY, []);
    write(
      ALERTS_KEY,
      cur.filter((a) => a.id !== id),
    );
  }, []);

  const markTriggered = useCallback((id: string) => {
    const cur = read<Alert[]>(ALERTS_KEY, []);
    write(
      ALERTS_KEY,
      cur.map((a) => (a.id === id ? { ...a, triggeredAt: new Date().toISOString() } : a)),
    );
  }, []);

  return { alerts, add, remove, markTriggered };
}

export function useApiKey() {
  const [key, setKey] = useState<string>("");
  useEffect(() => {
    const load = () => setKey(getApiKey());
    load();
    window.addEventListener("sf-apikey", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("sf-apikey", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return key;
}

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = (localStorage.getItem("sf.theme") as "dark" | "light") || "dark";
    setThemeState(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  const setTheme = useCallback((t: "dark" | "light") => {
    setThemeState(t);
    localStorage.setItem("sf.theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  return { theme, setTheme };
}

/** Simple hash router: "#/" or "#/stock/SYMBOL?mic=XETR&name=...". */
export function useHashRoute() {
  const [hash, setHash] = useState<string>(
    typeof window !== "undefined" ? window.location.hash : "",
  );
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

export function navigate(to: string) {
  window.location.hash = to;
}
