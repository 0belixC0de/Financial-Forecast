import { useMemo, useState } from "react";
import { useApiKey, useHashRoute } from "./lib/store";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { StockView } from "./components/StockView";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { AlertWatcher } from "./components/AlertWatcher";

interface StockRoute {
  name: "stock";
  symbol: string;
  micCode: string;
  displayName: string;
}
type Route = { name: "home" } | StockRoute;

function parseRoute(hash: string): Route {
  const m = hash.match(/^#\/stock\/([^?]+)(\?(.*))?$/);
  if (m) {
    const params = new URLSearchParams(m[3] || "");
    return {
      name: "stock",
      symbol: decodeURIComponent(m[1]),
      micCode: params.get("mic") || "",
      displayName: params.get("name") || decodeURIComponent(m[1]),
    };
  }
  return { name: "home" };
}

export function App() {
  const hash = useHashRoute();
  const apiKey = useApiKey();
  const route = useMemo(() => parseRoute(hash), [hash]);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <Header onOpenSettings={() => setKeyModalOpen(true)} hasKey={!!apiKey} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {!apiKey && <NoKeyBanner onAdd={() => setKeyModalOpen(true)} />}
        {route.name === "home" ? (
          <Home onOpenSettings={() => setKeyModalOpen(true)} hasKey={!!apiKey} />
        ) : (
          <StockView
            key={`${route.symbol}|${route.micCode}`}
            symbol={route.symbol}
            micCode={route.micCode}
            displayName={route.displayName}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-xs leading-relaxed text-zinc-500">
        Data via Twelve Data (free tier, may be delayed). Forecasts are statistical
        estimates from past prices and can be wrong. <strong>Not financial advice.</strong>
      </footer>

      <AlertWatcher />
      <ApiKeyModal open={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </div>
  );
}

function NoKeyBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-brand-500/40 bg-brand-50/60 dark:bg-brand-500/5">
      <div className="text-sm">
        <strong>One quick step:</strong> add a free Twelve Data API key to load live
        prices and forecasts. Takes ~10 seconds, no credit card.
      </div>
      <button className="btn-primary" onClick={onAdd}>
        Add API key
      </button>
    </div>
  );
}
