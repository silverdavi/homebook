import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ } from "./banks/choice";

const DATE = "2026-10-23";
const HELP = `/daily/${DATE}`;

function integerQ(id: string, expression: string, answer: number): Question {
  return numericQ(
    id,
    `${expression} = ?`,
    answer,
    `${expression} = ${answer}.`,
    HELP,
  );
}

function temperatureQ(id: string, start: number, change: number): Question {
  const answer = start + change;
  const direction =
    change >= 0 ? `rises ${change}` : `falls ${Math.abs(change)}`;
  return numericQ(
    id,
    `The temperature starts at ${start}°F and ${direction} degrees. What is the new temperature?`,
    answer,
    `${start} ${change >= 0 ? "+" : "−"} ${Math.abs(change)} = ${answer}°F.`,
    HELP,
    { unit: "°F" },
  );
}

const versionA: Question[] = [
  integerQ("a-i1", "−3 + 8", 5),
  integerQ("a-i2", "5 − 12", -7),
  integerQ("a-i3", "−6 + 2", -4),
  integerQ("a-i4", "−4 − 7", -11),
  integerQ("a-i5", "9 + (−13)", -4),
  integerQ("a-i6", "−10 + 17", 7),
  integerQ("a-i7", "2 − 9", -7),
  integerQ("a-i8", "−12 + 5", -7),
  integerQ("a-i9", "−8 − 6", -14),
  temperatureQ("a-t1", -4, 9),
  temperatureQ("a-t2", 5, -7),
  temperatureQ("a-t3", -8, 3),
  choiceQ(
    "a-g1",
    "geography",
    "Ukraine is located in which region?",
    ["Eastern Europe", "Southern Africa", "Southeast Asia", "Central America"],
    0,
    "Ukraine is an Eastern European country on the Black Sea.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Sudan is located in which part of Africa?",
    [
      "Northeastern Africa",
      "Southern tip",
      "Atlantic islands",
      "Central rainforest only",
    ],
    0,
    "Sudan is in northeastern Africa, south of Egypt and west of the Red Sea.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Russia's full-scale invasion of Ukraine began in which year?",
    ["2014", "2022", "2025", "1991"],
    1,
    "Russia annexed Crimea and began intervention in 2014; the full-scale invasion began in February 2022.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Sudan's current war began in 2023 between which forces?",
    [
      "The Sudanese Armed Forces and Rapid Support Forces",
      "Ukraine and Russia",
      "India and Pakistan",
      "The UN and African Union",
    ],
    0,
    "The war pits the Sudanese Armed Forces against the paramilitary Rapid Support Forces.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What is a consistent humanitarian priority in every conflict?",
    [
      "Protect civilians and allow aid access",
      "Punish an entire population",
      "Attack hospitals",
      "Block food",
    ],
    0,
    "International humanitarian law requires civilian protection and humanitarian access.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Which practice improves understanding of a conflict?",
    [
      "Compare credible sources and distinguish civilians from governments",
      "Treat every social post as equal evidence",
      "Assume one flag explains everyone",
      "Ignore power differences",
    ],
    0,
    "Source comparison and careful distinctions reduce propaganda and stereotyping.",
    HELP,
  ),
];

const versionB: Question[] = [
  integerQ("b-i1", "−5 + 12", 7),
  integerQ("b-i2", "4 − 11", -7),
  integerQ("b-i3", "−7 + 3", -4),
  integerQ("b-i4", "−2 − 9", -11),
  integerQ("b-i5", "8 + (−14)", -6),
  integerQ("b-i6", "−11 + 19", 8),
  integerQ("b-i7", "3 − 10", -7),
  integerQ("b-i8", "−13 + 6", -7),
  integerQ("b-i9", "−9 − 5", -14),
  temperatureQ("b-t1", -6, 10),
  temperatureQ("b-t2", 7, -9),
  temperatureQ("b-t3", -9, 4),
  choiceQ(
    "b-g1",
    "geography",
    "Gaza lies along which sea?",
    ["Mediterranean Sea", "Caribbean Sea", "Baltic Sea", "South China Sea"],
    0,
    "Gaza is a narrow coastal territory on the eastern Mediterranean.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Myanmar is in which region?",
    ["Southeast Asia", "Western Europe", "Southern Africa", "North America"],
    0,
    "Myanmar lies in Southeast Asia between South and East Asia.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Why do colonial histories matter when studying current conflicts?",
    [
      "They shaped borders, institutions, inequalities, and political power",
      "They determine every event automatically",
      "They have no effect",
      "They only changed flags",
    ],
    0,
    "Colonial rule often reshaped territory, economies, and power relations that continue to matter.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Which statement best separates people from governments?",
    [
      "Civilians do not automatically share every action of a government or armed group",
      "Every citizen controls military policy",
      "A flag proves political agreement",
      "All people in a territory think alike",
    ],
    0,
    "Populations are diverse and must not be blamed collectively for leaders' or armed groups' actions.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "As of October 2026, which country has the world's largest hunger and displacement crisis?",
    ["Sudan", "Canada", "Japan", "Portugal"],
    0,
    "The UN describes Sudan as the world's largest hunger and displacement crisis.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "What was reducing food assistance in Gaza in October 2026?",
    [
      "Funding shortages",
      "Too much farmland",
      "A ban on bread worldwide",
      "No need for aid",
    ],
    0,
    "The World Food Programme reported that funding shortages forced major reductions in assistance.",
    HELP,
  ),
];

export const day20261023: Day = {
  date: DATE,
  title: "Day 36 — Integers on a number line",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Integers", "Current crises", "Reading power and sources"],
  versionA,
  versionB,
};
