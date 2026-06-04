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

// A and B intentionally share NO items (Adam: "B is just A with two
// numbers swapped"). Different numbers, elements, treaties, events.
// Content bumped: bigger multiplications, improper-result fractions.
// B is the harder set.

const versionA: Question[] = [
  multQ("a-m-1", 12, 13), // 156 — 2-digit × 2-digit
  multQ("a-m-2", 14, 15), // 210
  multQ("a-m-3", 17, 8), // 136
  gcfQ("a-gcf", 24, 36), // 12
  lcmQ("a-lcm", 8, 12), // 24
  fracAddQ("a-add", [3, 4], [2, 5]), // 23/20
  fracSubQ("a-sub", [5, 6], [3, 8]), // 11/24
  fracMulQ("a-mul", [3, 4], [8, 9]), // 2/3
  fracDivQ("a-div", [3, 4], [2, 3]), // 9/8

  periodicQ("a-v1", "P", "v"), // 5
  periodicQ("a-v2", "S", "v"), // 6
  periodicQ("a-v3", "Cl", "v"), // 7
  periodicQ("a-pn1", "Ar", "P"), // 18 protons
  periodicQ("a-pn2", "Si", "N"), // 14 neutrons

  peaceQ("a-pc1", "westphalia"), // 1648
  peaceQ("a-pc2", "osloI"), // 1993
  peaceQ("a-pc3", "goodFriday"), // 1998
  peaceQ("a-pc4", "campDavid"), // 1978
  warQ("a-war1", "wwii"), // 1939

  evolutionQ("a-evo1", "bigBang"), // 13800
  evolutionQ("a-evo2", "earthForms"), // 4540
  evolutionQ("a-evo3", "homoSapiens"), // 0.3
];

const versionB: Question[] = [
  multQ("b-m-1", 14, 16), // 224 — harder set
  multQ("b-m-2", 15, 15), // 225
  multQ("b-m-3", 18, 9), // 162
  gcfQ("b-gcf", 30, 45), // 15
  lcmQ("b-lcm", 9, 15), // 45
  fracAddQ("b-add", [5, 6], [3, 8]), // 29/24
  fracSubQ("b-sub", [7, 8], [2, 3]), // 5/24
  fracMulQ("b-mul", [5, 9], [3, 4]), // 5/12
  fracDivQ("b-div", [5, 6], [3, 4]), // 10/9

  periodicQ("b-v1", "Si", "v"), // 4
  periodicQ("b-v2", "Na", "v"), // 1
  periodicQ("b-v3", "Ar", "v"), // 8 (noble-gas trap)
  periodicQ("b-pn1", "P", "P"), // 15 protons
  periodicQ("b-pn2", "Cl", "N"), // 18 neutrons

  peaceQ("b-pc1", "versailles"), // 1919
  peaceQ("b-pc2", "vienna"), // 1815
  peaceQ("b-pc3", "abraham"), // 2020
  peaceQ("b-pc4", "dayton"), // 1995
  warQ("b-war1", "wwi"), // 1914

  evolutionQ("b-evo1", "cambrian"), // 540
  evolutionQ("b-evo2", "firstFish"), // 520
  evolutionQ("b-evo3", "firstHominids"), // 7
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
