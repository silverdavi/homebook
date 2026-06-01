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

const DATE = "2026-06-05";

// Day 16 = Week 4, Day 4. Final lap — full mixed review, all four math
// fraction ops, valence row 3, the Israel-related peace cluster, and a
// last decimal evolution answer. End of the four-week trial.

const versionA: Question[] = [
  multQ("a-m-1", 8, 9), // 72
  multQ("a-m-2", 13, 13), // 169 — 2-digit breakdown
  multQ("a-m-3", 18, 6), // 108 — 2-digit × 1-digit
  gcfQ("a-gcf", 24, 40), // 8
  lcmQ("a-lcm", 8, 10), // 40
  fracAddQ("a-add", [1, 2], [2, 5]), // 9/10
  fracSubQ("a-sub", [3, 4], [2, 3]), // 1/12
  fracMulQ("a-mul", [4, 9], [3, 8]), // 1/6
  fracDivQ("a-div", [3, 4], [3, 8]), // 2

  periodicQ("a-v1", "Na", "v"), // 1
  periodicQ("a-v2", "Mg", "v"), // 2
  periodicQ("a-v3", "Cl", "v"), // 7
  periodicQ("a-pn1", "P", "P"), // 15 protons
  periodicQ("a-pn2", "Ar", "N"), // 22 neutrons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "osloI"), // 1993
  peaceQ("a-pc3", "abraham"), // 2020
  peaceQ("a-pc4", "campDavid"), // 1978
  warQ("a-war1", "wwi"), // 1914

  evolutionQ("a-evo1", "firstLife"), // 3700
  evolutionQ("a-evo2", "firstDinos"), // 230
  evolutionQ("a-evo3", "homoSapiens"), // 0.3
];

const versionB: Question[] = [
  multQ("b-m-1", 7, 8), // 56
  multQ("b-m-2", 14, 12), // 168
  multQ("b-m-3", 16, 9), // 144
  gcfQ("b-gcf", 18, 30), // 6
  lcmQ("b-lcm", 12, 8), // 24
  fracAddQ("b-add", [1, 3], [1, 2]), // 5/6
  fracSubQ("b-sub", [7, 8], [3, 4]), // 1/8
  fracMulQ("b-mul", [3, 4], [4, 5]), // 3/5
  fracDivQ("b-div", [3, 4], [9, 8]), // 2/3

  periodicQ("b-v1", "O", "v"), // 6
  periodicQ("b-v2", "Si", "v"), // 4
  periodicQ("b-v3", "Ar", "v"), // 8
  periodicQ("b-pn1", "N", "P"), // 7 protons
  periodicQ("b-pn2", "Mg", "N"), // 12 neutrons

  peaceQ("b-pc1", "versailles"), // 1919
  peaceQ("b-pc2", "vienna"), // 1815
  peaceQ("b-pc3", "goodFriday"), // 1998
  peaceQ("b-pc4", "osloI"), // 1993
  warQ("b-war1", "wwii"), // 1939

  evolutionQ("b-evo1", "bigBang"), // 13800
  evolutionQ("b-evo2", "cambrian"), // 540
  evolutionQ("b-evo3", "firstMammals"), // 210
];

export const day20260605: Day = {
  date: DATE,
  title: "Day 16 — Review week: final lap (full mixed review)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Multiplication breakdown + tables",
    "GCF / LCM / all four fraction operations",
    "Valence (row 3) + protons/neutrons",
    "Peace: Westphalia, Oslo, Abraham, Camp David",
    "Evolution: first life, dinosaurs, Homo sapiens",
  ],
  versionA,
  versionB,
};
