import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-10-29.json";

const DATE = "2026-10-29";
const HELP = `/daily/${DATE}`;
function toRealQ(id: string, cm: number, scale: number): Question {
  return numericQ(
    id,
    `On a map, 1 cm = ${scale} km. Two towns are ${cm} cm apart on the map. How far apart are they really? Answer in km.`,
    cm * scale,
    `${cm} cm × ${scale} km per cm = ${cm * scale} km.`,
    HELP,
    { unit: "km" },
  );
}

function toMapQ(id: string, km: number, scale: number): Question {
  return numericQ(
    id,
    `On a map, 1 cm = ${scale} km. Two cities are really ${km} km apart. How far apart are they on the map? Answer in cm.`,
    km / scale,
    `You want cm, so divide by the scale: ${km} km ÷ ${scale} km per cm = ${km / scale} cm.`,
    HELP,
    { unit: "cm" },
  );
}

function findScaleQ(id: string, cm: number, km: number): Question {
  return numericQ(
    id,
    `On a map, ${cm} cm stands for ${km} km. How many km does 1 cm stand for? Answer in km per cm.`,
    km / cm,
    `“Per cm” means divide: ${km} km ÷ ${cm} cm = ${km / cm} km per cm.`,
    HELP,
    { unit: "km per cm" },
  );
}

const versionA: Question[] = [
  ...generated.a.toReal.map(([cm, scale], i) =>
    toRealQ(`a-r${i + 1}`, cm, scale),
  ),
  ...generated.a.toMap.map(([km, scale], i) =>
    toMapQ(`a-m${i + 1}`, km, scale),
  ),
  ...generated.a.findScale.map(([cm, km], i) =>
    findScaleQ(`a-s${i + 1}`, cm, km),
  ),
  choiceQ(
    "a-g1",
    "geography",
    "Which is the largest ocean?",
    ["The Pacific", "The Atlantic", "The Indian", "The Arctic"],
    0,
    "The Pacific is larger than all of Earth's land put together.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "On a Mercator map, Greenland looks about as big as Africa. In reality, Africa is about…",
    [
      "14 times larger",
      "the same size",
      "twice as large",
      "smaller than Greenland",
    ],
    0,
    "Mercator maps stretch places far from the equator.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Why did Gerardus Mercator design his 1569 map?",
    [
      "To help sailors steer straight compass courses",
      "To show countries at their true size",
      "To draw borders in Africa",
      "To map the stars",
    ],
    0,
    "On his map, a straight line is a constant compass direction, which was very useful at sea.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Why did some people promote the Gall–Peters map in the 1970s?",
    [
      "It shows land areas at their true relative size, so Africa and South America look as big as they are",
      "It is better for sailing",
      "It puts the South Pole at the top",
      "It shows every city",
    ],
    0,
    "Supporters argued Mercator made Europe and North America look more important than they are.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What does a map projection do?",
    [
      "Turns the round Earth into a flat map, which always distorts something",
      "Shows the Earth with no distortion at all",
      "Photographs the Earth from space",
      "Shows only political borders",
    ],
    0,
    "You cannot flatten a sphere without stretching shapes, sizes, distances, or directions.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "How many continents are usually counted in English-speaking schools?",
    ["7", "5", "6", "9"],
    0,
    "Africa, Antarctica, Asia, Australia, Europe, North America, and South America.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.toReal.map(([cm, scale], i) =>
    toRealQ(`b-r${i + 1}`, cm, scale),
  ),
  ...generated.b.toMap.map(([km, scale], i) =>
    toMapQ(`b-m${i + 1}`, km, scale),
  ),
  ...generated.b.findScale.map(([cm, km], i) =>
    findScaleQ(`b-s${i + 1}`, cm, km),
  ),
  choiceQ(
    "b-g1",
    "geography",
    "Which continent is the largest by area?",
    ["Asia", "Africa", "North America", "Antarctica"],
    0,
    "Asia covers about 30% of Earth's land; Africa is second.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Which ocean lies between Africa and Australia?",
    [
      "The Indian Ocean",
      "The Atlantic Ocean",
      "The Pacific Ocean",
      "The Southern Ocean",
    ],
    0,
    "The Indian Ocean touches East Africa, South Asia, and western Australia.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Mercator maps make which places look too big?",
    [
      "Places far from the equator, like Greenland and Russia",
      "Places on the equator",
      "Only islands",
      "Only oceans",
    ],
    0,
    "The further from the equator, the more Mercator stretches the land.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Why is putting north at the top of maps a choice, not a fact?",
    [
      "Space has no up or down; mapmakers chose the convention",
      "North is physically higher",
      "The North Pole is closer to the Sun",
      "Compasses only point upward",
    ],
    0,
    "Many medieval maps put east or south at the top.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "Which continent could fit the US, China, and India inside it with room to spare?",
    ["Africa", "Europe", "Australia", "South America"],
    0,
    "Africa is about 30 million km², bigger than the US, China, and India combined.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "What does an equal-area map keep correct?",
    [
      "The relative sizes of places",
      "The exact shapes of all countries",
      "Straight compass directions",
      "The distance between every pair of cities",
    ],
    0,
    "Equal-area maps keep sizes fair but bend shapes.",
    HELP,
  ),
];

export const day20261029: Day = {
  date: DATE,
  title: "Day 38 — Map scale: shrinking the world",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Map scale", "Map projections", "Continents and oceans"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
