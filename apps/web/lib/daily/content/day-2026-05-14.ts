import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-14";

const versionA: Question[] = [
  // Math: 8 questions — review + 3 sub + 3 mul
  gcfQ("a-gcf-1", 24, 30),
  lcmQ("a-lcm-1", 8, 12),
  fracSubQ("a-sub-1", [3, 4], [1, 6]),
  fracSubQ("a-sub-2", [1, 3], [1, 2]), // negative result
  fracSubQ("a-sub-3", [5, 6], [1, 3]),
  fracMulQ("a-mul-1", [2, 3], [3, 4]),
  fracMulQ("a-mul-2", [3, 5], [5, 6]),
  fracMulQ("a-mul-3", [4, 9], [3, 8]),

  // Add review (no - we're at 8 already)... bump count: include 1 add
  fracAddQ("a-add-1", [3, 8], [1, 4]),

  // Periodic: rows 1-3 mix (4 questions)
  periodicQ("a-pt-1", "Na", "P"),
  periodicQ("a-pt-2", "Ar", "N"),
  periodicQ("a-pt-3", "Cl", "e"),
  periodicQ("a-pt-4", "S", "N"),

  // History: wars 9-12 (3 questions)
  warQ("a-war-1", "russianCivil"),
  warQ("a-war-2", "wwii"),
  warQ("a-war-3", "korean"),

  // Biology: dinos + KT (3 questions; one repeats from earlier days)
  evolutionQ("a-evo-1", "firstDinos"),
  evolutionQ("a-evo-2", "ktExtinction"),
  evolutionQ("a-evo-3", "cambrian"),
];

const versionB: Question[] = [
  // Math
  gcfQ("b-gcf-1", 36, 24),
  lcmQ("b-lcm-1", 9, 12),
  fracSubQ("b-sub-1", [2, 3], [1, 4]),
  fracSubQ("b-sub-2", [1, 4], [1, 2]), // negative
  fracSubQ("b-sub-3", [7, 8], [3, 8]),
  fracMulQ("b-mul-1", [3, 4], [4, 5]),
  fracMulQ("b-mul-2", [2, 7], [7, 9]),
  fracMulQ("b-mul-3", [3, 8], [4, 9]),

  fracAddQ("b-add-1", [1, 6], [2, 3]),

  // Periodic
  periodicQ("b-pt-1", "Mg", "N"),
  periodicQ("b-pt-2", "Si", "P"),
  periodicQ("b-pt-3", "Al", "e"),
  periodicQ("b-pt-4", "P", "N"),

  // History
  warQ("b-war-1", "spanishCivil"),
  warQ("b-war-2", "wwii"),
  warQ("b-war-3", "korean"),

  // Biology
  evolutionQ("b-evo-1", "ktExtinction"),
  evolutionQ("b-evo-2", "firstDinos"),
  evolutionQ("b-evo-3", "firstFish"),
];

export const day20260514: Day = {
  date: DATE,
  title: "Day 3 — Subtract, Multiply, Row 3, Wars 9-12",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Fraction subtraction (any order)",
    "Fraction multiplication (each < 10)",
    "Reviews: GCF, LCM, addition",
    "Periodic — rows 1-3",
    "Wars 9-12",
    "Dinosaurs / KT extinction",
  ],
  versionA,
  versionB,
};
