"use client";

import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-orange-100 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-stone-700 shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400/30 ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
          {showLabel && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-stone-600 transition-transform duration-300 hover:-rotate-12" />
          {showLabel && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
}
