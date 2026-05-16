import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-18";

// Day 5 = Week 2, Day 1.
//
// Goal: re-cement Wednesday's gains. Adam went 4/6 on addition once
// it was scaffolded; we keep the scaffolding and turn up the volume.
//
// 22 questions: 11 math (3 GCF + 2 LCM + 6 add) + 4 periodic + 4 wars + 3 evolution.
//
// All add problems are achievable with the same three-step rule. Two
// are same-denominator warmups (he got 100% on these last Wed). Four
// are cross-denominator (he was 1/3 on these — this is the day to
// flip that).

const versionA: Question[] = [
  // GCF refresh (3) — confidence layer
  gcfQ("a-gcf-1", 12, 18),
  gcfQ("a-gcf-2", 14, 35),
  gcfQ("a-gcf-3", 24, 36),

  // LCM refresh (2) — keep alive, simple cases
  lcmQ("a-lcm-1", 4, 6),
  lcmQ("a-lcm-2", 3, 8),

  // Fraction add (6): 2 same-denominator warmups + 4 cross-denominator
  fracAddQ("a-add-1", [1, 5], [3, 5]),  // same den
  fracAddQ("a-add-2", [2, 9], [4, 9]),  // same den
  fracAddQ("a-add-3", [1, 2], [1, 4]),  // small LCM
  fracAddQ("a-add-4", [1, 3], [1, 6]),  // small LCM
  fracAddQ("a-add-5", [2, 3], [1, 4]),  // LCM=12, his Day 13 type
  fracAddQ("a-add-6", [3, 5], [1, 10]), // LCM=10

  // Periodic (4) rows 1-2, mix of asks
  periodicQ("a-pt-1", "C", "P"),
  periodicQ("a-pt-2", "N", "N"),
  periodicQ("a-pt-3", "Ne", "e"),
  periodicQ("a-pt-4", "Be", "N"),

  // History (4) — wars 1-4 (the early American set)
  warQ("a-war-1", "americanRevolution"),
  warQ("a-war-2", "warOf1812"),
  warQ("a-war-3", "mexicanAmerican"),
  warQ("a-war-4", "americanCivil"),

  // Biology (3) — early-Earth events
  evolutionQ("a-evo-1", "bigBang"),
  evolutionQ("a-evo-2", "earthForms"),
  evolutionQ("a-evo-3", "firstLife"),
];

const versionB: Question[] = [
  gcfQ("b-gcf-1", 18, 12),
  gcfQ("b-gcf-2", 35, 14),
  gcfQ("b-gcf-3", 36, 24),

  lcmQ("b-lcm-1", 6, 4),
  lcmQ("b-lcm-2", 8, 3),

  fracAddQ("b-add-1", [2, 7], [3, 7]),
  fracAddQ("b-add-2", [1, 4], [3, 4]),
  fracAddQ("b-add-3", [1, 3], [1, 4]),
  fracAddQ("b-add-4", [1, 6], [1, 4]),
  fracAddQ("b-add-5", [3, 4], [1, 6]),
  fracAddQ("b-add-6", [2, 5], [3, 10]),

  periodicQ("b-pt-1", "O", "P"),
  periodicQ("b-pt-2", "Li", "N"),
  periodicQ("b-pt-3", "F", "e"),
  periodicQ("b-pt-4", "B", "N"),

  warQ("b-war-1", "warOf1812"),
  warQ("b-war-2", "americanRevolution"),
  warQ("b-war-3", "americanCivil"),
  warQ("b-war-4", "mexicanAmerican"),

  evolutionQ("b-evo-1", "earthForms"),
  evolutionQ("b-evo-2", "bigBang"),
  evolutionQ("b-evo-3", "firstLife"),
];

export const day20260518: Day = {
  date: DATE,
  title: "Day 5 — Foundations + Fraction Add (cross-denominator)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "GCF refresh (3 questions)",
    "LCM refresh (2 questions)",
    "Fraction add: same + cross-denominator (6)",
    "Periodic rows 1-2 review",
    "Wars 1-4",
    "Early-Earth evolution",
  ],
  versionA,
  versionB,
};
