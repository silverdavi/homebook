import { describe, expect, it } from "vitest";
import { getDayPlan } from "@/lib/daily/plans";
import { WEEK } from "@/lib/daily/week";

describe("canonical daily plans", () => {
  const plannedDays = WEEK.filter((day) => day.date >= "2026-10-06");

  it("gives every current day a complete plan", () => {
    for (const day of plannedDays) {
      const plan = getDayPlan(day.date);
      expect(plan, `${day.date} plan`).not.toBeNull();
      expect(plan?.materials.length).toBeGreaterThan(0);
      expect(plan?.deviceRule).toContain("Computer only");
      expect(plan?.blocks.some((block) => block.kind === "exam")).toBe(true);
    }
  });

  it("fills each work block with specific, estimated steps", () => {
    for (const day of plannedDays) {
      const plan = getDayPlan(day.date);
      expect(plan).not.toBeNull();
      for (const block of plan?.blocks ?? []) {
        if (block.kind !== "work") continue;
        expect(
          block.steps.reduce((sum, step) => sum + step.minutes, 0),
          `${day.date} ${block.time}`,
        ).toBe(40);
        for (const step of block.steps) {
          expect(step.minutes).toBeGreaterThan(0);
          expect(step.task.length).toBeGreaterThan(10);
          expect(step.doneWhen.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("estimates reading and lets the exam end early", () => {
    for (const day of plannedDays) {
      const plan = getDayPlan(day.date);
      const workText = (plan?.blocks ?? [])
        .flatMap((block) => (block.kind === "work" ? block.steps : []))
        .map((step) => step.task)
        .join(" ");
      expect(workText).toMatch(/\b[Rr]ead\b/);

      const exam = plan?.blocks.find((block) => block.kind === "exam");
      expect(exam?.kind).toBe("exam");
      if (exam?.kind === "exam") {
        expect(exam.expectedMinutes).toBeLessThan(exam.maxMinutes);
        expect(exam.instruction).toMatch(/finish|Submit/);
      }
    }
  });
});

