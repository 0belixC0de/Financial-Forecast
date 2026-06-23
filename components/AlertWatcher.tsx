"use client";

import { useEffect, useRef, useState } from "react";
import { useAlerts } from "@/lib/store";
import type { Quote } from "@/lib/types";
import { formatPrice } from "@/lib/format";

interface Toast {
  id: string;
  message: string;
}

const POLL_MS = 60_000;

export function AlertWatcher() {
  const { alerts, markTriggered } = useAlerts();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  function pushToast(message: string) {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
  }

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const pending = alertsRef.current.filter((a) => !a.triggeredAt);
      if (pending.length === 0) return;
      const symbols = Array.from(new Set(pending.map((a) => a.symbol)));
      try {
        const res = await fetch(`/api/quote?symbols=${symbols.join(",")}`);
        const data = await res.json();
        if (cancelled) return;
        const bySymbol = new Map<string, Quote>(
          (data.quotes || []).map((q: Quote) => [q.symbol, q]),
        );
        for (const a of pending) {
          const q = bySymbol.get(a.symbol);
          if (!q) continue;
          const hit =
            (a.type === "above" && q.price >= a.price) ||
            (a.type === "below" && q.price <= a.price);
          if (hit) {
            markTriggered(a.id);
            pushToast(
              `${a.symbol} is ${a.type} ${formatPrice(a.price, q.currency)} — now ${formatPrice(q.price, q.currency)}`,
            );
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("ShareForecast alert", {
                body: `${a.symbol} ${a.type} ${a.price}`,
              });
            }
          }
        }
      } catch {
        /* network hiccup — try again next tick */
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
          className="card flex items-center gap-2 border-brand/40 text-sm shadow-lg"
        >
          <span className="text-brand-fg">🔔</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
