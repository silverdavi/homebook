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

const DATE = "2026-06-12";

// Day 20 = Week 5, Day 4. LAST DAY of the trial. A celebratory capstone:
// a clean mixed pass across everything he learned, tuned slightly gentler
// than Day 19 so he ends on a win. 11 math + 7 science + 4 history.
// A and B share no items; B is the harder set.

const versionA: Question[] = [
  multQ("a-m-1", 12, 12), // 144
  multQ("a-m-2", 13, 14), // 182
  multQ("a-m-3", 15, 13), // 195
  multQ("a-m-4", 11, 13), // 143
  multQ("a-m-5", 17, 12), // 204
  gcfQ("a-gcf", 20, 30), // 10
  lcmQ("a-lcm", 4, 6), // 12
  fracAddQ("a-add", [1, 2], [1, 3]), // 5/6
  fracSubQ("a-sub", [3, 4], [1, 2]), // 1/4
  fracMulQ("a-mul", [2, 3], [3, 4]), // 1/2
  fracDivQ("a-div", [1, 2], [3, 4]), // 2/3

  periodicQ("a-v1", "H", "v"), // 1
  periodicQ("a-v2", "C", "v"), // 4
  periodicQ("a-v3", "O", "v"), // 6
  periodicQ("a-pn1", "C", "P"), // 6 protons
  periodicQ("a-pn2", "O", "N"), // 8 neutrons
  periodicQ("a-pn3", "Ne", "e"), // 10 electrons
  periodicQ("a-pn4", "Na", "P"), // 11 protons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "osloI"), // 1993
  peaceQ("a-pc3", "abraham"), // 2020
  peaceQ("a-pc4", "goodFriday"), // 1998
];

const versionB: Question[] = [
  multQ("b-m-1", 14, 13), // 182
  multQ("b-m-2", 15, 14), // 210
  multQ("b-m-3", 16, 12), // 192
  multQ("b-m-4", 13, 16), // 208
  multQ("b-m-5", 18, 11), // 198
  gcfQ("b-gcf", 36, 60), // 12
  lcmQ("b-lcm", 8, 10), // 40
  fracAddQ("b-add", [2, 3], [1, 4]), // 11/12
  fracSubQ("b-sub", [5, 6], [1, 3]), // 1/2
  fracMulQ("b-mul", [3, 5], [5, 6]), // 1/2
  fracDivQ("b-div", [2, 3], [1, 2]), // 4/3

  periodicQ("b-v1", "He", "v"), // 2
  periodicQ("b-v2", "N", "v"), // 5
  periodicQ("b-v3", "Cl", "v"), // 7
  periodicQ("b-pn1", "Mg", "P"), // 12 protons
  periodicQ("b-pn2", "S", "N"), // 16 neutrons
  periodicQ("b-pn3", "Ar", "e"), // 18 electrons
  periodicQ("b-pn4", "Al", "P"), // 13 protons

  peaceQ("b-pc1", "versailles"), // 1919
  peaceQ("b-pc2", "campDavid"), // 1978
  peaceQ("b-pc3", "dayton"), // 1995
  peaceQ("b-pc4", "vienna"), // 1815
];

export const day20260612: Day = {
  date: DATE,
  title: "Day 20 — Last day: the capstone",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "2-digit multiplication breakdown",
    "GCF / LCM / all four fraction operations",
    "Valence + protons / neutrons / electrons",
    "Peace: Westphalia, Oslo, Abraham, Good Friday",
    "Everything, one clean pass",
  ],
  versionA,
  versionB,
};
