import { useEffect, useState } from "react";
import { DEFAULT_PROXY, getProxy, setProxy } from "../lib/api";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(getProxy());
  }, [open]);

  if (!open) return null;

  function save() {
    setProxy(value);
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
        <h2 className="text-lg font-bold">Settings</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Prices come from Yahoo Finance. Because this is a static site with no
          server, requests go through a free CORS proxy. The default works out of
          the box — you only need to change this if data stops loading.
        </p>

        <label className="mt-4 block text-xs font-medium text-zinc-400">
          CORS proxy URL (advanced)
        </label>
        <input
          className="input mt-1 font-mono text-xs"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={DEFAULT_PROXY}
        />
        <button
          className="mt-2 text-xs text-brand-600 underline"
          onClick={() => setValue(DEFAULT_PROXY)}
        >
          Reset to default
        </button>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
