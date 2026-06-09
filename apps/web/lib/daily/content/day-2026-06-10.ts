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

const DATE = "2026-06-10";

// Day 18 = Week 5, Day 2. Push the fractions harder and lean on atomic
// structure (protons/neutrons/isotopes). 11 math + 7 science + 4 history.
// A and B share no items; B is the harder set.

const versionA: Question[] = [
  multQ("a-m-1", 13, 15), // 195
  multQ("a-m-2", 14, 14), // 196
  multQ("a-m-3", 19, 9), // 171
  multQ("a-m-4", 16, 12), // 192
  multQ("a-m-5", 17, 11), // 187
  gcfQ("a-gcf", 30, 45), // 15
  lcmQ("a-lcm", 10, 15), // 30
  fracAddQ("a-add", [2, 5], [1, 3]), // 11/15
  fracSubQ("a-sub", [3, 4], [2, 5]), // 7/20
  fracMulQ("a-mul", [4, 5], [5, 6]), // 2/3
  fracDivQ("a-div", [2, 3], [4, 9]), // 3/2

  periodicQ("a-v1", "Li", "v"), // 1
  periodicQ("a-v2", "O", "v"), // 6
  periodicQ("a-v3", "Ne", "v"), // 8
  periodicQ("a-pn1", "C", "P"), // 6 protons
  periodicQ("a-pn2", "Cl", "N"), // 18 neutrons
  periodicQ("a-pn3", "Ar", "e"), // 18 electrons
  periodicQ("a-pn4", "S", "P"), // 16 protons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "campDavid"), // 1978
  peaceQ("a-pc3", "israelEgypt"), // 1979
  peaceQ("a-pc4", "dayton"), // 1995
];

const versionB: Question[] = [
  multQ("b-m-1", 15, 16), // 240
  multQ("b-m-2", 17, 13), // 221
  multQ("b-m-3", 18, 14), // 252
  multQ("b-m-4", 19, 12), // 228
  multQ("b-m-5", 16, 16), // 256
  gcfQ("b-gcf", 56, 84), // 28
  lcmQ("b-lcm", 12, 18), // 36
  fracAddQ("b-add", [5, 6], [3, 8]), // 29/24
  fracSubQ("b-sub", [7, 8], [5, 6]), // 1/24
  fracMulQ("b-mul", [5, 8], [4, 9]), // 5/18
  fracDivQ("b-div", [7, 8], [3, 4]), // 7/6

  periodicQ("b-v1", "B", "v"), // 3
  periodicQ("b-v2", "F", "v"), // 7
  periodicQ("b-v3", "Mg", "v"), // 2
  periodicQ("b-pn1", "Na", "P"), // 11 protons
  periodicQ("b-pn2", "Ar", "N"), // 22 neutrons
  periodicQ("b-pn3", "O", "e"), // 8 electrons
  periodicQ("b-pn4", "Cl", "P"), // 17 protons

  peaceQ("b-pc1", "versailles"), // 1919
  peaceQ("b-pc2", "vienna"), // 1815
  peaceQ("b-pc3", "goodFriday"), // 1998
  peaceQ("b-pc4", "abraham"), // 2020
];

export const day20260610: Day = {
  date: DATE,
  title: "Day 18 — Final week: fractions + atomic structure",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "2-digit multiplication breakdown",
    "GCF / LCM / harder fractions",
    "Valence + protons / neutrons / electrons",
    "Peace: Westphalia, Camp David, Israel-Egypt, Dayton",
    "Isotopes & atomic number",
  ],
  versionA,
  versionB,
};
