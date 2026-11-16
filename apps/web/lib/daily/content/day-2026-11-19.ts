import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-19.json";

const DATE = "2026-11-19";
const HELP = `/daily/${DATE}`;
const r2 = (x: number) => Math.round(x * 100) / 100;

function circQ(id: string, r: number): Question {
  const answer = r2(2 * 3.14 * r);
  return numericQ(
    id,
    `A circle has a radius of ${r} cm. Using π ≈ 3.14, what is its circumference in cm?`,
    answer,
    `2 × 3.14 × ${r} = ${answer} cm.`,
    HELP,
    { unit: "cm", tolerance: 0.05 },
  );
}

function areaQ(id: string, r: number): Question {
  const answer = r2(3.14 * r * r);
  return numericQ(
    id,
    `A circle has a radius of ${r} cm. Using π ≈ 3.14, what is its area in cm²?`,
    answer,
    `${r} × ${r} = ${r * r}, then × 3.14 = ${answer} cm².`,
    HELP,
    { unit: "cm²", tolerance: 0.05 },
  );
}

function diamQ(id: string, d: number): Question {
  const answer = r2(3.14 * d);
  return numericQ(
    id,
    `A circle has a diameter of ${d} cm. Using π ≈ 3.14, what is its circumference in cm?`,
    answer,
    `3.14 × ${d} = ${answer} cm.`,
    HELP,
    { unit: "cm", tolerance: 0.05 },
  );
}

const versionA: Question[] = [
  ...generated.a.circ.map((r, i) => circQ(`a-c${i + 1}`, r)),
  ...generated.a.area.map((r, i) => areaQ(`a-a${i + 1}`, r)),
  ...generated.a.diam.map((d, i) => diamQ(`a-d${i + 1}`, d)),
  choiceQ(
    "a-g1",
    "geography",
    "The Battle of Gettysburg was fought in which state?",
    ["Pennsylvania", "Texas", "California", "Florida"],
    0,
    "In July 1863, the biggest battle of the Civil War: about 50,000 soldiers killed, wounded, or missing.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "In the Civil War, the states that broke away were mostly in…",
    ["The South", "The North", "The far West", "New England"],
    0,
    "11 Southern states formed the Confederacy to keep slavery.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What was the main cause of the US Civil War?",
    [
      "Slavery: Southern states broke away to keep it",
      "A fight over taxes on tea from Britain",
      "A war with Mexico over the border in Texas",
      "An argument over where to put the capital",
    ],
    0,
    "The Confederacy's own leaders said they seceded to protect slavery.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Lincoln gave the Gettysburg Address on…",
    ["November 19, 1863", "July 4, 1776", "December 7, 1941", "January 1, 1900"],
    0,
    "163 years ago today, at the dedication of a cemetery for the soldiers.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "The Gettysburg Address begins “Four score and seven years ago.” How many years is that?",
    ["87", "47", "74", "100"],
    0,
    "A score is 20: 4 × 20 + 7 = 87, back to 1776.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Circumference of a circle = ?",
    ["π × diameter", "π × radius × radius", "Radius + diameter", "Diameter ÷ π"],
    0,
    "Or 2 × π × radius, since the diameter is 2 radii.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.circ.map((r, i) => circQ(`b-c${i + 1}`, r)),
  ...generated.b.area.map((r, i) => areaQ(`b-a${i + 1}`, r)),
  ...generated.b.diam.map((d, i) => diamQ(`b-d${i + 1}`, d)),
  choiceQ(
    "b-g1",
    "geography",
    "Washington, D.C. was the capital of the Union. What was the Confederacy's capital?",
    ["Richmond, Virginia", "New York City", "Boston, Massachusetts", "Chicago, Illinois"],
    0,
    "Only about 100 miles from Washington.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "About how many soldiers were killed, wounded, or missing at Gettysburg?",
    ["About 50,000", "About 500", "About 5,000", "About 5 million"],
    0,
    "In three days, July 1–3, 1863.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What did the Emancipation Proclamation (1863) do?",
    [
      "Declared enslaved people in the rebelling states free",
      "Ended the Civil War with a peace treaty signed by both sides",
      "Gave women the right to vote in all federal elections",
      "Moved the capital of the country from New York to D.C.",
    ],
    0,
    "The 13th Amendment (1865) then ended slavery in the whole country.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "In the Gettysburg Address, Lincoln called for “government of the people, by the people, for the people.” He meant…",
    [
      "A democracy where ordinary people rule",
      "A kingdom where one family rules forever",
      "A country ruled by its strongest army",
      "A country run by its richest companies",
    ],
    0,
    "He said the war was a test of whether such a nation could survive.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "How long is the Gettysburg Address?",
    ["About 270 words, around 2 minutes", "About 2 hours, around 15,000 words", "About 50 pages, around an hour", "About 10,000 words, around 1 hour"],
    0,
    "The speaker before Lincoln talked for 2 hours. Lincoln's 2 minutes are the ones remembered.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Area of a circle = ?",
    ["π × radius × radius", "π × diameter", "2 × radius", "Radius × diameter"],
    0,
    "Radius 10: 3.14 × 10 × 10 = 314 cm².",
    HELP,
  ),
];

export const day20261119: Day = {
  date: DATE,
  title: "Day 50 — Circles: around and inside",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Circumference", "Area of circles", "The Gettysburg Address"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
