import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";

const DATE = "2026-10-22";
const HELP = `/daily/${DATE}`;

function integerQ(id: string, expression: string, answer: number): Question {
  return numericQ(id, `${expression} = ?`, answer, `${expression} = ${answer}.`, HELP);
}

function temperatureQ(id: string, start: number, change: number): Question {
  const answer = start + change;
  const direction = change >= 0 ? `rises ${change}` : `falls ${Math.abs(change)}`;
  return numericQ(
    id,
    `The temperature starts at ${start}°F and ${direction} degrees. What is the new temperature?`,
    answer,
    `${start} ${change >= 0 ? "+" : "−"} ${Math.abs(change)} = ${answer}°F.`,
    HELP,
    { unit: "°F" },
  );
}

const versionA: Question[] = [
  integerQ("a-i1", "−3 + 8", 5),
  integerQ("a-i2", "5 − 12", -7),
  integerQ("a-i3", "−6 + 2", -4),
  integerQ("a-i4", "−4 − 7", -11),
  integerQ("a-i5", "9 + (−13)", -4),
  integerQ("a-i6", "−10 + 17", 7),
  integerQ("a-i7", "2 − 9", -7),
  integerQ("a-i8", "−12 + 5", -7),
  integerQ("a-i9", "−8 − 6", -14),
  integerQ("a-i10", "14 + (−9)", 5),
  integerQ("a-i11", "−15 + 20", 5),
  integerQ("a-i12", "7 − 18", -11),
  temperatureQ("a-t1", -4, 9),
  temperatureQ("a-t2", 5, -7),
  temperatureQ("a-t3", -8, 3),
  temperatureQ("a-t4", 2, -11),
  temperatureQ("a-t5", -12, 15),
  temperatureQ("a-t6", 6, -14),
];

const versionB: Question[] = [
  integerQ("b-i1", "−5 + 12", 7),
  integerQ("b-i2", "4 − 11", -7),
  integerQ("b-i3", "−7 + 3", -4),
  integerQ("b-i4", "−2 − 9", -11),
  integerQ("b-i5", "8 + (−14)", -6),
  integerQ("b-i6", "−11 + 19", 8),
  integerQ("b-i7", "3 − 10", -7),
  integerQ("b-i8", "−13 + 6", -7),
  integerQ("b-i9", "−9 − 5", -14),
  integerQ("b-i10", "16 + (−7)", 9),
  integerQ("b-i11", "−18 + 24", 6),
  integerQ("b-i12", "9 − 21", -12),
  temperatureQ("b-t1", -6, 10),
  temperatureQ("b-t2", 7, -9),
  temperatureQ("b-t3", -9, 4),
  temperatureQ("b-t4", 3, -12),
  temperatureQ("b-t5", -14, 18),
  temperatureQ("b-t6", 8, -15),
];

export const day20261022: Day = {
  date: DATE,
  title: "Day 35 — Left and right of zero",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Integer addition", "Integer subtraction", "Temperature changes"],
  versionA,
  versionB,
};
