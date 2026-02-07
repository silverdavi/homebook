import { describe, it, expect } from "vitest";
import {
  ELEMENTS,
  SCIENCE_WORDS,
  SCIENCE_SENTENCES,
  getElementsByDifficulty,
} from "@/lib/games/science-data";

describe("Elements data", () => {
  it("should have at least 25 elements", () => {
    expect(ELEMENTS.length).toBeGreaterThanOrEqual(25);
  });

  it("every element should have symbol, name, atomicNumber, difficulty", () => {
    for (const el of ELEMENTS) {
      expect(el.symbol).toBeTruthy();
      expect(el.name).toBeTruthy();
      expect(el.atomicNumber).toBeGreaterThan(0);
      expect(["easy", "medium", "hard"]).toContain(el.difficulty);
    }
  });

  it("symbols should be unique", () => {
    const symbols = ELEMENTS.map((e) => e.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("names should be unique", () => {
    const names = ELEMENTS.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("getElementsByDifficulty easy should only return easy elements", () => {
    const easy = getElementsByDifficulty("easy");
    expect(easy.every((e) => e.difficulty === "easy")).toBe(true);
    expect(easy.length).toBeGreaterThan(3);
  });

  it("getElementsByDifficulty hard should include all elements", () => {
    const hard = getElementsByDifficulty("hard");
    expect(hard.length).toBe(ELEMENTS.length);
  });

  it("getElementsByDifficulty medium should include easy + medium", () => {
    const medium = getElementsByDifficulty("medium");
    expect(medium.every((e) => e.difficulty !== "hard")).toBe(true);
    expect(medium.length).toBeGreaterThan(getElementsByDifficulty("easy").length);
  });

  it("tricky elements should have non-obvious symbols", () => {
    const tricky = ELEMENTS.filter((e) => e.category === "tricky");
    expect(tricky.length).toBeGreaterThanOrEqual(5);
    // Fe != Iron initial, Na != Sodium initial
    const fe = tricky.find((e) => e.symbol === "Fe");
    expect(fe?.name).toBe("Iron");
    const na = tricky.find((e) => e.symbol === "Na");
    expect(na?.name).toBe("Sodium");
  });
});

describe("Science words", () => {
  it("should have at least 40 words", () => {
    expect(SCIENCE_WORDS.length).toBeGreaterThanOrEqual(40);
  });

  it("should have chemistry, physics, and biology categories", () => {
    const categories = new Set(SCIENCE_WORDS.map((w) => w.category));
    expect(categories.has("Chemistry")).toBe(true);
    expect(categories.has("Physics")).toBe(true);
    expect(categories.has("Biology")).toBe(true);
  });

  it("every word should be uppercase", () => {
    for (const w of SCIENCE_WORDS) {
      expect(w.word).toBe(w.word.toUpperCase());
    }
  });

  it("every word should have a hint", () => {
    for (const w of SCIENCE_WORDS) {
      expect(w.hint.length).toBeGreaterThan(5);
    }
  });

  it("words should be 3-8 characters long", () => {
    for (const w of SCIENCE_WORDS) {
      expect(w.word.length).toBeGreaterThanOrEqual(3);
      expect(w.word.length).toBeLessThanOrEqual(8);
    }
  });

  it("should have words across all difficulty levels", () => {
    const diffs = new Set(SCIENCE_WORDS.map((w) => w.difficulty));
    expect(diffs.has("easy")).toBe(true);
    expect(diffs.has("medium")).toBe(true);
    expect(diffs.has("hard")).toBe(true);
  });
});

describe("Science sentences", () => {
  it("should have at least 25 sentences", () => {
    expect(SCIENCE_SENTENCES.length).toBeGreaterThanOrEqual(25);
  });

  it("should have chemistry, physics, biology categories", () => {
    const cats = new Set(SCIENCE_SENTENCES.map((s) => s.category));
    expect(cats.has("chemistry")).toBe(true);
    expect(cats.has("physics")).toBe(true);
    expect(cats.has("biology")).toBe(true);
  });

  it("sentences should be reasonable length", () => {
    for (const s of SCIENCE_SENTENCES) {
      expect(s.text.length).toBeGreaterThan(10);
      expect(s.text.length).toBeLessThan(200);
    }
  });
});
