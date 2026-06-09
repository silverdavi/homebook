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

const DATE = "2026-06-09";

// Day 17 = Week 5 (final week), Day 1. Same philosophy as Day 16: no
// evolution (mastered), drill the weak spots — 2-digit multiplication,
// the harder fractions, valence + atomic structure, and the peace dates
// he keeps missing. 11 math + 7 science + 4 history = 22.
// A and B share no items; B is the harder set.

const versionA: Question[] = [
  multQ("a-m-1", 12, 14), // 168
  multQ("a-m-2", 13, 13), // 169
  multQ("a-m-3", 17, 9), // 153
  multQ("a-m-4", 18, 8), // 144
  multQ("a-m-5", 16, 11), // 176
  gcfQ("a-gcf", 24, 36), // 12
  lcmQ("a-lcm", 8, 12), // 24
  fracAddQ("a-add", [1, 2], [2, 3]), // 7/6
  fracSubQ("a-sub", [5, 6], [1, 4]), // 7/12
  fracMulQ("a-mul", [2, 3], [3, 5]), // 2/5
  fracDivQ("a-div", [3, 4], [2, 3]), // 9/8

  periodicQ("a-v1", "B", "v"), // 3
  periodicQ("a-v2", "C", "v"), // 4
  periodicQ("a-v3", "F", "v"), // 7
  periodicQ("a-pn1", "N", "P"), // 7 protons
  periodicQ("a-pn2", "Cl", "N"), // 18 neutrons
  periodicQ("a-pn3", "Mg", "e"), // 12 electrons
  periodicQ("a-pn4", "Al", "P"), // 13 protons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "versailles"), // 1919
  peaceQ("a-pc3", "unCharter"), // 1945
  peaceQ("a-pc4", "geneva"), // 1949
];

const versionB: Question[] = [
  multQ("b-m-1", 14, 15), // 210
  multQ("b-m-2", 16, 13), // 208
  multQ("b-m-3", 19, 8), // 152
  multQ("b-m-4", 18, 12), // 216
  multQ("b-m-5", 17, 14), // 238
  gcfQ("b-gcf", 48, 72), // 24
  lcmQ("b-lcm", 9, 12), // 36
  fracAddQ("b-add", [3, 4], [5, 6]), // 19/12
  fracSubQ("b-sub", [7, 8], [2, 3]), // 5/24
  fracMulQ("b-mul", [3, 4], [5, 9]), // 5/12
  fracDivQ("b-div", [5, 6], [2, 3]), // 5/4

  periodicQ("b-v1", "Be", "v"), // 2
  periodicQ("b-v2", "N", "v"), // 5
  periodicQ("b-v3", "S", "v"), // 6
  periodicQ("b-pn1", "P", "P"), // 15 protons
  periodicQ("b-pn2", "Ar", "N"), // 22 neutrons
  periodicQ("b-pn3", "Na", "e"), // 11 electrons
  periodicQ("b-pn4", "Si", "P"), // 14 protons

  peaceQ("b-pc1", "vienna"), // 1815
  peaceQ("b-pc2", "parisAmerican"), // 1783
  peaceQ("b-pc3", "osloI"), // 1993
  peaceQ("b-pc4", "abraham"), // 2020
];

export const day20260609: Day = {
  date: DATE,
  title: "Day 17 — Final week: weak-spot drill",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "2-digit multiplication breakdown",
    "GCF / LCM / harder fractions",
    "Valence + protons / neutrons / electrons",
    "Peace: Westphalia, Versailles, UN Charter, Geneva",
    "Atomic structure",
  ],
  versionA,
  versionB,
};
