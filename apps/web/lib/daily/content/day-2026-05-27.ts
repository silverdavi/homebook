import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-27";

// Day 10 = Week 3, Day 2.
//
// Math: introduce 11-12 row of times tables; lean in on distributive
// for 2-digit × 1-digit (17 × 8, 13 × 7, …).
// Science: valence row 3.
// History: WWI-era accords. Includes Versailles — the "bad" treaty.
// Biology: Cambrian-era review.

const versionA: Question[] = [
  // Math (10)
  multQ("a-m-1", 11, 11),    // 121
  multQ("a-m-2", 12, 12),    // 144
  multQ("a-m-3", 11, 8),     // 88
  multQ("a-m-4", 12, 7),     // 84
  // Distributive 2-digit × 1-digit
  multQ("a-m-5", 17, 8),     // = (10+7)×8 = 80+56 = 136
  multQ("a-m-6", 13, 7),     // 91
  multQ("a-m-7", 19, 6),     // 114
  multQ("a-m-8", 14, 9),     // 126
  lcmQ("a-rev-lcm", 4, 6),
  fracAddQ("a-rev-add", [2, 3], [1, 4]),

  // Science (3): valence row 3
  periodicQ("a-pt-1", "Na", "v"),  // 1
  periodicQ("a-pt-2", "Si", "v"),  // 4
  periodicQ("a-pt-3", "Cl", "v"),  // 7

  // History (4): WWI-era + Versailles
  peaceQ("a-pc-1", "versailles"),
  peaceQ("a-pc-2", "unCharter"),
  peaceQ("a-pc-3", "geneva"),
  peaceQ("a-pc-4", "vienna"), // review

  // Evolution (3): Cambrian
  evolutionQ("a-evo-1", "cambrian"),
  evolutionQ("a-evo-2", "firstFish"),
  evolutionQ("a-evo-3", "firstPlants"),
];

const versionB: Question[] = [
  multQ("b-m-1", 12, 11),
  multQ("b-m-2", 11, 12),
  multQ("b-m-3", 11, 9),
  multQ("b-m-4", 12, 8),
  multQ("b-m-5", 18, 7),     // = (10+8)×7 = 70+56 = 126
  multQ("b-m-6", 14, 8),
  multQ("b-m-7", 16, 9),
  multQ("b-m-8", 19, 7),
  lcmQ("b-rev-lcm", 6, 9),
  fracAddQ("b-rev-add", [3, 4], [1, 6]),

  periodicQ("b-pt-1", "Mg", "v"),  // 2
  periodicQ("b-pt-2", "P", "v"),   // 5
  periodicQ("b-pt-3", "Ar", "v"),  // 8

  peaceQ("b-pc-1", "unCharter"),
  peaceQ("b-pc-2", "versailles"),
  peaceQ("b-pc-3", "geneva"),
  peaceQ("b-pc-4", "westphalia"),  // review

  evolutionQ("b-evo-1", "firstFish"),
  evolutionQ("b-evo-2", "cambrian"),
  evolutionQ("b-evo-3", "firstPlants"),
];

export const day20260527: Day = {
  date: DATE,
  title: "Day 10 — 11/12 tables + 2-digit × 1-digit breakdown + Versailles",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "11 and 12 times tables",
    "Distributive 2-digit × 1-digit (17 × 8 etc.)",
    "Valence row 3",
    "Peace: Versailles + UN + Geneva",
    "Cambrian review",
  ],
  versionA,
  versionB,
};
