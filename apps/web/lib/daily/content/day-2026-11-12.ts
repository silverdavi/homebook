import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-12.json";

const DATE = "2026-11-12";
const HELP = `/daily/${DATE}`;

export function plainQ(id: string, a: number, b: number, c: number): Question {
  const answer = a + b * c;
  return numericQ(
    id,
    `Work out ${a} + ${b} × ${c}.`,
    answer,
    `Multiply first: ${b} × ${c} = ${b * c}. Then ${a} + ${b * c} = ${answer}.`,
    HELP,
  );
}

export function bracketsQ(
  id: string,
  a: number,
  b: number,
  c: number,
): Question {
  const answer = (a + b) * c;
  return numericQ(
    id,
    `Work out (${a} + ${b}) × ${c}.`,
    answer,
    `Brackets first: ${a} + ${b} = ${a + b}. Then ${a + b} × ${c} = ${answer}.`,
    HELP,
  );
}

export function mixedQ(
  id: string,
  a: number,
  b: number,
  c: number,
  d: number,
): Question {
  const answer = a * b - c / d;
  return numericQ(
    id,
    `Work out ${a} × ${b} − ${c} ÷ ${d}.`,
    answer,
    `${a} × ${b} = ${a * b} and ${c} ÷ ${d} = ${c / d}. Then ${a * b} − ${c / d} = ${answer}.`,
    HELP,
  );
}

const versionA: Question[] = [
  ...generated.a.plain.map(([a, b, c], i) => plainQ(`a-p${i + 1}`, a, b, c)),
  ...generated.a.brackets.map(([a, b, c], i) =>
    bracketsQ(`a-b${i + 1}`, a, b, c),
  ),
  ...generated.a.mixed.map(([a, b, c, d], i) =>
    mixedQ(`a-m${i + 1}`, a, b, c, d),
  ),
  choiceQ(
    "a-g1",
    "geography",
    "World War I began after an archduke was shot in which city?",
    ["Sarajevo", "Paris", "London", "Madrid"],
    0,
    "Archduke Franz Ferdinand of Austria-Hungary was shot there in June 1914.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Most of the fighting on the Western Front was in…",
    [
      "Trenches across Belgium and France",
      "Jungles across Brazil and Peru",
      "Deserts across Egypt and Libya",
      "Mountains across Nepal and Tibet",
    ],
    0,
    "The lines barely moved for years; a few kilometers could cost hundreds of thousands of lives.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Why is Veterans Day on November 11?",
    [
      "World War I fighting stopped at 11 a.m. on November 11, 1918",
      "George Washington was born on November 11 in Virginia",
      "World War II began on November 11 with an attack on Poland",
      "The US Army was founded on November 11 by Abraham Lincoln",
    ],
    0,
    "“The eleventh hour of the eleventh day of the eleventh month.” It was renamed Veterans Day in 1954.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Which empires collapsed because of World War I?",
    [
      "The Ottoman, Austro-Hungarian, Russian, and German",
      "The British, French, Italian, and Japanese",
      "The Spanish, Dutch, Portuguese, and Danish",
      "The Mongol, Mughal, Ming, and Mali",
    ],
    0,
    "New countries appeared across Europe and the Middle East, many with borders drawn by Britain and France.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "Why do people wear red poppies in November?",
    [
      "To remember soldiers who died, after the poem “In Flanders Fields”",
      "To celebrate the start of the winter holiday season with friends",
      "To show which sports team they support in the November finals",
      "To mark the end of the harvest season on farms in the fall",
    ],
    0,
    "Poppies grew on the battlefields of Flanders, in Belgium.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "In 5 + 2 × 3, what do you do first?",
    ["Multiply", "Add", "Work left to right", "Either way, it's the same"],
    0,
    "2 × 3 = 6, then 5 + 6 = 11. Left to right would give 21, which is wrong.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.plain.map(([a, b, c], i) => plainQ(`b-p${i + 1}`, a, b, c)),
  ...generated.b.brackets.map(([a, b, c], i) =>
    bracketsQ(`b-b${i + 1}`, a, b, c),
  ),
  ...generated.b.mixed.map(([a, b, c, d], i) =>
    mixedQ(`b-m${i + 1}`, a, b, c, d),
  ),
  choiceQ(
    "b-g1",
    "geography",
    "In World War I, over a million soldiers came from which British colony?",
    ["India", "Iceland", "Japan", "Argentina"],
    0,
    "Soldiers from India, Africa, and the Caribbean fought for empires that ruled them.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Where are the poppy fields of “In Flanders Fields”?",
    ["Belgium", "Mexico", "Japan", "Australia"],
    0,
    "A Canadian doctor, John McCrae, wrote the poem there in 1915.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "When did World War I take place?",
    ["1914–1918", "1861–1865", "1939–1945", "1950–1953"],
    0,
    "About 20 million people died, soldiers and civilians.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "What was the League of Nations?",
    [
      "A group of countries formed after WWI to try to prevent another war",
      "A sports league in which national teams played for a world cup",
      "An army that the winners of WWI sent to rule over Germany",
      "A company that rebuilt the cities that were destroyed in WWI",
    ],
    0,
    "It failed to stop World War II, but the United Nations was built on its idea in 1945.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "Who is honored on Veterans Day?",
    [
      "Everyone who has served in the military",
      "Only soldiers who died in World War I",
      "Only generals and admirals",
      "Only presidents of the US",
    ],
    0,
    "Memorial Day, in May, honors those who died; Veterans Day honors all who served.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "In (5 + 2) × 3, what do you do first?",
    [
      "Add, inside the brackets",
      "Multiply",
      "Work right to left",
      "Either way, it's the same",
    ],
    0,
    "Brackets first: 5 + 2 = 7, then 7 × 3 = 21.",
    HELP,
  ),
];

export const day20261112: Day = {
  date: DATE,
  title: "Day 46 — Order of operations",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Order of operations", "World War I", "Veterans Day"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
