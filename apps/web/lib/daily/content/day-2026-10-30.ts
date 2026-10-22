import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ, shuffleChoices } from "./banks/choice";

const DATE = "2026-10-30";
const HELP = `/daily/${DATE}`;
const s = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const pt = (x: number, y: number) => `(${s(x)}, ${s(y)})`;

function quadrantQ(id: string, x: number, y: number): Question {
  const q = x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3;
  return numericQ(
    id,
    `In which quadrant is the point ${pt(x, y)}? Answer 1, 2, 3, or 4.`,
    q,
    `Signs (${x > 0 ? "+" : "−"}, ${y > 0 ? "+" : "−"}) mean quadrant ${q}.`,
    HELP,
  );
}

function moveQ(
  id: string,
  x: number,
  y: number,
  steps: number,
  dir: "left" | "right" | "up" | "down",
): Question {
  const axis = dir === "left" || dir === "right" ? "x" : "y";
  const sign = dir === "right" || dir === "up" ? 1 : -1;
  const start = axis === "x" ? x : y;
  const answer = start + sign * steps;
  return numericQ(
    id,
    `Start at ${pt(x, y)}. Move ${steps} ${dir}. What is the new ${axis}-coordinate?`,
    answer,
    `Only ${axis} changes: ${s(start)} ${sign > 0 ? "+" : "−"} ${steps} = ${s(answer)}.`,
    HELP,
  );
}

function distanceQ(id: string, a: [number, number], b: [number, number]): Question {
  const answer = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  return numericQ(
    id,
    `How many units apart are ${pt(...a)} and ${pt(...b)}?`,
    answer,
    `They share a line, so count the gap in the other coordinate: ${answer} units.`,
    HELP,
    { unit: "units" },
  );
}

const versionA: Question[] = [
  quadrantQ("a-q1", 3, 4),
  quadrantQ("a-q2", -2, 5),
  quadrantQ("a-q3", -4, -1),
  quadrantQ("a-q4", 5, -3),
  moveQ("a-m1", 2, 3, 5, "left"),
  moveQ("a-m2", -1, -2, 6, "up"),
  moveQ("a-m3", 4, 1, 7, "down"),
  moveQ("a-m4", -3, 0, 8, "right"),
  distanceQ("a-d1", [-2, 4], [5, 4]),
  distanceQ("a-d2", [-6, -1], [-1, -1]),
  distanceQ("a-d3", [3, -4], [3, 2]),
  distanceQ("a-d4", [-3, -3], [4, -3]),
  choiceQ(
    "a-g1",
    "geography",
    "Which line is 0° latitude?",
    [
      "The equator",
      "The Prime Meridian",
      "The Tropic of Cancer",
      "The Arctic Circle",
    ],
    0,
    "Latitude counts north and south from the equator.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "The Prime Meridian (0° longitude) passes through which city?",
    [
      "London",
      "Paris",
      "New York",
      "Cairo",
    ],
    0,
    "It runs through the Royal Observatory in Greenwich, London.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "Why was Greenwich chosen as the Prime Meridian in 1884?",
    [
      "Britain's navy and empire already used it on most sea charts",
      "It is the exact center of Earth",
      "It is the highest point in Europe",
      "It was picked by a coin toss",
    ],
    0,
    "At the 1884 conference, power decided the starting line. France kept using Paris for decades.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Before standard time zones, how did towns set their clocks?",
    [
      "By local sun time, so nearby towns had different times",
      "By one world clock",
      "By radio signals",
      "They did not use clocks",
    ],
    0,
    "Noon was when the sun was highest, so every town was a few minutes different.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "Roughly how many degrees of longitude wide is one time zone?",
    [
      "15°",
      "10°",
      "24°",
      "30°",
    ],
    0,
    "Earth turns 360° in 24 hours: 360 ÷ 24 = 15° each hour.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "What does latitude measure?",
    [
      "How far north or south of the equator a place is",
      "How far east or west of Greenwich a place is",
      "Height above sea level",
      "Distance from the Sun",
    ],
    0,
    "Latitude goes from 0° at the equator to 90° at each pole.",
    HELP,
  ),
];

const versionB: Question[] = [
  quadrantQ("b-q1", 1, 6),
  quadrantQ("b-q2", -5, 2),
  quadrantQ("b-q3", -3, -3),
  quadrantQ("b-q4", 2, -4),
  moveQ("b-m1", 3, 2, 6, "left"),
  moveQ("b-m2", -2, -3, 7, "up"),
  moveQ("b-m3", 1, 4, 9, "down"),
  moveQ("b-m4", -4, 1, 6, "right"),
  distanceQ("b-d1", [-3, 2], [4, 2]),
  distanceQ("b-d2", [-5, -2], [-1, -2]),
  distanceQ("b-d3", [2, -5], [2, 3]),
  distanceQ("b-d4", [-4, -1], [3, -1]),
  choiceQ(
    "b-g1",
    "geography",
    "In which hemisphere is Australia?",
    [
      "The Southern Hemisphere",
      "The Northern Hemisphere",
      "Both equally",
      "Neither",
    ],
    0,
    "All of Australia is south of the equator.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Lines of longitude run between…",
    [
      "The North and South Poles",
      "East and west along the equator",
      "Only across the oceans",
      "Only through Europe",
    ],
    0,
    "Longitude lines meet at both poles.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What pushed the United States to adopt standard time zones in 1883?",
    [
      "Railroads needed consistent train schedules",
      "A war with Britain",
      "The invention of the internet",
      "A volcano",
    ],
    0,
    "With dozens of local times, train timetables were chaos.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "China spans about 5 geographic time zones. How many official time zones does it use?",
    [
      "1",
      "3",
      "5",
      "24",
    ],
    0,
    "Since 1949, all of China uses Beijing time, so in the far west the sun can rise around 10 a.m.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What is the International Date Line?",
    [
      "A line near 180° longitude where the calendar date changes",
      "Another name for the equator",
      "The border of Russia",
      "The line where seasons change",
    ],
    0,
    "Cross it going west and you skip forward a day.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Why are there 24 main time zones?",
    [
      "Earth turns 360° in 24 hours, so each hour is 15°",
      "There are 24 continents",
      "The Moon has 24 phases",
      "Clocks only show 24 numbers",
    ],
    0,
    "One time zone for each hour of Earth's turn.",
    HELP,
  ),
];

export const day20261030: Day = {
  date: DATE,
  title: "Day 40 — Coordinates: find any point",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Coordinate plane", "Latitude and longitude", "Time zones"],
  versionA: shuffleChoices(versionA, DATE, { balanced: true }),
  versionB: shuffleChoices(versionB, DATE, { balanced: true }),
};
