import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-13";

// Day 13 composition is shaped by Adam's Day 12 result (10/18).
// - GCF refresh expands from 2 → 3 questions, repeating the exact
//   failure modes from yesterday: (24,18), (14,35), (15,25). The kid
//   sees them again and gets a real chance to convert.
// - Fraction-add drops to 2 questions to make room.
// - History keeps 3 questions but pulls 1 from yesterday's wars 1-4
//   (which he answered blank) and 2 from today's wars 5-8.

const versionA: Question[] = [
  // Math (8): 3 GCF refresh + 3 LCM + 2 fraction-add
  gcfQ("a-gcf-1", 24, 18), // exact repeat of Day 12 a-gcf-7 (he said 11; expected 6)
  gcfQ("a-gcf-2", 14, 35), // exact repeat of Day 12 a-gcf-8 (he said 1; expected 7)
  gcfQ("a-gcf-3", 15, 25), // cousin of Day 12 a-gcf-6 — same failure family (he said 15; expected 5)
  lcmQ("a-lcm-1", 4, 6),
  lcmQ("a-lcm-2", 6, 8),
  lcmQ("a-lcm-3", 5, 7),
  fracAddQ("a-add-1", [1, 2], [1, 4]),
  fracAddQ("a-add-2", [3, 7], [2, 7]),

  // Periodic (4): row 1 + row 2
  periodicQ("a-pt-1", "C", "P"),
  periodicQ("a-pt-2", "O", "N"),
  periodicQ("a-pt-3", "Ne", "e"),
  periodicQ("a-pt-4", "F", "N"),

  // History (3): 1 from wars 1-4 (the one he never saw on Day 12) + 2 from 5-8
  warQ("a-war-1", "warOf1812"),
  warQ("a-war-2", "francoPrussian"),
  warQ("a-war-3", "wwi"),

  // Biology (3): cambrian, fish, plants
  evolutionQ("a-evo-1", "cambrian"),
  evolutionQ("a-evo-2", "firstFish"),
  evolutionQ("a-evo-3", "firstPlants"),
];

const versionB: Question[] = [
  // Math (8): 3 GCF refresh + 3 LCM + 2 fraction-add
  gcfQ("b-gcf-1", 18, 24), // mirror of A's (24,18)
  gcfQ("b-gcf-2", 21, 14), // cousin of (14,35), GCF=7
  gcfQ("b-gcf-3", 20, 25), // cousin of (15,25), GCF=5
  lcmQ("b-lcm-1", 3, 4),
  lcmQ("b-lcm-2", 10, 15),
  lcmQ("b-lcm-3", 6, 9),
  fracAddQ("b-add-1", [1, 3], [1, 4]),
  fracAddQ("b-add-2", [2, 5], [1, 5]),

  // Periodic (4)
  periodicQ("b-pt-1", "Li", "P"),
  periodicQ("b-pt-2", "B", "N"),
  periodicQ("b-pt-3", "N", "e"),
  periodicQ("b-pt-4", "Be", "N"),

  // History (3): 1 from wars 1-4 (he had it blank yesterday) + 2 from 5-8
  warQ("b-war-1", "americanCivil"),
  warQ("b-war-2", "spanishAmerican"),
  warQ("b-war-3", "russoJapanese"),

  // Biology (3)
  evolutionQ("b-evo-1", "firstFish"),
  evolutionQ("b-evo-2", "cambrian"),
  evolutionQ("b-evo-3", "firstPlants"),
];

export const day20260513: Day = {
  date: DATE,
  title: "Day 2 — GCF rescue, LCM, Fraction Add, Wars 1-8",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "GCF refresh (Euclid's algorithm)",
    "LCM (1-99)",
    "Adding fractions",
    "Periodic — rows 1 & 2",
    "Wars 1-8 (1 from yesterday, 2 new)",
    "Cambrian / fish / land plants",
  ],
  versionA,
  versionB,
};
