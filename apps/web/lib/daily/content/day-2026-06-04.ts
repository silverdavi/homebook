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

const DATE = "2026-06-04";

// Day 15 = Week 4, Day 3. Lap 3 — divide returns, valence spans rows
// 1-3 (H, C, P), the "bad peace" cluster, and a decimal evolution answer.

const versionA: Question[] = [
  multQ("a-m-1", 6, 8), // 48
  multQ("a-m-2", 14, 14), // 196 — 2-digit breakdown
  multQ("a-m-3", 13, 8), // 104 — 2-digit × 1-digit
  gcfQ("a-gcf", 12, 30), // 6
  lcmQ("a-lcm", 6, 10), // 30
  fracAddQ("a-add", [3, 4], [1, 8]), // 7/8
  fracSubQ("a-sub", [2, 3], [1, 4]), // 5/12
  fracDivQ("a-div", [3, 4], [1, 2]), // 3/2
  fracMulQ("a-mul", [3, 8], [4, 9]), // 1/6

  periodicQ("a-v1", "H", "v"), // 1
  periodicQ("a-v2", "C", "v"), // 4
  periodicQ("a-v3", "P", "v"), // 5
  periodicQ("a-pn1", "Si", "P"), // 14 protons
  periodicQ("a-pn2", "O", "N"), // 8 neutrons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "parisAmerican"), // 1783
  peaceQ("a-pc3", "abraham"), // 2020
  peaceQ("a-pc4", "goodFriday"), // 1998
  warQ("a-war1", "wwii"), // 1939

  evolutionQ("a-evo1", "bigBang"), // 13800
  evolutionQ("a-evo2", "earthForms"), // 4540
  evolutionQ("a-evo3", "homoSapiens"), // 0.3
];

const versionB: Question[] = [
  multQ("b-m-1", 9, 7), // 63
  multQ("b-m-2", 12, 15), // 180
  multQ("b-m-3", 17, 4), // 68
  gcfQ("b-gcf", 14, 21), // 7
  lcmQ("b-lcm", 9, 6), // 18
  fracAddQ("b-add", [2, 5], [3, 10]), // 7/10
  fracSubQ("b-sub", [5, 6], [1, 2]), // 1/3
  fracDivQ("b-div", [2, 3], [4, 9]), // 3/2
  fracMulQ("b-mul", [5, 6], [2, 5]), // 1/3

  periodicQ("b-v1", "He", "v"), // 2
  periodicQ("b-v2", "B", "v"), // 3
  periodicQ("b-v3", "O", "v"), // 6
  periodicQ("b-pn1", "Al", "P"), // 13 protons
  periodicQ("b-pn2", "S", "N"), // 16 neutrons

  peaceQ("b-pc1", "vienna"), // 1815
  peaceQ("b-pc2", "versailles"), // 1919
  peaceQ("b-pc3", "osloI"), // 1993
  peaceQ("b-pc4", "dayton"), // 1995
  warQ("b-war1", "korean"), // 1950

  evolutionQ("b-evo1", "cambrian"), // 540
  evolutionQ("b-evo2", "firstFish"), // 520
  evolutionQ("b-evo3", "ktExtinction"), // 66
];

export const day20260604: Day = {
  date: DATE,
  title: "Day 15 — Review week: lap 3 (divide, valence rows 1-3, bad peace)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Multiplication breakdown + tables",
    "GCF / LCM / add / subtract / divide / multiply",
    "Valence (H, C, P) + protons/neutrons",
    "Peace: Westphalia, Paris 1783, Abraham, Good Friday",
    "Evolution: Big Bang, Earth forms, Homo sapiens",
  ],
  versionA,
  versionB,
};
