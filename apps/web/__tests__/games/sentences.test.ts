import { describe, it, expect } from "vitest";
import { SENTENCES, CATEGORIES, getSentences, pickSentence } from "@/lib/games/sentences";

describe("Sentences data", () => {
  it("should have at least 50 sentences", () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(50);
  });

  it("every sentence should have text, category, and difficulty", () => {
    for (const s of SENTENCES) {
      expect(s.text).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(["easy", "medium", "hard"]).toContain(s.difficulty);
    }
  });

  it("should have sentences for each difficulty level", () => {
    const easy = SENTENCES.filter((s) => s.difficulty === "easy");
    const medium = SENTENCES.filter((s) => s.difficulty === "medium");
    const hard = SENTENCES.filter((s) => s.difficulty === "hard");
    expect(easy.length).toBeGreaterThan(5);
    expect(medium.length).toBeGreaterThan(5);
    expect(hard.length).toBeGreaterThan(5);
  });

  it("should have sentences for chemistry, physics, biology categories", () => {
    const chemistry = SENTENCES.filter((s) => s.category === "chemistry");
    const physics = SENTENCES.filter((s) => s.category === "physics");
    const biology = SENTENCES.filter((s) => s.category === "biology");
    expect(chemistry.length).toBeGreaterThan(3);
    expect(physics.length).toBeGreaterThan(3);
    expect(biology.length).toBeGreaterThan(3);
  });

  it("categories should include chemistry, physics, biology", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toContain("chemistry");
    expect(ids).toContain("physics");
    expect(ids).toContain("biology");
  });

  it("getSentences should filter by difficulty", () => {
    const easy = getSentences("easy");
    expect(easy.every((s) => s.difficulty === "easy")).toBe(true);
    expect(easy.length).toBeGreaterThan(0);
  });

  it("getSentences should filter by difficulty and category", () => {
    const easyMath = getSentences("easy", "math");
    expect(easyMath.every((s) => s.difficulty === "easy" && s.category === "math")).toBe(true);
  });

  it("pickSentence should return a valid sentence", () => {
    const used = new Set<number>();
    const result = pickSentence("easy", used);
    expect(result.sentence).toBeTruthy();
    expect(result.sentence.text).toBeTruthy();
    expect(result.index).toBeGreaterThanOrEqual(0);
  });

  it("pickSentence should avoid used indices", () => {
    const used = new Set<number>();
    const first = pickSentence("easy", used);
    used.add(first.index);
    const second = pickSentence("easy", used);
    expect(second.index).not.toBe(first.index);
  });

  it("sentence text should not contain special characters that break games", () => {
    for (const s of SENTENCES) {
      expect(s.text).not.toMatch(/[<>{}[\]|\\]/);
    }
  });
});
