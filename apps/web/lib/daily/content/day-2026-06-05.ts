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

// Final day. A and B share NO items. Content bumped; B is the harder set.

const versionA: Question[] = [
  multQ("a-m-1", 13, 14), // 182 — 2-digit × 2-digit
  multQ("a-m-2", 15, 12), // 180
  multQ("a-m-3", 16, 8), // 128
  gcfQ("a-gcf", 36, 48), // 12
  lcmQ("a-lcm", 6, 14), // 42
  fracAddQ("a-add", [2, 3], [3, 4]), // 17/12
  fracSubQ("a-sub", [7, 8], [1, 3]), // 13/24
  fracMulQ("a-mul", [5, 6], [3, 8]), // 5/16
  fracDivQ("a-div", [7, 8], [3, 4]), // 7/6

  periodicQ("a-v1", "Na", "v"), // 1
  periodicQ("a-v2", "Al", "v"), // 3
  periodicQ("a-v3", "O", "v"), // 6
  periodicQ("a-pn1", "Mg", "P"), // 12 protons
  periodicQ("a-pn2", "Ar", "N"), // 22 neutrons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "osloI"), // 1993
  peaceQ("a-pc3", "abraham"), // 2020
  peaceQ("a-pc4", "versailles"), // 1919
  warQ("a-war1", "wwii"), // 1939

  evolutionQ("a-evo1", "firstLife"), // 3700
  evolutionQ("a-evo2", "firstDinos"), // 230
  evolutionQ("a-evo3", "homoSapiens"), // 0.3
];

const versionB: Question[] = [
  multQ("b-m-1", 15, 14), // 210 — harder set
  multQ("b-m-2", 16, 15), // 240
  multQ("b-m-3", 19, 7), // 133
  gcfQ("b-gcf", 40, 60), // 20
  lcmQ("b-lcm", 12, 15), // 60
  fracAddQ("b-add", [5, 6], [4, 9]), // 23/18
  fracSubQ("b-sub", [5, 6], [7, 12]), // 1/4
  fracMulQ("b-mul", [7, 8], [4, 9]), // 7/18
  fracDivQ("b-div", [7, 9], [2, 3]), // 7/6

  periodicQ("b-v1", "Mg", "v"), // 2
  periodicQ("b-v2", "Si", "v"), // 4
  periodicQ("b-v3", "Cl", "v"), // 7
  periodicQ("b-pn1", "P", "P"), // 15 protons
  periodicQ("b-pn2", "Na", "N"), // 12 neutrons

  peaceQ("b-pc1", "vienna"), // 1815
  peaceQ("b-pc2", "goodFriday"), // 1998
  peaceQ("b-pc3", "campDavid"), // 1978
  peaceQ("b-pc4", "dayton"), // 1995
  warQ("b-war1", "korean"), // 1950

  evolutionQ("b-evo1", "bigBang"), // 13800
  evolutionQ("b-evo2", "cambrian"), // 540
  evolutionQ("b-evo3", "firstHominids"), // 7
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
