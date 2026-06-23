import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="text-brand-fg">📈</span>
          <span>ShareForecast</span>
        </Link>
        <div className="hidden flex-1 sm:block">
          <SearchBar />
        </div>
        <ThemeToggle />
      </div>
      <div className="mx-auto block max-w-6xl px-4 pb-3 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
