import "server-only";
import type { Day, ExamVersion, Question } from "./types";
import { day20260512 } from "./content/day-2026-05-12";
import { day20260513 } from "./content/day-2026-05-13";
import { day20260514 } from "./content/day-2026-05-14";
import { day20260515 } from "./content/day-2026-05-15";
import { day20260518 } from "./content/day-2026-05-18";
import { day20260519 } from "./content/day-2026-05-19";
import { day20260520 } from "./content/day-2026-05-20";
import { day20260521 } from "./content/day-2026-05-21";
import { day20260526 } from "./content/day-2026-05-26";
import { day20260527 } from "./content/day-2026-05-27";
import { day20260528 } from "./content/day-2026-05-28";
import { day20260529 } from "./content/day-2026-05-29";

export const WEEK1: Day[] = [day20260512, day20260513, day20260514, day20260515];
export const WEEK2: Day[] = [day20260518, day20260519, day20260520, day20260521];
export const WEEK3: Day[] = [day20260526, day20260527, day20260528, day20260529];

export interface WeekSpec {
  id: number;
  label: string;
  introFile: string;
  days: Day[];
  /** First day-of-trial number for this week (1-indexed). */
  startDayNumber: number;
}

export const WEEKS: WeekSpec[] = [
  {
    id: 1,
    label: "Week 1 — May 12-15",
    introFile: "WEEK-2026-05-12.md",
    days: WEEK1,
    startDayNumber: 1,
  },
  {
    id: 2,
    label: "Week 2 — May 18-21",
    introFile: "WEEK-2026-05-18.md",
    days: WEEK2,
    startDayNumber: WEEK1.length + 1,
  },
  {
    id: 3,
    label: "Week 3 — May 26-29",
    introFile: "WEEK-2026-05-26.md",
    days: WEEK3,
    startDayNumber: WEEK1.length + WEEK2.length + 1,
  },
];

/** Backward-compat: the full flat list of days across all weeks. */
export const WEEK: Day[] = [...WEEK1, ...WEEK2, ...WEEK3];

export const WEEK_RANGE = {
  start: WEEK[0].date,
  end: WEEK[WEEK.length - 1].date,
};

export function getDay(date: string): Day | null {
  return WEEK.find((d) => d.date === date) ?? null;
}

export function getQuestions(
  date: string,
  version: ExamVersion,
): Question[] | null {
  const day = getDay(date);
  if (!day) return null;
  return version === "a" ? day.versionA : day.versionB;
}

/** Return today's date in 'YYYY-MM-DD' (server-local clock). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
