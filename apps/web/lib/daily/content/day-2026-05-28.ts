import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { fracAddQ } from "./banks/frac-add";
import { fracMulQ } from "./banks/frac-mul";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-05-28";

// Day 11 = Week 3, Day 3.
//
// Math: 13/14/15 times tables; first 2-digit × 2-digit breakdown
// problems (17 × 25 type).
// Science: bonding — pick two elements, count valences, predict the
// bond (we ask the valence count of one of the two; the brief
// explains the bond).
// History: 1970s–1990s peace — Camp David, Israel-Egypt, Oslo I, Good
// Friday. The two-state failure is the through-line.
// Biology: dinosaurs + KT review.

const versionA: Question[] = [
  // Math (10)
  multQ("a-m-1", 13, 13),
  multQ("a-m-2", 14, 14),
  multQ("a-m-3", 15, 15),
  multQ("a-m-4", 13, 11),
  // 2-digit × 2-digit breakdown
  multQ("a-m-5", 17, 25),    // = (10+7)(20+5) = 200+50+140+35 = 425
  multQ("a-m-6", 23, 14),    // 322
  multQ("a-m-7", 18, 17),    // 306
  multQ("a-m-8", 19, 19),    // 361
  fracAddQ("a-rev-add", [1, 4], [1, 6]),
  fracMulQ("a-rev-mul", [2, 3], [3, 5]),

  // Science (3): bonding-flavored valence
  periodicQ("a-pt-1", "C", "v"),   // 4 — carbon, makes 4 bonds
  periodicQ("a-pt-2", "O", "v"),   // 6 — needs 2 more
  periodicQ("a-pt-3", "Na", "v"),  // 1 — gives 1 to Cl

  // History (4): peace process era
  peaceQ("a-pc-1", "campDavid"),
  peaceQ("a-pc-2", "israelEgypt"),
  peaceQ("a-pc-3", "osloI"),
  peaceQ("a-pc-4", "goodFriday"),

  // Evolution (3): dinosaurs + KT
  evolutionQ("a-evo-1", "firstDinos"),
  evolutionQ("a-evo-2", "ktExtinction"),
  evolutionQ("a-evo-3", "firstMammals"),
];

const versionB: Question[] = [
  multQ("b-m-1", 14, 13),
  multQ("b-m-2", 15, 14),
  multQ("b-m-3", 15, 12),
  multQ("b-m-4", 13, 12),
  multQ("b-m-5", 21, 19),    // = (20+1)(20-1) → easier: 21×19 = 399
  multQ("b-m-6", 23, 13),    // 299
  multQ("b-m-7", 18, 16),    // 288
  multQ("b-m-8", 24, 15),    // 360
  fracAddQ("b-rev-add", [3, 4], [1, 8]),
  fracMulQ("b-rev-mul", [3, 4], [2, 9]),

  periodicQ("b-pt-1", "N", "v"),   // 5 — makes 3 bonds (NH3)
  periodicQ("b-pt-2", "Cl", "v"),  // 7 — takes 1 from Na
  periodicQ("b-pt-3", "Mg", "v"),  // 2 — gives 2 to O

  peaceQ("b-pc-1", "israelEgypt"),
  peaceQ("b-pc-2", "campDavid"),
  peaceQ("b-pc-3", "osloI"),
  peaceQ("b-pc-4", "dayton"),

  evolutionQ("b-evo-1", "ktExtinction"),
  evolutionQ("b-evo-2", "firstDinos"),
  evolutionQ("b-evo-3", "firstMammals"),
];

export const day20260528: Day = {
  date: DATE,
  title: "Day 11 — 13/14/15 tables + 2-digit × 2-digit + Oslo era",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "13, 14, 15 times tables",
    "(a + b)(c + d) breakdown for 17 × 25 etc.",
    "Valence → bonding intuition",
    "Peace: Camp David / Oslo / Good Friday",
    "Dinosaurs + KT",
  ],
  versionA,
  versionB,
};
