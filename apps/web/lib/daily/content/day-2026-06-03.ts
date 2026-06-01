import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { inverseFracQ } from "./banks/frac-inverse";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-06-03";

// Day 14 = Week 4, Day 2. Lap 2 — rotate values, swap divide for inverse,
// hit valence again (S, Al, Ne), and the 1970s peace cluster.

const versionA: Question[] = [
  multQ("a-m-1", 7, 9), // 63
  multQ("a-m-2", 15, 13), // 195 — 2-digit breakdown
  multQ("a-m-3", 16, 7), // 112 — 2-digit × 1-digit
  gcfQ("a-gcf", 16, 40), // 8
  lcmQ("a-lcm", 9, 12), // 36
  fracAddQ("a-add", [2, 5], [1, 10]), // 1/2
  fracSubQ("a-sub", [5, 6], [1, 3]), // 1/2
  fracMulQ("a-mul", [4, 5], [5, 8]), // 1/2
  inverseFracQ("a-inv", [3, 7]), // 7/3

  periodicQ("a-v1", "S", "v"), // 6
  periodicQ("a-v2", "Al", "v"), // 3
  periodicQ("a-v3", "Ne", "v"), // 8
  periodicQ("a-pn1", "Mg", "P"), // 12 protons
  periodicQ("a-pn2", "F", "N"), // 10 neutrons

  peaceQ("a-pc1", "campDavid"), // 1978
  peaceQ("a-pc2", "israelEgypt"), // 1979
  peaceQ("a-pc3", "dayton"), // 1995
  peaceQ("a-pc4", "westphalia"), // 1648 anchor
  warQ("a-war1", "korean"), // 1950

  evolutionQ("a-evo1", "firstFish"), // 520
  evolutionQ("a-evo2", "firstPlants"), // 470
  evolutionQ("a-evo3", "ktExtinction"), // 66
];

const versionB: Question[] = [
  multQ("b-m-1", 8, 8), // 64
  multQ("b-m-2", 12, 14), // 168
  multQ("b-m-3", 19, 5), // 95
  gcfQ("b-gcf", 20, 30), // 10
  lcmQ("b-lcm", 8, 12), // 24
  fracAddQ("b-add", [1, 4], [3, 8]), // 5/8
  fracSubQ("b-sub", [7, 8], [1, 4]), // 5/8
  fracMulQ("b-mul", [2, 7], [7, 4]), // 1/2
  inverseFracQ("b-inv", [5, 9]), // 9/5

  periodicQ("b-v1", "Cl", "v"), // 7
  periodicQ("b-v2", "Be", "v"), // 2
  periodicQ("b-v3", "Si", "v"), // 4
  periodicQ("b-pn1", "N", "P"), // 7 protons
  periodicQ("b-pn2", "Cl", "N"), // 18 neutrons

  peaceQ("b-pc1", "versailles"), // 1919
  peaceQ("b-pc2", "unCharter"), // 1945
  peaceQ("b-pc3", "osloI"), // 1993
  peaceQ("b-pc4", "vienna"), // 1815
  warQ("b-war1", "vietnam"), // 1955

  evolutionQ("b-evo1", "firstDinos"), // 230
  evolutionQ("b-evo2", "firstMammals"), // 210
  evolutionQ("b-evo3", "bigBang"), // 13800
];

export const day20260603: Day = {
  date: DATE,
  title: "Day 14 — Review week: lap 2 (inverses, valence, 1970s peace)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Multiplication breakdown + tables",
    "GCF / LCM / add / subtract / multiply / inverse",
    "Valence (S, Al, Ne) + protons/neutrons",
    "Peace: Camp David, Israel-Egypt, Dayton, Westphalia",
    "Evolution: first fish, plants, KT extinction",
  ],
  versionA,
  versionB,
};
