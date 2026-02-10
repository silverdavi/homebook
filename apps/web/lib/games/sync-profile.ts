"use client";

/**
 * Gather all game progress from localStorage and sync to server profile.
 * Called once when user creates a profile or clicks "Sync Progress".
 */
export async function migrateLocalStorageToServer(profileId: string): Promise<boolean> {
  try {
    // 1. Gather playerProfile
    const rawProfile = localStorage.getItem("playerProfile");
    const playerProfile = rawProfile ? JSON.parse(rawProfile) : undefined;

    // 2. Gather achievements
    const rawAch = localStorage.getItem("achievements");
    const achievements = rawAch ? JSON.parse(rawAch) : undefined;

    // 3. Gather daily challenges
    const rawDaily = localStorage.getItem("dailyChallengeData");
    const dailyChallenges = rawDaily ? JSON.parse(rawDaily) : undefined;

    // 4. Gather high scores
    const HIGH_SCORE_KEYS: Record<string, string> = {
      "letter-rain": "letterRain_highScore",
      "word-builder": "wordBuilder_highScore",
      "math-blitz": "mathBlitz_highScore",
      "fraction-fighter": "fractionFighter_highScore",
      "times-table": "timesTable_highScore",
      "fraction-lab": "fractionLab_highScore",
      "decimal-dash": "decimalDash_highScore",
      "graph-plotter": "graphPlotter_highScore",
      "element-match": "elementMatch_highScore",
      "equation-balancer": "equationBalancer_highScore",
      "genetics-lab": "geneticsLab_highScore",
      "unit-converter": "unitConverter_highScore",
      "timeline-dash": "timelineDash_highScore",
      "maze-runner": "mazeRunner_highScore",
      "trace-learn": "traceLearn_highScore",
      "color-lab": "colorLab_highScore",
      "connect-dots": "connectDots_highScore",
      "scratch-reveal": "scratchReveal_highScore",
      "sudoku": "sudoku_highScore",
      "crossword": "crossword",
      "word-search": "wordSearch_highScore",
      "trivia-quiz": "trivia-quiz",
      "nonogram": "nonogram_highScore",
      "number-puzzle": "numberPuzzle_highScore",
    };

    const highScores: Record<string, number> = {};
    for (const [gameId, key] of Object.entries(HIGH_SCORE_KEYS)) {
      const val = localStorage.getItem(key);
      if (val) {
        const score = parseInt(val, 10);
        if (!isNaN(score) && score > 0) highScores[gameId] = score;
      }
    }
    // Also check elementMatch_best which uses a different key
    const emBest = localStorage.getItem("elementMatch_best");
    if (emBest) {
      const score = parseInt(emBest, 10);
      if (!isNaN(score) && score > 0) highScores["element-match"] = Math.max(highScores["element-match"] || 0, score);
    }

    // 5. Gather preferences
    const preferences: Record<string, string> = {};
    const prefKeys = ["games_music_enabled", "games_sfx_enabled", "games_eink_mode", "eink_mode"];
    for (const key of prefKeys) {
      const val = localStorage.getItem(key);
      if (val !== null) preferences[key] = val;
    }

    // 6. Send to server
    const res = await fetch(`/api/profiles/${profileId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerProfile,
        achievements,
        dailyChallenges,
        highScores,
        preferences,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}
