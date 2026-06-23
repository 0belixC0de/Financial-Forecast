import { useTheme } from "../lib/store";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="btn-ghost h-10 w-10 !px-0 text-base"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
