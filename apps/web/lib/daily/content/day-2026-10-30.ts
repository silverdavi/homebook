import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ, shuffleChoices } from "./banks/choice";

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
  meanQ("a-a1", [4, 6, 8]),
  meanQ("a-a2", [10, 20, 30]),
  meanQ("a-a3", [3, 7, 8, 10, 12]),
  meanQ("a-a4", [12, 15, 18, 11]),
  meanQ("a-a5", [2, 9, 4, 8, 7]),
  meanQ("a-a6", [20, 25, 30, 45]),
  medianQ("a-d1", [3, 9, 5]),
  medianQ("a-d2", [8, 2, 6, 4, 10]),
  medianQ("a-d3", [15, 11, 13]),
  medianQ("a-d4", [7, 1, 9, 3, 5]),
  medianQ("a-d5", [21, 14, 30, 18, 25]),
  medianQ("a-d6", [6, 40, 9, 12, 7]),
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
      "The median is always the bigger number",
      "The mean is impossible to calculate",
      "The median counts only rich people",
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
  meanQ("b-a1", [3, 5, 7]),
  meanQ("b-a2", [20, 30, 40]),
  meanQ("b-a3", [2, 6, 9, 11, 12]),
  meanQ("b-a4", [10, 14, 16, 12]),
  meanQ("b-a5", [5, 8, 3, 9, 10]),
  meanQ("b-a6", [15, 25, 35, 45]),
  medianQ("b-d1", [4, 10, 6]),
  medianQ("b-d2", [9, 3, 7, 5, 11]),
  medianQ("b-d3", [16, 12, 14]),
  medianQ("b-d4", [8, 2, 10, 4, 6]),
  medianQ("b-d5", [22, 15, 31, 19, 26]),
  medianQ("b-d6", [5, 50, 8, 11, 6]),
  choiceQ(
    "b-g1",
    "geography",
    "Kinshasa, one of Africa's largest cities, is the capital of which country?",
    ["The Democratic Republic of the Congo", "Nigeria", "Ghana", "Ethiopia"],
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
  versionA: shuffleChoices(versionA, DATE, { balanced: true }),
  versionB: shuffleChoices(versionB, DATE, { balanced: true }),
};
