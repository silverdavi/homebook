import "server-only";
import type { Day } from "../types";
import { loadMarkdown } from "./loader";
import { lcmQ } from "./banks/lcm";

const DATE = "2026-10-09";

// Day 29 — LCM. List multiples, take the first shared one. No peace.

const versionA = [
  lcmQ("a-l1", 4, 6),
  lcmQ("a-l2", 6, 8),
  lcmQ("a-l3", 8, 12),
  lcmQ("a-l4", 9, 6),
  lcmQ("a-l5", 10, 15),
  lcmQ("a-l6", 7, 3),
  lcmQ("a-l7", 5, 7),
  lcmQ("a-l8", 4, 10),
  lcmQ("a-l9", 9, 12),
  lcmQ("a-l10", 8, 10),
  lcmQ("a-l11", 6, 9),
  lcmQ("a-l12", 14, 21),
  lcmQ("a-l13", 15, 20),
  lcmQ("a-l14", 8, 14),
  lcmQ("a-l15", 9, 15),
  lcmQ("a-l16", 12, 18),
  lcmQ("a-l17", 10, 25),
  lcmQ("a-l18", 16, 12),
];

const versionB = [
  lcmQ("b-l1", 5, 15),
  lcmQ("b-l2", 6, 10),
  lcmQ("b-l3", 4, 14),
  lcmQ("b-l4", 8, 6),
  lcmQ("b-l5", 9, 8),
  lcmQ("b-l6", 7, 14),
  lcmQ("b-l7", 12, 16),
  lcmQ("b-l8", 10, 12),
  lcmQ("b-l9", 15, 25),
  lcmQ("b-l10", 9, 21),
  lcmQ("b-l11", 8, 18),
  lcmQ("b-l12", 6, 15),
  lcmQ("b-l13", 4, 18),
  lcmQ("b-l14", 10, 14),
  lcmQ("b-l15", 7, 5),
  lcmQ("b-l16", 11, 3),
  lcmQ("b-l17", 12, 15),
  lcmQ("b-l18", 16, 24),
];

export const day20261009: Day = {
  date: DATE,
  title: "Day 29 — The first shared multiple",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "List the multiples",
    "First number in both lists",
    "LCM goes up",
  ],
  versionA,
  versionB,
};
