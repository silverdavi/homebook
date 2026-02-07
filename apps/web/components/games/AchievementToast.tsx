"use client";

import { Medal } from "lucide-react";
import type { MedalTier } from "@/lib/games/achievements";

interface AchievementToastProps {
  name: string;
  tier: MedalTier;
  onDismiss?: () => void;
  className?: string;
}

const TIER_COLORS: Record<MedalTier, string> = {
  bronze: "from-amber-700/90 to-amber-900/90 border-amber-500/50 text-amber-100",
  silver: "from-slate-400/90 to-slate-600/90 border-slate-300/50 text-slate-100",
  gold: "from-yellow-500/90 to-yellow-700/90 border-yellow-400/50 text-yellow-100",
};

export function AchievementToast({ name, tier, onDismiss, className = "" }: AchievementToastProps) {
  return (
    <div
      className={`absolute left-1/2 top-24 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-gradient-to-br shadow-xl ${TIER_COLORS[tier]} ${className}`}
      style={{ animation: "fadeIn 0.4s ease-out" }}
      role="alert"
      aria-live="polite"
    >
      <Medal className="w-8 h-8 flex-shrink-0" />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
          {tier} medal
        </span>
        <span className="font-bold text-sm">{name}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 p-1 rounded-lg hover:bg-white/20 transition-colors text-inherit"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
