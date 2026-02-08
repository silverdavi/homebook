"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Target, Gamepad2, Star, Flame, Award } from "lucide-react";
import { getProfile, getLocalHighScore, type PlayerProfile } from "@/lib/games/use-scores";
import { getAchievements, MEDALS, type MedalTier } from "@/lib/games/achievements";
import { getDailyChallengeStreak, getLongestStreak, getCompletedDates } from "@/lib/games/daily-challenge";
import { GameIcon } from "@/components/games/GameIcon";
import Link from "next/link";

// ── Game metadata ──

const GAMES = [
  { id: "letter-rain", name: "Letter Rain", emoji: "🌧️", scoreKey: "letterRain_highScore", color: "indigo" },
  { id: "word-builder", name: "Word Builder", emoji: "🔤", scoreKey: "wordBuilder_highScore", color: "cyan" },
  { id: "math-blitz", name: "Math Blitz", emoji: "⚡", scoreKey: "mathBlitz_highScore", color: "emerald" },
  { id: "fraction-fighter", name: "Fraction Fighter", emoji: "🥊", scoreKey: "fractionFighter_highScore", color: "orange" },
  { id: "times-table", name: "Times Table", emoji: "✖️", scoreKey: "timesTable_highScore", color: "violet" },
  { id: "fraction-lab", name: "Fraction Lab", emoji: "🥧", scoreKey: "fractionLab_highScore", color: "pink" },
  { id: "decimal-dash", name: "Decimal Dash", emoji: "🔢", scoreKey: "decimalDash_highScore", color: "teal" },
  { id: "graph-plotter", name: "Graph Plotter", emoji: "📈", scoreKey: "graphPlotter_highScore", color: "indigo" },
  { id: "element-match", name: "Element Match", emoji: "🧪", scoreKey: "elementMatch_highScore", color: "blue" },
  { id: "equation-balancer", name: "Equation Balancer", emoji: "⚖️", scoreKey: "equationBalancer_highScore", color: "violet" },
  { id: "genetics-lab", name: "Genetics Lab", emoji: "🧬", scoreKey: "geneticsLab_highScore", color: "green" },
  { id: "unit-converter", name: "Unit Converter", emoji: "📏", scoreKey: "unitConverter_highScore", color: "sky" },
  { id: "timeline-dash", name: "Timeline Dash", emoji: "🕰️", scoreKey: "timelineDash_highScore", color: "purple" },
  { id: "maze-runner", name: "Maze Runner", emoji: "🏃", scoreKey: "mazeRunner_highScore", color: "cyan" },
  { id: "trace-learn", name: "Trace & Learn", emoji: "✏️", scoreKey: "traceLearn_highScore", color: "purple" },
  { id: "color-lab", name: "Color Lab", emoji: "🎨", scoreKey: "colorLab_highScore", color: "pink" },
  { id: "connect-dots", name: "Connect Dots", emoji: "🔵", scoreKey: "connectDots_highScore", color: "blue" },
  { id: "scratch-reveal", name: "Scratch & Reveal", emoji: "🎫", scoreKey: "scratchReveal_highScore", color: "yellow" },
  { id: "sudoku", name: "Sudoku", emoji: "🔢", scoreKey: "sudoku_highScore", color: "slate" },
  { id: "crossword", name: "Crossword", emoji: "📝", scoreKey: "crossword", color: "slate" },
  { id: "word-search", name: "Word Search", emoji: "🔍", scoreKey: "wordSearch_highScore", color: "slate" },
  { id: "trivia-quiz", name: "Trivia Quiz", emoji: "❓", scoreKey: "trivia-quiz", color: "slate" },
  { id: "nonogram", name: "Nonogram", emoji: "🧩", scoreKey: "nonogram_highScore", color: "slate" },
  { id: "number-puzzle", name: "Number Puzzle", emoji: "🎲", scoreKey: "numberPuzzle_highScore", color: "slate" },
] as const;

const SUBJECT_CATEGORIES: Record<string, string[]> = {
  Math: ["math-blitz", "fraction-fighter", "times-table", "fraction-lab", "decimal-dash", "graph-plotter"],
  Science: ["element-match", "equation-balancer", "genetics-lab", "unit-converter"],
  Language: ["letter-rain", "word-builder", "word-search", "crossword"],
  History: ["timeline-dash", "trivia-quiz"],
  "Touch & Create": ["maze-runner", "trace-learn", "color-lab", "connect-dots", "scratch-reveal"],
  Puzzles: ["sudoku", "nonogram", "number-puzzle"],
};

const MEDAL_ICONS: Record<MedalTier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
};

const TIER_ORDER: MedalTier[] = ["bronze", "silver", "gold"];

export function ProgressDashboard() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [achievements, setAchievements] = useState<Record<string, MedalTier>>({});
  const [gameScores, setGameScores] = useState<Record<string, number>>({});
  const [dailyStreak, setDailyStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setAchievements(getAchievements());
    const scores: Record<string, number> = {};
    for (const game of GAMES) {
      scores[game.id] = getLocalHighScore(game.scoreKey);
    }
    setGameScores(scores);
    setDailyStreak(getDailyChallengeStreak());
    setLongestStreak(getLongestStreak());
    setCompletedDates(getCompletedDates());
    setMounted(true);
  }, []);

  if (!mounted || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Computed stats
  const totalHighScore = Object.values(gameScores).reduce((a, b) => a + b, 0);
  const gamesPlayed = Object.entries(profile.gamesPlayedByGameId);
  const favoriteGame = gamesPlayed.length > 0
    ? gamesPlayed.sort((a, b) => b[1] - a[1])[0]
    : null;
  const favoriteGameMeta = favoriteGame ? GAMES.find((g) => g.id === favoriteGame[0]) : null;
  const uniqueGamesPlayed = Object.keys(profile.gamesPlayedByGameId).length;
  const totalMedals = Object.keys(achievements).length;

  // Subject strength calculation
  const subjectStrengths = Object.entries(SUBJECT_CATEGORIES).map(([subject, gameIds]) => {
    const totalPlays = gameIds.reduce((sum, id) => sum + (profile.gamesPlayedByGameId[id] ?? 0), 0);
    const totalScore = gameIds.reduce((sum, id) => sum + (gameScores[id] ?? 0), 0);
    // Normalize: score contributes 60%, play count 40% (capped at 50 plays)
    const scoreNorm = Math.min(totalScore / 500, 1);
    const playNorm = Math.min(totalPlays / 50, 1);
    const strength = scoreNorm * 0.6 + playNorm * 0.4;
    return { subject, strength: Math.round(strength * 100) };
  });
  const maxStrength = Math.max(...subjectStrengths.map((s) => s.strength), 1);

  // Activity heatmap (last 30 days) — use daily challenge completions + game plays
  const heatmapDays = (() => {
    const days: Array<{ date: string; level: number }> = [];
    const completedSet = new Set(completedDates);
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      // level 0 = no activity, 1 = daily challenge done, just use binary for simplicity
      days.push({ date: ds, level: completedSet.has(ds) ? 1 : 0 });
    }
    return days;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Games
        </Link>
        <h1 className="text-lg font-bold text-white">Progress</h1>
        <div className="w-16" />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pb-12 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Gamepad2 className="w-5 h-5 text-indigo-400" />}
            label="Games Played"
            value={profile.totalGamesPlayed}
          />
          <SummaryCard
            icon={<Star className="w-5 h-5 text-yellow-400" />}
            label="Total Score"
            value={profile.totalScore.toLocaleString()}
          />
          <SummaryCard
            icon={<Trophy className="w-5 h-5 text-amber-400" />}
            label="Medals Earned"
            value={totalMedals}
          />
          <SummaryCard
            icon={<Target className="w-5 h-5 text-emerald-400" />}
            label="Games Explored"
            value={`${uniqueGamesPlayed}/${GAMES.length}`}
          />
        </div>

        {/* Favorite Game */}
        {favoriteGameMeta && (
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <GameIcon id={favoriteGameMeta.id} size={40} fallback={favoriteGameMeta.emoji} />
            <div>
              <div className="text-xs text-slate-400">Favorite Game</div>
              <div className="text-white font-bold">{favoriteGameMeta.name}</div>
              <div className="text-xs text-slate-500">{favoriteGame![1]} plays</div>
            </div>
          </div>
        )}

        {/* Daily Challenge Streak */}
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-bold">Daily Challenge</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold text-orange-400">{dailyStreak}</div>
              <div className="text-xs text-slate-400">Current Streak</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">{longestStreak}</div>
              <div className="text-xs text-slate-400">Longest Streak</div>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-bold mb-3 text-sm">Activity — Last 30 Days</h3>
          <div className="grid grid-cols-10 gap-1.5">
            {heatmapDays.map((day) => (
              <div
                key={day.date}
                title={day.date}
                className={`aspect-square rounded-sm transition-all ${
                  day.level > 0
                    ? "bg-emerald-400"
                    : "bg-white/[0.06]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-slate-500">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-white/[0.06]" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <span>More</span>
          </div>
        </div>

        {/* Per-Game Stats */}
        <div>
          <h3 className="text-white font-bold mb-3 text-sm">Game Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GAMES.map((game) => {
              const plays = profile.gamesPlayedByGameId[game.id] ?? 0;
              const best = gameScores[game.id] ?? 0;
              return (
                <div
                  key={game.id}
                  className="bg-white/[0.04] border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.06] transition-all"
                >
                  <GameIcon id={game.id} size={32} fallback={game.emoji} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{game.name}</div>
                    <div className="text-xs text-slate-400">{plays} plays</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold tabular-nums">{best}</div>
                    <div className="text-[10px] text-slate-500">Best</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Showcase */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-yellow-400" />
            <h3 className="text-white font-bold text-sm">Achievements</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEDALS.map((medal) => {
              const earned = achievements[medal.id];
              const earnedIdx = earned ? TIER_ORDER.indexOf(earned) : -1;
              return (
                <div
                  key={medal.id}
                  className={`bg-white/[0.04] border rounded-xl p-4 transition-all ${
                    earned ? "border-yellow-400/20" : "border-white/10 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{medal.name}</span>
                    <div className="flex gap-1">
                      {TIER_ORDER.map((tier, idx) => (
                        <span
                          key={tier}
                          className={`text-base ${idx <= earnedIdx ? "" : "opacity-20 grayscale"}`}
                        >
                          {MEDAL_ICONS[tier]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Progress display */}
                  <div className="space-y-1">
                    {TIER_ORDER.map((tier, idx) => {
                      const isEarned = idx <= earnedIdx;
                      const req = medal[tier].requirement;
                      return (
                        <div key={tier} className="flex items-center gap-2 text-[11px]">
                          <span className={isEarned ? "text-green-400" : "text-slate-600"}>
                            {isEarned ? "✓" : "○"}
                          </span>
                          <span className={isEarned ? "text-slate-300" : "text-slate-600"}>
                            {req}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills Radar (simple bar-based visualization) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 text-sm">Subject Strength</h3>
          <div className="space-y-3">
            {subjectStrengths.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{s.subject}</span>
                  <span className="text-xs text-slate-500 tabular-nums">{s.strength}%</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${maxStrength > 0 ? (s.strength / maxStrength) * 100 : 0}%`,
                      background: `linear-gradient(90deg, #6366f1, #8b5cf6)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
