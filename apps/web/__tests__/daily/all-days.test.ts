import { describe, it, expect } from "vitest";
import { WEEK, WEEK1, WEEK2, WEEK3 } from "@/lib/daily/week";
import { gradeOne } from "@/lib/daily/grading";
import type { Question, RawAnswer } from "@/lib/daily/types";

function correctRaw(q: Question): RawAnswer {
  switch (q.kind) {
    case "gcf":
    case "lcm":
    case "mult":
    case "periodic":
    case "war":
    case "peace":
      return { kind: "integer", value: q.answer };
    case "evolution":
      return { kind: "integer", value: q.answerMya };
    case "fracAdd":
    case "fracSub":
    case "fracMul":
    case "fracDiv":
    case "fracInverse":
      return { kind: "fraction", num: q.answer[0], den: q.answer[1] };
  }
}

describe("WEEK structure", () => {
  it("has 12 days total across three weeks", () => {
    expect(WEEK1).toHaveLength(4);
    expect(WEEK2).toHaveLength(4);
    expect(WEEK3).toHaveLength(4);
    expect(WEEK).toHaveLength(12);
  });

  it("days are in chronological order with unique dates", () => {
    const dates = WEEK.map((d) => d.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("week 2 covers May 18-21 (Mon-Thu, no Friday since 5/22 is Shavuot)", () => {
    expect(WEEK2.map((d) => d.date)).toEqual([
      "2026-05-18",
      "2026-05-19",
      "2026-05-20",
      "2026-05-21",
    ]);
  });

  it("week 3 covers May 26-29 (Tue-Fri, May 25 is Memorial Day)", () => {
    expect(WEEK3.map((d) => d.date)).toEqual([
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ]);
  });
});

describe("All 8 days × 2 versions × all questions are valid + gradeable", () => {
  for (const day of WEEK) {
    describe(`${day.date} — ${day.title}`, () => {
      it("has at least 18 questions per version", () => {
        // 18-question minimum. Week 1 = 18, week 2 = 22, week 3 = 20.
        expect(day.versionA.length).toBeGreaterThanOrEqual(18);
        expect(day.versionB.length).toBeGreaterThanOrEqual(18);
      });

      it("question IDs are unique within each version", () => {
        for (const v of [day.versionA, day.versionB]) {
          const ids = v.map((q) => q.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      });

      it("the canonical correct answer grades as correct", () => {
        for (const version of ["a", "b"] as const) {
          const questions = version === "a" ? day.versionA : day.versionB;
          for (const q of questions) {
            const raw = correctRaw(q);
            const graded = gradeOne(q, raw);
            expect(
              graded.correct,
              `${day.date} ${version} ${q.id} (${q.kind}) raw=${JSON.stringify(raw)}`,
            ).toBe(true);
          }
        }
      });
    });
  }
});
