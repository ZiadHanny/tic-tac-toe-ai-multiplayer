"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      className="rounded-full border-2 px-4 py-2 text-sm font-medium"
      style={{ borderColor: "var(--border)", visibility: isLoaded ? "visible" : "hidden" }}
    >
      {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}
