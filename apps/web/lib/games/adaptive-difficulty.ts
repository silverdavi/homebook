/**
 * Adaptive Difficulty Engine
 *
 * Dynamically adjusts game difficulty based on player performance in real-time.
 *
 * Core idea:
 *   - Track a floating-point "level" that continuously adjusts
 *   - 5 quick correct answers in a row → level increases by ~10%
 *   - Wrong answers → level decreases (single wrong: -10%, 2+ in a row: -20%)
 *   - Games map this level to their own parameters (denominator range, timer, etc.)
 *
 * The system produces a smooth difficulty curve that keeps the player in a "flow
 * state" — always challenged but never overwhelmed.
 */

// ── Types ──

export interface AdaptiveConfig {
  /** How many consecutive correct answers before a difficulty bump (default 5) */
  streakThreshold: number;
  /** Percentage increase per threshold hit — 0.10 = 10% (default 0.10) */
  bumpPercent: number;
  /** Extra bump when answers are fast (default 0.05 = 5%) */
  fastBonus: number;
  /** Percentage decrease on a single wrong answer (default 0.10) */
  dropOnWrong: number;
  /** Percentage decrease on 2+ consecutive wrong answers (default 0.20) */
  dropOnWrongStreak: number;
  /** Minimum difficulty floor (default 1) */
  minLevel: number;
  /** Maximum difficulty ceiling (default 30) */
  maxLevel: number;
}

export interface AdaptiveState {
  /** Current effective difficulty level (float, starts at chosen level) */
  level: number;
  /** Current consecutive correct streak */
  streak: number;
  /** Current consecutive wrong streak */
  wrongStreak: number;
  /** Total correct answers this session */
  totalCorrect: number;
  /** Total wrong answers this session */
  totalWrong: number;
  /** How many times the difficulty has adjusted */
  adjustments: number;
  /** Direction of last adjustment: "up" | "down" | null */
  lastAdjust: "up" | "down" | null;
  /** Timestamp of last adjustment (for showing transient UI) */
  lastAdjustTime: number;
}

// ── Defaults ──

const DEFAULT_CONFIG: AdaptiveConfig = {
  streakThreshold: 5,
  bumpPercent: 0.15,     // 15% per streak — 1.5× faster climbing
  fastBonus: 0.075,      // 7.5% extra for fast answers
  dropOnWrong: 0.08,     // gentler single-wrong penalty
  dropOnWrongStreak: 0.18, // consecutive wrongs still punish
  minLevel: 1,
  maxLevel: 50,          // extended ceiling for Legendary+ tiers
};

// ── Core functions ──

/** Create initial adaptive state at a given starting level */
export function createAdaptiveState(startLevel: number): AdaptiveState {
  return {
    level: startLevel,
    streak: 0,
    wrongStreak: 0,
    totalCorrect: 0,
    totalWrong: 0,
    adjustments: 0,
    lastAdjust: null,
    lastAdjustTime: 0,
  };
}

/**
 * Update adaptive state after an answer.
 *
 * @param state - Current adaptive state
 * @param correct - Was the answer correct?
 * @param fast - Was the answer fast? (e.g., answered in < 50% of available time)
 * @param config - Optional partial config overrides
 * @returns New adaptive state (immutable)
 */
export function adaptiveUpdate(
  state: AdaptiveState,
  correct: boolean,
  fast: boolean,
  config: Partial<AdaptiveConfig> = {}
): AdaptiveState {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  if (correct) {
    const newStreak = state.streak + 1;
    let newLevel = state.level;
    let adjusted: "up" | null = null;

    // Every `streakThreshold` correct answers → bump difficulty
    if (newStreak > 0 && newStreak % cfg.streakThreshold === 0) {
      // Base bump: 10% of current level (minimum 0.5 so low levels still grow)
      let bump = Math.max(0.5, state.level * cfg.bumpPercent);
      // Fast answers get an extra bonus
      if (fast) bump += Math.max(0.3, state.level * cfg.fastBonus);
      newLevel = Math.min(cfg.maxLevel, state.level + bump);
      adjusted = "up";
    }

    return {
      level: newLevel,
      streak: newStreak,
      wrongStreak: 0,
      totalCorrect: state.totalCorrect + 1,
      totalWrong: state.totalWrong,
      adjustments: state.adjustments + (adjusted ? 1 : 0),
      lastAdjust: adjusted ?? state.lastAdjust,
      lastAdjustTime: adjusted ? now : state.lastAdjustTime,
    };
  } else {
    const newWrongStreak = state.wrongStreak + 1;
    let drop: number;

    if (newWrongStreak >= 2) {
      // Consecutive wrongs → bigger drop (20%)
      drop = Math.max(0.5, state.level * cfg.dropOnWrongStreak);
    } else {
      // Single wrong → smaller drop (10%)
      drop = Math.max(0.3, state.level * cfg.dropOnWrong);
    }

    return {
      level: Math.max(cfg.minLevel, state.level - drop),
      streak: 0,
      wrongStreak: newWrongStreak,
      totalCorrect: state.totalCorrect,
      totalWrong: state.totalWrong + 1,
      adjustments: state.adjustments + 1,
      lastAdjust: "down",
      lastAdjustTime: now,
    };
  }
}

// ── Parameter helpers ──
// Games use these to translate the float level into concrete parameters

export interface FractionParams {
  /** Maximum denominator to use in fraction generation */
  maxDenominator: number;
  /** Minimum decimal difference between fractions in comparison problems */
  minFractionDiff: number;
  /** Timer multiplier: 1.0 = normal, <1 = faster, >1 = slower */
  timerMultiplier: number;
  /** Probability of generating equal fractions (0.0 - 0.35) */
  equalProbability: number;
  /** Whether to allow "hard" challenge types (mixed numbers, multiply, etc.) */
  allowHardTypes: boolean;
}

/**
 * Map an adaptive level (1-50) to fraction game parameters.
 * Returns concrete values that games can use directly.
 */
export function getFractionParams(level: number): FractionParams {
  // Clamp to [1, 50]
  const l = Math.max(1, Math.min(50, level));

  return {
    // Denominators: level 1 → 5, level 15 → 17, level 30 → 30, level 50 → 48
    maxDenominator: Math.min(Math.floor(4 + l * 0.9), 48),
    // Min diff: level 1 → 0.15, level 15 → 0.06, level 30 → 0.01, level 50 → 0.003
    minFractionDiff: Math.max(0.003, 0.17 - l * 0.0035),
    // Timer: level 1 → 1.4x (slow), level 20 → 0.9x, level 35 → 0.5x, level 50 → 0.25x
    timerMultiplier: Math.max(0.25, 1.5 - l * 0.025),
    // Equal fraction probability: level 1 → 0.25, level 25 → 0.15, level 50 → 0.10
    equalProbability: Math.max(0.10, 0.27 - l * 0.0035),
    // Hard types enabled above level 8
    allowHardTypes: l >= 8,
  };
}

/**
 * Format the current adaptive state for display.
 * Returns a human-readable difficulty label with color.
 *
 * Tiers (10 levels):
 *   1-4    Easy          green
 *   4-8    Medium        lime
 *   8-12   Challenging   yellow
 *   12-16  Hard          orange
 *   16-21  Very Hard     red
 *   21-26  Extreme       deep red
 *   26-32  Unstoppable   purple
 *   32-39  Immortal      violet
 *   39-45  Legendary     gold
 *   45+    Mythic        prismatic/hot pink
 */
export function getDifficultyLabel(level: number): { label: string; color: string; emoji: string } {
  if (level < 4)  return { label: "Easy",        color: "#22c55e", emoji: "🟢" };
  if (level < 8)  return { label: "Medium",      color: "#84cc16", emoji: "🟡" };
  if (level < 12) return { label: "Challenging",  color: "#eab308", emoji: "🟠" };
  if (level < 16) return { label: "Hard",         color: "#f97316", emoji: "🔴" };
  if (level < 21) return { label: "Very Hard",    color: "#ef4444", emoji: "💥" };
  if (level < 26) return { label: "Extreme",      color: "#dc2626", emoji: "🔥" };
  if (level < 32) return { label: "Unstoppable",  color: "#a855f7", emoji: "⚡" };
  if (level < 39) return { label: "Immortal",     color: "#8b5cf6", emoji: "💎" };
  if (level < 45) return { label: "Legendary",    color: "#f59e0b", emoji: "👑" };
  return            { label: "Mythic",       color: "#ec4899", emoji: "🌟" };
}
