import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-10-30.json";

const DATE = "2026-10-30";
const HELP = `/daily/${DATE}`;
function meanQ(id: string, nums: number[]): Question {
  const total = nums.reduce((a, b) => a + b, 0);
  return numericQ(
    id,
    `What is the mean of ${nums.join(", ")}?`,
    total / nums.length,
    `${nums.join(" + ")} = ${total}; ${total} ÷ ${nums.length} = ${total / nums.length}.`,
    HELP,
  );
}

function medianQ(id: string, nums: number[]): Question {
  const sorted = [...nums].sort((a, b) => a - b);
  const middle = sorted[(sorted.length - 1) / 2];
  return numericQ(
    id,
    `What is the median of ${nums.join(", ")}?`,
    middle,
    `In order: ${sorted.join(", ")}. The middle number is ${middle}.`,
    HELP,
  );
}

const versionA: Question[] = [
  ...generated.a.mean.map((nums, i) => meanQ(`a-a${i + 1}`, nums)),
  ...generated.a.median.map((nums, i) => medianQ(`a-d${i + 1}`, nums)),
  choiceQ(
    "a-g1",
    "geography",
    "Which country has had the largest population since 2023?",
    ["India", "China", "The United States", "Indonesia"],
    0,
    "India passed China in 2023; each has over 1.4 billion people.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Lagos, one of Africa's largest and fastest-growing cities, is in which country?",
    ["Nigeria", "Kenya", "Egypt", "South Africa"],
    0,
    "Lagos is Nigeria's biggest city and a center of music, film, and business.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Where did the Industrial Revolution begin, around 1760?",
    ["Britain", "China", "Brazil", "Japan"],
    0,
    "Steam engines and textile factories spread from Britain to Europe, North America, and beyond.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "What did the 1911 Triangle Shirtwaist Factory fire in New York lead to?",
    [
      "New workplace safety laws",
      "The end of all factories",
      "Lower wages for workers",
      "The first skyscraper",
    ],
    0,
    "146 garment workers, mostly young immigrant women, died behind locked doors. Unions pushed for new safety laws.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "Why do economists often report median income instead of mean income?",
    [
      "A few very rich people pull the mean up, so the median shows a typical person better",
      "The median is always bigger, so incomes look better in the news",
      "The mean is too hard to calculate when there are millions of people",
      "The median leaves out the poorest people, so it is fairer to count",
    ],
    0,
    "The median is the middle person, so a billionaire cannot drag it up.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "About what share of the world's people live in cities today?",
    ["More than half", "About a tenth", "About a quarter", "Almost everyone"],
    0,
    "Cities passed half of humanity around 2007.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.mean.map((nums, i) => meanQ(`b-a${i + 1}`, nums)),
  ...generated.b.median.map((nums, i) => medianQ(`b-d${i + 1}`, nums)),
  choiceQ(
    "b-g1",
    "geography",
    "Kinshasa, one of Africa's largest cities, is the capital of which country?",
    ["The Democratic Republic of the Congo", "The Federal Republic of Nigeria", "The Republic of Ghana", "The Federal Republic of Ethiopia"],
    0,
    "Kinshasa sits on the Congo River, across from Brazzaville.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Which country had the largest population until India passed it in 2023?",
    ["China", "The United States", "Russia", "Brazil"],
    0,
    "China held the top spot for centuries.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What did labor unions win for many workers in the late 1800s and 1900s?",
    [
      "The 8-hour day and the weekend",
      "Longer shifts for children",
      "The end of all wages",
      "Twelve-hour Sundays",
    ],
    0,
    "Strikes and organizing won shorter hours, weekends, and limits on child labor.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Why did millions move to cities during the Industrial Revolution?",
    [
      "To find work in new factories",
      "Because farming was banned",
      "Because cities had no rules",
      "To escape the ocean",
    ],
    0,
    "New factories needed workers, and farm work was disappearing.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "World population passed which milestone in November 2022?",
    ["8 billion", "1 billion", "3 billion", "20 billion"],
    0,
    "The UN marked the day the world reached 8 billion people.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Four people earn $40,000 and one earns $10,000,000. Which number better shows a typical income?",
    ["The median", "The mean", "The largest income", "The total"],
    0,
    "The median is $40,000. The mean is over $2 million, which describes nobody there.",
    HELP,
  ),
];

export const day20261030: Day = {
  date: DATE,
  title: "Day 39 — Mean and median: two kinds of average",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Mean and median", "Cities and population", "Workers' rights"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
