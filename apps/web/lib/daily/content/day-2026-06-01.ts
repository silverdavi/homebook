import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { fracDivQ } from "./banks/frac-div";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-06-01";

// Day 13 = Week 4, Day 1. REVIEW WEEK — one lap through everything.
// 22 questions. Weighted toward the persistent weak spots:
//   - valence (3 of 5 science) — his worst topic all of week 3
//   - 2-digit multiplication breakdown (2 of 9 math) — method ok, arithmetic slips
//   - peace-accord dates incl. Westphalia 1648 (he keeps writing 1638)
//   - one evolution decimal answer (Homo sapiens, 0.3) to exercise the input.

const versionA: Question[] = [
  // Math (9)
  multQ("a-m-1", 8, 7), // 56 — table
  multQ("a-m-2", 13, 12), // 156 — 2-digit breakdown
  multQ("a-m-3", 17, 6), // 102 — 2-digit × 1-digit
  gcfQ("a-gcf", 24, 36), // 12
  lcmQ("a-lcm", 6, 8), // 24
  fracAddQ("a-add", [1, 2], [1, 3]), // 5/6
  fracSubQ("a-sub", [3, 4], [1, 2]), // 1/4
  fracMulQ("a-mul", [2, 3], [3, 4]), // 1/2
  fracDivQ("a-div", [1, 2], [1, 4]), // 2

  // Science (5): 3 valence + 2 P/N review
  periodicQ("a-v1", "O", "v"), // 6
  periodicQ("a-v2", "Na", "v"), // 1
  periodicQ("a-v3", "C", "v"), // 4
  periodicQ("a-pn1", "N", "P"), // 7 protons
  periodicQ("a-pn2", "Cl", "N"), // 18 neutrons

  // History (5): 4 peace + 1 war
  peaceQ("a-pc1", "westphalia"), // 1648 anchor
  peaceQ("a-pc2", "osloI"), // 1993
  peaceQ("a-pc3", "versailles"), // 1919
  peaceQ("a-pc4", "abraham"), // 2020
  warQ("a-war1", "wwii"), // 1939

  // Biology (3)
  evolutionQ("a-evo1", "bigBang"), // 13800
  evolutionQ("a-evo2", "cambrian"), // 540
  evolutionQ("a-evo3", "homoSapiens"), // 0.3 — decimal answer
];

const versionB: Question[] = [
  multQ("b-m-1", 9, 6), // 54
  multQ("b-m-2", 14, 11), // 154
  multQ("b-m-3", 18, 4), // 72
  gcfQ("b-gcf", 18, 24), // 6
  lcmQ("b-lcm", 4, 6), // 12
  fracAddQ("b-add", [1, 3], [1, 4]), // 7/12
  fracSubQ("b-sub", [2, 3], [1, 6]), // 1/2
  fracMulQ("b-mul", [3, 5], [5, 6]), // 1/2
  fracDivQ("b-div", [2, 3], [1, 3]), // 2

  periodicQ("b-v1", "N", "v"), // 5
  periodicQ("b-v2", "Mg", "v"), // 2
  periodicQ("b-v3", "F", "v"), // 7
  periodicQ("b-pn1", "O", "P"), // 8 protons
  periodicQ("b-pn2", "Na", "N"), // 12 neutrons

  peaceQ("b-pc1", "westphalia"), // 1648
  peaceQ("b-pc2", "osloI"), // 1993
  peaceQ("b-pc3", "vienna"), // 1815
  peaceQ("b-pc4", "goodFriday"), // 1998
  warQ("b-war1", "wwi"), // 1914

  evolutionQ("b-evo1", "earthForms"), // 4540
  evolutionQ("b-evo2", "firstLife"), // 3700
  evolutionQ("b-evo3", "homoSapiens"), // 0.3
];

export const day20260601: Day = {
  date: DATE,
  title: "Day 13 — Review week: one lap through everything",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Multiplication: tables + 2-digit breakdown",
    "GCF / LCM / fraction add, sub, multiply, divide",
    "Valence (O, Na, C) + protons/neutrons",
    "Peace: Westphalia, Oslo, Versailles, Abraham",
    "Evolution: Big Bang, Cambrian, Homo sapiens",
  ],
  versionA,
  versionB,
};
