import { describe, expect, it } from "vitest";
import { EXTRAS, getExtra } from "@/lib/daily/extras";

describe("20-minute extras", () => {
  it("has 30, one per school day, in date order", () => {
    expect(EXTRAS).toHaveLength(30);
    const dates = EXTRAS.map((extra) => extra.date);
    expect(new Set(dates).size).toBe(30);
    expect([...dates].sort()).toEqual(dates);
    for (const date of dates) {
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
      expect(weekday, date).toBeGreaterThan(0);
      expect(weekday, date).toBeLessThan(6);
    }
    expect(getExtra("2026-10-26")?.number).toBe(1);
    expect(getExtra("2026-12-09")?.number).toBe(30);
  });

  it("skips Thanksgiving", () => {
    expect(getExtra("2026-11-26")).toBeNull();
    expect(getExtra("2026-11-27")).toBeNull();
  });

  it("gives every extra content, an activity, and a 4-question check", () => {
    for (const extra of EXTRAS) {
      expect(extra.groups.length, extra.date).toBeGreaterThan(1);
      expect(extra.facts.length, extra.date).toBeGreaterThanOrEqual(3);
      expect(extra.doIt.length, extra.date).toBeGreaterThan(40);
      expect(extra.quiz, extra.date).toHaveLength(4);
    }
  });
});
