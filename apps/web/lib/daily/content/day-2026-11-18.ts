import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-18.json";

const DATE = "2026-11-18";
const HELP = `/daily/${DATE}`;

function areaQ(id: string, b: number, h: number): Question {
  const answer = (b * h) / 2;
  return numericQ(
    id,
    `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area in cm²?`,
    answer,
    `${b} × ${h} = ${b * h}, then half: ${answer} cm².`,
    HELP,
    { unit: "cm²" },
  );
}

function rectQ(id: string, b: number, h: number): Question {
  const answer = (b * h) / 2;
  return numericQ(
    id,
    `A ${b} cm × ${h} cm rectangle is cut corner to corner into 2 triangles. What is the area of one triangle in cm²?`,
    answer,
    `The rectangle is ${b * h} cm²; each triangle is half: ${answer} cm².`,
    HELP,
    { unit: "cm²" },
  );
}

function missingQ(id: string, area: number, b: number): Question {
  const answer = (2 * area) / b;
  return numericQ(
    id,
    `A triangle has an area of ${area} cm² and a base of ${b} cm. What is its height in cm?`,
    answer,
    `Double the area: ${2 * area}. Divide by the base: ${2 * area} ÷ ${b} = ${answer} cm.`,
    HELP,
    { unit: "cm" },
  );
}

const versionA: Question[] = [
  ...generated.a.area.map(([b, h], i) => areaQ(`a-a${i + 1}`, b, h)),
  ...generated.a.rect.map(([b, h], i) => rectQ(`a-r${i + 1}`, b, h)),
  ...generated.a.missing.map(([a, b], i) => missingQ(`a-m${i + 1}`, a, b)),
  choiceQ(
    "a-g1",
    "geography",
    "Apartheid was the system of racial separation in which country?",
    ["South Africa", "Kenya", "Egypt", "Saudi Arabia"],
    0,
    "It lasted from 1948 to the early 1990s.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Nelson Mandela spent 18 of his 27 prison years on which island?",
    ["Robben Island", "Ellis Island", "Alcatraz Island", "Easter Island"],
    0,
    "It's off the coast of Cape Town and is now a museum.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What was apartheid?",
    [
      "Laws that split people by race and gave white people power",
      "A trade deal between South Africa and its neighbors",
      "A plan to give every family in the country a farm",
      "A sports league that only allowed teams from cities",
    ],
    0,
    "Black South Africans couldn't vote, live where they chose, or go to the same schools.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "In 1994, Nelson Mandela became…",
    [
      "South Africa's first Black president",
      "The leader of the United Nations",
      "The prime minister of Britain",
      "The coach of a world-cup team",
    ],
    0,
    "In the first election where all South Africans could vote.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "Why did students in Soweto protest in 1976?",
    [
      "They were forced to be taught in Afrikaans, the rulers' language",
      "Their school year was made two months longer than before",
      "Their sports teams were banned from playing in the city",
      "Their school buses were taken away to save money",
    ],
    0,
    "Police shot at the students; 13-year-old Hector Pieterson became a symbol of the struggle.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Area of a triangle = ?",
    ["Base × height ÷ 2", "Base × height", "Base + height", "Base × 2 + height"],
    0,
    "A triangle is half of a rectangle with the same base and height.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.area.map(([b, h], i) => areaQ(`b-a${i + 1}`, b, h)),
  ...generated.b.rect.map(([b, h], i) => rectQ(`b-r${i + 1}`, b, h)),
  ...generated.b.missing.map(([a, b], i) => missingQ(`b-m${i + 1}`, a, b)),
  choiceQ(
    "b-g1",
    "geography",
    "Cape Town and Johannesburg are cities in…",
    ["South Africa", "New Zealand", "Argentina", "Australia"],
    0,
    "Robben Island prison is just off Cape Town.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Soweto, where students protested in 1976, is next to which city?",
    ["Johannesburg", "Addis Ababa", "Nairobi", "Casablanca"],
    0,
    "Its name comes from South Western Townships.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "How many years was Nelson Mandela in prison?",
    ["27", "2", "10", "50"],
    0,
    "From 1962 to 1990. He came out without seeking revenge.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "How did people around the world pressure South Africa to end apartheid?",
    [
      "Boycotts: refusing to buy its goods, play its teams, or invest",
      "Sending armies from Europe to take over its biggest cities",
      "Moving all of their embassies to its neighbor countries",
      "Building a wall all the way around the country's borders",
    ],
    0,
    "Students in the US pushed their universities to pull their money out.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What was the Truth and Reconciliation Commission?",
    [
      "Hearings where victims told their stories and some abusers confessed",
      "A court that sent every former leader of apartheid to prison",
      "A group that chose the new South African flag and anthem",
      "A school that trained new teachers after apartheid ended",
    ],
    0,
    "Led by Archbishop Desmond Tutu, it tried to heal the country by telling the truth.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "A triangle's area is 20 cm² and its base is 8 cm. How do you find the height?",
    [
      "Double the area, then divide by the base",
      "Halve the area, then divide by the base",
      "Add the area and the base, then halve",
      "Subtract the base from the area, then halve",
    ],
    0,
    "20 × 2 = 40, and 40 ÷ 8 = 5 cm.",
    HELP,
  ),
];

export const day20261118: Day = {
  date: DATE,
  title: "Day 49 — Area of a triangle",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Area of triangles", "Apartheid", "Nelson Mandela"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
