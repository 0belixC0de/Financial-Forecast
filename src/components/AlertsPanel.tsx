import { useEffect, useState } from "react";
import { useAlerts } from "../lib/store";
import { formatPrice, formatTime } from "../lib/format";

export function AlertsPanel({
  symbol,
  micCode,
  name,
  currency,
  currentPrice,
}: {
  symbol: string;
  micCode: string;
  name: string;
  currency: string;
  currentPrice?: number;
}) {
  const { alerts, add, remove } = useAlerts();
  const [type, setType] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (currentPrice && !price) setPrice(currentPrice.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice]);

  const mine = alerts.filter((a) => a.symbol === symbol && a.micCode === micCode);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    if (!isFinite(p) || p <= 0) return;
    add({ symbol, micCode, name, type, price: p });
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-bold">Price alerts</h2>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">When price</label>
          <select
            className="input !w-auto"
            value={type}
            onChange={(e) => setType(e.target.value as "above" | "below")}
          >
            <option value="above">rises above</option>
            <option value="below">falls below</option>
          </select>
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs text-zinc-400">Price ({currency})</label>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {mine.length === 0 && (
          <p className="text-sm text-zinc-500">
            No alerts yet. You’ll be notified in-app when a condition is met
            (checked every ~1.5 min while the site is open).
          </p>
        )}
        {mine.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-white/[0.03]"
          >
            <span>
              {a.type === "above" ? "↑ above" : "↓ below"}{" "}
              <strong className="tabular-nums">{formatPrice(a.price, currency)}</strong>
              {a.triggeredAt && (
                <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs text-brand-600 dark:text-brand-400">
                  triggered {formatTime(a.triggeredAt)}
                </span>
              )}
            </span>
            <button
              onClick={() => remove(a.id)}
              className="text-zinc-400 hover:text-rose-500"
              aria-label="Remove alert"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
