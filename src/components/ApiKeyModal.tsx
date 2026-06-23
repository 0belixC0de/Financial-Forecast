import { useEffect, useState } from "react";
import { getApiKey, setApiKey } from "../lib/api";

export function ApiKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(getApiKey());
  }, [open]);

  if (!open) return null;

  function save() {
    setApiKey(value);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-slide-up rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Twelve Data API key</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Prices and forecasts come from{" "}
          <a
            href="https://twelvedata.com/pricing"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-600 underline"
          >
            Twelve Data
          </a>
          . The free plan is enough (no credit card). Your key is stored only in
          this browser — it’s never sent anywhere except Twelve Data.
        </p>

        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-500">
          <li>
            Open{" "}
            <a
              href="https://twelvedata.com/register"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 underline"
            >
              twelvedata.com/register
            </a>{" "}
            and sign up.
          </li>
          <li>Copy your API key from the dashboard.</li>
          <li>Paste it below.</li>
        </ol>

        <input
          className="input mt-4"
          placeholder="Paste your API key…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && save()}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={!value.trim()}>
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
