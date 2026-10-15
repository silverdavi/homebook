import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { periodicQ } from "./banks/periodic";

const DATE = "2026-10-15";

// Day 30 — estimate to check exact multiplication; mass = P + N. No peace.

const versionA: Question[] = [
  multQ("a-m1", 47, 6),
  multQ("a-m2", 32, 9),
  multQ("a-m3", 19, 14),
  multQ("a-m4", 26, 15),
  multQ("a-m5", 43, 7),
  multQ("a-m6", 28, 13),
  multQ("a-m7", 54, 6),
  multQ("a-m8", 17, 18),
  multQ("a-m9", 39, 8),
  periodicQ("a-p1", "C", "P"),
  periodicQ("a-p2", "C", "N"),
  periodicQ("a-p3", "F", "P"),
  periodicQ("a-p4", "F", "N"),
  periodicQ("a-p5", "Na", "P"),
  periodicQ("a-p6", "Na", "N"),
  periodicQ("a-p7", "Ar", "P"),
  periodicQ("a-p8", "Ar", "N"),
  periodicQ("a-p9", "Mg", "N"),
];

const versionB: Question[] = [
  multQ("b-m1", 46, 7),
  multQ("b-m2", 34, 8),
  multQ("b-m3", 21, 16),
  multQ("b-m4", 27, 14),
  multQ("b-m5", 52, 5),
  multQ("b-m6", 31, 9),
  multQ("b-m7", 18, 17),
  multQ("b-m8", 42, 6),
  multQ("b-m9", 29, 12),
  periodicQ("b-p1", "B", "P"),
  periodicQ("b-p2", "B", "N"),
  periodicQ("b-p3", "O", "P"),
  periodicQ("b-p4", "O", "N"),
  periodicQ("b-p5", "Al", "P"),
  periodicQ("b-p6", "Al", "N"),
  periodicQ("b-p7", "Cl", "P"),
  periodicQ("b-p8", "Cl", "N"),
  periodicQ("b-p9", "Ne", "N"),
];

export const day20261015: Day = {
  date: DATE,
  title: "Day 30 — Estimate, then check",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Estimate before exact multiplication",
    "Mass number = protons + neutrons",
    "No treaties",
  ],
  versionA,
  versionB,
};
