"use client";

import { useCallback, useEffect, useState } from "react";

export interface ScoreEntry {
  game: string;
  name: string;
  score: number;
  level: number;
  stats?: Record<string, number | string>;
  timestamp: string;
}

/** Fetch leaderboard for a game */
export function useLeaderboard(game: string, limit = 10) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/scores?game=${game}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setScores(data.scores || []);
      }
    } catch {
      // Silently fail — leaderboard is non-critical
    } finally {
      setLoading(false);
    }
  }, [game, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scores, loading, refresh };
}

/** Submit a score and return the rank */
export async function submitScore(
  game: string,
  name: string,
  score: number,
  level: number,
  stats?: Record<string, number | string>
): Promise<{ rank: number; total: number } | null> {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, name, score, level, stats }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Non-critical
  }
  return null;
}

/** Get saved player name from localStorage */
export function getSavedName(): string {
  try {
    return localStorage.getItem("playerName") || "";
  } catch {
    return "";
  }
}

/** Save player name to localStorage */
export function saveName(name: string): void {
  try {
    localStorage.setItem("playerName", name);
  } catch {
    // Ignore
  }
}

/** Safe localStorage high score access */
export function getLocalHighScore(key: string): number {
  try {
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

/** Safe localStorage high score save */
export function setLocalHighScore(key: string, score: number): void {
  try {
    localStorage.setItem(key, score.toString());
  } catch {
    // Ignore
  }
}
