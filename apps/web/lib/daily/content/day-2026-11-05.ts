import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-05.json";

const DATE = "2026-11-05";
const HELP = `/daily/${DATE}`;

function upQ(id: string, old: number, p: number): Question {
  const change = (old * p) / 100;
  return numericQ(
    id,
    `A $${old} bike goes up in price by ${p}%. What is the new price in dollars?`,
    old + change,
    `${p}% of $${old} is $${change}. $${old} + $${change} = $${old + change}.`,
    HELP,
    { unit: "dollars" },
  );
}

function downQ(id: string, old: number, p: number): Question {
  const change = (old * p) / 100;
  return numericQ(
    id,
    `A $${old} jacket is ${p}% off. What is the sale price in dollars?`,
    old - change,
    `${p}% of $${old} is $${change}. $${old} − $${change} = $${old - change}.`,
    HELP,
    { unit: "dollars" },
  );
}

function findQ(id: string, old: number, now: number): Question {
  const change = Math.abs(now - old);
  const answer = (change * 100) / old;
  const way = now > old ? "up" : "down";
  return numericQ(
    id,
    `A price went from $${old} to $${now}. By what percent did it go ${way}?`,
    answer,
    `The change is $${change}. $${change} ÷ $${old} = ${answer}%.`,
    HELP,
    { unit: "%" },
  );
}

const versionA: Question[] = [
  ...generated.a.up.map(([o, p], i) => upQ(`a-u${i + 1}`, o, p)),
  ...generated.a.down.map(([o, p], i) => downQ(`a-d${i + 1}`, o, p)),
  ...generated.a.find.map(([o, n], i) => findQ(`a-f${i + 1}`, o, n)),
  choiceQ(
    "a-g1",
    "geography",
    "Which country has put the most carbon dioxide into the air in total, since 1850?",
    ["The United States", "The United Kingdom", "Saudi Arabia", "South Africa"],
    0,
    "China emits the most each year now, but the US has emitted the most over time.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Why are low island nations like Tuvalu especially at risk?",
    [
      "Rising seas can flood land that is only a few meters high",
      "They are too far north, so their ice is melting fastest",
      "Their volcanoes erupt more often as the planet warms up",
      "They have no rain, so every farm on them has to close",
    ],
    0,
    "Most of Tuvalu is less than 3 meters above sea level.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What did almost every country agree to in the 2015 Paris Agreement?",
    [
      "Keep warming well below 2°C, and aim for 1.5°C",
      "Stop using all oil and gas by the end of 2016",
      "Move every city at risk of floods to higher ground",
      "Let each country decide whether warming is real",
    ],
    0,
    "Each country sets its own plan to cut emissions and updates it every 5 years.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "What started the big rise in carbon dioxide in the air?",
    [
      "Burning coal in factories and engines, from the 1700s",
      "Volcanoes that all erupted at once in the 1800s",
      "People breathing out more as the population grew",
      "The Sun getting hotter during the last 200 years",
    ],
    0,
    "From the 1700s, coal powered steam engines, then oil and gas powered cars and power plants.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What is the greenhouse effect?",
    [
      "Gases in the air trap heat, like a blanket around Earth",
      "Plants growing faster because they get more sunlight",
      "The ozone layer letting extra light reach the ground",
      "Heat escaping to space faster than it arrives from the Sun",
    ],
    0,
    "Some trapped heat keeps Earth livable. Adding more carbon dioxide traps too much.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Which of these produces electricity without burning fuel?",
    ["Solar panels", "A coal plant", "A gas plant", "A diesel generator"],
    0,
    "Solar and wind are now the cheapest new electricity in most of the world.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.up.map(([o, p], i) => upQ(`b-u${i + 1}`, o, p)),
  ...generated.b.down.map(([o, p], i) => downQ(`b-d${i + 1}`, o, p)),
  ...generated.b.find.map(([o, n], i) => findQ(`b-f${i + 1}`, o, n)),
  choiceQ(
    "b-g1",
    "geography",
    "Which country emits the most carbon dioxide each year today?",
    ["China", "Brazil", "Nigeria", "Australia"],
    0,
    "China emits the most per year; per person, the US emits about twice as much as China.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "In 2022, floods covered about a third of which country?",
    ["Pakistan", "Canada", "Norway", "Chile"],
    0,
    "Pakistan causes under 1% of world emissions but suffered about $30 billion in damage.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "At the 2022 climate talks (COP27), countries agreed to set up a fund for…",
    [
      "Loss and damage: helping poor countries hit by climate disasters",
      "Building new coal plants in every country that wanted one",
      "Paying oil companies to keep selling gas at a lower price",
      "Sending rockets to cool the Sun with a giant space shade",
    ],
    0,
    "Poor countries pushed for decades: those who caused the least harm suffer the most.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Greta Thunberg started her school strike for climate in…",
    ["2018", "1968", "1995", "2024"],
    0,
    "At 15 she sat outside Sweden's parliament; millions of students joined in 2019.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "Which gas is the main cause of global warming?",
    ["Carbon dioxide", "Oxygen", "Nitrogen", "Helium"],
    0,
    "It comes mostly from burning coal, oil, and gas.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Why do scientists say “climate,” not “weather,” for warming?",
    [
      "Climate is the average over many years; weather is one day",
      "Climate only means the temperature at the North Pole",
      "Weather is measured by satellites and climate is not",
      "Climate is the word for rain, and weather is for wind",
    ],
    0,
    "One cold day doesn't disprove warming, just as one hot day doesn't prove it.",
    HELP,
  ),
];

export const day20261105: Day = {
  date: DATE,
  title: "Day 42 — Percent increase and decrease",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Percent change", "Discounts", "Climate change"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
