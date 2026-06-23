import { useEffect, useRef, useState } from "react";
import { getQuote, hasApiKey } from "../lib/api";
import { useAlerts } from "../lib/store";
import { formatPrice } from "../lib/format";

interface Toast {
  id: string;
  message: string;
}

const POLL_MS = 90_000;

export function AlertWatcher() {
  const { alerts, markTriggered } = useAlerts();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  function pushToast(message: string) {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 9000);
  }

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!hasApiKey()) return;
      const pending = alertsRef.current.filter((a) => !a.triggeredAt);
      if (pending.length === 0) return;
      // De-dupe instruments to limit API calls.
      const seen = new Set<string>();
      for (const a of pending) {
        const k = `${a.symbol}|${a.micCode}`;
        if (seen.has(k)) continue;
        seen.add(k);
        try {
          const q = await getQuote(a.symbol, a.micCode);
          if (cancelled) return;
          for (const al of pending.filter((x) => x.symbol === a.symbol && x.micCode === a.micCode)) {
            const hit =
              (al.type === "above" && q.price >= al.price) ||
              (al.type === "below" && q.price <= al.price);
            if (hit) {
              markTriggered(al.id);
              pushToast(
                `${al.symbol} ${al.type} ${formatPrice(al.price, q.currency)} — now ${formatPrice(q.price, q.currency)}`,
              );
              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("ShareForecast alert", {
                  body: `${al.symbol} ${al.type} ${al.price}`,
                });
              }
            }
          }
        } catch {
          /* skip */
        }
      }
    }

    check();
    const id = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [markTriggered]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-slide-up items-center gap-2 rounded-xl border border-brand-500/40 bg-white px-4 py-3 text-sm shadow-2xl dark:bg-zinc-900"
        >
          <span>🔔</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
