"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "daily-exam-theme";

export function ReadingThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const isDark = localStorage.getItem(KEY) !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the saved choice once on mount
    setDark(isDark);
    return () => document.documentElement.classList.remove("dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(KEY, next ? "dark" : "light");
  }

  if (dark === null) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
