import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { lcmQ } from "./banks/lcm";
import { periodicQ } from "./banks/periodic";
import { peaceQ } from "./banks/peace";
import { evolutionQ } from "./banks/evolution";

const DATE = "2026-06-12";

// Day 20 = LAST DAY. A victory lap, not a drill. Adam said he's sick of
// the same multiplication/fraction/valence grind every day, so today is
// the *cool* stuff: the deep-time timeline of the whole universe, the
// elements that make you and the stars, the treaties that drew the modern
// world — plus a few quick, satisfying numbers. No messy fractions, no
// rote valence counting. Both versions are fun (B isn't "harder" today),
// just different cool facts. 18 questions; short day (9:30-11:00).

const versionA: Question[] = [
  // A few quick wins
  multQ("a-m-1", 11, 11), // 121
  multQ("a-m-2", 12, 12), // 144
  gcfQ("a-gcf", 12, 18), // 6
  lcmQ("a-lcm", 3, 4), // 12

  // The timeline of everything (deep time — the "wow" scale)
  evolutionQ("a-e1", "bigBang"), // 13,800 mya
  evolutionQ("a-e2", "earthForms"), // 4,540 mya
  evolutionQ("a-e3", "firstLife"), // 3,700 mya
  evolutionQ("a-e4", "firstDinos"), // 230 mya
  evolutionQ("a-e5", "homoSapiens"), // 0.3 mya

  // The elements that make you and the stars
  periodicQ("a-s1", "H", "P"), // 1 — lightest thing there is
  periodicQ("a-s2", "He", "v"), // 2 — the noble gas in the Sun
  periodicQ("a-s3", "C", "P"), // 6 — the element of all life
  periodicQ("a-s4", "O", "v"), // 6 — what you breathe
  periodicQ("a-s5", "Ne", "v"), // 8 — neon lights

  // Treaties that drew the modern world
  peaceQ("a-pc1", "westphalia"), // 1648 — invented the nation-state
  peaceQ("a-pc2", "versailles"), // 1919 — the peace that started WWII
  peaceQ("a-pc3", "goodFriday"), // 1998 — ended the Troubles
  peaceQ("a-pc4", "abraham"), // 2020
];

const versionB: Question[] = [
  multQ("b-m-1", 9, 9), // 81
  multQ("b-m-2", 13, 13), // 169
  gcfQ("b-gcf", 16, 24), // 8
  lcmQ("b-lcm", 4, 6), // 12

  evolutionQ("b-e1", "cambrian"), // 540 mya — life explodes
  evolutionQ("b-e2", "firstFish"), // 520 mya
  evolutionQ("b-e3", "firstPlants"), // 470 mya
  evolutionQ("b-e4", "ktExtinction"), // 66 mya — the asteroid
  evolutionQ("b-e5", "firstHominids"), // 7 mya

  periodicQ("b-s1", "He", "P"), // 2
  periodicQ("b-s2", "C", "v"), // 4 — carbon makes 4 bonds
  periodicQ("b-s3", "N", "v"), // 5 — most of the air
  periodicQ("b-s4", "Ar", "v"), // 8 — noble, does nothing
  periodicQ("b-s5", "Na", "v"), // 1 — half of table salt

  peaceQ("b-pc1", "vienna"), // 1815
  peaceQ("b-pc2", "campDavid"), // 1978
  peaceQ("b-pc3", "osloI"), // 1993
  peaceQ("b-pc4", "dayton"), // 1995
];

export const day20260612: Day = {
  date: DATE,
  title: "Day 20 — Last day: the cool stuff (victory lap)",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "The timeline of everything (Big Bang to you)",
    "Elements that make you and the stars",
    "Treaties that drew the modern world",
    "A few quick, satisfying numbers",
    "No drills — a victory lap",
  ],
  versionA,
  versionB,
};
