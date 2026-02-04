"use client";

/**
 * Version footer displayed at the bottom of all pages.
 * Shows version, git commit, and build time for debugging deployments.
 */
export function VersionFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT || "local";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;

  // Format build time for display
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
      <span>
        v{version}
      </span>
      <span className="text-slate-600">|</span>
      <span className="font-mono">
        {commit}
      </span>
      <span className="text-slate-600">|</span>
      <span>
        Built {buildDate}
      </span>
    </footer>
  );
}
