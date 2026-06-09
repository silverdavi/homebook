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

const DATE = "2026-06-11";

// Day 19 = Week 5, Day 3. Hardest day: biggest 2-digit multiplications,
// full fraction spread, all of atomic structure, the full peace set.
// 11 math + 7 science + 4 history. A and B share no items; B is the
// harder set.

const versionA: Question[] = [
  multQ("a-m-1", 14, 16), // 224
  multQ("a-m-2", 13, 17), // 221
  multQ("a-m-3", 18, 11), // 198
  multQ("a-m-4", 19, 11), // 209
  multQ("a-m-5", 15, 15), // 225
  gcfQ("a-gcf", 18, 27), // 9
  lcmQ("a-lcm", 6, 15), // 30
  fracAddQ("a-add", [1, 4], [2, 3]), // 11/12
  fracSubQ("a-sub", [5, 6], [3, 8]), // 11/24
  fracMulQ("a-mul", [3, 8], [4, 5]), // 3/10
  fracDivQ("a-div", [5, 6], [5, 9]), // 3/2

  periodicQ("a-v1", "Na", "v"), // 1
  periodicQ("a-v2", "Al", "v"), // 3
  periodicQ("a-v3", "P", "v"), // 5
  periodicQ("a-pn1", "N", "P"), // 7 protons
  periodicQ("a-pn2", "F", "N"), // 10 neutrons
  periodicQ("a-pn3", "Si", "e"), // 14 electrons
  periodicQ("a-pn4", "Mg", "P"), // 12 protons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "versailles"), // 1919
  peaceQ("a-pc3", "parisAmerican"), // 1783
  peaceQ("a-pc4", "unCharter"), // 1945
];

const versionB: Question[] = [
  multQ("b-m-1", 16, 17), // 272
  multQ("b-m-2", 18, 15), // 270
  multQ("b-m-3", 19, 13), // 247
  multQ("b-m-4", 18, 16), // 288
  multQ("b-m-5", 17, 17), // 289
  gcfQ("b-gcf", 64, 96), // 32
  lcmQ("b-lcm", 14, 21), // 42
  fracAddQ("b-add", [5, 8], [2, 3]), // 31/24
  fracSubQ("b-sub", [7, 9], [1, 2]), // 5/18
  fracMulQ("b-mul", [7, 9], [3, 8]), // 7/24
  fracDivQ("b-div", [4, 9], [2, 3]), // 2/3

  periodicQ("b-v1", "Mg", "v"), // 2
  periodicQ("b-v2", "Si", "v"), // 4
  periodicQ("b-v3", "Cl", "v"), // 7
  periodicQ("b-pn1", "S", "P"), // 16 protons
  periodicQ("b-pn2", "Ar", "N"), // 22 neutrons
  periodicQ("b-pn3", "Al", "e"), // 13 electrons
  periodicQ("b-pn4", "P", "P"), // 15 protons

  peaceQ("b-pc1", "vienna"), // 1815
  peaceQ("b-pc2", "osloI"), // 1993
  peaceQ("b-pc3", "abraham"), // 2020
  peaceQ("b-pc4", "campDavid"), // 1978
];

export const day20260611: Day = {
  date: DATE,
  title: "Day 19 — Final week: the hard set",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Big 2-digit multiplication breakdown",
    "GCF / LCM / full fraction spread",
    "Valence + protons / neutrons / electrons",
    "Peace: Westphalia, Versailles, Paris 1783, UN Charter",
    "Atomic structure",
  ],
  versionA,
  versionB,
};
