import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { fracAddQ } from "./banks/frac-add";
import { fracMulQ } from "./banks/frac-mul";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-29";

// Day 12 = Week 3, Day 4 — last day of the trial (May 30 is Shabbat).
//
// Mixed-mental-math drill day. All operations covered this trial show
// up; the focus is fluency, not new content.
// Science: full valence review across rows 1-3.
// History: Abraham Accords + 21st-century review. The brief frames
// "peace deals that exclude the people most affected" as the lesson
// that ties Versailles, Oslo, and Abraham together.
// Biology: full timeline review.

const versionA: Question[] = [
  // Math (10) — mental-math mix
  multQ("a-m-1", 15, 15),
  multQ("a-m-2", 17, 12),
  multQ("a-m-3", 22, 13),
  multQ("a-m-4", 19, 16),
  multQ("a-m-5", 14, 14),
  multQ("a-m-6", 13, 17),
  multQ("a-m-7", 7, 9),
  multQ("a-m-8", 8, 8),
  gcfQ("a-rev-gcf", 24, 36),
  lcmQ("a-rev-lcm", 6, 9),

  // Science (3): valence mix across all 3 rows
  periodicQ("a-pt-1", "C", "v"),   // 4
  periodicQ("a-pt-2", "S", "v"),   // 6
  periodicQ("a-pt-3", "Ar", "v"),  // 8

  // History (4): Abraham + the through-line + review
  peaceQ("a-pc-1", "abraham"),
  peaceQ("a-pc-2", "osloI"),
  peaceQ("a-pc-3", "versailles"),
  peaceQ("a-pc-4", "westphalia"),

  // Evolution (3): the long arc
  evolutionQ("a-evo-1", "homoSapiens"),
  evolutionQ("a-evo-2", "firstHominids"),
  evolutionQ("a-evo-3", "bigBang"),
];

const versionB: Question[] = [
  multQ("b-m-1", 14, 15),
  multQ("b-m-2", 12, 17),
  multQ("b-m-3", 13, 22),
  multQ("b-m-4", 16, 19),
  multQ("b-m-5", 13, 13),
  multQ("b-m-6", 17, 13),
  multQ("b-m-7", 9, 7),
  multQ("b-m-8", 8, 9),
  fracAddQ("b-rev-add", [3, 4], [1, 8]),
  fracMulQ("b-rev-mul", [4, 5], [3, 8]),

  periodicQ("b-pt-1", "Si", "v"),  // 4
  periodicQ("b-pt-2", "O", "v"),   // 6
  periodicQ("b-pt-3", "Ne", "v"),  // 8

  peaceQ("b-pc-1", "abraham"),
  peaceQ("b-pc-2", "campDavid"),
  peaceQ("b-pc-3", "geneva"),
  peaceQ("b-pc-4", "parisAmerican"),

  evolutionQ("b-evo-1", "firstHominids"),
  evolutionQ("b-evo-2", "homoSapiens"),
  evolutionQ("b-evo-3", "earthForms"),
];

export const day20260529: Day = {
  date: DATE,
  title: "Day 12 — Mixed mental math + full valence + Abraham Accords",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Mental-math fluency (15 × 15, 17 × 12, 22 × 13, …)",
    "Valence across rows 1-3",
    "Peace: Abraham Accords + the 'who's at the table' thread",
    "Evolution: full-timeline review",
  ],
  versionA,
  versionB,
};
