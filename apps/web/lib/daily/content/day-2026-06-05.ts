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

const DATE = "2026-06-05";

// Day 16 = Week 4, Day 4. Final day of the trial.
//
// Adam asked us to stop re-asking questions he's already nailed twice
// (his example: the evolution "Gya" timeline — he's mastered all of it
// across the four weeks). So today DROPS evolution entirely and the
// mastered war dates, and reloads what the trial data shows he still
// misses:
//   - 2-digit multiplication breakdowns (his arithmetic slips)
//   - the harder fractions (improper results)
//   - Westphalia 1648 / Versailles 1919 (kept missing)
//   - valence (persistent weak spot), plus protons / neutrons / electrons
//     to reinforce the expanded atomic-structure background material.
//
// Shape today: 11 math + 7 science + 4 history = 22. No evolution.
// A and B still share NO items; B is the harder set.

const versionA: Question[] = [
  // Math (11): 5 multiplication (2-digit focus) + GCF + LCM + 4 fractions
  multQ("a-m-1", 13, 14), // 182
  multQ("a-m-2", 17, 8), // 136
  multQ("a-m-3", 12, 13), // 156
  multQ("a-m-4", 18, 7), // 126
  multQ("a-m-5", 16, 9), // 144
  gcfQ("a-gcf", 36, 48), // 12
  lcmQ("a-lcm", 6, 14), // 42
  fracAddQ("a-add", [2, 3], [3, 4]), // 17/12
  fracSubQ("a-sub", [7, 8], [1, 3]), // 13/24
  fracMulQ("a-mul", [5, 6], [3, 8]), // 5/16
  fracDivQ("a-div", [7, 8], [3, 4]), // 7/6

  // Science (7): valence + protons/neutrons/electrons (atomic structure)
  periodicQ("a-v1", "Na", "v"), // 1 valence
  periodicQ("a-v2", "Al", "v"), // 3 valence
  periodicQ("a-v3", "Cl", "v"), // 7 valence
  periodicQ("a-pn1", "Mg", "P"), // 12 protons (atomic number)
  periodicQ("a-pn2", "Ar", "N"), // 22 neutrons (isotope Ar-40)
  periodicQ("a-pn3", "O", "e"), // 8 electrons
  periodicQ("a-pn4", "S", "P"), // 16 protons

  // History (4): the peace dates he keeps missing
  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "versailles"), // 1919
  peaceQ("a-pc3", "dayton"), // 1995
  peaceQ("a-pc4", "parisAmerican"), // 1783
];

const versionB: Question[] = [
  multQ("b-m-1", 15, 14), // 210 — harder set
  multQ("b-m-2", 16, 15), // 240
  multQ("b-m-3", 19, 7), // 133
  multQ("b-m-4", 18, 9), // 162
  multQ("b-m-5", 14, 16), // 224
  gcfQ("b-gcf", 40, 60), // 20
  lcmQ("b-lcm", 12, 15), // 60
  fracAddQ("b-add", [5, 6], [4, 9]), // 23/18
  fracSubQ("b-sub", [5, 6], [7, 12]), // 1/4
  fracMulQ("b-mul", [7, 8], [4, 9]), // 7/18
  fracDivQ("b-div", [5, 8], [3, 4]), // 5/6

  periodicQ("b-v1", "Mg", "v"), // 2 valence
  periodicQ("b-v2", "Si", "v"), // 4 valence
  periodicQ("b-v3", "P", "v"), // 5 valence
  periodicQ("b-pn1", "P", "P"), // 15 protons (atomic number)
  periodicQ("b-pn2", "Na", "N"), // 12 neutrons
  periodicQ("b-pn3", "Cl", "e"), // 17 electrons
  periodicQ("b-pn4", "Ar", "P"), // 18 protons

  peaceQ("b-pc1", "vienna"), // 1815
  peaceQ("b-pc2", "goodFriday"), // 1998
  peaceQ("b-pc3", "campDavid"), // 1978
  peaceQ("b-pc4", "israelEgypt"), // 1979
];

export const day20260605: Day = {
  date: DATE,
  title: "Day 16 — Final day: what you still need (no evolution)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "2-digit multiplication breakdown",
    "GCF / LCM / harder fractions",
    "Valence + protons / neutrons / electrons",
    "Peace: Westphalia, Versailles, Dayton, Paris 1783",
    "Atomic structure: atomic number & isotopes",
  ],
  versionA,
  versionB,
};
