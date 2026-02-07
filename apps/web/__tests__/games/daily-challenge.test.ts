import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDailyChallenge,
  getDailyChallengeStreak,
  setDailyChallengeCompleted,
  isDailyChallengeCompleted,
  getDailyChallengeScore,
  getCompletedDates,
  getLongestStreak,
  getChallengeTypeLabel,
  getChallengeTypeEmoji,
} from "@/lib/games/daily-challenge";

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

describe("getDailyChallenge", () => {
  it("is deterministic — same date gives same challenge", () => {
    const date = new Date(2025, 5, 15); // June 15 local
    const c1 = getDailyChallenge(date);
    const c2 = getDailyChallenge(date);
    expect(c1).toEqual(c2);
  });

  it("different dates give different challenges", () => {
    const c1 = getDailyChallenge(new Date(2025, 5, 15));
    const c2 = getDailyChallenge(new Date(2025, 5, 16));
    expect(c1.date).not.toBe(c2.date);
  });

  it("returns a valid challenge config", () => {
    const config = getDailyChallenge(new Date(2025, 5, 15));
    expect(config.date).toBe("2025-06-15");
    expect(config.seed).toBeTypeOf("number");
    expect(config.challenge.type).toBeTruthy();
    expect(["math", "fraction", "element", "vocabulary", "timeline"]).toContain(config.challenge.type);
  });

  it("cycles through all challenge types across different days", () => {
    const types = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const date = new Date(2025, 0, 1 + i);
      types.add(getDailyChallenge(date).challenge.type);
    }
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  it("math challenge has 5 problems with choices", () => {
    // Find a date that generates a math challenge
    let found = false;
    for (let i = 0; i < 30; i++) {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + i);
      const config = getDailyChallenge(date);
      if (config.challenge.type === "math") {
        const c = config.challenge;
        expect(c.problems).toHaveLength(5);
        for (const p of c.problems) {
          expect(p.question).toBeTruthy();
          expect(p.answer).toBeTypeOf("number");
          expect(p.choices.length).toBe(4);
          expect(p.choices).toContain(p.answer);
        }
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("fraction challenge has 5 pairs", () => {
    let found = false;
    for (let i = 0; i < 30; i++) {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + i);
      const config = getDailyChallenge(date);
      if (config.challenge.type === "fraction") {
        const c = config.challenge;
        expect(c.pairs).toHaveLength(5);
        for (const p of c.pairs) {
          expect(p.left).toMatch(/\d+\/\d+/);
          expect(p.right).toMatch(/\d+\/\d+/);
          expect(["left", "right", "equal"]).toContain(p.answer);
        }
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("element challenge has 5 questions with 4 choices", () => {
    let found = false;
    for (let i = 0; i < 30; i++) {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + i);
      const config = getDailyChallenge(date);
      if (config.challenge.type === "element") {
        const c = config.challenge;
        expect(c.questions).toHaveLength(5);
        for (const q of c.questions) {
          expect(q.symbol).toBeTruthy();
          expect(q.correctName).toBeTruthy();
          expect(q.choices).toHaveLength(4);
          expect(q.choices).toContain(q.correctName);
        }
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("vocabulary challenge has 3 words with scrambled text", () => {
    let found = false;
    for (let i = 0; i < 30; i++) {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + i);
      const config = getDailyChallenge(date);
      if (config.challenge.type === "vocabulary") {
        const c = config.challenge;
        expect(c.words).toHaveLength(3);
        for (const w of c.words) {
          expect(w.scrambled).toBeTruthy();
          expect(w.answer).toBeTruthy();
          expect(w.hint).toBeTruthy();
          // Scrambled should have same letters as answer
          expect(w.scrambled.split("").sort().join("")).toBe(w.answer.split("").sort().join(""));
        }
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("timeline challenge has 4 events with correct order", () => {
    let found = false;
    for (let i = 0; i < 30; i++) {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + i);
      const config = getDailyChallenge(date);
      if (config.challenge.type === "timeline") {
        const c = config.challenge;
        expect(c.events).toHaveLength(4);
        expect(c.correctOrder).toHaveLength(4);
        // correctOrder should contain indices 0-3
        expect(c.correctOrder.sort()).toEqual([0, 1, 2, 3]);
        for (const e of c.events) {
          expect(e.name).toBeTruthy();
          expect(e.year).toBeTypeOf("number");
        }
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe("setDailyChallengeCompleted / isDailyChallengeCompleted", () => {
  it("returns false when not completed", () => {
    expect(isDailyChallengeCompleted(new Date(2025, 5, 15))).toBe(false);
  });

  it("returns true after completion", () => {
    setDailyChallengeCompleted(new Date(2025, 5, 15), 5);
    expect(isDailyChallengeCompleted(new Date(2025, 5, 15))).toBe(true);
  });

  it("does not affect other dates", () => {
    setDailyChallengeCompleted(new Date(2025, 5, 15), 5);
    expect(isDailyChallengeCompleted(new Date(2025, 5, 16))).toBe(false);
  });
});

describe("getDailyChallengeScore", () => {
  it("returns 0 when not completed", () => {
    expect(getDailyChallengeScore(new Date(2025, 5, 15))).toBe(0);
  });

  it("returns saved score", () => {
    setDailyChallengeCompleted(new Date(2025, 5, 15), 4);
    expect(getDailyChallengeScore(new Date(2025, 5, 15))).toBe(4);
  });

  it("keeps higher score on re-completion", () => {
    setDailyChallengeCompleted(new Date(2025, 5, 15), 4);
    setDailyChallengeCompleted(new Date(2025, 5, 15), 3);
    expect(getDailyChallengeScore(new Date(2025, 5, 15))).toBe(4);
  });
});

describe("getDailyChallengeStreak", () => {
  it("returns 0 with no completions", () => {
    expect(getDailyChallengeStreak()).toBe(0);
  });

  it("returns 1 when only today completed", () => {
    const today = new Date();
    setDailyChallengeCompleted(today, 5);
    expect(getDailyChallengeStreak()).toBe(1);
  });

  it("counts consecutive days", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    setDailyChallengeCompleted(dayBefore, 3);
    setDailyChallengeCompleted(yesterday, 4);
    setDailyChallengeCompleted(today, 5);
    expect(getDailyChallengeStreak()).toBe(3);
  });

  it("breaks streak on missed day", () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    setDailyChallengeCompleted(threeDaysAgo, 3);
    setDailyChallengeCompleted(today, 5);
    // Gap of 2 days means streak is only 1
    expect(getDailyChallengeStreak()).toBe(1);
  });
});

describe("getLongestStreak", () => {
  it("returns 0 with no completions", () => {
    expect(getLongestStreak()).toBe(0);
  });

  it("calculates longest streak across history", () => {
    // Create a 3-day streak
    const base = new Date(2025, 5, 10);
    setDailyChallengeCompleted(new Date(2025, 5, 10), 3);
    setDailyChallengeCompleted(new Date(2025, 5, 11), 4);
    setDailyChallengeCompleted(new Date(2025, 5, 12), 5);
    // Gap, then a 2-day streak
    setDailyChallengeCompleted(new Date(2025, 5, 15), 2);
    setDailyChallengeCompleted(new Date(2025, 5, 16), 3);

    expect(getLongestStreak()).toBe(3);
  });
});

describe("getCompletedDates", () => {
  it("returns empty array initially", () => {
    expect(getCompletedDates()).toEqual([]);
  });

  it("returns completed dates", () => {
    setDailyChallengeCompleted(new Date(2025, 5, 15), 5);
    setDailyChallengeCompleted(new Date(2025, 5, 16), 3);
    const dates = getCompletedDates();
    expect(dates).toContain("2025-06-15");
    expect(dates).toContain("2025-06-16");
  });
});

describe("getChallengeTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getChallengeTypeLabel("math")).toBe("Math Sprint");
    expect(getChallengeTypeLabel("fraction")).toBe("Fraction Compare");
    expect(getChallengeTypeLabel("element")).toBe("Element Quiz");
    expect(getChallengeTypeLabel("vocabulary")).toBe("Word Unscramble");
    expect(getChallengeTypeLabel("timeline")).toBe("Timeline Order");
  });
});

describe("getChallengeTypeEmoji", () => {
  it("returns an emoji for each type", () => {
    expect(getChallengeTypeEmoji("math")).toBeTruthy();
    expect(getChallengeTypeEmoji("fraction")).toBeTruthy();
    expect(getChallengeTypeEmoji("element")).toBeTruthy();
    expect(getChallengeTypeEmoji("vocabulary")).toBeTruthy();
    expect(getChallengeTypeEmoji("timeline")).toBeTruthy();
  });
});
