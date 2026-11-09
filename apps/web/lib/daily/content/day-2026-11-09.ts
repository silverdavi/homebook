import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-09.json";

const DATE = "2026-11-09";
const HELP = `/daily/${DATE}`;

function boxQ(id: string, l: number, w: number, h: number): Question {
  const answer = l * w * h;
  return numericQ(
    id,
    `A box is ${l} cm long, ${w} cm wide, and ${h} cm tall. What is its volume in cm³?`,
    answer,
    `${l} × ${w} = ${l * w}, then × ${h} = ${answer} cm³.`,
    HELP,
    { unit: "cm³" },
  );
}

function missingQ(id: string, vol: number, l: number, w: number): Question {
  const base = l * w;
  const answer = vol / base;
  return numericQ(
    id,
    `A box has a volume of ${vol} cm³. Its base is ${l} cm by ${w} cm. How tall is it in cm?`,
    answer,
    `Base = ${l} × ${w} = ${base}. ${vol} ÷ ${base} = ${answer} cm.`,
    HELP,
    { unit: "cm" },
  );
}

function cubeQ(id: string, s: number): Question {
  const answer = s ** 3;
  return numericQ(
    id,
    `A cube has sides ${s} cm long. What is its volume in cm³?`,
    answer,
    `${s} × ${s} × ${s} = ${answer} cm³.`,
    HELP,
    { unit: "cm³" },
  );
}

const versionA: Question[] = [
  ...generated.a.box.map(([l, w, h], i) => boxQ(`a-v${i + 1}`, l, w, h)),
  ...generated.a.missing.map(([v, l, w], i) =>
    missingQ(`a-m${i + 1}`, v, l, w),
  ),
  ...generated.a.cube.map((s, i) => cubeQ(`a-c${i + 1}`, s)),
  choiceQ(
    "a-g1",
    "geography",
    "The Berlin Wall split which city in two?",
    ["Berlin", "Vienna", "Warsaw", "Moscow"],
    0,
    "It ran through Berlin from 1961 to 1989, splitting families and neighbors.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "After World War II, Germany was split into…",
    [
      "East Germany (Soviet side) and West Germany",
      "North Germany and South Germany, by the Alps",
      "A French half and a British half, by the Rhine",
      "Five small countries, one for each big river",
    ],
    0,
    "Germany reunited in 1990, less than a year after the Wall fell.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "When did the Berlin Wall fall?",
    ["November 9, 1989", "July 4, 1776", "June 6, 1944", "September 11, 2001"],
    0,
    "37 years ago today, crowds crossed and began chipping the Wall apart.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Why did East Germany build the Wall in 1961?",
    [
      "To stop its own people from escaping to the West",
      "To keep an invading army from the West outside",
      "To protect the city from floods from the river",
      "To mark where the new subway line would be built",
    ],
    0,
    "About 3 million people had already left; the government called it a defense, but its guns faced inward.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What was the Cold War?",
    [
      "A long rivalry between the US and the Soviet Union without direct war",
      "A war fought only in the Arctic and Antarctica in the 1950s",
      "A war between Canada and Russia over who owns the North Pole",
      "A famous winter battle in World War II in Russia's snow",
    ],
    0,
    "From about 1947 to 1991: an arms race, a space race, and wars fought by other countries.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Which country broke up into 15 countries in 1991?",
    ["The Soviet Union", "The United States", "China", "Brazil"],
    0,
    "Russia, Ukraine, Kazakhstan, the Baltic states, and others became independent.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.box.map(([l, w, h], i) => boxQ(`b-v${i + 1}`, l, w, h)),
  ...generated.b.missing.map(([v, l, w], i) =>
    missingQ(`b-m${i + 1}`, v, l, w),
  ),
  ...generated.b.cube.map((s, i) => cubeQ(`b-c${i + 1}`, s)),
  choiceQ(
    "b-g1",
    "geography",
    "Berlin is the capital of which country today?",
    ["Germany", "Austria", "Poland", "Russia"],
    0,
    "It became the capital of reunited Germany in 1990.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "The “Iron Curtain” was the line between…",
    [
      "Soviet-controlled Eastern Europe and Western Europe",
      "The cold north of Russia and its warm southern coast",
      "Europe and Africa, across the Mediterranean Sea",
      "The iron mines and the farms in central Germany",
    ],
    0,
    "Winston Churchill named it in 1946.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What brought the Wall down in 1989?",
    [
      "Peaceful protests by East Germans, and a border opened by mistake",
      "An American army that drove its tanks through it in the night",
      "An earthquake that shook the city and knocked it down",
      "A vote in the United Nations to remove the wall by force",
    ],
    0,
    "Weekly protests in Leipzig grew to hundreds of thousands. Then an official announced, by mistake, that the border was open “immediately.”",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "In what year did the Wall go up?",
    ["1961", "1918", "1945", "1999"],
    0,
    "It went up overnight on August 13, 1961.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "In the Cold War, the US and the Soviet Union raced to build…",
    [
      "Nuclear weapons and rockets to space",
      "The tallest buildings and the longest bridges",
      "The biggest farms and the largest factories",
      "The fastest trains and the largest ships",
    ],
    0,
    "The space race ended with Americans on the Moon in 1969; the arms race left tens of thousands of nuclear weapons.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "How long did the Berlin Wall stand?",
    ["28 years", "5 years", "50 years", "100 years"],
    0,
    "From 1961 to 1989. At least 140 people died trying to cross it.",
    HELP,
  ),
];

export const day20261109: Day = {
  date: DATE,
  title: "Day 44 — Volume: how much a box holds",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Volume", "Cubes", "The Berlin Wall and the Cold War"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
