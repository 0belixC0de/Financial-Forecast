import Link from "next/link";
import { getQuote } from "@/lib/yahoo";
import { StockHeader } from "@/components/StockHeader";
import { PriceChart } from "@/components/PriceChart";
import { ForecastCard } from "@/components/ForecastCard";
import { AlertsPanel } from "@/components/AlertsPanel";

export const dynamic = "force-dynamic";

export default async function StockPage({
  params,
}: {
  params: { symbol: string };
}) {
  const symbol = decodeURIComponent(params.symbol);
  const quote = await getQuote(symbol);

  if (!quote) {
    return (
      <div className="card text-center">
        <p className="text-lg font-medium">Couldn’t find “{symbol}”.</p>
        <p className="mt-1 text-sm text-zinc-500">
          Yahoo Finance has broad global coverage but not every small exchange.
          Try searching by company name instead.
        </p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StockHeader initialQuote={quote} />
      <PriceChart symbol={symbol} currency={quote.currency} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ForecastCard symbol={symbol} />
        <AlertsPanel symbol={symbol} currency={quote.currency} currentPrice={quote.price} />
      </div>
    </div>
  );
}
