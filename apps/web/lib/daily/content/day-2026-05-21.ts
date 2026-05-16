import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { fracMulQ } from "./banks/frac-mul";
import { fracDivQ } from "./banks/frac-div";
import { inverseFracQ, inverseIntQ } from "./banks/frac-inverse";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-21";

// Day 8 = Week 2, Day 4. New today: fraction division + inverse.
//
// Inverse is trivial (swap top and bottom). Division is "multiply by
// the inverse of the second one" — so once mul + inverse are
// internalized, div is essentially free.
//
// 22 = 11 math (2 add + 2 sub + 2 mul + 3 div + 2 inverse) + 4 periodic
// + 4 wars + 3 evolution.
//
// Periodic table completes row 3 (P, S, Cl, Ar). Wars include the last
// three (Vietnam, Gulf, Iraq) plus a review pull. Evolution finishes
// the timeline (mammals → hominids → Homo sapiens).

const versionA: Question[] = [
  // Add (2) — keep alive
  fracAddQ("a-add-1", [3, 7], [2, 7]),
  fracAddQ("a-add-2", [1, 2], [1, 4]),

  // Sub (2)
  fracSubQ("a-sub-1", [5, 6], [1, 6]),
  fracSubQ("a-sub-2", [3, 4], [1, 6]),

  // Mul (2)
  fracMulQ("a-mul-1", [2, 3], [3, 5]),
  fracMulQ("a-mul-2", [3, 8], [4, 9]),

  // Inverse — NEW today (2)
  inverseIntQ("a-inv-1", 7),         // 1/7
  inverseFracQ("a-inv-2", [3, 5]),   // 5/3

  // Divide — NEW today (3)
  fracDivQ("a-div-1", [2, 3], [4, 5]),   // 2/3 × 5/4 = 10/12 = 5/6
  fracDivQ("a-div-2", [3, 4], [9, 8]),   // 3/4 × 8/9 = 24/36 = 2/3
  fracDivQ("a-div-3", [5, 6], [1, 3]),   // 5/6 × 3/1 = 15/6 = 5/2

  // Periodic (4) — row 3 second half (P, S, Cl, Ar) + 1 review
  periodicQ("a-pt-1", "P", "P"),         // 15
  periodicQ("a-pt-2", "S", "N"),         // 16
  periodicQ("a-pt-3", "Cl", "e"),        // 17
  periodicQ("a-pt-4", "Ar", "N"),        // 22 (the curveball)

  // History (4) — wars 13-15 + 1 review
  warQ("a-war-1", "vietnam"),
  warQ("a-war-2", "gulf"),
  warQ("a-war-3", "iraq"),
  warQ("a-war-4", "wwii"),               // review

  // Biology (3) — final events
  evolutionQ("a-evo-1", "firstMammals"),
  evolutionQ("a-evo-2", "firstHominids"),
  evolutionQ("a-evo-3", "homoSapiens"),
];

const versionB: Question[] = [
  fracAddQ("b-add-1", [2, 9], [4, 9]),
  fracAddQ("b-add-2", [1, 3], [1, 6]),

  fracSubQ("b-sub-1", [4, 5], [1, 5]),
  fracSubQ("b-sub-2", [2, 3], [1, 4]),

  fracMulQ("b-mul-1", [3, 4], [4, 5]),
  fracMulQ("b-mul-2", [4, 9], [3, 8]),

  inverseIntQ("b-inv-1", 9),         // 1/9
  inverseFracQ("b-inv-2", [2, 7]),   // 7/2

  fracDivQ("b-div-1", [3, 5], [6, 7]),   // 3/5 × 7/6 = 21/30 = 7/10
  fracDivQ("b-div-2", [4, 9], [8, 3]),   // 4/9 × 3/8 = 12/72 = 1/6
  fracDivQ("b-div-3", [3, 8], [3, 1]),   // 3/8 × 1/3 = 1/8

  periodicQ("b-pt-1", "S", "P"),         // 16
  periodicQ("b-pt-2", "Cl", "N"),        // 18
  periodicQ("b-pt-3", "P", "e"),         // 15
  periodicQ("b-pt-4", "Ar", "N"),        // 22

  warQ("b-war-1", "iraq"),
  warQ("b-war-2", "vietnam"),
  warQ("b-war-3", "gulf"),
  warQ("b-war-4", "americanRevolution"), // review

  evolutionQ("b-evo-1", "firstHominids"),
  evolutionQ("b-evo-2", "homoSapiens"),
  evolutionQ("b-evo-3", "firstMammals"),
];

export const day20260521: Day = {
  date: DATE,
  title: "Day 8 — Inverse + Fraction Division (flip + multiply)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Add / sub / mul keep-alive (6)",
    "Inverse — new today (2)",
    "Fraction divide — new today (3)",
    "Periodic — finish row 3 (P, S, Cl, Ar)",
    "Wars 13-15 + review",
    "Mammals / hominids / Homo sapiens",
  ],
  versionA,
  versionB,
};
