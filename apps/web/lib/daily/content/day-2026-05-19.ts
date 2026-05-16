import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracSubQ } from "./banks/frac-sub";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-19";

// Day 6 = Week 2, Day 2. New today: fraction subtraction.
//
// Sub uses the exact same three-step rule as add (LCM → rewrite →
// operate on the tops). The only twist is that the answer can be
// negative — the minus sign goes on the numerator.
//
// 22 = 11 math (2 GCF + 3 LCM + 3 add review + 3 sub) + 4 periodic
// + 4 wars + 3 evolution.

const versionA: Question[] = [
  // GCF + LCM keep-alive (5)
  gcfQ("a-gcf-1", 16, 24),
  gcfQ("a-gcf-2", 30, 45),
  lcmQ("a-lcm-1", 5, 7),  // his Day 13 a-lcm-3 miss type
  lcmQ("a-lcm-2", 10, 15), // his Day 13 b-lcm-2 miss type
  lcmQ("a-lcm-3", 6, 9),

  // Fraction add review (3)
  fracAddQ("a-add-1", [3, 7], [2, 7]),  // same den
  fracAddQ("a-add-2", [1, 2], [1, 3]),  // small LCM
  fracAddQ("a-add-3", [1, 4], [1, 6]),  // LCM=12

  // Fraction subtract — NEW today (3) — mix of same/cross-den, all positive
  fracSubQ("a-sub-1", [3, 5], [1, 5]),   // same den, positive
  fracSubQ("a-sub-2", [3, 4], [1, 6]),   // LCM=12 → 9/12 - 2/12 = 7/12
  fracSubQ("a-sub-3", [5, 6], [1, 3]),   // LCM=6 → 5/6 - 2/6 = 3/6 = 1/2

  // Periodic (4)
  periodicQ("a-pt-1", "Li", "P"),
  periodicQ("a-pt-2", "B", "N"),
  periodicQ("a-pt-3", "C", "e"),
  periodicQ("a-pt-4", "F", "N"),

  // History (4) — wars 5-8
  warQ("a-war-1", "francoPrussian"),
  warQ("a-war-2", "spanishAmerican"),
  warQ("a-war-3", "russoJapanese"),
  warQ("a-war-4", "wwi"),

  // Biology (3) — adds Cambrian set
  evolutionQ("a-evo-1", "cambrian"),
  evolutionQ("a-evo-2", "firstFish"),
  evolutionQ("a-evo-3", "firstPlants"),
];

const versionB: Question[] = [
  gcfQ("b-gcf-1", 24, 16),
  gcfQ("b-gcf-2", 45, 30),
  lcmQ("b-lcm-1", 7, 5),
  lcmQ("b-lcm-2", 15, 10),
  lcmQ("b-lcm-3", 9, 6),

  fracAddQ("b-add-1", [2, 9], [4, 9]),
  fracAddQ("b-add-2", [1, 3], [1, 4]),
  fracAddQ("b-add-3", [1, 5], [1, 10]),

  fracSubQ("b-sub-1", [4, 7], [2, 7]),   // same den
  fracSubQ("b-sub-2", [2, 3], [1, 4]),   // LCM=12 → 8/12 - 3/12 = 5/12
  fracSubQ("b-sub-3", [7, 8], [1, 4]),   // LCM=8 → 7/8 - 2/8 = 5/8

  periodicQ("b-pt-1", "O", "P"),
  periodicQ("b-pt-2", "Be", "N"),
  periodicQ("b-pt-3", "He", "e"),
  periodicQ("b-pt-4", "N", "N"),

  warQ("b-war-1", "spanishAmerican"),
  warQ("b-war-2", "francoPrussian"),
  warQ("b-war-3", "wwi"),
  warQ("b-war-4", "russoJapanese"),

  evolutionQ("b-evo-1", "firstFish"),
  evolutionQ("b-evo-2", "cambrian"),
  evolutionQ("b-evo-3", "firstPlants"),
];

export const day20260519: Day = {
  date: DATE,
  title: "Day 6 — Fraction Subtraction (the same rule, with a sign)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "GCF + LCM keep-alive",
    "Fraction add review (3)",
    "Fraction subtract — new today (3)",
    "Periodic rows 1-2 review",
    "Wars 5-8",
    "Cambrian / fish / land plants",
  ],
  versionA,
  versionB,
};
