"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

/** Detect e-ink devices via user agent */
export function isEinkDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("kindle") ||
    ua.includes("kobo") ||
    ua.includes("boox") ||
    ua.includes("nook")
  );
}

const EINK_STORAGE_KEY = "games_eink_mode";

/** Hook: returns [einkMode, toggleEinkMode]. Auto-detects e-ink on first load. */
export function useEinkMode(): [boolean, () => void] {
  const [einkMode, setEinkMode] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(EINK_STORAGE_KEY);
    } catch {}

    if (stored !== null) {
      setEinkMode(stored === "true");
    } else if (isEinkDevice()) {
      setEinkMode(true);
      try {
        localStorage.setItem(EINK_STORAGE_KEY, "true");
      } catch {}
    }
  }, []);

  const toggleEinkMode = useCallback(() => {
    setEinkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EINK_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return [einkMode, toggleEinkMode];
}

/** Returns eink class string if eink mode active, otherwise the standard class */
export function einkClass(standard: string, eink: string, isEink: boolean): string {
  return isEink ? eink : standard;
}

/** E-ink info banner with toggle — place at top of every e-reader game */
export function EinkBanner({
  einkMode,
  onToggle,
}: {
  einkMode: boolean;
  onToggle: () => void;
}) {
  if (einkMode) {
    return (
      <div
        style={{
          background: "#fff",
          color: "#000",
          border: "2px solid #000",
          padding: "8px 12px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span>
          This game works on e-readers (Kindle, Kobo, Boox) — Tap/click only
        </span>
        <button
          onClick={onToggle}
          style={{
            background: "#000",
            color: "#fff",
            border: "2px solid #000",
            padding: "6px 16px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          E-Ink Mode: ON
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
      <span>
        This game works on e-readers (Kindle, Kobo, Boox) — Tap/click only
      </span>
      <button
        onClick={onToggle}
        className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded border border-white/20"
      >
        E-Ink Mode: OFF
      </button>
    </div>
  );
}

/** Wrapper component for e-ink mode: sets base styles */
export function EinkWrapper({
  children,
  einkMode,
}: {
  children: ReactNode;
  einkMode: boolean;
}) {
  if (einkMode) {
    return (
      <div
        style={{
          background: "#fff",
          color: "#000",
          minHeight: "100vh",
          fontFamily: "serif",
          fontSize: "18px",
          lineHeight: 1.4,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] text-white">
      {children}
    </div>
  );
}
