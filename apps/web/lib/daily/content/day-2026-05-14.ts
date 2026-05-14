import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-14";

// Day 14 composition is shaped by Adam's Day 13 result (28/36 across A+B):
//
//   GCF    5 / 6   — fine, occasional list slip
//   LCM    3 / 6   — twice he listed factors instead of multiples; once
//                    he listed correctly but picked the wrong "first
//                    common"
//   Add    0 / 4   — he has *no* mental model. Wrote "if I have half
//                    an apple and a quarter of an apple I'd have a
//                    third of an apple so 2/3."
//   Periodic, wars, evolution: 8/8, 6/6, 6/6.
//
// So we hold back fraction subtraction and multiplication for now and
// do not introduce row 3 of the periodic table either. This is a
// drill day: 22 questions per version (the +20% the parents asked
// for), with all the new headroom going into addition and LCM.

const versionA: Question[] = [
  // Math (12): 2 GCF refresh + 4 LCM + 6 fraction add
  gcfQ("a-gcf-1", 20, 25), // direct repeat of his Day 13 b-gcf-3 miss (he said 10)
  gcfQ("a-gcf-2", 24, 36),

  lcmQ("a-lcm-1", 4, 6),  // direct repeat of Day 13 a-lcm-1 miss (he said 24, expected 12)
  lcmQ("a-lcm-2", 5, 7),  // direct repeat of Day 13 a-lcm-3 miss (he said 34, expected 35)
  lcmQ("a-lcm-3", 10, 15), // direct repeat of Day 13 b-lcm-2 miss (he said 5 — confused with GCF)
  lcmQ("a-lcm-4", 6, 9),

  fracAddQ("a-add-1", [1, 5], [2, 5]),   // same denominator, easy
  fracAddQ("a-add-2", [1, 4], [2, 4]),   // same denominator
  fracAddQ("a-add-3", [1, 2], [1, 4]),   // direct repeat of Day 13 a-add-1 miss
  fracAddQ("a-add-4", [3, 7], [2, 7]),   // direct repeat of Day 13 a-add-2 miss
  fracAddQ("a-add-5", [1, 3], [1, 4]),   // direct repeat of Day 13 b-add-1 miss
  fracAddQ("a-add-6", [2, 5], [1, 5]),   // direct repeat of Day 13 b-add-2 miss

  // Periodic (4): rows 1-2 only — no new content while math is broken
  periodicQ("a-pt-1", "C", "P"),
  periodicQ("a-pt-2", "N", "N"),
  periodicQ("a-pt-3", "F", "e"),
  periodicQ("a-pt-4", "Be", "N"),

  // History (3): all from active list 1-8
  warQ("a-war-1", "americanRevolution"),
  warQ("a-war-2", "francoPrussian"),
  warQ("a-war-3", "wwi"),

  // Biology (3): active list (no new events today)
  evolutionQ("a-evo-1", "earthForms"),
  evolutionQ("a-evo-2", "cambrian"),
  evolutionQ("a-evo-3", "firstPlants"),
];

const versionB: Question[] = [
  // Math (12)
  gcfQ("b-gcf-1", 25, 20), // mirror
  gcfQ("b-gcf-2", 36, 24),

  lcmQ("b-lcm-1", 6, 4),
  lcmQ("b-lcm-2", 7, 5),
  lcmQ("b-lcm-3", 15, 10),
  lcmQ("b-lcm-4", 9, 6),

  fracAddQ("b-add-1", [2, 7], [3, 7]),   // same denominator
  fracAddQ("b-add-2", [1, 3], [1, 3]),   // same denominator (= 2/3)
  fracAddQ("b-add-3", [1, 2], [1, 3]),   // small LCM
  fracAddQ("b-add-4", [1, 4], [1, 6]),
  fracAddQ("b-add-5", [2, 3], [1, 4]),
  fracAddQ("b-add-6", [1, 5], [3, 10]),

  // Periodic (4)
  periodicQ("b-pt-1", "O", "P"),
  periodicQ("b-pt-2", "Li", "N"),
  periodicQ("b-pt-3", "Ne", "e"),
  periodicQ("b-pt-4", "B", "N"),

  // History (3)
  warQ("b-war-1", "warOf1812"),
  warQ("b-war-2", "americanCivil"),
  warQ("b-war-3", "spanishAmerican"),

  // Biology (3)
  evolutionQ("b-evo-1", "bigBang"),
  evolutionQ("b-evo-2", "firstLife"),
  evolutionQ("b-evo-3", "firstFish"),
];

export const day20260514: Day = {
  date: DATE,
  title: "Day 3 — Drill day: GCF, LCM, Adding fractions",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "GCF refresh (2 questions)",
    "LCM (4 questions, mixed)",
    "Adding fractions (6 questions — heavy practice)",
    "Periodic — rows 1 & 2 review",
    "Wars 1-8 review",
    "Evolution review",
  ],
  versionA,
  versionB,
};
