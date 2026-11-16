import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-20.json";

const DATE = "2026-11-20";
const HELP = `/daily/${DATE}`;
const s = (n: number) => (n < 0 ? `(−${Math.abs(n)})` : String(n));
const plain = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const signRule = (a: number, b: number) =>
  a > 0 === b > 0 ? "Same signs give +" : "Different signs give −";

function mulQ(id: string, a: number, b: number): Question {
  const answer = a * b;
  return numericQ(
    id,
    `Work out ${s(a)} × ${s(b)}.`,
    answer,
    `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(answer)}. ${signRule(a, b)}: ${plain(answer)}.`,
    HELP,
  );
}

function divQ(id: string, a: number, b: number): Question {
  const answer = a / b;
  return numericQ(
    id,
    `Work out ${s(a)} ÷ ${s(b)}.`,
    answer,
    `${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(answer)}. ${signRule(a, b)}: ${plain(answer)}.`,
    HELP,
  );
}

function tripleQ(id: string, a: number, b: number, c: number): Question {
  const answer = a * b * c;
  const minuses = [a, b, c].filter((x) => x < 0).length;
  return numericQ(
    id,
    `Work out ${s(a)} × ${s(b)} × ${s(c)}.`,
    answer,
    `${Math.abs(a)} × ${Math.abs(b)} × ${Math.abs(c)} = ${Math.abs(answer)}. ${minuses} minus sign${minuses === 1 ? "" : "s"}: ${minuses % 2 === 0 ? "even, so +" : "odd, so −"}. Answer ${plain(answer)}.`,
    HELP,
  );
}

const versionA: Question[] = [
  ...generated.a.mul.map(([a, b], i) => mulQ(`a-x${i + 1}`, a, b)),
  ...generated.a.div.map(([a, b], i) => divQ(`a-d${i + 1}`, a, b)),
  ...generated.a.triple.map(([a, b, c], i) =>
    tripleQ(`a-t${i + 1}`, a, b, c),
  ),
  choiceQ(
    "a-g1",
    "geography",
    "Malala Yousafzai was shot for speaking up for girls' education in which country?",
    ["Pakistan", "Peru", "Portugal", "Poland"],
    0,
    "In 2012, at 15. She survived and won the Nobel Peace Prize at 17.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Which is the only UN member country that has not ratified the Convention on the Rights of the Child?",
    ["The United States", "France", "The United Kingdom", "Brazil"],
    0,
    "The US signed it in 1995 but never ratified it.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "When did the UN adopt the Convention on the Rights of the Child?",
    ["November 20, 1989", "July 4, 1776", "June 6, 1944", "January 1, 2000"],
    0,
    "That's why November 20 is World Children's Day.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "Malala won the Nobel Peace Prize at 17, in…",
    ["2014", "1964", "1989", "2024"],
    0,
    "She is the youngest Nobel winner ever.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "Which of these is a right in the Convention on the Rights of the Child?",
    [
      "To go to school and to be heard on things that affect you",
      "To drive a car on any road once you turn 12 years old",
      "To skip school whenever there is a test you dislike",
      "To vote in every election from the age of 10",
    ],
    0,
    "It also includes health care, safety from harm, play, and a name and nationality.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "A negative number times a negative number is…",
    ["Positive", "Negative", "Zero", "It depends on the size"],
    0,
    "Same signs give +: (−3) × (−4) = 12.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.mul.map(([a, b], i) => mulQ(`b-x${i + 1}`, a, b)),
  ...generated.b.div.map(([a, b], i) => divQ(`b-d${i + 1}`, a, b)),
  ...generated.b.triple.map(([a, b, c], i) =>
    tripleQ(`b-t${i + 1}`, a, b, c),
  ),
  choiceQ(
    "b-g1",
    "geography",
    "Iqbal Masih, who spoke out against child labor in carpet factories, was from…",
    ["Pakistan", "Sweden", "Canada", "Portugal"],
    0,
    "He escaped forced labor at 10 and became a famous activist before he was killed at 12.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "About how many children worldwide are not in school?",
    ["About 250 million", "About 2,000", "About 25,000", "About 2.5 billion"],
    0,
    "UNESCO's estimate; girls in war zones are the most likely to miss out.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Why is November 20 World Children's Day?",
    [
      "The UN adopted the children's rights convention that day in 1989",
      "It was the birthday of the first child born in the United States",
      "The first public school in the world opened on that day",
      "It marks the end of the school year in most countries",
    ],
    0,
    "It is the most widely ratified human rights treaty in history.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "In 2018, after a school shooting, students in the US organized…",
    [
      "March for Our Lives, one of the biggest youth protests in US history",
      "A strike to make the school day two hours shorter everywhere",
      "A contest to design a new flag for every state in the country",
      "A campaign to cancel all homework in American high schools",
    ],
    0,
    "Young people can't vote, but they can organize and be heard.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "Under the Convention, a “child” is anyone under the age of…",
    ["18", "10", "13", "21"],
    0,
    "So the rights cover you until you turn 18.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "(−2) × (−3) × (−4) is…",
    ["Negative, because 3 minus signs is odd", "Positive, because negatives cancel", "Zero", "Positive, because 2, 3, and 4 are small"],
    0,
    "2 × 3 × 4 = 24, and an odd number of minus signs gives −24.",
    HELP,
  ),
];

export const day20261120: Day = {
  date: DATE,
  title: "Day 51 — Multiplying and dividing negatives",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Negative numbers", "Sign rules", "Children's rights"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
