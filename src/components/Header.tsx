import { navigate } from "../lib/store";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500/15 text-brand-500">
            📈
          </span>
          <span>
            Share<span className="text-brand-500">Forecast</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="btn-ghost h-10 w-10 !px-0 text-base"
            title="Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
