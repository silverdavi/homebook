import { describe, it, expect } from "vitest";
import {
  WEEK,
  WEEK1,
  WEEK2,
  WEEK3,
  WEEK4,
  WEEK5,
  WEEK6,
  WEEK7,
  WEEK8,
  WEEK9,
  WEEK10,
  WEEK11,
} from "@/lib/daily/week";
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
    case "numeric":
      return { kind: "integer", value: q.answer };
    case "geography":
    case "history":
    case "generalKnowledge":
      return { kind: "integer", value: q.answerIndex };
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
  it("has 36 days total across eleven weeks", () => {
    expect(WEEK1).toHaveLength(4);
    expect(WEEK2).toHaveLength(4);
    expect(WEEK3).toHaveLength(4);
    expect(WEEK4).toHaveLength(4);
    expect(WEEK5).toHaveLength(4);
    expect(WEEK6).toHaveLength(2);
    expect(WEEK7).toHaveLength(3);
    expect(WEEK8).toHaveLength(4);
    expect(WEEK9).toHaveLength(2);
    expect(WEEK10).toHaveLength(4);
    expect(WEEK11).toHaveLength(1);
    expect(WEEK).toHaveLength(36);
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

  it("week 4 covers Jun 1-5 review (Mon, Wed, Thu, Fri — no Tuesday)", () => {
    expect(WEEK4.map((d) => d.date)).toEqual([
      "2026-06-01",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("week 5 covers Jun 9-12 (Tue-Fri, final week)", () => {
    expect(WEEK5.map((d) => d.date)).toEqual([
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ]);
  });

  it("week 6 covers Sep 24-25 (Thu-Fri, back from summer)", () => {
    expect(WEEK6.map((d) => d.date)).toEqual(["2026-09-24", "2026-09-25"]);
  });

  it("week 7 covers Sep 29–Oct 1 with no peace questions", () => {
    expect(WEEK7.map((d) => d.date)).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
    ]);
    for (const day of WEEK7) {
      for (const q of [...day.versionA, ...day.versionB]) {
        expect(q.kind).not.toBe("peace");
      }
    }
  });

  it("week 8 covers Oct 6–9 with no peace questions", () => {
    expect(WEEK8.map((d) => d.date)).toEqual([
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
    for (const day of WEEK8) {
      for (const q of [...day.versionA, ...day.versionB]) {
        expect(q.kind).not.toBe("peace");
      }
    }
  });

  it("week 9 covers Oct 15–16 with no peace questions", () => {
    expect(WEEK9.map((d) => d.date)).toEqual(["2026-10-15", "2026-10-16"]);
    for (const day of WEEK9) {
      for (const q of [...day.versionA, ...day.versionB]) {
        expect(q.kind).not.toBe("peace");
      }
    }
  });

  it("week 10 covers Oct 19–22 (Friday off) with no peace questions", () => {
    expect(WEEK10.map((d) => d.date)).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
    ]);
    for (const day of WEEK10) {
      for (const q of [...day.versionA, ...day.versionB]) {
        expect(q.kind).not.toBe("peace");
      }
    }
  });

  it("Tuesday onward restores tracked geography, history, and general knowledge", () => {
    for (const day of [...WEEK10.slice(1), ...WEEK11]) {
      for (const version of [day.versionA, day.versionB]) {
        const kinds = version.map((q) => q.kind);
        expect(kinds.filter((kind) => kind === "geography")).toHaveLength(2);
        expect(kinds.filter((kind) => kind === "history")).toHaveLength(2);
        expect(
          kinds.filter((kind) => kind === "generalKnowledge"),
        ).toHaveLength(2);
      }
    }
  });

  it("Wednesday reteaches only rectangle perimeter and area before testing", () => {
    const wednesday = WEEK10.find((day) => day.date === "2026-10-21");
    expect(wednesday).toBeDefined();
    for (const version of [
      wednesday?.versionA ?? [],
      wednesday?.versionB ?? [],
    ]) {
      const mathQuestions = version.filter(
        (question) => question.kind === "numeric",
      );
      expect(mathQuestions).toHaveLength(12);
      for (const question of mathQuestions) {
        if (question.kind !== "numeric") continue;
        expect(question.prompt).toMatch(/rectangle/i);
        expect(question.prompt).toMatch(/area|perimeter/i);
        expect(question.prompt).not.toMatch(/triangle|volume|density/i);
      }
    }
  });

  it("Wednesday onward spreads correct choices across positions", () => {
    for (const day of [...WEEK10, ...WEEK11].filter(
      (d) => d.date >= "2026-10-21",
    )) {
      for (const version of [day.versionA, day.versionB]) {
        const positions = new Set(
          version.flatMap((q) => ("options" in q ? [q.answerIndex] : [])),
        );
        expect(positions.size).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("Monday teaches units before testing them, with the unit named", () => {
    const monday = WEEK11.find((day) => day.date === "2026-10-26");
    for (const version of [monday?.versionA ?? [], monday?.versionB ?? []]) {
      const math = version.filter((q) => q.kind === "numeric");
      expect(math).toHaveLength(12);
      for (const q of math) {
        if (q.kind !== "numeric") continue;
        expect(q.unit).toBeTruthy();
        expect(q.prompt).toContain(`Answer in ${q.unit}.`);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    }
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
