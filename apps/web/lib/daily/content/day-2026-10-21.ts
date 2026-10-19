import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ } from "./banks/choice";

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
  choiceQ("a-g1", "geography", "Which biome is cold, treeless, and often underlain by permafrost?", ["Rainforest", "Tundra", "Grassland", "Savanna"], 1, "Tundra has a short growing season, low vegetation, and widespread permafrost.", HELP),
  choiceQ("a-g2", "geography", "What defines a desert?", ["Always hot temperatures", "Very low precipitation", "No living things", "Permanent ice"], 1, "Deserts are defined by very low precipitation and can be hot or cold.", HELP),
  choiceQ("a-h1", "history", "Who managed many landscapes long before modern conservation agencies?", ["Only industrial corporations", "Indigenous communities", "No humans", "Space agencies"], 1, "Indigenous peoples have long used detailed ecological knowledge to manage land and water.", HELP),
  choiceQ("a-h2", "history", "What harm has some conservation policy caused?", ["It created all deserts", "It displaced Indigenous peoples from ancestral lands", "It ended every forest fire", "It removed all national borders"], 1, "Some protected areas were created by excluding people who had cared for those lands for generations.", HELP),
  choiceQ("a-k1", "generalKnowledge", "What does climate justice examine?", ["Only tomorrow's weather", "How climate responsibility and harm are distributed", "The weight of clouds", "Names of hurricanes only"], 1, "Climate justice asks who caused emissions, who is harmed, and who has power and resources to respond.", HELP),
  choiceQ("a-k2", "generalKnowledge", "Which biome is typically warm, wet, and highly biodiverse?", ["Tundra", "Rainforest", "Polar desert", "Temperate grassland"], 1, "Tropical rainforests receive abundant rainfall and support extraordinary biodiversity.", HELP),
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
  choiceQ("b-g1", "geography", "Which biome is dominated by grasses and usually has seasonal rainfall?", ["Grassland", "Tundra", "Rainforest", "Ice sheet"], 0, "Grasslands receive enough rain for grasses but generally not dense forest.", HELP),
  choiceQ("b-g2", "geography", "Which statement about biome boundaries is accurate?", ["They are sharp walls", "They blend and shift", "They never respond to climate", "They follow national borders"], 1, "Biomes are broad patterns that transition gradually and shift with climate and human activity.", HELP),
  choiceQ("b-h1", "history", "Why should conservation include Indigenous land rights?", ["Indigenous knowledge and stewardship are part of the landscape's history", "Rights do not matter in forests", "Only tourists use protected lands", "It makes maps smaller"], 0, "Effective and just conservation respects communities whose lives and knowledge are tied to the land.", HELP),
  choiceQ("b-h2", "history", "Which activity has shaped grasslands for thousands of years?", ["Human and Indigenous land management", "Only satellite photography", "Deep-sea fishing", "No activity at all"], 0, "Grazing, cultural burning, farming, and stewardship have shaped many grassland ecosystems.", HELP),
  choiceQ("b-k1", "generalKnowledge", "Who is often most exposed to climate harm?", ["Only the highest emitters", "Communities with fewer resources, often despite low emissions", "Nobody near coasts", "Only mapmakers"], 1, "Low-emitting communities can face high exposure and have fewer resources to adapt.", HELP),
  choiceQ("b-k2", "generalKnowledge", "Permafrost is ground that remains frozen for at least how long?", ["2 consecutive years", "1 afternoon", "1 month", "100,000 years only"], 0, "Permafrost is ground that stays at or below freezing for at least 2 consecutive years.", HELP),
];

export const day20261021: Day = {
  date: DATE,
  title: "Day 34 — Density packs matter",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Density", "Biomes", "Climate justice"],
  versionA,
  versionB,
};
