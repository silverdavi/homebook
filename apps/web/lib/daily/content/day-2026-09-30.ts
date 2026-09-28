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

const DATE = "2026-09-30";

// Day 24 — different denominators. No peace, no wars.

const versionA: Question[] = [
  fracAddQ("a-fa1", [1, 2], [1, 3]),
  fracAddQ("a-fa2", [2, 9], [1, 9]),
  fracSubQ("a-fs1", [3, 4], [1, 6]),
  fracSubQ("a-fs2", [5, 8], [1, 8]),
  fracMulQ("a-fm1", [2, 3], [3, 8]),
  fracMulQ("a-fm2", [4, 5], [1, 2]),
  fracDivQ("a-fd1", [1, 2], [1, 3]),
  fracDivQ("a-fd2", [3, 4], [3, 8]),
  inverseIntQ("a-i1", 7),
  inverseFracQ("a-i2", [4, 9]),
  gcfQ("a-gcf", 20, 28),
  lcmQ("a-lcm", 9, 6),
  multQ("a-m1", 18, 11),
  multQ("a-m2", 21, 4),
  fracAddQ("a-fa3", [1, 4], [1, 4]),
  fracSubQ("a-fs3", [7, 10], [1, 5]),
  fracMulQ("a-fm3", [5, 6], [2, 5]),
  fracDivQ("a-fd3", [2, 5], [1, 5]),
];

const versionB: Question[] = [
  fracAddQ("b-fa1", [1, 4], [1, 3]),
  fracAddQ("b-fa2", [3, 10], [1, 10]),
  fracSubQ("b-fs1", [5, 6], [1, 4]),
  fracSubQ("b-fs2", [7, 8], [1, 8]),
  fracMulQ("b-fm1", [3, 4], [2, 9]),
  fracMulQ("b-fm2", [1, 6], [3, 5]),
  fracDivQ("b-fd1", [3, 5], [1, 2]),
  fracDivQ("b-fd2", [4, 5], [2, 5]),
  inverseIntQ("b-i1", 9),
  inverseFracQ("b-i2", [5, 8]),
  gcfQ("b-gcf", 16, 36),
  lcmQ("b-lcm", 8, 10),
  multQ("b-m1", 19, 5),
  multQ("b-m2", 22, 3),
  fracAddQ("b-fa3", [2, 7], [3, 7]),
  fracSubQ("b-fs3", [4, 5], [1, 10]),
  fracMulQ("b-fm3", [3, 7], [7, 9]),
  fracDivQ("b-fd3", [1, 4], [1, 2]),
];

export const day20260930: Day = {
  date: DATE,
  title: "Day 24 — Different denominators",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Add and subtract unlike fractions",
    "Multiply by canceling, divide by flipping",
    "No treaties, no war years",
  ],
  versionA,
  versionB,
};
