import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracMulQ } from "./banks/frac-mul";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-09-29";

// Day 23 — four wars that were not the daily drill. No peace questions.

const versionA: Question[] = [
  warQ("a-w1", "mexicanAmerican"),
  warQ("a-w2", "spanishAmerican"),
  warQ("a-w3", "gulf"),
  warQ("a-w4", "iraq"),
  multQ("a-m1", 13, 14),
  multQ("a-m2", 16, 16),
  gcfQ("a-gcf", 18, 24),
  lcmQ("a-lcm", 8, 12),
  fracAddQ("a-fa", [2, 5], [1, 5]),
  fracMulQ("a-fm", [3, 5], [1, 2]),
  periodicQ("a-p1", "B", "P"),
  periodicQ("a-p2", "Al", "P"),
  periodicQ("a-p3", "Si", "P"),
  periodicQ("a-p4", "Be", "P"),
  evolutionQ("a-e1", "firstMammals"),
  evolutionQ("a-e2", "firstPlants"),
  evolutionQ("a-e3", "cambrian"),
  warQ("a-w5", "warOf1812"),
];

const versionB: Question[] = [
  warQ("b-w1", "francoPrussian"),
  warQ("b-w2", "russoJapanese"),
  warQ("b-w3", "russianCivil"),
  warQ("b-w4", "spanishCivil"),
  multQ("b-m1", 14, 14),
  multQ("b-m2", 15, 13),
  gcfQ("b-gcf", 15, 25),
  lcmQ("b-lcm", 6, 8),
  fracAddQ("b-fa", [1, 7], [2, 7]),
  fracMulQ("b-fm", [1, 3], [3, 4]),
  periodicQ("b-p1", "F", "P"),
  periodicQ("b-p2", "Mg", "P"),
  periodicQ("b-p3", "P", "P"),
  periodicQ("b-p4", "S", "P"),
  evolutionQ("b-e1", "firstFish"),
  evolutionQ("b-e2", "firstDinos"),
  evolutionQ("b-e3", "firstHominids"),
  warQ("b-w5", "vietnam"),
];

export const day20260929: Day = {
  date: DATE,
  title: "Day 23 — Four wars, no treaties",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Mexican-American, Spanish-American, Gulf, Iraq",
    "New multiplications",
    "No peace dates",
  ],
  versionA,
  versionB,
};
