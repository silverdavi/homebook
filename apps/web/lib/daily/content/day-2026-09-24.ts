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
import { inverseIntQ, inverseFracQ } from "./banks/frac-inverse";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { peaceQ } from "./banks/peace";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-09-24";

// Day 21 — first day back. One item from every thread of the May–June
// trial. Not a drill of the weak spots (that's tomorrow). 18 questions.
// A and B don't share items.

const versionA: Question[] = [
  gcfQ("a-gcf", 12, 18),
  lcmQ("a-lcm", 4, 6),
  multQ("a-m1", 12, 12),
  multQ("a-m2", 11, 13),
  fracAddQ("a-fa", [1, 2], [1, 4]),
  fracSubQ("a-fs", [3, 4], [1, 4]),
  fracMulQ("a-fm", [1, 2], [2, 3]),
  fracDivQ("a-fd", [1, 2], [1, 4]),
  inverseIntQ("a-inv", 5),
  periodicQ("a-p1", "H", "P"),
  periodicQ("a-p2", "C", "v"),
  periodicQ("a-p3", "Na", "v"),
  periodicQ("a-p4", "O", "P"),
  warQ("a-w1", "wwi"),
  warQ("a-w2", "wwii"),
  peaceQ("a-pc1", "westphalia"),
  peaceQ("a-pc2", "versailles"),
  evolutionQ("a-e1", "earthForms"),
];

const versionB: Question[] = [
  gcfQ("b-gcf", 16, 24),
  lcmQ("b-lcm", 3, 5),
  multQ("b-m1", 15, 15),
  multQ("b-m2", 9, 9),
  fracAddQ("b-fa", [1, 3], [1, 6]),
  fracSubQ("b-fs", [5, 6], [1, 3]),
  fracMulQ("b-fm", [2, 3], [3, 4]),
  fracDivQ("b-fd", [3, 4], [1, 2]),
  inverseFracQ("b-inv", [2, 5]),
  periodicQ("b-p1", "He", "v"),
  periodicQ("b-p2", "Cl", "v"),
  periodicQ("b-p3", "N", "P"),
  periodicQ("b-p4", "Ne", "v"),
  warQ("b-w1", "americanRevolution"),
  warQ("b-w2", "korean"),
  peaceQ("b-pc1", "goodFriday"),
  peaceQ("b-pc2", "osloI"),
  evolutionQ("b-e1", "ktExtinction"),
];

export const day20260924: Day = {
  date: DATE,
  title: "Day 21 — The whole trial, once",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "One pass over GCF, LCM, fractions, and times tables",
    "H–Ar: protons and valence",
    "Wars, peace dates, deep time",
    "No new material",
  ],
  versionA,
  versionB,
};
