import { SearchBar } from "./SearchBar";
import { Watchlist } from "./Watchlist";
import { navigate } from "../lib/store";

const EXAMPLES = [
  { symbol: "AAPL", mic: "XNGS", name: "Apple Inc" },
  { symbol: "NVDA", mic: "XNGS", name: "NVIDIA Corp" },
  { symbol: "TSLA", mic: "XNGS", name: "Tesla Inc" },
  { symbol: "LHA", mic: "XETR", name: "Deutsche Lufthansa AG" },
  { symbol: "BMW", mic: "XETR", name: "Bayerische Motoren Werke AG" },
  { symbol: "AIR", mic: "XPAR", name: "Airbus SE" },
];

export function Home({
  hasKey,
  onOpenSettings,
}: {
  hasKey: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-gradient-to-br from-white via-white to-brand-50 p-8 shadow-sm dark:border-white/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-brand-500/5 sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Forecast shares with <span className="text-brand-500">math</span>, the smart way.
        </h1>
        <p className="mt-3 max-w-xl text-zinc-500">
          Search any stock across US &amp; European markets, track it, set price
          alerts, and get a 7-day forecast with a confidence range and a momentum
          signal.
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBar autoFocus={hasKey} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={`${e.symbol}-${e.mic}`}
              className="chip"
              onClick={() =>
                navigate(
                  `/stock/${encodeURIComponent(e.symbol)}?mic=${e.mic}&name=${encodeURIComponent(e.name)}`,
                )
              }
            >
              {e.name.split(" ")[0]}
            </button>
          ))}
        </div>
        {!hasKey && (
          <button onClick={onOpenSettings} className="mt-5 text-sm font-medium text-brand-600 underline">
            Add your free API key to begin →
          </button>
        )}
      </section>

      <Watchlist />
    </div>
  );
}
