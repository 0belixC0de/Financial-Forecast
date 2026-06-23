import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { Watchlist } from "@/components/Watchlist";

const EXAMPLES = [
  { symbol: "AAPL", label: "Apple" },
  { symbol: "MSFT", label: "Microsoft" },
  { symbol: "TSLA", label: "Tesla" },
  { symbol: "NVDA", label: "Nvidia" },
  { symbol: "BMW.DE", label: "BMW" },
  { symbol: "BTC-USD", label: "Bitcoin" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="card bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Forecast shares with math <span className="text-brand-fg">+</span> the news
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Search any stock worldwide, track it on your watchlist, set price
          alerts, and get a 7-day forecast that blends a statistical model with
          AI-read market news.
        </p>
        <div className="mt-4 max-w-xl">
          <SearchBar autoFocus />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <Link
              key={e.symbol}
              href={`/stock/${encodeURIComponent(e.symbol)}`}
              className="btn-ghost !py-1 text-xs"
            >
              {e.label}
            </Link>
          ))}
        </div>
      </section>

      <Watchlist />
    </div>
  );
}
