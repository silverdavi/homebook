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

/** All 12 medals with tier checks */
export const MEDALS: MedalDef[] = [
  {
    id: "first-steps",
    name: "First Steps",
    bronze: { requirement: "Play 1 game", check: (c) => c.totalGamesPlayed >= 1 },
    silver: { requirement: "Play 10 games", check: (c) => c.totalGamesPlayed >= 10 },
    gold: { requirement: "Play 50 games", check: (c) => c.totalGamesPlayed >= 50 },
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    bronze: { requirement: "80% accuracy in any game", check: (c) => (c.stats.accuracy ?? 0) >= 80 },
    silver: { requirement: "90% accuracy", check: (c) => (c.stats.accuracy ?? 0) >= 90 },
    gold: { requirement: "100% accuracy (perfect game)", check: (c) => (c.stats.accuracy ?? 0) >= 100 },
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    bronze: { requirement: "15+ LPM in Letter Rain", check: (c) => c.stats.gameId === "letter-rain" && (c.stats.lpm ?? 0) >= 15 },
    silver: { requirement: "25+ LPM", check: (c) => c.stats.gameId === "letter-rain" && (c.stats.lpm ?? 0) >= 25 },
    gold: { requirement: "40+ LPM", check: (c) => c.stats.gameId === "letter-rain" && (c.stats.lpm ?? 0) >= 40 },
  },
  {
    id: "math-machine",
    name: "Math Machine",
    bronze: { requirement: "Solve 20 in Math Blitz", check: (c) => c.stats.gameId === "math-blitz" && (c.stats.solved ?? 0) >= 20 },
    silver: { requirement: "Solve 30", check: (c) => c.stats.gameId === "math-blitz" && (c.stats.solved ?? 0) >= 30 },
    gold: { requirement: "Solve 40", check: (c) => c.stats.gameId === "math-blitz" && (c.stats.solved ?? 0) >= 40 },
  },
  {
    id: "streak-master",
    name: "Streak Master",
    bronze: { requirement: "10-streak in any game", check: (c) => (c.stats.bestStreak ?? c.stats.bestCombo ?? 0) >= 10 },
    silver: { requirement: "20-streak", check: (c) => (c.stats.bestStreak ?? c.stats.bestCombo ?? 0) >= 20 },
    gold: { requirement: "50-streak", check: (c) => (c.stats.bestStreak ?? c.stats.bestCombo ?? 0) >= 50 },
  },
  {
    id: "fraction-pro",
    name: "Fraction Pro",
    bronze: { requirement: "Level 5 in Fraction Fighter", check: (c) => c.stats.gameId === "fraction-fighter" && (c.stats.level ?? 0) >= 5 },
    silver: { requirement: "Level 10", check: (c) => c.stats.gameId === "fraction-fighter" && (c.stats.level ?? 0) >= 10 },
    gold: { requirement: "Level 15", check: (c) => c.stats.gameId === "fraction-fighter" && (c.stats.level ?? 0) >= 15 },
  },
  {
    id: "chemist",
    name: "Chemist",
    bronze: { requirement: "Match 4 elements", check: (c) => c.stats.gameId === "element-match" && (c.stats.totalPairs ?? 0) >= 4 },
    silver: { requirement: "Match 8 elements", check: (c) => c.stats.gameId === "element-match" && (c.stats.totalPairs ?? 0) >= 8 },
    gold: { requirement: "Match 10 in under 60s", check: (c) => c.stats.gameId === "element-match" && (c.stats.totalPairs ?? 0) >= 10 && ((c.stats.timeSeconds ?? c.stats.elapsed ?? 999) as number) < 60 },
  },
  {
    id: "wordsmith",
    name: "Wordsmith",
    bronze: { requirement: "Build 10 words", check: (c) => c.stats.gameId === "word-builder" && (c.stats.wordsBuilt ?? c.stats.level ?? 0) >= 10 },
    silver: { requirement: "Build 25 words", check: (c) => c.stats.gameId === "word-builder" && (c.stats.wordsBuilt ?? c.stats.level ?? 0) >= 25 },
    gold: { requirement: "Build 50 words", check: (c) => c.stats.gameId === "word-builder" && (c.stats.wordsBuilt ?? c.stats.level ?? 0) >= 50 },
  },
  {
    id: "times-table-king",
    name: "Times Table King",
    bronze: { requirement: "Complete Sprint mode", check: (c) => c.stats.gameId === "times-table" && c.stats.mode === "sprint" },
    silver: { requirement: "Sprint under 90s", check: (c) => c.stats.gameId === "times-table" && c.stats.mode === "sprint" && (c.stats.timeSeconds ?? c.stats.elapsed ?? 999) < 90 },
    gold: { requirement: "Sprint under 60s", check: (c) => c.stats.gameId === "times-table" && c.stats.mode === "sprint" && (c.stats.timeSeconds ?? c.stats.elapsed ?? 999) < 60 },
  },
  {
    id: "lab-expert",
    name: "Lab Expert",
    bronze: { requirement: "Score 100 in Fraction Lab", check: (c) => c.stats.gameId === "fraction-lab" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 200", check: (c) => c.stats.gameId === "fraction-lab" && (c.stats.score ?? 0) >= 200 },
    gold: { requirement: "Score 300", check: (c) => c.stats.gameId === "fraction-lab" && (c.stats.score ?? 0) >= 300 },
  },
  {
    id: "polymath",
    name: "Polymath",
    bronze: { requirement: "Play 5 different games", check: (c) => Object.keys(c.gamesPlayedByGameId).length >= 5 },
    silver: { requirement: "Play 10 different games", check: (c) => Object.keys(c.gamesPlayedByGameId).length >= 10 },
    gold: { requirement: "Play all 25 games", check: (c) => Object.keys(c.gamesPlayedByGameId).length >= 25 },
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    bronze: { requirement: "1 perfect level (0 misses)", check: (c) => (c.stats.perfectLevels ?? 0) >= 1 },
    silver: { requirement: "3 perfect levels", check: (c) => (c.stats.perfectLevels ?? 0) >= 3 },
    gold: { requirement: "10 perfect levels", check: (c) => (c.stats.perfectLevels ?? 0) >= 10 },
  },
  {
    id: "decimal-master",
    name: "Decimal Master",
    bronze: { requirement: "Score 100 in Decimal Dash", check: (c) => c.stats.gameId === "decimal-dash" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 200", check: (c) => c.stats.gameId === "decimal-dash" && (c.stats.score ?? 0) >= 200 },
    gold: { requirement: "Score 400", check: (c) => c.stats.gameId === "decimal-dash" && (c.stats.score ?? 0) >= 400 },
  },
  {
    id: "graph-guru",
    name: "Graph Guru",
    bronze: { requirement: "Score 100 in Graph Plotter", check: (c) => c.stats.gameId === "graph-plotter" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 200", check: (c) => c.stats.gameId === "graph-plotter" && (c.stats.score ?? 0) >= 200 },
    gold: { requirement: "Score 400", check: (c) => c.stats.gameId === "graph-plotter" && (c.stats.score ?? 0) >= 400 },
  },
  {
    id: "equation-wizard",
    name: "Equation Wizard",
    bronze: { requirement: "Score 100 in Equation Balancer", check: (c) => c.stats.gameId === "equation-balancer" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 250", check: (c) => c.stats.gameId === "equation-balancer" && (c.stats.score ?? 0) >= 250 },
    gold: { requirement: "Score 500", check: (c) => c.stats.gameId === "equation-balancer" && (c.stats.score ?? 0) >= 500 },
  },
  {
    id: "geneticist",
    name: "Geneticist",
    bronze: { requirement: "Score 100 in Genetics Lab", check: (c) => c.stats.gameId === "genetics-lab" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 200", check: (c) => c.stats.gameId === "genetics-lab" && (c.stats.score ?? 0) >= 200 },
    gold: { requirement: "Score 400", check: (c) => c.stats.gameId === "genetics-lab" && (c.stats.score ?? 0) >= 400 },
  },
  {
    id: "unit-expert",
    name: "Unit Expert",
    bronze: { requirement: "Score 100 in Unit Converter", check: (c) => c.stats.gameId === "unit-converter" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 200", check: (c) => c.stats.gameId === "unit-converter" && (c.stats.score ?? 0) >= 200 },
    gold: { requirement: "Score 400", check: (c) => c.stats.gameId === "unit-converter" && (c.stats.score ?? 0) >= 400 },
  },
  {
    id: "historian",
    name: "Historian",
    bronze: { requirement: "Score 100 in Timeline Dash", check: (c) => c.stats.gameId === "timeline-dash" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 250", check: (c) => c.stats.gameId === "timeline-dash" && (c.stats.score ?? 0) >= 250 },
    gold: { requirement: "Score 500", check: (c) => c.stats.gameId === "timeline-dash" && (c.stats.score ?? 0) >= 500 },
  },
  {
    id: "maze-master",
    name: "Maze Master",
    bronze: { requirement: "Score 100 in Maze Runner", check: (c) => c.stats.gameId === "maze-runner" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 250", check: (c) => c.stats.gameId === "maze-runner" && (c.stats.score ?? 0) >= 250 },
    gold: { requirement: "Score 500", check: (c) => c.stats.gameId === "maze-runner" && (c.stats.score ?? 0) >= 500 },
  },
  {
    id: "scratch-champion",
    name: "Scratch Champion",
    bronze: { requirement: "Score 100 in Scratch & Reveal", check: (c) => c.stats.gameId === "scratch-reveal" && (c.stats.score ?? 0) >= 100 },
    silver: { requirement: "Score 200", check: (c) => c.stats.gameId === "scratch-reveal" && (c.stats.score ?? 0) >= 200 },
    gold: { requirement: "Score 400", check: (c) => c.stats.gameId === "scratch-reveal" && (c.stats.score ?? 0) >= 400 },
  },
];

const GAME_IDS = [
  "letter-rain", "word-builder",
  "math-blitz", "fraction-fighter", "times-table", "fraction-lab", "decimal-dash", "graph-plotter",
  "element-match", "equation-balancer", "genetics-lab", "unit-converter",
  "timeline-dash",
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
