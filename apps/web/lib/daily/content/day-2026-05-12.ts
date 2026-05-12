import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { gcfQ } from "./banks/gcf";
import { periodicQ } from "./banks/periodic";
import { warQ } from "./banks/wars";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-12";

const versionA: Question[] = [
  // Math: GCF (8 questions)
  gcfQ("a-gcf-1", 12, 18),
  gcfQ("a-gcf-2", 8, 20),
  gcfQ("a-gcf-3", 9, 16),
  gcfQ("a-gcf-4", 24, 36),
  gcfQ("a-gcf-5", 7, 21),
  gcfQ("a-gcf-6", 15, 25),
  gcfQ("a-gcf-7", 48, 18),
  gcfQ("a-gcf-8", 14, 35),

  // Periodic: H, He (4 questions, P/N/e mix)
  periodicQ("a-pt-1", "H", "P"),
  periodicQ("a-pt-2", "H", "N"),
  periodicQ("a-pt-3", "He", "P"),
  periodicQ("a-pt-4", "He", "N"),

  // History: wars 1-4 (3 questions)
  warQ("a-war-1", "americanRevolution"),
  warQ("a-war-2", "mexicanAmerican"),
  warQ("a-war-3", "americanCivil"),

  // Biology: 3 events (3 questions)
  evolutionQ("a-evo-1", "bigBang"),
  evolutionQ("a-evo-2", "earthForms"),
  evolutionQ("a-evo-3", "firstLife"),
];

const versionB: Question[] = [
  // Math: GCF
  gcfQ("b-gcf-1", 16, 24),
  gcfQ("b-gcf-2", 10, 25),
  gcfQ("b-gcf-3", 11, 13),
  gcfQ("b-gcf-4", 30, 45),
  gcfQ("b-gcf-5", 6, 9),
  gcfQ("b-gcf-6", 18, 27),
  gcfQ("b-gcf-7", 32, 24),
  gcfQ("b-gcf-8", 21, 28),

  // Periodic
  periodicQ("b-pt-1", "He", "e"),
  periodicQ("b-pt-2", "H", "e"),
  periodicQ("b-pt-3", "H", "P"),
  periodicQ("b-pt-4", "He", "N"),

  // History
  warQ("b-war-1", "warOf1812"),
  warQ("b-war-2", "americanCivil"),
  warQ("b-war-3", "americanRevolution"),

  // Biology
  evolutionQ("b-evo-1", "earthForms"),
  evolutionQ("b-evo-2", "firstLife"),
  evolutionQ("b-evo-3", "bigBang"),
];

export const day20260512: Day = {
  date: DATE,
  title: "Day 1 — GCF, H/He, Wars 1-4, Early Evolution",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "GCF (1-99)",
    "Periodic table — H, He",
    "Wars 1-4",
    "Early evolution (3 events)",
  ],
  versionA,
  versionB,
};
