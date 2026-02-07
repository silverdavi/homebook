import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSavedName,
  saveName,
  getLocalHighScore,
  setLocalHighScore,
  getProfile,
  trackGamePlayed,
} from "@/lib/games/use-scores";

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

describe("getSavedName / saveName", () => {
  it("returns empty string when no name saved", () => {
    expect(getSavedName()).toBe("");
  });

  it("saves and retrieves a name", () => {
    saveName("Alice");
    expect(getSavedName()).toBe("Alice");
  });

  it("overwrites previous name", () => {
    saveName("Alice");
    saveName("Bob");
    expect(getSavedName()).toBe("Bob");
  });
});

describe("getLocalHighScore / setLocalHighScore", () => {
  it("returns 0 when no score saved", () => {
    expect(getLocalHighScore("mathBlitz_highScore")).toBe(0);
  });

  it("saves and retrieves a score", () => {
    setLocalHighScore("mathBlitz_highScore", 150);
    expect(getLocalHighScore("mathBlitz_highScore")).toBe(150);
  });

  it("overwrites previous score", () => {
    setLocalHighScore("mathBlitz_highScore", 100);
    setLocalHighScore("mathBlitz_highScore", 200);
    expect(getLocalHighScore("mathBlitz_highScore")).toBe(200);
  });

  it("works with different keys independently", () => {
    setLocalHighScore("mathBlitz_highScore", 100);
    setLocalHighScore("letterRain_highScore", 200);
    expect(getLocalHighScore("mathBlitz_highScore")).toBe(100);
    expect(getLocalHighScore("letterRain_highScore")).toBe(200);
  });
});

describe("getProfile", () => {
  it("returns default profile when nothing saved", () => {
    const profile = getProfile();
    expect(profile.totalGamesPlayed).toBe(0);
    expect(profile.gamesPlayedByGameId).toEqual({});
    expect(profile.totalScore).toBe(0);
  });

  it("returns saved profile data", () => {
    store["playerProfile"] = JSON.stringify({
      totalGamesPlayed: 5,
      gamesPlayedByGameId: { "math-blitz": 3, "letter-rain": 2 },
      totalScore: 500,
    });
    const profile = getProfile();
    expect(profile.totalGamesPlayed).toBe(5);
    expect(profile.gamesPlayedByGameId).toEqual({ "math-blitz": 3, "letter-rain": 2 });
    expect(profile.totalScore).toBe(500);
  });

  it("handles corrupted data gracefully", () => {
    store["playerProfile"] = "not-json";
    const profile = getProfile();
    expect(profile.totalGamesPlayed).toBe(0);
    expect(profile.gamesPlayedByGameId).toEqual({});
    expect(profile.totalScore).toBe(0);
  });
});

describe("trackGamePlayed", () => {
  it("increments total games played", () => {
    trackGamePlayed("math-blitz", 100);
    const profile = getProfile();
    expect(profile.totalGamesPlayed).toBe(1);
  });

  it("tracks per-game counts", () => {
    trackGamePlayed("math-blitz", 100);
    trackGamePlayed("math-blitz", 200);
    trackGamePlayed("letter-rain", 50);
    const profile = getProfile();
    expect(profile.gamesPlayedByGameId["math-blitz"]).toBe(2);
    expect(profile.gamesPlayedByGameId["letter-rain"]).toBe(1);
  });

  it("accumulates total score", () => {
    trackGamePlayed("math-blitz", 100);
    trackGamePlayed("letter-rain", 200);
    const profile = getProfile();
    expect(profile.totalScore).toBe(300);
  });

  it("handles zero score", () => {
    trackGamePlayed("math-blitz");
    const profile = getProfile();
    expect(profile.totalGamesPlayed).toBe(1);
    expect(profile.totalScore).toBe(0);
  });
});
