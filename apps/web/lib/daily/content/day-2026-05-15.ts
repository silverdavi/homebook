import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { fracDivQ } from "./banks/frac-div";
import { inverseFracQ, inverseIntQ } from "./banks/frac-inverse";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-15";

const versionA: Question[] = [
  // Math: 9 questions (heavier on the new stuff + review)
  fracDivQ("a-div-1", [2, 3], [4, 5]),
  fracDivQ("a-div-2", [3, 4], [9, 8]),
  fracDivQ("a-div-3", [5, 6], [1, 3]),
  inverseIntQ("a-inv-1", 7),
  inverseFracQ("a-inv-2", [3, 8]),
  inverseIntQ("a-inv-3", 4),
  // Mixed review
  gcfQ("a-rev-1", 28, 42),
  lcmQ("a-rev-2", 6, 10),
  fracMulQ("a-rev-3", [3, 4], [4, 9]),

  // Periodic: full review (4 questions, drawn from rows 1-3)
  periodicQ("a-pt-1", "C", "N"),
  periodicQ("a-pt-2", "Cl", "P"),
  periodicQ("a-pt-3", "Ar", "e"),
  periodicQ("a-pt-4", "Mg", "N"),

  // History: 3 new + 2 review (5 total)
  warQ("a-war-1", "vietnam"),
  warQ("a-war-2", "gulf"),
  warQ("a-war-3", "iraq"),
  warQ("a-war-4", "wwii"),
  warQ("a-war-5", "americanCivil"),

  // Biology: 3 final events
  evolutionQ("a-evo-1", "firstMammals"),
  evolutionQ("a-evo-2", "firstHominids"),
  evolutionQ("a-evo-3", "homoSapiens"),
];

const versionB: Question[] = [
  // Math
  fracDivQ("b-div-1", [3, 5], [6, 7]),
  fracDivQ("b-div-2", [4, 9], [8, 3]),
  fracDivQ("b-div-3", [7, 8], [7, 1]),
  inverseIntQ("b-inv-1", 9),
  inverseFracQ("b-inv-2", [2, 7]),
  inverseIntQ("b-inv-3", 6),
  // Mixed review
  gcfQ("b-rev-1", 18, 27),
  lcmQ("b-rev-2", 8, 12),
  fracSubQ("b-rev-3", [3, 4], [5, 6]),

  // Periodic
  periodicQ("b-pt-1", "Na", "N"),
  periodicQ("b-pt-2", "F", "P"),
  periodicQ("b-pt-3", "He", "e"),
  periodicQ("b-pt-4", "Si", "N"),

  // History (3 new + 2 review)
  warQ("b-war-1", "iraq"),
  warQ("b-war-2", "vietnam"),
  warQ("b-war-3", "gulf"),
  warQ("b-war-4", "wwi"),
  warQ("b-war-5", "americanRevolution"),

  // Biology
  evolutionQ("b-evo-1", "firstHominids"),
  evolutionQ("b-evo-2", "homoSapiens"),
  evolutionQ("b-evo-3", "firstMammals"),
];

export const day20260515: Day = {
  date: DATE,
  title: "Day 4 — Divide, Inverse, Full Review",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Fraction division (each < 10)",
    "Formal inverse (1/n, reciprocal)",
    "Full math review",
    "Periodic — rows 1-3 review",
    "Wars 13-15 + review",
    "Mammals / hominids / Homo sapiens",
  ],
  versionA,
  versionB,
};
