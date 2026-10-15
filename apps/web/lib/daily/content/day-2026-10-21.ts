import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";

const DATE = "2026-10-21";
const HELP = `/daily/${DATE}`;

function densityQ(id: string, mass: number, volume: number): Question {
  const answer = mass / volume;
  return numericQ(id, `Mass is ${mass} g and volume is ${volume} cm³. What is density?`, answer, `${mass} ÷ ${volume} = ${answer} g/cm³.`, HELP, { unit: "g/cm³" });
}

function massQ(id: string, density: number, volume: number): Question {
  const answer = density * volume;
  return numericQ(id, `Density is ${density} g/cm³ and volume is ${volume} cm³. What is mass?`, answer, `${density} × ${volume} = ${answer} g.`, HELP, { unit: "g" });
}

function volumeQ(id: string, mass: number, density: number): Question {
  const answer = mass / density;
  return numericQ(id, `Mass is ${mass} g and density is ${density} g/cm³. What is volume?`, answer, `${mass} ÷ ${density} = ${answer} cm³.`, HELP, { unit: "cm³" });
}

const versionA: Question[] = [
  densityQ("a-d1", 60, 20),
  densityQ("a-d2", 48, 12),
  densityQ("a-d3", 35, 5),
  densityQ("a-d4", 81, 9),
  densityQ("a-d5", 22, 4),
  densityQ("a-d6", 75, 30),
  massQ("a-m1", 4, 6),
  massQ("a-m2", 3, 15),
  massQ("a-m3", 2.5, 8),
  massQ("a-m4", 7, 9),
  massQ("a-m5", 1.5, 12),
  massQ("a-m6", 6, 11),
  volumeQ("a-v1", 45, 5),
  volumeQ("a-v2", 72, 8),
  volumeQ("a-v3", 30, 2.5),
  volumeQ("a-v4", 54, 6),
  volumeQ("a-v5", 42, 3.5),
  volumeQ("a-v6", 96, 12),
];

const versionB: Question[] = [
  densityQ("b-d1", 80, 20),
  densityQ("b-d2", 54, 9),
  densityQ("b-d3", 42, 6),
  densityQ("b-d4", 63, 7),
  densityQ("b-d5", 27, 4),
  densityQ("b-d6", 84, 24),
  massQ("b-m1", 5, 7),
  massQ("b-m2", 4, 13),
  massQ("b-m3", 3.5, 8),
  massQ("b-m4", 6, 9),
  massQ("b-m5", 2.5, 12),
  massQ("b-m6", 8, 11),
  volumeQ("b-v1", 56, 7),
  volumeQ("b-v2", 90, 10),
  volumeQ("b-v3", 36, 3),
  volumeQ("b-v4", 65, 5),
  volumeQ("b-v5", 48, 4),
  volumeQ("b-v6", 99, 9),
];

export const day20261021: Day = {
  date: DATE,
  title: "Day 34 — Density packs matter",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Density = mass ÷ volume", "Mass = density × volume", "Units matter"],
  versionA,
  versionB,
};
