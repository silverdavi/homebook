import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ } from "./banks/choice";

const DATE = "2026-10-20";
const HELP = `/daily/${DATE}`;

function rectangleArea(id: string, length: number, width: number): Question {
  const answer = length * width;
  return numericQ(id, `Area of a ${length} cm by ${width} cm rectangle?`, answer, `${length} × ${width} = ${answer} cm².`, HELP, { unit: "cm²" });
}

function rectanglePerimeter(id: string, length: number, width: number): Question {
  const answer = 2 * length + 2 * width;
  return numericQ(id, `Perimeter of a ${length} cm by ${width} cm rectangle?`, answer, `2(${length}) + 2(${width}) = ${answer} cm.`, HELP, { unit: "cm" });
}

function triangleArea(id: string, base: number, height: number): Question {
  const answer = (base * height) / 2;
  return numericQ(id, `Area of a triangle with base ${base} cm and height ${height} cm?`, answer, `${base} × ${height} ÷ 2 = ${answer} cm².`, HELP, { unit: "cm²" });
}

const versionA: Question[] = [
  rectangleArea("a-a1", 9, 4),
  rectangleArea("a-a2", 12, 7),
  rectangleArea("a-a3", 15, 6),
  rectangleArea("a-a4", 11, 8),
  rectangleArea("a-a5", 20, 5),
  rectanglePerimeter("a-p1", 9, 4),
  rectanglePerimeter("a-p2", 12, 7),
  rectanglePerimeter("a-p3", 15, 6),
  rectanglePerimeter("a-p4", 11, 8),
  rectanglePerimeter("a-p5", 20, 5),
  triangleArea("a-t1", 10, 6),
  triangleArea("a-t2", 14, 8),
  choiceQ("a-g1", "geography", "Japan is on which continent?", ["Europe", "Asia", "Africa", "South America"], 1, "Japan is an island country in East Asia.", HELP),
  choiceQ("a-g2", "geography", "Brazil is on which continent?", ["North America", "Africa", "South America", "Asia"], 2, "Brazil occupies much of eastern South America.", HELP),
  choiceQ("a-h1", "history", "Who drew many present-day African borders during the colonial era?", ["European imperial governments", "The United Nations", "Local voters in referendums", "Antarctic explorers"], 0, "European empires partitioned much of Africa, often disregarding existing peoples and political communities.", HELP),
  choiceQ("a-h2", "history", "Why can a map reflect power?", ["Maps never show borders", "A mapmaker chooses what to center, name, enlarge, or omit", "Only kings can read maps", "Every map uses identical choices"], 1, "Maps are models made for purposes; choices about projection, labels, and borders shape what viewers see.", HELP),
  choiceQ("a-k1", "generalKnowledge", "Which symbol appears on Canada's flag?", ["A cedar tree", "A maple leaf", "A red circle", "A yellow diamond"], 1, "Canada's flag has a red maple leaf between 2 red bars.", HELP),
  choiceQ("a-k2", "generalKnowledge", "The equator divides Earth into which 2 hemispheres?", ["Eastern and Western", "Land and ocean", "Northern and Southern", "Warm and cold"], 2, "The equator is 0° latitude and divides the Northern and Southern Hemispheres.", HELP),
];

const versionB: Question[] = [
  rectangleArea("b-a1", 8, 5),
  rectangleArea("b-a2", 13, 6),
  rectangleArea("b-a3", 14, 9),
  rectangleArea("b-a4", 16, 7),
  rectangleArea("b-a5", 25, 4),
  rectanglePerimeter("b-p1", 8, 5),
  rectanglePerimeter("b-p2", 13, 6),
  rectanglePerimeter("b-p3", 14, 9),
  rectanglePerimeter("b-p4", 16, 7),
  rectanglePerimeter("b-p5", 25, 4),
  triangleArea("b-t1", 12, 7),
  triangleArea("b-t2", 15, 6),
  choiceQ("b-g1", "geography", "South Africa is on which continent?", ["Africa", "Asia", "Europe", "Australia"], 0, "South Africa is at the southern end of the African continent.", HELP),
  choiceQ("b-g2", "geography", "Canada is on which continent?", ["South America", "North America", "Europe", "Asia"], 1, "Canada occupies the northern part of North America.", HELP),
  choiceQ("b-h1", "history", "Which statement about national borders is most accurate?", ["They are timeless natural facts", "They are human decisions that can change", "They are all rivers", "They were fixed before humans existed"], 1, "Borders are political decisions shaped by negotiation, migration, empire, and war.", HELP),
  choiceQ("b-h2", "history", "What does the Mercator map projection exaggerate?", ["Places near the poles", "The equator only", "Ocean depth", "Population"], 0, "Mercator preserves direction but makes high-latitude places look too large.", HELP),
  choiceQ("b-k1", "generalKnowledge", "Japan's flag is mainly a red circle on what background?", ["Green", "Blue", "White", "Yellow"], 2, "Japan's flag has a red sun disc on white.", HELP),
  choiceQ("b-k2", "generalKnowledge", "Which language is Brazil's national language?", ["Spanish", "French", "Portuguese", "Italian"], 2, "Portuguese became dominant through Portuguese colonization.", HELP),
];

export const day20261020: Day = {
  date: DATE,
  title: "Day 33 — Around, across, and inside",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Perimeter and area", "Maps and flags", "Borders and power"],
  versionA,
  versionB,
};
