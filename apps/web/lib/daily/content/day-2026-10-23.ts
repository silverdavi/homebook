import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ } from "./banks/choice";

const DATE = "2026-10-23";
const HELP = `/daily/${DATE}`;

function list(values: number[]): string {
  return values.join(", ");
}

function meanQ(id: string, values: number[]): Question {
  const sum = values.reduce((total, value) => total + value, 0);
  const answer = sum / values.length;
  return numericQ(id, `Find the mean: ${list(values)}`, answer, `Sum ${sum} ÷ ${values.length} values = ${answer}.`, HELP);
}

function medianQ(id: string, values: number[]): Question {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const answer = sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
  return numericQ(id, `Find the median: ${list(values)}`, answer, `Ordered: ${list(sorted)}. The middle is ${answer}.`, HELP);
}

const versionA: Question[] = [
  meanQ("a-m1", [3, 5, 5, 7, 10]),
  meanQ("a-m2", [4, 6, 8, 10]),
  meanQ("a-m3", [12, 15, 18]),
  meanQ("a-m4", [2, 3, 7, 8]),
  meanQ("a-m5", [20, 25, 30, 35, 40]),
  meanQ("a-m6", [6, 9, 12, 15, 18]),
  medianQ("a-d1", [9, 2, 7, 4, 6]),
  medianQ("a-d2", [12, 5, 8, 3]),
  medianQ("a-d3", [20, 11, 14, 17, 9]),
  medianQ("a-d4", [4, 10, 2, 8, 6, 12]),
  medianQ("a-d5", [15, 7, 9, 13, 11]),
  medianQ("a-d6", [21, 5, 17, 9]),
  choiceQ("a-g1", "geography", "Ukraine is located in which region?", ["Eastern Europe", "Southern Africa", "Southeast Asia", "Central America"], 0, "Ukraine is an Eastern European country on the Black Sea.", HELP),
  choiceQ("a-g2", "geography", "Sudan is located in which part of Africa?", ["Northeastern Africa", "Southern tip", "Atlantic islands", "Central rainforest only"], 0, "Sudan is in northeastern Africa, south of Egypt and west of the Red Sea.", HELP),
  choiceQ("a-h1", "history", "Russia's full-scale invasion of Ukraine began in which year?", ["2014", "2022", "2025", "1991"], 1, "Russia annexed Crimea and began intervention in 2014; the full-scale invasion began in February 2022.", HELP),
  choiceQ("a-h2", "history", "Sudan's current war began in 2023 between which forces?", ["The Sudanese Armed Forces and Rapid Support Forces", "Ukraine and Russia", "India and Pakistan", "The UN and African Union"], 0, "The war pits the Sudanese Armed Forces against the paramilitary Rapid Support Forces.", HELP),
  choiceQ("a-k1", "generalKnowledge", "What is a consistent humanitarian priority in every conflict?", ["Protect civilians and allow aid access", "Punish an entire population", "Attack hospitals", "Block food"], 0, "International humanitarian law requires civilian protection and humanitarian access.", HELP),
  choiceQ("a-k2", "generalKnowledge", "Which practice improves understanding of a conflict?", ["Compare credible sources and distinguish civilians from governments", "Treat every social post as equal evidence", "Assume one flag explains everyone", "Ignore power differences"], 0, "Source comparison and careful distinctions reduce propaganda and stereotyping.", HELP),
];

const versionB: Question[] = [
  meanQ("b-m1", [2, 4, 6, 8, 10]),
  meanQ("b-m2", [5, 7, 9, 11]),
  meanQ("b-m3", [14, 17, 20]),
  meanQ("b-m4", [1, 5, 6, 8]),
  meanQ("b-m5", [10, 20, 30, 40, 50]),
  meanQ("b-m6", [7, 10, 13, 16, 19]),
  medianQ("b-d1", [8, 3, 9, 5, 7]),
  medianQ("b-d2", [14, 6, 10, 4]),
  medianQ("b-d3", [22, 13, 16, 19, 11]),
  medianQ("b-d4", [5, 11, 3, 9, 7, 13]),
  medianQ("b-d5", [16, 8, 10, 14, 12]),
  medianQ("b-d6", [23, 7, 19, 11]),
  choiceQ("b-g1", "geography", "Gaza lies along which sea?", ["Mediterranean Sea", "Caribbean Sea", "Baltic Sea", "South China Sea"], 0, "Gaza is a narrow coastal territory on the eastern Mediterranean.", HELP),
  choiceQ("b-g2", "geography", "Myanmar is in which region?", ["Southeast Asia", "Western Europe", "Southern Africa", "North America"], 0, "Myanmar lies in Southeast Asia between South and East Asia.", HELP),
  choiceQ("b-h1", "history", "Why do colonial histories matter when studying current conflicts?", ["They shaped borders, institutions, inequalities, and political power", "They determine every event automatically", "They have no effect", "They only changed flags"], 0, "Colonial rule often reshaped territory, economies, and power relations that continue to matter.", HELP),
  choiceQ("b-h2", "history", "Which statement best separates people from governments?", ["Civilians do not automatically share every action of a government or armed group", "Every citizen controls military policy", "A flag proves political agreement", "All people in a territory think alike"], 0, "Populations are diverse and must not be blamed collectively for leaders' or armed groups' actions.", HELP),
  choiceQ("b-k1", "generalKnowledge", "As of October 2026, which country has the world's largest hunger and displacement crisis?", ["Sudan", "Canada", "Japan", "Portugal"], 0, "The UN describes Sudan as the world's largest hunger and displacement crisis.", HELP),
  choiceQ("b-k2", "generalKnowledge", "What was reducing food assistance in Gaza in October 2026?", ["Funding shortages", "Too much farmland", "A ban on bread worldwide", "No need for aid"], 0, "The World Food Programme reported that funding shortages forced major reductions in assistance.", HELP),
];

export const day20261023: Day = {
  date: DATE,
  title: "Day 36 — Center and spread",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Mean and median", "Current crises", "Reading power and sources"],
  versionA,
  versionB,
};
