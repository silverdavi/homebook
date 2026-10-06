import "server-only";
import type { Day } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";

const DATE = "2026-10-07";

// Day 27 — two-digit multiply, the last addition. No peace.

const versionA = [
  multQ("a-m1", 24, 13),
  multQ("a-m2", 16, 14),
  multQ("a-m3", 23, 12),
  multQ("a-m4", 18, 15),
  multQ("a-m5", 21, 14),
  multQ("a-m6", 19, 12),
  multQ("a-m7", 26, 11),
  multQ("a-m8", 24, 8),
  multQ("a-m9", 32, 6),
  multQ("a-m10", 27, 4),
  multQ("a-m11", 18, 7),
  multQ("a-m12", 14, 8),
  multQ("a-m13", 25, 12),
  multQ("a-m14", 22, 15),
  multQ("a-m15", 17, 12),
  multQ("a-m16", 13, 14),
  multQ("a-m17", 28, 5),
  multQ("a-m18", 36, 4),
];

const versionB = [
  multQ("b-m1", 27, 12),
  multQ("b-m2", 18, 16),
  multQ("b-m3", 22, 14),
  multQ("b-m4", 19, 15),
  multQ("b-m5", 26, 12),
  multQ("b-m6", 17, 14),
  multQ("b-m7", 23, 15),
  multQ("b-m8", 21, 16),
  multQ("b-m9", 34, 5),
  multQ("b-m10", 28, 6),
  multQ("b-m11", 16, 8),
  multQ("b-m12", 19, 6),
  multQ("b-m13", 25, 14),
  multQ("b-m14", 18, 13),
  multQ("b-m15", 32, 4),
  multQ("b-m16", 15, 13),
  multQ("b-m17", 27, 8),
  multQ("b-m18", 36, 5),
];

export const day20261007: Day = {
  date: DATE,
  title: "Day 27 — The last addition",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Split into tens and ones",
    "Multiply both pieces",
    "Add them",
  ],
  versionA,
  versionB,
};
