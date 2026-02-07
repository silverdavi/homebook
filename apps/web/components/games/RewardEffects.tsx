"use client";

import { Zap, Heart } from "lucide-react";

/** Multiplier tier from streak (plan: x1.5 at 5, x2 at 10, x3 at 20, x5 at 50) */
export function getMultiplierFromStreak(streak: number): { mult: number; label: string; intense: "low" | "mid" | "high" | "max" } {
  if (streak >= 50) return { mult: 5, label: "UNSTOPPABLE", intense: "max" };
  if (streak >= 20) return { mult: 3, label: "TRIPLE", intense: "high" };
  if (streak >= 10) return { mult: 2, label: "DOUBLE", intense: "mid" };
  if (streak >= 5) return { mult: 1.5, label: "x1.5", intense: "low" };
  return { mult: 1, label: "", intense: "low" };
}

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

/** Shows x1.5 / DOUBLE / TRIPLE / UNSTOPPABLE with escalating visual intensity. */
export function StreakBadge({ streak, className = "" }: StreakBadgeProps) {
  const { mult, label, intense } = getMultiplierFromStreak(streak);
  if (mult <= 1 || streak < 5) return null;

  const styles = {
    low: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    mid: "bg-amber-400/20 text-amber-300 border-amber-400/40 animate-pulse",
    high: "bg-orange-400/25 text-orange-300 border-orange-400/50 shadow-lg shadow-orange-500/20",
    max: "bg-red-500/30 text-red-200 border-red-400/60 shadow-lg shadow-red-500/30 animate-pulse",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold text-xs transition-all duration-300 ${styles[intense]} ${className}`}
      role="status"
      aria-label={`Streak ${streak}, ${label} multiplier`}
    >
      <Zap className="w-3.5 h-3.5 fill-current" />
      <span>{label || `x${mult}`}</span>
    </div>
  );
}

interface HeartRecoveryProps {
  show: boolean;
  className?: string;
}

/** Pulsing heart + "Heart recovered!" toast when gaining a life back. */
export function HeartRecovery({ show, className = "" }: HeartRecoveryProps) {
  if (!show) return null;
  return (
    <div
      className={`absolute left-1/2 top-20 -translate-x-1/2 z-30 flex flex-col items-center gap-1 ${className}`}
      style={{ animation: "fadeIn 0.4s ease-out" }}
      role="status"
      aria-live="polite"
    >
      <Heart className="w-10 h-10 text-red-400 fill-red-400 animate-pulse" />
      <span className="text-sm font-bold text-white drop-shadow-lg">Heart recovered!</span>
    </div>
  );
}

interface BonusToastProps {
  show: boolean;
  text: string;
  points?: number;
  className?: string;
}

/** Floating "+100 Perfect!" style bonus text. */
export function BonusToast({ show, text, points, className = "" }: BonusToastProps) {
  if (!show) return null;
  return (
    <div
      className={`absolute left-1/2 top-24 -translate-x-1/2 z-30 flex flex-col items-center gap-0.5 ${className}`}
      style={{ animation: "fadeIn 0.3s ease-out" }}
      role="status"
      aria-live="polite"
    >
      {points != null && (
        <span className="text-2xl font-black text-yellow-400 drop-shadow-lg">+{points}</span>
      )}
      <span className="text-sm font-bold text-white/90 drop-shadow-lg">{text}</span>
    </div>
  );
}
