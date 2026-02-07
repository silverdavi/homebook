"use client";

import { useState } from "react";
import { Trophy, Send } from "lucide-react";
import { submitScore, getSavedName, saveName } from "@/lib/games/use-scores";

interface ScoreSubmitProps {
  game: string;
  score: number;
  level: number;
  stats?: Record<string, number | string>;
  onSubmitted?: (rank: number) => void;
}

export function ScoreSubmit({ game, score, level, stats, onSubmitted }: ScoreSubmitProps) {
  const [name, setName] = useState(getSavedName);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    saveName(name.trim());
    const result = await submitScore(game, name.trim(), score, level, stats);
    setSubmitting(false);
    setSubmitted(true);
    if (result) {
      setRank(result.rank);
      onSubmitted?.(result.rank);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        {rank && rank <= 3 ? (
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-medium">
            <Trophy className="w-4 h-4" />
            {rank === 1 ? "1st Place!" : rank === 2 ? "2nd Place!" : "3rd Place!"}
          </div>
        ) : rank ? (
          <div className="text-slate-400 text-sm">
            Ranked #{rank} on the leaderboard
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Score saved!</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-xs mx-auto">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Your name"
        maxLength={20}
        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-white/40"
      />
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || submitting}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg text-sm transition-all flex items-center gap-1.5"
      >
        <Send className="w-3.5 h-3.5" />
        {submitting ? "..." : "Save"}
      </button>
    </div>
  );
}
