import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ, shuffleChoices } from "./banks/choice";

const DATE = "2026-10-22";
const HELP = `/daily/${DATE}`;

function densityQ(id: string, mass: number, volume: number): Question {
  const answer = mass / volume;
  return numericQ(
    id,
    `Mass is ${mass} g and volume is ${volume} cm³. What is density?`,
    answer,
    `${mass} ÷ ${volume} = ${answer} g/cm³.`,
    HELP,
    { unit: "g/cm³" },
  );
}

function massQ(id: string, density: number, volume: number): Question {
  const answer = density * volume;
  return numericQ(
    id,
    `Density is ${density} g/cm³ and volume is ${volume} cm³. What is mass?`,
    answer,
    `${density} × ${volume} = ${answer} g.`,
    HELP,
    { unit: "g" },
  );
}

const versionA: Question[] = [
  densityQ("a-d1", 24, 6),
  densityQ("a-d2", 30, 10),
  densityQ("a-d3", 42, 7),
  densityQ("a-d4", 48, 12),
  densityQ("a-d5", 35, 5),
  densityQ("a-d6", 60, 20),
  massQ("a-m1", 4, 5),
  massQ("a-m2", 3, 8),
  massQ("a-m3", 6, 7),
  massQ("a-m4", 5, 9),
  massQ("a-m5", 2, 12),
  massQ("a-m6", 7, 6),
  choiceQ(
    "a-g1",
    "geography",
    "Which colors form Ukraine's flag?",
    [
      "Blue over yellow",
      "Red circle on white",
      "Green and gold",
      "Black and orange",
    ],
    0,
    "Ukraine's flag is blue over yellow, often associated with sky and wheat fields.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Which description matches the Palestinian flag?",
    [
      "Black, white, and green stripes with a red triangle",
      "Blue cross on white",
      "Red maple leaf",
      "Yellow stars on blue",
    ],
    0,
    "The Palestinian flag has black, white, and green horizontal stripes with a red triangle at the hoist.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Which forces have changed borders over time?",
    [
      "Empire, colonization, war, and negotiation",
      "Only weather",
      "Only elections",
      "Borders never change",
    ],
    0,
    "Borders are historical political arrangements, often shaped by unequal power.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Why is migration part of history?",
    [
      "People move for family, work, safety, climate, and many other reasons",
      "Nobody moved before airplanes",
      "Only governments migrate",
      "Migration has one cause",
    ],
    0,
    "Human movement has always shaped languages, economies, families, and political communities.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "A refugee is a person who has done what?",
    [
      "Crossed a border after being forced to flee persecution, war, or violence",
      "Taken any vacation",
      "Changed schools",
      "Bought a passport",
    ],
    0,
    "Refugees cross borders because serious danger forces them from home.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "What does an asylum seeker request?",
    [
      "Legal protection in another country",
      "A weather forecast",
      "A new flag design",
      "A trade discount",
    ],
    0,
    "An asylum seeker asks a country to recognize a need for protection.",
    HELP,
  ),
];

const versionB: Question[] = [
  densityQ("b-d1", 25, 5),
  densityQ("b-d2", 36, 9),
  densityQ("b-d3", 56, 8),
  densityQ("b-d4", 54, 6),
  densityQ("b-d5", 45, 15),
  densityQ("b-d6", 72, 12),
  massQ("b-m1", 5, 4),
  massQ("b-m2", 4, 7),
  massQ("b-m3", 7, 8),
  massQ("b-m4", 6, 9),
  massQ("b-m5", 3, 12),
  massQ("b-m6", 8, 6),
  choiceQ(
    "b-g1",
    "geography",
    "Which symbol is centered on Israel's flag?",
    ["A Star of David", "A maple leaf", "A red sun", "A crescent moon"],
    0,
    "Israel's blue-and-white flag centers a Star of David.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Which feature appears on South Africa's flag?",
    [
      "A sideways green Y",
      "One red circle",
      "One blue star",
      "A black maple leaf",
    ],
    0,
    "South Africa's multicolor flag has a distinctive sideways green Y.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Which statement about borders is accurate?",
    [
      "They may divide communities that existed before the border",
      "They are always mountains",
      "They never move",
      "They contain only one culture",
    ],
    0,
    "Colonial and other political borders have often cut across older communities and movement routes.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Why should migration history include migrants' own accounts?",
    [
      "They describe lived experience that official records may omit",
      "Governments never keep records",
      "Only migrants know geography",
      "Personal accounts replace all evidence",
    ],
    0,
    "History is stronger when official sources are read alongside the experiences of affected people.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What is a nation?",
    [
      "A community connected by identity, culture, language, or history",
      "Any line on a weather map",
      "Only a government building",
      "A unit of temperature",
    ],
    0,
    "A nation is a human community; it may or may not have a state of its own.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "What is a state in political geography?",
    [
      "A territory with a government and political authority",
      "A biome",
      "A language family only",
      "A type of flag",
    ],
    0,
    "A state is a political organization governing a territory and population.",
    HELP,
  ),
];

export const day20261022: Day = {
  date: DATE,
  title: "Day 35 — Density, one rule at a time",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Density", "Flags and borders", "Migration"],
  versionA: shuffleChoices(versionA, DATE),
  versionB: shuffleChoices(versionB, DATE),
};
