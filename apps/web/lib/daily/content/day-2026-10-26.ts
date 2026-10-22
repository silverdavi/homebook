import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ, shuffleChoices } from "./banks/choice";

const DATE = "2026-10-26";
const HELP = `/daily/${DATE}`;

function unitQ(
  id: string,
  prompt: string,
  answer: number,
  unit: string,
  explanation: string,
): Question {
  return numericQ(
    id,
    `${prompt} Answer in ${unit}.`,
    answer,
    explanation,
    HELP,
    {
      unit,
    },
  );
}

function boxQ(id: string, l: number, w: number, h: number): Question {
  return unitQ(
    id,
    `A box is ${l} cm long, ${w} cm wide, and ${h} cm tall. What is its volume?`,
    l * w * h,
    "cm³",
    `${l} cm × ${w} cm × ${h} cm = ${l * w * h} cm³. Three lengths multiplied give cubic units.`,
  );
}

function speedQ(id: string, km: number, hours: number): Question {
  return unitQ(
    id,
    `A train travels ${km} km in ${hours} hours. What is its speed?`,
    km / hours,
    "km/h",
    `“Per hour” means divide: ${km} km ÷ ${hours} h = ${km / hours} km/h.`,
  );
}

function priceQ(id: string, dollars: number, kg: number): Question {
  return unitQ(
    id,
    `${kg} kg of rice costs $${dollars}. What is the price per kg?`,
    dollars / kg,
    "$/kg",
    `“Per kg” means divide: $${dollars} ÷ ${kg} kg = $${dollars / kg} per kg.`,
  );
}

function distanceQ(id: string, speed: number, hours: number): Question {
  return unitQ(
    id,
    `A bike rides at ${speed} km/h for ${hours} hours. How far does it go?`,
    speed * hours,
    "km",
    `km/h × h: the hours cancel. ${speed} × ${hours} = ${speed * hours} km.`,
  );
}

function costQ(id: string, perKg: number, kg: number): Question {
  return unitQ(
    id,
    `Apples cost $${perKg} per kg. How much do ${kg} kg cost?`,
    perKg * kg,
    "$",
    `$/kg × kg: the kg cancel. ${perKg} × ${kg} = $${perKg * kg}.`,
  );
}

function massQ(id: string, density: number, volume: number): Question {
  return unitQ(
    id,
    `A metal has density ${density} g/cm³. What is the mass of ${volume} cm³ of it?`,
    density * volume,
    "g",
    `g/cm³ × cm³: the cm³ cancel. ${density} × ${volume} = ${density * volume} g.`,
  );
}

function timeQ(id: string, km: number, speed: number): Question {
  return unitQ(
    id,
    `A car drives ${km} km at ${speed} km/h. How many hours does it take?`,
    km / speed,
    "hours",
    `You want hours, the bottom of km/h, so divide by the rate: ${km} km ÷ ${speed} km/h = ${km / speed} h.`,
  );
}

function kgQ(id: string, dollars: number, perKg: number): Question {
  return unitQ(
    id,
    `Rice costs $${perKg} per kg. How many kg can you buy with $${dollars}?`,
    dollars / perKg,
    "kg",
    `You want kg, the bottom of $/kg, so divide by the rate: $${dollars} ÷ $${perKg}/kg = ${dollars / perKg} kg.`,
  );
}

function volumeQ(id: string, mass: number, density: number): Question {
  return unitQ(
    id,
    `A stone has mass ${mass} g and density ${density} g/cm³. What is its volume?`,
    mass / density,
    "cm³",
    `You want cm³, the bottom of g/cm³, so divide by the density: ${mass} g ÷ ${density} g/cm³ = ${mass / density} cm³.`,
  );
}

const versionA: Question[] = [
  boxQ("a-v1", 4, 3, 2),
  boxQ("a-v2", 5, 2, 3),
  speedQ("a-s1", 120, 2),
  speedQ("a-s2", 45, 3),
  priceQ("a-p1", 20, 4),
  distanceQ("a-d1", 15, 3),
  costQ("a-c1", 4, 6),
  massQ("a-m1", 3, 10),
  timeQ("a-t1", 90, 30),
  kgQ("a-q1", 18, 6),
  volumeQ("a-x1", 40, 8),
  timeQ("a-t2", 150, 50),
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
  boxQ("b-v1", 3, 3, 4),
  boxQ("b-v2", 6, 2, 2),
  speedQ("b-s1", 180, 3),
  speedQ("b-s2", 56, 4),
  priceQ("b-p1", 21, 3),
  distanceQ("b-d1", 12, 4),
  costQ("b-c1", 5, 7),
  massQ("b-m1", 4, 6),
  timeQ("b-t1", 120, 40),
  kgQ("b-q1", 24, 8),
  volumeQ("b-x1", 54, 9),
  timeQ("b-t2", 200, 50),
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

export const day20261026: Day = {
  date: DATE,
  title: "Day 36 — Units: when to multiply, divide, or flip",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Units and rates", "Volume", "Current crises"],
  versionA: shuffleChoices(versionA, DATE, { balanced: true }),
  versionB: shuffleChoices(versionB, DATE, { balanced: true }),
};
