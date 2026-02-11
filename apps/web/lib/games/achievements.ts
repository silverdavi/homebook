/**
 * Achievement/medal system: definitions, check logic, localStorage persistence.
 * Medals have bronze / silver / gold tiers. Check after each game end.
 */

export type MedalTier = "bronze" | "silver" | "gold";

export interface MedalDef {
  id: string;
  name: string;
  bronze: { requirement: string; check: (ctx: AchievementContext) => boolean };
  silver: { requirement: string; check: (ctx: AchievementContext) => boolean };
  gold: { requirement: string; check: (ctx: AchievementContext) => boolean };
}

/** Stats passed from each game on game-over. Game-specific; only relevant fields present. */
export interface GameStats {
  gameId: string;
  score?: number;
  level?: number;
  accuracy?: number; // 0–100
  lpm?: number;
  bestCombo?: number;
  bestStreak?: number;
  solved?: number;
  totalCaught?: number;
  totalMissed?: number;
  perfectLevels?: number; // levels completed with 0 misses (e.g. Letter Rain)
  wordsBuilt?: number;
  mode?: string; // e.g. "sprint" | "survival" | "target"
  timeSeconds?: number;
  elapsed?: number;
  moves?: number;
  totalPairs?: number;
}

/** Aggregate context for checks: current game stats + profile (games played, games played per id). */
export interface AchievementContext {
  stats: GameStats;
  totalGamesPlayed: number;
  gamesPlayedByGameId: Record<string, number>;
  earnedMedals: Record<string, MedalTier>;
}

const STORAGE_KEY_ACHIEVEMENTS = "achievements";

/**
 * Achievement thresholds — designed so:
 *   Bronze: accessible to beginners, a warm "good job" after a few minutes of play
 *   Silver: requires solid skill, sustained focus, and good streaks
 *   Gold: genuinely hard — demands mastery, near-perfect play, and endurance
 */
export const MEDALS: MedalDef[] = [
  // ── Global / cross-game ──
  {
    id: "first-steps",
    name: "First Steps",
    bronze: { requirement: "Play 3 games", check: (c) => c.totalGamesPlayed >= 3 },
    silver: { requirement: "Play 25 games", check: (c) => c.totalGamesPlayed >= 25 },
    gold: { requirement: "Play 100 games", check: (c) => c.totalGamesPlayed >= 100 },
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    bronze: { requirement: "80% accuracy in any game", check: (c) => (c.stats.accuracy ?? 0) >= 80 },
    silver: { requirement: "95% accuracy", check: (c) => (c.stats.accuracy ?? 0) >= 95 },
    gold: { requirement: "100% accuracy with 30+ solved", check: (c) => (c.stats.accuracy ?? 0) >= 100 && (c.stats.solved ?? 0) >= 30 },
  },
  {
    id: "streak-master",
    name: "Streak Master",
    bronze: { requirement: "15-streak in any game", check: (c) => (c.stats.bestStreak ?? c.stats.bestCombo ?? 0) >= 15 },
    silver: { requirement: "40-streak", check: (c) => (c.stats.bestStreak ?? c.stats.bestCombo ?? 0) >= 40 },
    gold: { requirement: "80-streak", check: (c) => (c.stats.bestStreak ?? c.stats.bestCombo ?? 0) >= 80 },
  },
  {
    id: "polymath",
    name: "Polymath",
    bronze: { requirement: "Play 5 different games", check: (c) => Object.keys(c.gamesPlayedByGameId).length >= 5 },
    silver: { requirement: "Play 15 different games", check: (c) => Object.keys(c.gamesPlayedByGameId).length >= 15 },
    gold: { requirement: "Play all 30 games", check: (c) => Object.keys(c.gamesPlayedByGameId).length >= 30 },
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    bronze: { requirement: "1 perfect level (0 misses)", check: (c) => (c.stats.perfectLevels ?? 0) >= 1 },
    silver: { requirement: "5 perfect levels", check: (c) => (c.stats.perfectLevels ?? 0) >= 5 },
    gold: { requirement: "15 perfect levels", check: (c) => (c.stats.perfectLevels ?? 0) >= 15 },
  },
  // ── Language ──
  {
    id: "speed-demon",
    name: "Speed Demon",
    bronze: { requirement: "20+ LPM in Letter Rain", check: (c) => c.stats.gameId === "letter-rain" && (c.stats.lpm ?? 0) >= 20 },
    silver: { requirement: "35+ LPM", check: (c) => c.stats.gameId === "letter-rain" && (c.stats.lpm ?? 0) >= 35 },
    gold: { requirement: "50+ LPM", check: (c) => c.stats.gameId === "letter-rain" && (c.stats.lpm ?? 0) >= 50 },
  },
  {
    id: "wordsmith",
    name: "Wordsmith",
    bronze: { requirement: "Build 15 words", check: (c) => c.stats.gameId === "word-builder" && (c.stats.wordsBuilt ?? c.stats.level ?? 0) >= 15 },
    silver: { requirement: "Build 40 words", check: (c) => c.stats.gameId === "word-builder" && (c.stats.wordsBuilt ?? c.stats.level ?? 0) >= 40 },
    gold: { requirement: "Build 80 words", check: (c) => c.stats.gameId === "word-builder" && (c.stats.wordsBuilt ?? c.stats.level ?? 0) >= 80 },
  },
  // ── Math ──
  {
    id: "math-machine",
    name: "Math Machine",
    bronze: { requirement: "Solve 25 in Math Blitz", check: (c) => c.stats.gameId === "math-blitz" && (c.stats.solved ?? 0) >= 25 },
    silver: { requirement: "Solve 60", check: (c) => c.stats.gameId === "math-blitz" && (c.stats.solved ?? 0) >= 60 },
    gold: { requirement: "Solve 100", check: (c) => c.stats.gameId === "math-blitz" && (c.stats.solved ?? 0) >= 100 },
  },
  {
    id: "fraction-pro",
    name: "Fraction Pro",
    bronze: { requirement: "Score 500 in Fraction Fighter", check: (c) => c.stats.gameId === "fraction-fighter" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "fraction-fighter" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "fraction-fighter" && (c.stats.score ?? 0) >= 5000 },
  },
  {
    id: "lab-expert",
    name: "Lab Expert",
    bronze: { requirement: "Score 500 in Fraction Lab", check: (c) => c.stats.gameId === "fraction-lab" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "fraction-lab" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "fraction-lab" && (c.stats.score ?? 0) >= 5000 },
  },
  {
    id: "times-table-king",
    name: "Times Table King",
    bronze: { requirement: "Complete Sprint mode", check: (c) => c.stats.gameId === "times-table" && c.stats.mode === "sprint" },
    silver: { requirement: "Sprint under 75s", check: (c) => c.stats.gameId === "times-table" && c.stats.mode === "sprint" && (c.stats.timeSeconds ?? c.stats.elapsed ?? 999) < 75 },
    gold: { requirement: "Sprint under 45s", check: (c) => c.stats.gameId === "times-table" && c.stats.mode === "sprint" && (c.stats.timeSeconds ?? c.stats.elapsed ?? 999) < 45 },
  },
  {
    id: "decimal-master",
    name: "Decimal Master",
    bronze: { requirement: "Score 500 in Decimal Dash", check: (c) => c.stats.gameId === "decimal-dash" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "decimal-dash" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "decimal-dash" && (c.stats.score ?? 0) >= 5000 },
  },
  {
    id: "graph-guru",
    name: "Graph Guru",
    bronze: { requirement: "Score 500 in Graph Plotter", check: (c) => c.stats.gameId === "graph-plotter" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 1500", check: (c) => c.stats.gameId === "graph-plotter" && (c.stats.score ?? 0) >= 1500 },
    gold: { requirement: "Score 4000", check: (c) => c.stats.gameId === "graph-plotter" && (c.stats.score ?? 0) >= 4000 },
  },
  // ── Science ──
  {
    id: "chemist",
    name: "Chemist",
    bronze: { requirement: "Match 6 elements", check: (c) => c.stats.gameId === "element-match" && (c.stats.totalPairs ?? 0) >= 6 },
    silver: { requirement: "Match 10 elements", check: (c) => c.stats.gameId === "element-match" && (c.stats.totalPairs ?? 0) >= 10 },
    gold: { requirement: "Match 15 in under 60s", check: (c) => c.stats.gameId === "element-match" && (c.stats.totalPairs ?? 0) >= 15 && ((c.stats.timeSeconds ?? c.stats.elapsed ?? 999) as number) < 60 },
  },
  {
    id: "equation-wizard",
    name: "Equation Wizard",
    bronze: { requirement: "Score 500 in Equation Balancer", check: (c) => c.stats.gameId === "equation-balancer" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "equation-balancer" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "equation-balancer" && (c.stats.score ?? 0) >= 5000 },
  },
  {
    id: "geneticist",
    name: "Geneticist",
    bronze: { requirement: "Score 500 in Genetics Lab", check: (c) => c.stats.gameId === "genetics-lab" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 1500", check: (c) => c.stats.gameId === "genetics-lab" && (c.stats.score ?? 0) >= 1500 },
    gold: { requirement: "Score 4000", check: (c) => c.stats.gameId === "genetics-lab" && (c.stats.score ?? 0) >= 4000 },
  },
  {
    id: "unit-expert",
    name: "Unit Expert",
    bronze: { requirement: "Score 500 in Unit Converter", check: (c) => c.stats.gameId === "unit-converter" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 1500", check: (c) => c.stats.gameId === "unit-converter" && (c.stats.score ?? 0) >= 1500 },
    gold: { requirement: "Score 4000", check: (c) => c.stats.gameId === "unit-converter" && (c.stats.score ?? 0) >= 4000 },
  },
  // ── Science Study ──
  {
    id: "science-scholar",
    name: "Science Scholar",
    bronze: { requirement: "Score 500 in Science Study", check: (c) => c.stats.gameId === "science-study" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "science-study" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "science-study" && (c.stats.score ?? 0) >= 5000 },
  },
  // ── Geography ──
  {
    id: "world-explorer",
    name: "World Explorer",
    bronze: { requirement: "Score 500 in Geography", check: (c) => c.stats.gameId === "geography" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "geography" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "geography" && (c.stats.score ?? 0) >= 5000 },
  },
  // ── History / Creative / Puzzles ──
  {
    id: "historian",
    name: "Historian",
    bronze: { requirement: "Score 500 in Timeline Dash", check: (c) => c.stats.gameId === "timeline-dash" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "timeline-dash" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "timeline-dash" && (c.stats.score ?? 0) >= 5000 },
  },
  {
    id: "maze-master",
    name: "Maze Master",
    bronze: { requirement: "Score 500 in Maze Runner", check: (c) => c.stats.gameId === "maze-runner" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 2000", check: (c) => c.stats.gameId === "maze-runner" && (c.stats.score ?? 0) >= 2000 },
    gold: { requirement: "Score 5000", check: (c) => c.stats.gameId === "maze-runner" && (c.stats.score ?? 0) >= 5000 },
  },
  {
    id: "scratch-champion",
    name: "Scratch Champion",
    bronze: { requirement: "Score 500 in Scratch & Reveal", check: (c) => c.stats.gameId === "scratch-reveal" && (c.stats.score ?? 0) >= 500 },
    silver: { requirement: "Score 1500", check: (c) => c.stats.gameId === "scratch-reveal" && (c.stats.score ?? 0) >= 1500 },
    gold: { requirement: "Score 4000", check: (c) => c.stats.gameId === "scratch-reveal" && (c.stats.score ?? 0) >= 4000 },
  },
];

const GAME_IDS = [
  "letter-rain", "word-builder",
  "math-blitz", "fraction-fighter", "times-table", "fraction-lab", "decimal-dash", "graph-plotter",
  "element-match", "equation-balancer", "genetics-lab", "unit-converter", "science-study",
  "timeline-dash", "geography",
  "maze-runner", "trace-learn", "color-lab", "connect-dots", "scratch-reveal",
  "sudoku", "crossword", "word-search", "trivia-quiz", "nonogram", "number-puzzle",
  "daily-challenge",
] as const;

export function getAchievements(): Record<string, MedalTier> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, MedalTier> = {};
    for (const [id, tier] of Object.entries(parsed)) {
      if (tier === "bronze" || tier === "silver" || tier === "gold") out[id] = tier;
    }
    return out;
  } catch {
    return {};
  }
}

export function setAchievement(medalId: string, tier: MedalTier): void {
  const prev = getAchievements();
  const order: MedalTier[] = ["bronze", "silver", "gold"];
  const prevTier = prev[medalId];
  const prevIdx = prevTier ? order.indexOf(prevTier) : -1;
  const newIdx = order.indexOf(tier);
  if (newIdx <= prevIdx) return;
  try {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify({ ...prev, [medalId]: tier }));
  } catch {
    // ignore
  }
  // Sync to server if logged in
  syncAchievementToServer(medalId, tier);
}

/** Sync achievement to server profile (fire-and-forget). */
function syncAchievementToServer(medalId: string, tier: MedalTier): void {
  try {
    const profileId = typeof window !== "undefined" ? localStorage.getItem("activeProfileId") : null;
    if (!profileId) return;

    fetch(`/api/profiles/${profileId}/achievements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medalId, tier }),
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

export function getMedalDef(id: string): MedalDef | undefined {
  return MEDALS.find((m) => m.id === id);
}

/** Return tier for a medal if the context satisfies it (best tier only). */
function getTierForMedal(medal: MedalDef, ctx: AchievementContext): MedalTier | null {
  if (medal.gold.check(ctx)) return "gold";
  if (medal.silver.check(ctx)) return "silver";
  if (medal.bronze.check(ctx)) return "bronze";
  return null;
}

export interface NewAchievement {
  medalId: string;
  name: string;
  tier: MedalTier;
}

/**
 * Check all medals; persist any new/upgraded; return list of newly earned (or upgraded) for toasts.
 */
export function checkAchievements(
  stats: GameStats,
  totalGamesPlayed: number,
  gamesPlayedByGameId: Record<string, number>
): NewAchievement[] {
  const earned = getAchievements();
  const ctx: AchievementContext = {
    stats,
    totalGamesPlayed,
    gamesPlayedByGameId,
    earnedMedals: earned,
  };
  const newEarned: NewAchievement[] = [];

  for (const medal of MEDALS) {
    const tier = getTierForMedal(medal, ctx);
    if (!tier) continue;
    const current = earned[medal.id];
    const order: MedalTier[] = ["bronze", "silver", "gold"];
    const currentIdx = current ? order.indexOf(current) : -1;
    const newIdx = order.indexOf(tier);
    if (newIdx > currentIdx) {
      setAchievement(medal.id, tier);
      newEarned.push({ medalId: medal.id, name: medal.name, tier });
    }
  }

  return newEarned;
}

export { GAME_IDS };
