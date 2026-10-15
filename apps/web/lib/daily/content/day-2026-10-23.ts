import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";

const DATE = "2026-10-23";
const HELP = `/daily/${DATE}`;

function list(values: number[]): string {
  return values.join(", ");
}

function meanQ(id: string, values: number[]): Question {
  const sum = values.reduce((total, value) => total + value, 0);
  const answer = sum / values.length;
  return numericQ(id, `Find the mean: ${list(values)}`, answer, `Sum ${sum} ÷ ${values.length} values = ${answer}.`, HELP);
}

function medianQ(id: string, values: number[]): Question {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const answer = sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
  return numericQ(id, `Find the median: ${list(values)}`, answer, `Ordered: ${list(sorted)}. The middle is ${answer}.`, HELP);
}

function rangeQ(id: string, values: number[]): Question {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const answer = high - low;
  return numericQ(id, `Find the range: ${list(values)}`, answer, `${high} − ${low} = ${answer}.`, HELP);
}

const versionA: Question[] = [
  meanQ("a-m1", [3, 5, 5, 7, 10]),
  meanQ("a-m2", [4, 6, 8, 10]),
  meanQ("a-m3", [12, 15, 18]),
  meanQ("a-m4", [2, 3, 7, 8]),
  meanQ("a-m5", [20, 25, 30, 35, 40]),
  meanQ("a-m6", [6, 9, 12, 15, 18]),
  medianQ("a-d1", [9, 2, 7, 4, 6]),
  medianQ("a-d2", [12, 5, 8, 3]),
  medianQ("a-d3", [20, 11, 14, 17, 9]),
  medianQ("a-d4", [4, 10, 2, 8, 6, 12]),
  medianQ("a-d5", [15, 7, 9, 13, 11]),
  medianQ("a-d6", [21, 5, 17, 9]),
  rangeQ("a-r1", [3, 5, 5, 7, 10]),
  rangeQ("a-r2", [12, 4, 19, 8]),
  rangeQ("a-r3", [30, 22, 27, 25]),
  rangeQ("a-r4", [6, 18, 11, 9]),
  rangeQ("a-r5", [100, 85, 92, 88]),
  rangeQ("a-r6", [-3, 4, 8, 1]),
];

const versionB: Question[] = [
  meanQ("b-m1", [2, 4, 6, 8, 10]),
  meanQ("b-m2", [5, 7, 9, 11]),
  meanQ("b-m3", [14, 17, 20]),
  meanQ("b-m4", [1, 5, 6, 8]),
  meanQ("b-m5", [10, 20, 30, 40, 50]),
  meanQ("b-m6", [7, 10, 13, 16, 19]),
  medianQ("b-d1", [8, 3, 9, 5, 7]),
  medianQ("b-d2", [14, 6, 10, 4]),
  medianQ("b-d3", [22, 13, 16, 19, 11]),
  medianQ("b-d4", [5, 11, 3, 9, 7, 13]),
  medianQ("b-d5", [16, 8, 10, 14, 12]),
  medianQ("b-d6", [23, 7, 19, 11]),
  rangeQ("b-r1", [2, 4, 6, 8, 10]),
  rangeQ("b-r2", [15, 5, 20, 9]),
  rangeQ("b-r3", [32, 24, 29, 26]),
  rangeQ("b-r4", [7, 21, 13, 10]),
  rangeQ("b-r5", [105, 90, 96, 93]),
  rangeQ("b-r6", [-5, 3, 9, 0]),
];

export const day20261023: Day = {
  date: DATE,
  title: "Day 36 — Center and spread",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Mean", "Median", "Range"],
  versionA,
  versionB,
};
