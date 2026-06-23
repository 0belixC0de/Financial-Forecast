"use client";

import { useState } from "react";
import { useAlerts } from "@/lib/store";
import { formatPrice, formatTime } from "@/lib/format";

export function AlertsPanel({
  symbol,
  currency,
  currentPrice,
}: {
  symbol: string;
  currency: string;
  currentPrice: number;
}) {
  const { alerts, add, remove } = useAlerts();
  const [type, setType] = useState<"above" | "below">("above");
  const [price, setPrice] = useState<string>(currentPrice ? currentPrice.toFixed(2) : "");

  const mine = alerts.filter((a) => a.symbol === symbol);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    if (!isFinite(p) || p <= 0) return;
    add({ symbol, type, price: p });
    requestNotificationPermission();
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-semibold">Price alerts</h2>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Condition</label>
          <select
            className="input !w-auto"
            value={type}
            onChange={(e) => setType(e.target.value as "above" | "below")}
          >
            <option value="above">Price rises above</option>
            <option value="below">Price falls below</option>
          </select>
        </div>
        <div className="w-28">
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
          Add alert
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {mine.length === 0 && (
          <p className="text-sm text-zinc-500">
            No alerts yet. You’ll get an in-app notification when a condition is
            met (checked every minute while the site is open).
          </p>
        )}
        {mine.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/50"
          >
            <span>
              {a.type === "above" ? "↑ above" : "↓ below"}{" "}
              <strong>{formatPrice(a.price, currency)}</strong>
              {a.triggeredAt && (
                <span className="ml-2 rounded bg-brand/20 px-1.5 py-0.5 text-xs text-brand-fg">
                  triggered {formatTime(a.triggeredAt)}
                </span>
              )}
            </span>
            <button
              onClick={() => remove(a.id)}
              className="text-zinc-400 hover:text-red-500"
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

function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}
