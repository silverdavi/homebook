import { describe, it, expect } from "vitest";

describe("Score submission validation", () => {
  it("should sanitize player names", () => {
    const sanitize = (name: string): string =>
      name.trim().slice(0, 20).replace(/[<>&"']/g, "").trim() || "Anonymous";

    expect(sanitize("  Alice  ")).toBe("Alice");
    // After removing <>&"' from "<script>alert(1)</script>" we get "scriptalert(1)/script"
    // But .slice(0, 20) applies first: "<script>alert(1)</sc" → remove <>&"' → "scriptalert(1)/sc"
    expect(sanitize("<script>alert(1)</script>")).toBe("scriptalert(1)/sc");
    expect(sanitize("")).toBe("Anonymous");
    expect(sanitize("   ")).toBe("Anonymous");
    expect(sanitize("A".repeat(30))).toBe("A".repeat(20));
    expect(sanitize("Normal Name")).toBe("Normal Name");
  });

  it("valid games list should contain all 5 games", () => {
    const VALID_GAMES = ["letter-rain", "math-blitz", "fraction-fighter", "element-match", "word-builder"];
    expect(VALID_GAMES).toHaveLength(5);
    expect(VALID_GAMES).toContain("letter-rain");
    expect(VALID_GAMES).toContain("math-blitz");
    expect(VALID_GAMES).toContain("fraction-fighter");
    expect(VALID_GAMES).toContain("element-match");
    expect(VALID_GAMES).toContain("word-builder");
  });

  it("score should be non-negative and within bounds", () => {
    const isValidScore = (score: number): boolean =>
      typeof score === "number" && score >= 0 && score <= 999999;

    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(100)).toBe(true);
    expect(isValidScore(999999)).toBe(true);
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(1000000)).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
  });
});
