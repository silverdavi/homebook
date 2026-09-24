import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { fracDivQ } from "./banks/frac-div";
import { inverseIntQ, inverseFracQ } from "./banks/frac-inverse";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";

const DATE = "2026-09-25";

// Day 22 — the three leaks from the trial: valence off by one or two,
// the last addition on a two-digit multiply, and the peace dates
// (Westphalia 1648, Versailles 1919). Fractions stay in so reducing
// doesn't go cold. 18 questions. A and B share nothing.

const versionA: Question[] = [
  multQ("a-m1", 17, 25),
  multQ("a-m2", 23, 14),
  multQ("a-m3", 16, 15),
  multQ("a-m4", 12, 15),
  fracAddQ("a-fa", [1, 2], [1, 3]),
  fracSubQ("a-fs", [2, 3], [1, 4]),
  fracMulQ("a-fm", [2, 3], [3, 5]),
  fracDivQ("a-fd", [2, 3], [4, 5]),
  inverseFracQ("a-inv", [3, 8]),
  periodicQ("a-v1", "C", "v"),
  periodicQ("a-v2", "O", "v"),
  periodicQ("a-v3", "Na", "v"),
  periodicQ("a-v4", "Cl", "v"),
  periodicQ("a-v5", "He", "v"),
  peaceQ("a-pc1", "westphalia"),
  peaceQ("a-pc2", "versailles"),
  peaceQ("a-pc3", "parisAmerican"),
  peaceQ("a-pc4", "unCharter"),
];

const versionB: Question[] = [
  multQ("b-m1", 19, 15),
  multQ("b-m2", 24, 13),
  multQ("b-m3", 18, 12),
  multQ("b-m4", 14, 15),
  fracAddQ("b-fa", [1, 4], [1, 6]),
  fracSubQ("b-fs", [3, 4], [1, 6]),
  fracMulQ("b-fm", [3, 4], [2, 9]),
  fracDivQ("b-fd", [3, 5], [1, 2]),
  inverseIntQ("b-inv", 8),
  periodicQ("b-v1", "Li", "v"),
  periodicQ("b-v2", "F", "v"),
  periodicQ("b-v3", "Mg", "v"),
  periodicQ("b-v4", "S", "v"),
  periodicQ("b-v5", "Ar", "v"),
  peaceQ("b-pc1", "vienna"),
  peaceQ("b-pc2", "campDavid"),
  peaceQ("b-pc3", "dayton"),
  peaceQ("b-pc4", "abraham"),
];

export const day20260925: Day = {
  date: DATE,
  title: "Day 22 — The three leaks",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Valence from the group number",
    "Two-digit multiplication, last addition",
    "Westphalia 1648 and Versailles 1919",
    "Fractions, reduced",
  ],
  versionA,
  versionB,
};
