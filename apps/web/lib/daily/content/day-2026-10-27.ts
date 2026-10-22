import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ, shuffleChoices } from "./banks/choice";

const DATE = "2026-10-27";
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
    "Which is the longest river in Africa?",
    ["The Nile", "The Congo", "The Niger", "The Zambezi"],
    0,
    "The Nile flows about 6,650 km north to the Mediterranean.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Which river carries the most water in the world?",
    ["The Amazon", "The Nile", "The Mississippi", "The Yangtze"],
    0,
    "The Amazon carries about a fifth of all river water that reaches the oceans. The Nile is longer, but carries far less.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What happened to the Aral Sea after Soviet planners diverted its rivers to grow cotton?",
    [
      "It shrank to about a tenth of its size",
      "It flooded nearby cities",
      "It stayed the same size",
      "It became the world's largest lake",
    ],
    0,
    "Starting in the 1960s, river water went to cotton fields, and most of the sea dried up.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "In 2014, which US city's tap water was contaminated with lead after officials switched water sources to save money?",
    [
      "Flint, Michigan",
      "Detroit, Michigan",
      "Chicago, Illinois",
      "Cleveland, Ohio",
    ],
    0,
    "In Flint, a majority-Black city, the new water corroded old pipes and released lead.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What powers the water cycle?",
    [
      "Heat from the sun evaporating water",
      "The moon's pull on the oceans",
      "Wind pushing water uphill",
      "Volcanoes heating the ground",
    ],
    0,
    "Sunlight evaporates water; it cools into clouds and falls as rain or snow.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "In 2010, the UN General Assembly recognized clean water and sanitation as…",
    [
      "A human right",
      "A product each country may sell",
      "A goal only for rich countries",
      "A military resource",
    ],
    0,
    "Resolution 64/292 recognized safe drinking water and sanitation as a human right.",
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
    "Which river flows through Egypt?",
    ["The Nile", "The Tigris", "The Euphrates", "The Jordan"],
    0,
    "About 95% of Egyptians live within a few kilometers of the Nile.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "The Mekong River flows through which region?",
    ["Southeast Asia", "South America", "Central Africa", "Eastern Europe"],
    0,
    "The Mekong runs from China through Myanmar, Laos, Thailand, Cambodia, and Vietnam.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Why is Ethiopia's Grand Renaissance Dam a source of tension?",
    [
      "Egypt and Sudan depend on Nile water flowing downstream from Ethiopia",
      "Egypt built it without asking Ethiopia",
      "It blocks the Congo River",
      "It flooded the Sahara",
    ],
    0,
    "Upstream countries can control water that downstream countries need.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Who led the 2016 Standing Rock protests against an oil pipeline near their water supply?",
    [
      "The Standing Rock Sioux Tribe and its allies",
      "The pipeline company",
      "The US Army",
      "The state of Texas",
    ],
    0,
    "The tribe argued the Dakota Access Pipeline threatened its drinking water and sacred sites.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "About how much of Earth's water is fresh water?",
    ["About 3%", "About 25%", "About 50%", "About 70%"],
    0,
    "About 97% is salty ocean water, and most fresh water is frozen in ice.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "What is a watershed?",
    [
      "All the land that drains into the same river or lake",
      "A building that stores drinking water",
      "The line where rain turns to snow",
      "An underground lake",
    ],
    0,
    "Rain that falls anywhere in a watershed ends up in the same river or lake.",
    HELP,
  ),
];

export const day20261027: Day = {
  date: DATE,
  title: "Day 37 — Integers: moving through zero",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Integers", "Rivers and water", "Water justice"],
  versionA: shuffleChoices(versionA, DATE, { balanced: true }),
  versionB: shuffleChoices(versionB, DATE, { balanced: true }),
};
