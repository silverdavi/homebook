import "server-only";
import type { Day } from "../types";
import { loadMarkdown } from "./loader";
import { evolutionQ } from "./banks/evolution";
import { multQ } from "./banks/mult";

const DATE = "2026-10-08";

// Day 28 — evolution as one line. A few multiplies so yesterday stays. No peace.

const line = [
  "bigBang",
  "earthForms",
  "firstLife",
  "cambrian",
  "firstFish",
  "firstPlants",
  "firstDinos",
  "firstMammals",
  "ktExtinction",
  "firstHominids",
  "homoSapiens",
] as const;

const versionA = [
  ...line.map((key, i) => evolutionQ(`a-e${i + 1}`, key)),
  multQ("a-m1", 41, 3),
  multQ("a-m2", 33, 4),
  multQ("a-m3", 26, 8),
  multQ("a-m4", 19, 8),
  multQ("a-m5", 22, 6),
  multQ("a-m6", 35, 4),
  multQ("a-m7", 18, 9),
];

const versionB = [
  ...line.map((key, i) => evolutionQ(`b-e${i + 1}`, key)),
  multQ("b-m1", 29, 4),
  multQ("b-m2", 37, 3),
  multQ("b-m3", 24, 7),
  multQ("b-m4", 16, 9),
  multQ("b-m5", 28, 7),
  multQ("b-m6", 21, 8),
  multQ("b-m7", 45, 3),
];

export const day20261008: Day = {
  date: DATE,
  title: "Day 28 — The long line",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "One timeline, millions of years ago",
    "Fish just after the Cambrian",
    "Humans last, almost now",
  ],
  versionA,
  versionB,
};
