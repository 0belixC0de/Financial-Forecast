import { useMemo, useState } from "react";
import { useHashRoute } from "./lib/store";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { StockView } from "./components/StockView";
import { SettingsModal } from "./components/SettingsModal";
import { AlertWatcher } from "./components/AlertWatcher";

interface StockRoute {
  name: "stock";
  symbol: string;
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
      displayName: params.get("name") || decodeURIComponent(m[1]),
    };
  }
  return { name: "home" };
}

export function App() {
  const hash = useHashRoute();
  const route = useMemo(() => parseRoute(hash), [hash]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {route.name === "home" ? (
          <Home />
        ) : (
          <StockView
            key={route.symbol}
            symbol={route.symbol}
            displayName={route.displayName}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-xs leading-relaxed text-zinc-500">
        Data via Yahoo Finance (delayed ~15 min). Forecasts are statistical
        estimates from past prices and can be wrong. <strong>Not financial advice.</strong>
      </footer>

      <AlertWatcher />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
