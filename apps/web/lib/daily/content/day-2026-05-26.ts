import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { fracAddQ } from "./banks/frac-add";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-26";

// Day 9 = Week 3, Day 1. NEW thread starts.
//
// Topic switch:
//   - Math new: multiplication table 2-10 + "break-it-down" warmup.
//   - Science new: valence electrons (rows 1-2 only today).
//   - History new: peace accords replace wars. Today's accords are
//     the three early ones (Westphalia, Treaty of Paris 1783, Vienna).
//   - Biology: light review.
// 20 questions, shorter day, more memory less notes.

const versionA: Question[] = [
  // Math (10): 7 times-table + 1 distributive warmup + 1 GCF + 1 frac-add keep-alive
  multQ("a-m-1", 7, 8),
  multQ("a-m-2", 6, 9),
  multQ("a-m-3", 4, 7),
  multQ("a-m-4", 8, 9),
  multQ("a-m-5", 9, 9),
  multQ("a-m-6", 6, 7),
  multQ("a-m-7", 8, 7),
  // Distributive warmup: 12 × 6 = (10 + 2) × 6 = 60 + 12 = 72
  multQ("a-m-8", 12, 6),
  gcfQ("a-rev-gcf", 12, 18),
  fracAddQ("a-rev-add", [1, 2], [1, 4]),

  // Science (3): valence rows 1-2 only
  periodicQ("a-pt-1", "Li", "v"), // 1
  periodicQ("a-pt-2", "O", "v"),  // 6
  periodicQ("a-pt-3", "Ne", "v"), // 8

  // History (4): early peace accords
  peaceQ("a-pc-1", "westphalia"),
  peaceQ("a-pc-2", "parisAmerican"),
  peaceQ("a-pc-3", "vienna"),
  peaceQ("a-pc-4", "westphalia"), // intentional repeat to anchor

  // Evolution (3): review the canonical big-three
  evolutionQ("a-evo-1", "bigBang"),
  evolutionQ("a-evo-2", "earthForms"),
  evolutionQ("a-evo-3", "firstLife"),
];

const versionB: Question[] = [
  multQ("b-m-1", 8, 7),
  multQ("b-m-2", 9, 6),
  multQ("b-m-3", 7, 4),
  multQ("b-m-4", 9, 8),
  multQ("b-m-5", 8, 8),
  multQ("b-m-6", 7, 6),
  multQ("b-m-7", 7, 9),
  multQ("b-m-8", 13, 5),
  gcfQ("b-rev-gcf", 14, 35),
  fracAddQ("b-rev-add", [1, 3], [1, 6]),

  periodicQ("b-pt-1", "Be", "v"), // 2
  periodicQ("b-pt-2", "N", "v"),  // 5
  periodicQ("b-pt-3", "F", "v"),  // 7

  peaceQ("b-pc-1", "parisAmerican"),
  peaceQ("b-pc-2", "vienna"),
  peaceQ("b-pc-3", "westphalia"),
  peaceQ("b-pc-4", "vienna"),

  evolutionQ("b-evo-1", "earthForms"),
  evolutionQ("b-evo-2", "bigBang"),
  evolutionQ("b-evo-3", "firstLife"),
];

export const day20260526: Day = {
  date: DATE,
  title: "Day 9 — Multiplication table + valence + first peace accords",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Times tables 2-9 (memorize)",
    "First distributive warmup (12 × 6)",
    "Valence rows 1-2",
    "Peace: Westphalia / Paris 1783 / Vienna",
    "Evolution: big-three review",
  ],
  versionA,
  versionB,
};
