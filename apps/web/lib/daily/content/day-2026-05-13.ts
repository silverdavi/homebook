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

const versionA: Question[] = [
  // Math: 8 questions = 2 GCF refresh + 3 LCM + 3 fraction add
  gcfQ("a-gcf-1", 14, 21),
  gcfQ("a-gcf-2", 18, 30),
  lcmQ("a-lcm-1", 4, 6),
  lcmQ("a-lcm-2", 6, 8),
  lcmQ("a-lcm-3", 5, 7),
  fracAddQ("a-add-1", [1, 2], [1, 4]),
  fracAddQ("a-add-2", [2, 3], [1, 6]),
  fracAddQ("a-add-3", [3, 7], [2, 7]),

  // Periodic: row 1 + row 2 (4 questions)
  periodicQ("a-pt-1", "C", "P"),
  periodicQ("a-pt-2", "O", "N"),
  periodicQ("a-pt-3", "Ne", "e"),
  periodicQ("a-pt-4", "F", "N"),

  // History: wars 5-8 (3 questions)
  warQ("a-war-1", "francoPrussian"),
  warQ("a-war-2", "wwi"),
  warQ("a-war-3", "russoJapanese"),

  // Biology: cambrian, fish, plants (3 questions)
  evolutionQ("a-evo-1", "cambrian"),
  evolutionQ("a-evo-2", "firstFish"),
  evolutionQ("a-evo-3", "firstPlants"),
];

const versionB: Question[] = [
  // Math
  gcfQ("b-gcf-1", 16, 28),
  gcfQ("b-gcf-2", 27, 36),
  lcmQ("b-lcm-1", 3, 4),
  lcmQ("b-lcm-2", 10, 15),
  lcmQ("b-lcm-3", 6, 9),
  fracAddQ("b-add-1", [1, 3], [1, 4]),
  fracAddQ("b-add-2", [3, 8], [1, 4]),
  fracAddQ("b-add-3", [2, 5], [1, 5]),

  // Periodic
  periodicQ("b-pt-1", "Li", "P"),
  periodicQ("b-pt-2", "B", "N"),
  periodicQ("b-pt-3", "N", "e"),
  periodicQ("b-pt-4", "Be", "N"),

  // History
  warQ("b-war-1", "spanishAmerican"),
  warQ("b-war-2", "wwi"),
  warQ("b-war-3", "francoPrussian"),

  // Biology
  evolutionQ("b-evo-1", "firstFish"),
  evolutionQ("b-evo-2", "cambrian"),
  evolutionQ("b-evo-3", "firstPlants"),
];

export const day20260513: Day = {
  date: DATE,
  title: "Day 2 — LCM, Adding Fractions, Rows 1-2, Wars 5-8",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "LCM (1-99)",
    "Adding fractions (n,d < 20)",
    "Periodic — rows 1 & 2",
    "Wars 5-8",
    "Cambrian / fish / land plants",
  ],
  versionA,
  versionB,
};
