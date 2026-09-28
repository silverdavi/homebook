import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { multQ } from "./banks/mult";
import { gcfQ } from "./banks/gcf";
import { periodicQ } from "./banks/periodic";
import { evolutionQ } from "./banks/evolution";
import { fracAddQ } from "./banks/frac-add";
import { fracMulQ } from "./banks/frac-mul";

const DATE = "2026-10-01";

// Day 25 — neutrons vs protons. No peace, no valence as the point.

const versionA: Question[] = [
  periodicQ("a-p1", "Be", "P"),
  periodicQ("a-p2", "Be", "N"),
  periodicQ("a-p3", "F", "P"),
  periodicQ("a-p4", "F", "N"),
  periodicQ("a-p5", "Mg", "P"),
  periodicQ("a-p6", "Mg", "N"),
  periodicQ("a-p7", "Ar", "P"),
  periodicQ("a-p8", "Ar", "N"),
  periodicQ("a-p9", "C", "N"),
  periodicQ("a-p10", "Li", "N"),
  evolutionQ("a-e1", "firstLife"),
  evolutionQ("a-e2", "homoSapiens"),
  multQ("a-m1", 24, 6),
  multQ("a-m2", 13, 13),
  gcfQ("a-gcf", 14, 21),
  fracAddQ("a-fa", [1, 5], [2, 5]),
  fracMulQ("a-fm", [2, 7], [7, 8]),
  periodicQ("a-p11", "B", "N"),
];

const versionB: Question[] = [
  periodicQ("b-p1", "Li", "P"),
  periodicQ("b-p2", "Li", "N"),
  periodicQ("b-p3", "B", "P"),
  periodicQ("b-p4", "N", "N"),
  periodicQ("b-p5", "Al", "P"),
  periodicQ("b-p6", "Al", "N"),
  periodicQ("b-p7", "Si", "N"),
  periodicQ("b-p8", "S", "N"),
  periodicQ("b-p9", "Ne", "P"),
  periodicQ("b-p10", "Ne", "N"),
  evolutionQ("b-e1", "bigBang"),
  evolutionQ("b-e2", "earthForms"),
  multQ("b-m1", 25, 8),
  multQ("b-m2", 17, 6),
  gcfQ("b-gcf", 18, 30),
  fracAddQ("b-fa", [3, 8], [1, 8]),
  fracMulQ("b-fm", [4, 9], [3, 4]),
  periodicQ("b-p11", "He", "N"),
];

export const day20261001: Day = {
  date: DATE,
  title: "Day 25 — Neutrons",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Protons name the element",
    "Neutrons are the extra weight",
    "No treaties, no valence drill",
  ],
  versionA,
  versionB,
};
