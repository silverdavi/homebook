import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-06.json";

const DATE = "2026-11-06";
const HELP = `/daily/${DATE}`;

function bagQ(id: string, red: number, blue: number): Question {
  const total = red + blue;
  const answer = (red * 100) / total;
  return numericQ(
    id,
    `A bag has ${red} red marbles and ${blue} blue marbles. You pick one without looking. What is the percent chance it is red?`,
    answer,
    `${red} out of ${total} = ${answer} out of 100 = ${answer}%.`,
    HELP,
    { unit: "%" },
  );
}

function expectQ(id: string, sides: number, rolls: number): Question {
  const answer = rolls / sides;
  return numericQ(
    id,
    `You roll a fair ${sides}-sided die ${rolls} times. About how many times do you expect a 1?`,
    answer,
    `Each side has a 1 in ${sides} chance: ${rolls} ÷ ${sides} = ${answer}.`,
    HELP,
  );
}

function spinnerQ(
  id: string,
  red: number,
  parts: number,
  spins: number,
): Question {
  const answer = (spins * red) / parts;
  return numericQ(
    id,
    `A spinner has ${parts} equal parts, and ${red} of them are red. You spin ${spins} times. About how many times do you expect red?`,
    answer,
    `${spins} ÷ ${parts} = ${spins / parts} per part, × ${red} red parts = ${answer}.`,
    HELP,
  );
}

const versionA: Question[] = [
  ...generated.a.bag.map(([r, b], i) => bagQ(`a-b${i + 1}`, r, b)),
  ...generated.a.expect.map(([s, n], i) => expectQ(`a-e${i + 1}`, s, n)),
  ...generated.a.spinner.map(([r, p, n], i) =>
    spinnerQ(`a-s${i + 1}`, r, p, n),
  ),
  choiceQ(
    "a-g1",
    "geography",
    "Which is the largest Native nation by land in the United States?",
    ["The Navajo Nation", "The Cherokee Nation", "The Lakota", "The Seminole"],
    0,
    "The Navajo Nation is bigger than 10 US states, across Arizona, New Mexico, and Utah.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Where is the Standing Rock Sioux reservation?",
    [
      "North and South Dakota",
      "Florida and Georgia",
      "Maine and Vermont",
      "Oregon and Washington",
    ],
    0,
    "In 2016, thousands joined Standing Rock to protest the Dakota Access oil pipeline.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What was the Trail of Tears (1830s)?",
    [
      "The forced removal of the Cherokee and other nations from their homelands",
      "A trade route that Native nations built to sell furs to Europe",
      "A road that settlers built to reach the gold mines of California",
      "A peace treaty that gave Native nations land along the Mississippi",
    ],
    0,
    "Thousands of Cherokee died on the forced march to what is now Oklahoma.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "In 2020, the Supreme Court case McGirt v. Oklahoma ruled that…",
    [
      "Much of eastern Oklahoma is still Muscogee (Creek) land under a treaty",
      "Native nations no longer have any treaties with the United States",
      "Oklahoma must move all of its Native people to a different state",
      "Native people in Oklahoma are no longer allowed to vote",
    ],
    0,
    "The court said a treaty is a promise: Congress never ended the reservation, so it still exists.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "Why are Native nations called “sovereign”?",
    [
      "They have their own governments, laws, and courts",
      "They are part of Canada instead of the United States",
      "They have a king who is chosen by the US president",
      "They don't take part in any elections at all",
    ],
    0,
    "Treaties were signed nation to nation; that's the basis of tribal sovereignty.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "Which month is Native American Heritage Month?",
    ["November", "February", "July", "October"],
    0,
    "It has been every November since 1990.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.bag.map(([r, b], i) => bagQ(`b-b${i + 1}`, r, b)),
  ...generated.b.expect.map(([s, n], i) => expectQ(`b-e${i + 1}`, s, n)),
  ...generated.b.spinner.map(([r, p, n], i) =>
    spinnerQ(`b-s${i + 1}`, r, p, n),
  ),
  choiceQ(
    "b-g1",
    "geography",
    "About how many federally recognized Native nations are there in the US?",
    ["574", "12", "50", "2,000"],
    0,
    "Each has its own government; many more are still seeking recognition.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "The Navajo Nation spreads across which three states?",
    [
      "Arizona, New Mexico, and Utah",
      "Texas, Louisiana, and Florida",
      "Ohio, Indiana, and Illinois",
      "Maine, New York, and Vermont",
    ],
    0,
    "It's about 27,000 square miles, bigger than West Virginia.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What did the Indian Removal Act of 1830 do?",
    [
      "Let the government force Native nations off their land in the East",
      "Gave every Native person US citizenship and the right to vote",
      "Created the first national parks on land that Native nations chose",
      "Ended all wars between the United States and Native nations",
    ],
    0,
    "It led to the Trail of Tears and the removal of the Cherokee, Muscogee, Seminole, Chickasaw, and Choctaw.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "Why did people protest at Standing Rock in 2016?",
    [
      "An oil pipeline threatened the tribe's water and sacred sites",
      "The state wanted to build a new airport on the reservation",
      "The tribe was told it could no longer hold its own elections",
      "A dam was going to make a lake bigger for boats and fishing",
    ],
    0,
    "The rallying cry was “Mni Wiconi”: water is life.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What is a treaty?",
    [
      "A written agreement between nations",
      "A speech given by the president",
      "A tax paid on land",
      "A kind of court case",
    ],
    0,
    "The US signed about 370 treaties with Native nations, and broke many of them.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "When did all Native Americans born in the US become citizens?",
    ["1924", "1776", "1865", "1990"],
    0,
    "The Indian Citizenship Act of 1924; some states still blocked them from voting into the 1950s.",
    HELP,
  ),
];

export const day20261106: Day = {
  date: DATE,
  title: "Day 43 — Probability: what to expect",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Probability", "Expected counts", "Native nations today"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
