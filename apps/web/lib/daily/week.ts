import "server-only";
import type { Day, ExamVersion, Question } from "./types";
import { day20260512 } from "./content/day-2026-05-12";
import { day20260513 } from "./content/day-2026-05-13";
import { day20260514 } from "./content/day-2026-05-14";
import { day20260515 } from "./content/day-2026-05-15";

export const WEEK: Day[] = [day20260512, day20260513, day20260514, day20260515];

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
