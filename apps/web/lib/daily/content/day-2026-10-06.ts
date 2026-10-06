import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { periodicQ } from "./banks/periodic";
import { fracDivQ } from "./banks/frac-div";

const DATE = "2026-10-06";

// Day 26 — valence. Short day. No peace, no neutron drill.

const versionA: Question[] = [
  periodicQ("a-v1", "H", "v"),
  periodicQ("a-v2", "He", "v"),
  periodicQ("a-v3", "Li", "v"),
  periodicQ("a-v4", "C", "v"),
  periodicQ("a-v5", "O", "v"),
  periodicQ("a-v6", "F", "v"),
  periodicQ("a-v7", "Ne", "v"),
  periodicQ("a-v8", "Na", "v"),
  periodicQ("a-v9", "Al", "v"),
  periodicQ("a-v10", "S", "v"),
  periodicQ("a-v11", "Cl", "v"),
  periodicQ("a-v12", "Ar", "v"),
  fracDivQ("a-d1", [1, 2], [1, 4]),
  fracDivQ("a-d2", [3, 4], [1, 2]),
  fracDivQ("a-d3", [2, 3], [4, 5]),
  fracDivQ("a-d4", [1, 2], [3, 4]),
  multQ("a-m1", 14, 12),
  multQ("a-m2", 16, 15),
];

const versionB: Question[] = [
  periodicQ("b-v1", "Be", "v"),
  periodicQ("b-v2", "B", "v"),
  periodicQ("b-v3", "N", "v"),
  periodicQ("b-v4", "Mg", "v"),
  periodicQ("b-v5", "Si", "v"),
  periodicQ("b-v6", "P", "v"),
  periodicQ("b-v7", "He", "v"),
  periodicQ("b-v8", "O", "v"),
  periodicQ("b-v9", "Na", "v"),
  periodicQ("b-v10", "Cl", "v"),
  periodicQ("b-v11", "H", "v"),
  periodicQ("b-v12", "Ar", "v"),
  fracDivQ("b-d1", [1, 3], [1, 6]),
  fracDivQ("b-d2", [3, 5], [1, 5]),
  fracDivQ("b-d3", [2, 7], [1, 3]),
  fracDivQ("b-d4", [3, 8], [1, 4]),
  multQ("b-m1", 13, 12),
  multQ("b-m2", 15, 14),
];

export const day20261006: Day = {
  date: DATE,
  title: "Day 26 — Valence",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Valence is the outer electrons",
    "Same column, same number",
    "Helium is 2",
  ],
  versionA,
  versionB,
};
