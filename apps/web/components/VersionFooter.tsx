"use client";

import { usePathname } from "next/navigation";

/**
 * Version footer displayed at the bottom of all pages (except individual game pages).
 * Shows version, git commit, and build time for debugging deployments.
 */
export function VersionFooter() {
  const pathname = usePathname();

  // Hide on individual game pages (e.g. /games/math-blitz) to avoid overlapping game UI
  // Still show on /games (the arena) and /games/progress
  const isGamePage = /^\/games\/[^/]+$/.test(pathname) && pathname !== "/games/progress";
  if (isGamePage) return null;

  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT || "local";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;

  const buildDate = buildTime
    ? new Date(buildTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "dev";

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm text-slate-400 text-xs py-1.5 px-4 flex items-center justify-center gap-4 z-50">
      <span>v{version}</span>
      <span className="text-slate-600">|</span>
      <span className="font-mono">{commit}</span>
      <span className="text-slate-600">|</span>
      <span suppressHydrationWarning>Built {buildDate}</span>
    </footer>
  );
}
