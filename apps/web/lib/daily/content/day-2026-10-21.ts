import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ, shuffleChoices } from "./banks/choice";

const DATE = "2026-10-21";
const HELP = `/daily/${DATE}`;

function areaQ(id: string, length: number, width: number): Question {
  const answer = length * width;
  return numericQ(
    id,
    `A rectangle is ${length} cm long and ${width} cm wide. What is its area?`,
    answer,
    `${length} × ${width} = ${answer} cm².`,
    HELP,
    { unit: "cm²" },
  );
}

function perimeterQ(id: string, length: number, width: number): Question {
  const answer = 2 * length + 2 * width;
  return numericQ(
    id,
    `A rectangle is ${length} cm long and ${width} cm wide. What is its perimeter?`,
    answer,
    `${length} + ${width} + ${length} + ${width} = ${answer} cm.`,
    HELP,
    { unit: "cm" },
  );
}

const versionA: Question[] = [
  perimeterQ("a-p1", 4, 3),
  perimeterQ("a-p2", 6, 2),
  perimeterQ("a-p3", 5, 4),
  perimeterQ("a-p4", 8, 3),
  perimeterQ("a-p5", 7, 5),
  perimeterQ("a-p6", 9, 4),
  areaQ("a-a1", 4, 3),
  areaQ("a-a2", 6, 2),
  areaQ("a-a3", 5, 4),
  areaQ("a-a4", 8, 3),
  areaQ("a-a5", 7, 5),
  areaQ("a-a6", 9, 4),
  choiceQ(
    "a-g1",
    "geography",
    "Which biome is cold, treeless, and often underlain by permafrost?",
    ["Rainforest", "Tundra", "Grassland", "Savanna"],
    1,
    "Tundra has a short growing season, low vegetation, and widespread permafrost.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "What defines a desert?",
    [
      "Always hot temperatures",
      "Very low precipitation",
      "No living things",
      "Permanent ice",
    ],
    1,
    "Deserts are defined by very low precipitation and can be hot or cold.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Who managed many landscapes long before modern conservation agencies?",
    [
      "Only industrial corporations",
      "Indigenous communities",
      "No humans",
      "Space agencies",
    ],
    1,
    "Indigenous peoples have long used detailed ecological knowledge to manage land and water.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "What harm has some conservation policy caused?",
    [
      "It created all deserts",
      "It displaced Indigenous peoples from ancestral lands",
      "It ended every forest fire",
      "It removed all national borders",
    ],
    1,
    "Some protected areas were created by excluding people who had cared for those lands for generations.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What does climate justice examine?",
    [
      "Only tomorrow's weather",
      "How climate responsibility and harm are distributed",
      "The weight of clouds",
      "Names of hurricanes only",
    ],
    1,
    "Climate justice asks who caused emissions, who is harmed, and who has power and resources to respond.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Which biome is typically warm, wet, and highly biodiverse?",
    ["Tundra", "Rainforest", "Polar desert", "Temperate grassland"],
    1,
    "Tropical rainforests receive abundant rainfall and support extraordinary biodiversity.",
    HELP,
  ),
];

const versionB: Question[] = [
  perimeterQ("b-p1", 5, 3),
  perimeterQ("b-p2", 7, 2),
  perimeterQ("b-p3", 6, 4),
  perimeterQ("b-p4", 9, 3),
  perimeterQ("b-p5", 8, 5),
  perimeterQ("b-p6", 10, 4),
  areaQ("b-a1", 5, 3),
  areaQ("b-a2", 7, 2),
  areaQ("b-a3", 6, 4),
  areaQ("b-a4", 9, 3),
  areaQ("b-a5", 8, 5),
  areaQ("b-a6", 10, 4),
  choiceQ(
    "b-g1",
    "geography",
    "Which biome is dominated by grasses and usually has seasonal rainfall?",
    ["Grassland", "Tundra", "Rainforest", "Ice sheet"],
    0,
    "Grasslands receive enough rain for grasses but generally not dense forest.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Which statement about biome boundaries is accurate?",
    [
      "They are sharp walls",
      "They blend and shift",
      "They never respond to climate",
      "They follow national borders",
    ],
    1,
    "Biomes are broad patterns that transition gradually and shift with climate and human activity.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Why should conservation include Indigenous land rights?",
    [
      "Indigenous knowledge and stewardship are part of the landscape's history",
      "Rights do not matter in forests",
      "Only tourists use protected lands",
      "It makes maps smaller",
    ],
    0,
    "Effective and just conservation respects communities whose lives and knowledge are tied to the land.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Which activity has shaped grasslands for thousands of years?",
    [
      "Human and Indigenous land management",
      "Only satellite photography",
      "Deep-sea fishing",
      "No activity at all",
    ],
    0,
    "Grazing, cultural burning, farming, and stewardship have shaped many grassland ecosystems.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "Who is often most exposed to climate harm?",
    [
      "Only the highest emitters",
      "Communities with fewer resources, often despite low emissions",
      "Nobody near coasts",
      "Only mapmakers",
    ],
    1,
    "Low-emitting communities can face high exposure and have fewer resources to adapt.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Permafrost is ground that remains frozen for at least how long?",
    ["2 consecutive years", "1 afternoon", "1 month", "100,000 years only"],
    0,
    "Permafrost is ground that stays at or below freezing for at least 2 consecutive years.",
    HELP,
  ),
];

export const day20261021: Day = {
  date: DATE,
  title: "Day 34 — Perimeter and area: around vs. inside",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Perimeter and area", "Biomes", "Climate justice"],
  versionA: shuffleChoices(versionA, DATE),
  versionB: shuffleChoices(versionB, DATE),
};
