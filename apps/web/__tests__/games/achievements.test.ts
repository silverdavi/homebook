import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAchievements,
  setAchievement,
  checkAchievements,
  getMedalDef,
  MEDALS,
  type GameStats,
  type MedalTier,
} from "@/lib/games/achievements";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  });
});

describe("getAchievements", () => {
  it("returns empty object when nothing saved", () => {
    expect(getAchievements()).toEqual({});
  });

  it("returns saved achievements", () => {
    store["achievements"] = JSON.stringify({ "first-steps": "bronze", "sharpshooter": "gold" });
    expect(getAchievements()).toEqual({ "first-steps": "bronze", "sharpshooter": "gold" });
  });

  it("filters invalid tiers", () => {
    store["achievements"] = JSON.stringify({ "first-steps": "platinum" });
    expect(getAchievements()).toEqual({});
  });

  it("handles corrupted JSON gracefully", () => {
    store["achievements"] = "not-json";
    expect(getAchievements()).toEqual({});
  });
});

describe("setAchievement", () => {
  it("stores a new achievement", () => {
    setAchievement("first-steps", "bronze");
    const saved = JSON.parse(store["achievements"]);
    expect(saved["first-steps"]).toBe("bronze");
  });

  it("upgrades from bronze to silver", () => {
    setAchievement("first-steps", "bronze");
    setAchievement("first-steps", "silver");
    const saved = JSON.parse(store["achievements"]);
    expect(saved["first-steps"]).toBe("silver");
  });

  it("upgrades from silver to gold", () => {
    setAchievement("first-steps", "silver");
    setAchievement("first-steps", "gold");
    const saved = JSON.parse(store["achievements"]);
    expect(saved["first-steps"]).toBe("gold");
  });

  it("does NOT downgrade from gold to bronze", () => {
    setAchievement("first-steps", "gold");
    setAchievement("first-steps", "bronze");
    const saved = JSON.parse(store["achievements"]);
    expect(saved["first-steps"]).toBe("gold");
  });

  it("does NOT downgrade from silver to bronze", () => {
    setAchievement("first-steps", "silver");
    setAchievement("first-steps", "bronze");
    const saved = JSON.parse(store["achievements"]);
    expect(saved["first-steps"]).toBe("silver");
  });
});

describe("getMedalDef", () => {
  it("finds a medal by id", () => {
    const medal = getMedalDef("first-steps");
    expect(medal).toBeDefined();
    expect(medal!.name).toBe("First Steps");
  });

  it("returns undefined for unknown id", () => {
    expect(getMedalDef("nonexistent")).toBeUndefined();
  });
});

describe("MEDALS definitions", () => {
  it("has 12 medals", () => {
    expect(MEDALS).toHaveLength(12);
  });

  it("each medal has id, name, bronze, silver, gold", () => {
    for (const medal of MEDALS) {
      expect(medal.id).toBeTruthy();
      expect(medal.name).toBeTruthy();
      expect(medal.bronze.check).toBeTypeOf("function");
      expect(medal.silver.check).toBeTypeOf("function");
      expect(medal.gold.check).toBeTypeOf("function");
      expect(medal.bronze.requirement).toBeTruthy();
      expect(medal.silver.requirement).toBeTruthy();
      expect(medal.gold.requirement).toBeTruthy();
    }
  });
});

describe("checkAchievements — First Steps", () => {
  it("earns bronze after 1 game", () => {
    const stats: GameStats = { gameId: "math-blitz" };
    const result = checkAchievements(stats, 1, { "math-blitz": 1 });
    const firstSteps = result.find((a) => a.medalId === "first-steps");
    expect(firstSteps).toBeDefined();
    expect(firstSteps!.tier).toBe("bronze");
  });

  it("earns silver after 10 games", () => {
    const stats: GameStats = { gameId: "math-blitz" };
    const result = checkAchievements(stats, 10, { "math-blitz": 10 });
    const firstSteps = result.find((a) => a.medalId === "first-steps");
    expect(firstSteps).toBeDefined();
    expect(firstSteps!.tier).toBe("silver");
  });

  it("earns gold after 50 games", () => {
    const stats: GameStats = { gameId: "math-blitz" };
    const result = checkAchievements(stats, 50, { "math-blitz": 50 });
    const firstSteps = result.find((a) => a.medalId === "first-steps");
    expect(firstSteps).toBeDefined();
    expect(firstSteps!.tier).toBe("gold");
  });
});

describe("checkAchievements — Sharpshooter", () => {
  it("earns bronze at 80% accuracy", () => {
    const stats: GameStats = { gameId: "math-blitz", accuracy: 80 };
    const result = checkAchievements(stats, 1, { "math-blitz": 1 });
    const medal = result.find((a) => a.medalId === "sharpshooter");
    expect(medal).toBeDefined();
    expect(medal!.tier).toBe("bronze");
  });

  it("earns gold at 100% accuracy", () => {
    const stats: GameStats = { gameId: "math-blitz", accuracy: 100 };
    const result = checkAchievements(stats, 1, { "math-blitz": 1 });
    const medal = result.find((a) => a.medalId === "sharpshooter");
    expect(medal).toBeDefined();
    expect(medal!.tier).toBe("gold");
  });

  it("does not earn at 79% accuracy", () => {
    const stats: GameStats = { gameId: "math-blitz", accuracy: 79 };
    const result = checkAchievements(stats, 1, { "math-blitz": 1 });
    const medal = result.find((a) => a.medalId === "sharpshooter");
    expect(medal).toBeUndefined();
  });
});

describe("checkAchievements — Speed Demon (Letter Rain specific)", () => {
  it("earns bronze at 15 LPM in letter-rain", () => {
    const stats: GameStats = { gameId: "letter-rain", lpm: 15 };
    const result = checkAchievements(stats, 1, { "letter-rain": 1 });
    const medal = result.find((a) => a.medalId === "speed-demon");
    expect(medal).toBeDefined();
    expect(medal!.tier).toBe("bronze");
  });

  it("does not earn for math-blitz even with high lpm", () => {
    const stats: GameStats = { gameId: "math-blitz", lpm: 50 };
    const result = checkAchievements(stats, 1, { "math-blitz": 1 });
    const medal = result.find((a) => a.medalId === "speed-demon");
    expect(medal).toBeUndefined();
  });
});

describe("checkAchievements — Polymath", () => {
  it("earns bronze when 3 different games played", () => {
    const stats: GameStats = { gameId: "math-blitz" };
    const result = checkAchievements(stats, 3, {
      "math-blitz": 1,
      "letter-rain": 1,
      "word-builder": 1,
    });
    const medal = result.find((a) => a.medalId === "polymath");
    expect(medal).toBeDefined();
    expect(medal!.tier).toBe("bronze");
  });

  it("earns gold when 7+ games played", () => {
    const stats: GameStats = { gameId: "math-blitz" };
    const gamesPlayed = {
      "math-blitz": 1,
      "letter-rain": 1,
      "word-builder": 1,
      "fraction-fighter": 1,
      "element-match": 1,
      "times-table": 1,
      "fraction-lab": 1,
    };
    const result = checkAchievements(stats, 7, gamesPlayed);
    const medal = result.find((a) => a.medalId === "polymath");
    expect(medal).toBeDefined();
    expect(medal!.tier).toBe("gold");
  });
});

describe("checkAchievements — does not re-earn", () => {
  it("does not return already-earned medals at same tier", () => {
    // First call earns bronze
    const stats: GameStats = { gameId: "math-blitz" };
    const first = checkAchievements(stats, 1, { "math-blitz": 1 });
    expect(first.find((a) => a.medalId === "first-steps")).toBeDefined();

    // Second call with same stats should not re-earn
    const second = checkAchievements(stats, 1, { "math-blitz": 1 });
    expect(second.find((a) => a.medalId === "first-steps")).toBeUndefined();
  });
});
