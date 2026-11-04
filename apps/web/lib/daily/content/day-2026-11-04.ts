import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-04.json";

const DATE = "2026-11-04";
const HELP = `/daily/${DATE}`;

function unitQ(id: string, total: number, count: number): Question {
  const each = total / count;
  return numericQ(
    id,
    `${count} notebooks cost $${total}. How many dollars is 1 notebook?`,
    each,
    `Unit rate: $${total} ÷ ${count} = $${each} each.`,
    HELP,
    { unit: "dollars" },
  );
}

function equivalentQ(id: string, a: number, b: number, c: number): Question {
  const times = c / a;
  const answer = b * times;
  return numericQ(
    id,
    `A recipe uses ${a} cups of flour for every ${b} cups of water. With ${c} cups of flour, how many cups of water?`,
    answer,
    `${c} ÷ ${a} = ${times} times the recipe, so ${b} × ${times} = ${answer} cups.`,
    HELP,
    { unit: "cups" },
  );
}

function shareQ(id: string, total: number, a: number, b: number): Question {
  const part = total / (a + b);
  const answer = part * Math.max(a, b);
  return numericQ(
    id,
    `Split $${total} in the ratio ${a} : ${b}. How many dollars is the bigger share?`,
    answer,
    `${a} + ${b} = ${a + b} parts. $${total} ÷ ${a + b} = $${part} per part. ${Math.max(a, b)} × $${part} = $${answer}.`,
    HELP,
    { unit: "dollars" },
  );
}

const versionA: Question[] = [
  ...generated.a.unit.map(([t, n], i) => unitQ(`a-u${i + 1}`, t, n)),
  ...generated.a.equivalent.map(([a, b, c], i) =>
    equivalentQ(`a-e${i + 1}`, a, b, c),
  ),
  ...generated.a.share.map(([t, a, b], i) => shareQ(`a-s${i + 1}`, t, a, b)),
  choiceQ(
    "a-g1",
    "geography",
    "In a US presidential election, how many electoral votes does a candidate need to win?",
    ["270", "100", "435", "538"],
    0,
    "There are 538 electoral votes in total; a majority is 270.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Why do a few “swing states” get most of the campaign attention?",
    [
      "Either party could win them, so they decide the Electoral College",
      "They are the largest states by land area in the whole country",
      "Only swing states are allowed to vote for the president",
      "They hold their elections a week before the other states",
    ],
    0,
    "Most states reliably vote one way, so campaigns focus where the result is close.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What did the 19th Amendment (1920) do?",
    [
      "Guaranteed women the right to vote",
      "Lowered the voting age to 18",
      "Ended poll taxes in federal elections",
      "Gave senators six-year terms",
    ],
    0,
    "Women won the vote after decades of organizing, marching, and going to jail for it.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "What did the Voting Rights Act of 1965 fight against?",
    [
      "Rules like literacy tests used to stop Black citizens from voting",
      "Rules that let people mail in their ballots from far away",
      "Rules that gave each state two senators no matter its size",
      "Rules that set the date of Election Day in early November",
    ],
    0,
    "It followed the Selma marches; voter registration among Black Southerners rose sharply.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "A “midterm” election happens…",
    [
      "Halfway through a president's four-year term",
      "Only when a president leaves office early",
      "Every year in the middle of the summer",
      "Only in states that have a new governor",
    ],
    0,
    "Midterms choose all 435 House seats and about a third of the Senate.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "How old do you have to be to vote in US federal elections?",
    ["18", "16", "21", "25"],
    0,
    "The 26th Amendment (1971) lowered it from 21 to 18.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.unit.map(([t, n], i) => unitQ(`b-u${i + 1}`, t, n)),
  ...generated.b.equivalent.map(([a, b, c], i) =>
    equivalentQ(`b-e${i + 1}`, a, b, c),
  ),
  ...generated.b.share.map(([t, a, b], i) => shareQ(`b-s${i + 1}`, t, a, b)),
  choiceQ(
    "b-g1",
    "geography",
    "How many seats are in the US House of Representatives?",
    ["435", "100", "50", "538"],
    0,
    "Seats are shared out by population, so California has 52 and Wyoming has 1.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "Every state has 2 senators. What does that mean for voters?",
    [
      "A voter in a small state has more say in the Senate than one in a big state",
      "Every voter in the country has exactly the same say in the Senate",
      "Big states get extra senators to make up for their size",
      "Senators are chosen by the president, not by voters",
    ],
    0,
    "Wyoming (about 580,000 people) and California (about 39 million) each get 2.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "Which amendment lowered the voting age to 18?",
    ["The 26th", "The 1st", "The 13th", "The 19th"],
    0,
    "Passed in 1971: if 18-year-olds could be drafted to Vietnam, they should be able to vote.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "What was a poll tax?",
    [
      "A fee to vote, used to keep poor and Black citizens from voting",
      "A tax on newspapers that printed the results of elections",
      "A fee that candidates paid to put their names on the ballot",
      "A tax on the companies that built the voting machines",
    ],
    0,
    "The 24th Amendment (1964) banned poll taxes in federal elections.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "How long is one term in the US House of Representatives?",
    ["2 years", "4 years", "6 years", "8 years"],
    0,
    "That's why every House seat is on the ballot in every even year.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Why is a secret ballot important?",
    [
      "No one can pressure or punish you for how you voted",
      "It makes the votes faster for officials to count",
      "It lets each person vote more than one time",
      "It keeps the names of the candidates hidden",
    ],
    0,
    "Before secret ballots, bosses and landlords could watch how people voted.",
    HELP,
  ),
];

export const day20261104: Day = {
  date: DATE,
  title: "Day 41 — Ratios and unit rates",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Ratios", "Unit rates", "Elections and voting rights"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
