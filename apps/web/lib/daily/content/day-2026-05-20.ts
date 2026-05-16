import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-20";

// Day 7 = Week 2, Day 3. New today: fraction multiplication.
//
// Multiplication is mechanically the easiest fraction operation: no
// LCM needed, just multiply tops and multiply bottoms, then reduce.
// Cancel-before-multiply is the trick to keep the numbers small.
//
// 22 = 11 math (2 LCM + 3 add + 3 sub + 3 mul) + 4 periodic
// + 4 wars + 3 evolution.
//
// Periodic table introduces row 3 (first half).

const versionA: Question[] = [
  // LCM keep-alive (2)
  lcmQ("a-lcm-1", 4, 6),
  lcmQ("a-lcm-2", 5, 7),

  // Add (3)
  fracAddQ("a-add-1", [1, 4], [2, 4]),    // same den
  fracAddQ("a-add-2", [2, 5], [1, 3]),    // LCM=15
  fracAddQ("a-add-3", [3, 4], [1, 6]),    // LCM=12

  // Subtract (3)
  fracSubQ("a-sub-1", [4, 5], [2, 5]),    // same den
  fracSubQ("a-sub-2", [3, 4], [1, 3]),    // LCM=12 → 9/12 - 4/12 = 5/12
  fracSubQ("a-sub-3", [5, 8], [1, 4]),    // LCM=8 → 5/8 - 2/8 = 3/8

  // Multiply — NEW today (3)
  fracMulQ("a-mul-1", [2, 3], [3, 4]),    // = 6/12 = 1/2
  fracMulQ("a-mul-2", [3, 5], [5, 6]),    // = 15/30 = 1/2
  fracMulQ("a-mul-3", [4, 9], [3, 8]),    // cancel-friendly: = 12/72 = 1/6

  // Periodic (4) — row 1-2 review + 2 row 3 (Na, Mg, Al, Si introduced)
  periodicQ("a-pt-1", "Na", "P"),         // 11
  periodicQ("a-pt-2", "Mg", "N"),         // 12
  periodicQ("a-pt-3", "Ne", "e"),         // 10 (review)
  periodicQ("a-pt-4", "C", "N"),          // 6 (review)

  // History (4) — wars 9-12
  warQ("a-war-1", "russianCivil"),
  warQ("a-war-2", "spanishCivil"),
  warQ("a-war-3", "wwii"),
  warQ("a-war-4", "korean"),

  // Biology (3) — adds dinosaurs + KT
  evolutionQ("a-evo-1", "firstDinos"),
  evolutionQ("a-evo-2", "ktExtinction"),
  evolutionQ("a-evo-3", "cambrian"),
];

const versionB: Question[] = [
  lcmQ("b-lcm-1", 6, 4),
  lcmQ("b-lcm-2", 7, 5),

  fracAddQ("b-add-1", [1, 5], [3, 5]),
  fracAddQ("b-add-2", [1, 3], [1, 5]),    // LCM=15
  fracAddQ("b-add-3", [1, 6], [3, 4]),    // LCM=12

  fracSubQ("b-sub-1", [5, 6], [1, 6]),
  fracSubQ("b-sub-2", [2, 3], [1, 4]),    // LCM=12 → 8/12 - 3/12 = 5/12
  fracSubQ("b-sub-3", [7, 9], [1, 3]),    // LCM=9 → 7/9 - 3/9 = 4/9

  fracMulQ("b-mul-1", [3, 4], [4, 5]),
  fracMulQ("b-mul-2", [2, 7], [7, 9]),    // cancel: = 14/63 → 2/9
  fracMulQ("b-mul-3", [3, 8], [4, 9]),    // cancel: = 12/72 → 1/6

  periodicQ("b-pt-1", "Al", "P"),         // 13
  periodicQ("b-pt-2", "Si", "N"),         // 14
  periodicQ("b-pt-3", "F", "e"),          // 9 (review)
  periodicQ("b-pt-4", "O", "N"),          // 8 (review)

  warQ("b-war-1", "spanishCivil"),
  warQ("b-war-2", "russianCivil"),
  warQ("b-war-3", "korean"),
  warQ("b-war-4", "wwii"),

  evolutionQ("b-evo-1", "ktExtinction"),
  evolutionQ("b-evo-2", "firstDinos"),
  evolutionQ("b-evo-3", "firstFish"),
];

export const day20260520: Day = {
  date: DATE,
  title: "Day 7 — Fraction Multiplication (no LCM, just multiply)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Add + sub keep-alive (6)",
    "Fraction multiply — new today (3)",
    "Periodic — start of row 3 (Na, Mg, Al, Si)",
    "Wars 9-12",
    "Dinosaurs + KT extinction",
  ],
  versionA,
  versionB,
};
