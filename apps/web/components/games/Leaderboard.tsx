"use client";

import { Trophy } from "lucide-react";
import { useLeaderboard } from "@/lib/games/use-scores";

interface LeaderboardProps {
  game: string;
  limit?: number;
  compact?: boolean;
}

export function Leaderboard({ game, limit = 10, compact = false }: LeaderboardProps) {
  const { scores, loading } = useLeaderboard(game, limit);

  if (loading) {
    return (
      <div className="text-center text-slate-500 text-xs py-2">
        Loading leaderboard...
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="text-center text-slate-600 text-xs py-2">
        No scores yet. Be the first!
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {scores.slice(0, 5).map((s, i) => (
          <div key={`${s.timestamp}-${i}`} className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              <span className={i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-500"}>
                #{i + 1}
              </span>{" "}
              {s.name}
            </span>
            <span className="text-white font-bold tabular-nums">{s.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-bold text-white">Leaderboard</span>
      </div>
      <div className="space-y-1.5">
        {scores.map((s, i) => (
          <div
            key={`${s.timestamp}-${i}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              i === 0 ? "bg-yellow-400/10 border border-yellow-400/20" :
              i === 1 ? "bg-slate-300/5 border border-slate-300/10" :
              i === 2 ? "bg-amber-600/5 border border-amber-600/10" :
              "bg-white/[0.02]"
            }`}
          >
            <span className={`w-6 text-center font-bold text-sm ${
              i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-600"
            }`}>
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-white truncate">{s.name}</span>
            <span className="text-sm font-bold text-white tabular-nums">{s.score.toLocaleString()}</span>
            {s.level > 1 && (
              <span className="text-[10px] text-slate-500">Lv{s.level}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
