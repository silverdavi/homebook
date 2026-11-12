import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-13.json";

const DATE = "2026-11-13";
const HELP = `/daily/${DATE}`;

export function distanceQ(id: string, speed: number, hours: number): Question {
  const answer = speed * hours;
  return numericQ(
    id,
    `A bus goes ${speed} km/h for ${hours} hours. How many km does it travel?`,
    answer,
    `Distance = speed × time: ${speed} × ${hours} = ${answer} km.`,
    HELP,
    { unit: "km" },
  );
}

export function speedQ(id: string, km: number, hours: number): Question {
  const answer = km / hours;
  return numericQ(
    id,
    `A train travels ${km} km in ${hours} hours. What is its speed in km/h?`,
    answer,
    `Speed = distance ÷ time: ${km} ÷ ${hours} = ${answer} km/h.`,
    HELP,
    { unit: "km/h" },
  );
}

export function timeQ(id: string, km: number, speed: number): Question {
  const answer = km / speed;
  return numericQ(
    id,
    `A car drives ${km} km at ${speed} km/h. How many hours does it take?`,
    answer,
    `Time = distance ÷ speed: ${km} ÷ ${speed} = ${answer} hours.`,
    HELP,
    { unit: "hours" },
  );
}

const versionA: Question[] = [
  ...generated.a.distance.map(([s, t], i) => distanceQ(`a-d${i + 1}`, s, t)),
  ...generated.a.speed.map(([d, t], i) => speedQ(`a-s${i + 1}`, d, t)),
  ...generated.a.time.map(([d, s], i) => timeQ(`a-t${i + 1}`, d, s)),
  choiceQ(
    "a-g1",
    "geography",
    "Which country hosts the most refugees from Syria?",
    ["Turkey", "Canada", "Japan", "Brazil"],
    0,
    "Turkey hosted over 3 million Syrians, more than any other country.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Most of the world's refugees live in…",
    [
      "Poorer countries next door to the one they fled",
      "The richest countries in Europe and North America",
      "Camps that are set up on islands far out at sea",
      "Big cities that are on the other side of the world",
    ],
    0,
    "About 70% stay in neighboring countries, and most of those are low- or middle-income.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "The 1951 Refugee Convention says a refugee is someone who…",
    [
      "Fled their country because of danger or persecution and can't go back",
      "Moved to a new country only to find a better job and higher pay",
      "Travels between countries every year for holidays with family",
      "Lives in a different city from the one where they were born",
    ],
    0,
    "Countries that signed it promised not to send refugees back to danger.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Which famous scientist was a refugee from Nazi Germany?",
    ["Albert Einstein", "Isaac Newton", "Marie Curie", "Charles Darwin"],
    0,
    "He fled in 1933. Many refugees have gone on to change the countries that took them in.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What does “asylum” mean?",
    [
      "Protection that a country gives to someone fleeing danger",
      "A visa that lets a tourist stay for one month or less",
      "A tax that every new arrival has to pay at the border",
      "A test that people take to drive in another country",
    ],
    0,
    "Asking for asylum is a legal right under international law.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Speed = ?",
    [
      "Distance ÷ time",
      "Distance × time",
      "Time ÷ distance",
      "Distance + time",
    ],
    0,
    "60 km in 2 hours is 60 ÷ 2 = 30 km/h.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.distance.map(([s, t], i) => distanceQ(`b-d${i + 1}`, s, t)),
  ...generated.b.speed.map(([d, t], i) => speedQ(`b-s${i + 1}`, d, t)),
  ...generated.b.time.map(([d, s], i) => timeQ(`b-t${i + 1}`, d, s)),
  choiceQ(
    "b-g1",
    "geography",
    "In 2022, millions of refugees fled which country after it was invaded?",
    ["Ukraine", "Spain", "Finland", "Portugal"],
    0,
    "Russia invaded in February 2022; Poland and Germany took in millions of Ukrainians.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Since 2023, the world's largest displacement crisis has been in…",
    ["Sudan", "Norway", "Chile", "New Zealand"],
    0,
    "Over 12 million Sudanese were forced from their homes by the war that began in April 2023.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "About how many people in the world are forced from their homes?",
    ["Over 100 million", "About 1 million", "About 10,000", "Under 1,000"],
    0,
    "The UN refugee agency (UNHCR) counted about 123 million in 2024.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Why was the Refugee Convention written in 1951?",
    [
      "After World War II, millions in Europe had no safe home",
      "A new ocean route made it faster to travel to America",
      "The first airplanes made it easier to visit other lands",
      "A world census found that most people had moved cities",
    ],
    0,
    "In 1939, the ship St. Louis was turned away with over 900 Jewish refugees, and many later died in the Holocaust.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What is the difference between a refugee and a migrant?",
    [
      "A refugee fled danger; a migrant may move for work or family",
      "A refugee always travels by boat; a migrant always flies",
      "A refugee is a child; a migrant is always an adult",
      "There is no difference; they mean exactly the same",
    ],
    0,
    "Refugees have special legal protection because going home isn't safe.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Time = ?",
    [
      "Distance ÷ speed",
      "Distance × speed",
      "Speed ÷ distance",
      "Speed − distance",
    ],
    0,
    "120 km at 40 km/h is 120 ÷ 40 = 3 hours.",
    HELP,
  ),
];

export const day20261113: Day = {
  date: DATE,
  title: "Day 47 — Speed, distance, and time",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Speed", "Distance and time", "Refugees"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
