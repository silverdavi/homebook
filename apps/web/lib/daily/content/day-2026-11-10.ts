import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { applyOrder, choiceQ } from "./banks/choice";
import generated from "./generated/2026-11-10.json";

const DATE = "2026-11-10";
const HELP = `/daily/${DATE}`;
const s = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));

type Form = "add" | "sub" | "mul" | "div";
const UNDO: Record<Form, string> = {
  add: "subtract",
  sub: "add",
  mul: "divide by",
  div: "multiply by",
};

export function equationQ(
  id: string,
  form: Form,
  a: number,
  b: number,
): Question {
  const text = {
    add: `x + ${a} = ${s(b)}`,
    sub: `x − ${a} = ${s(b)}`,
    mul: `${a}x = ${b}`,
    div: `x ÷ ${a} = ${b}`,
  }[form];
  const x = { add: b - a, sub: b + a, mul: b / a, div: b * a }[form];
  return numericQ(
    id,
    `Solve ${text}. What is x?`,
    x,
    `${UNDO[form][0].toUpperCase()}${UNDO[form].slice(1)} ${a} on both sides: x = ${s(x)}.`,
    HELP,
  );
}

function wordQ(id: string, price: number, count: number): Question {
  const total = price * count;
  return numericQ(
    id,
    `Tickets cost $${price} each. x tickets cost $${total}. Solve ${price}x = ${total}. What is x?`,
    count,
    `${total} ÷ ${price} = ${count} tickets.`,
    HELP,
    { unit: "tickets" },
  );
}

const versionA: Question[] = [
  ...generated.a.addsub.map(([f, a, b], i) =>
    equationQ(`a-p${i + 1}`, f as Form, Number(a), Number(b)),
  ),
  ...generated.a.muldiv.map(([f, a, b], i) =>
    equationQ(`a-t${i + 1}`, f as Form, Number(a), Number(b)),
  ),
  ...generated.a.word.map(([p, c], i) => wordQ(`a-w${i + 1}`, p, c)),
  choiceQ(
    "a-g1",
    "geography",
    "In 2013, the Rana Plaza garment factory collapsed in which country?",
    ["Bangladesh", "Mexico", "Italy", "Canada"],
    0,
    "1,134 workers died. Cracks were found the day before, but workers were ordered back in.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Why do US states have different minimum wages?",
    [
      "States can set their own, as long as it's at least the federal one",
      "The federal government sets a different wage for each state",
      "Each state's wage depends on how close it is to the ocean",
      "Only states with big cities are allowed to have a minimum wage",
    ],
    0,
    "Washington state is over $16 an hour; about 20 states still use $7.25.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "The “Fight for $15” was started in 2012 by…",
    [
      "Fast-food workers in New York City",
      "Bank owners in Chicago and Boston",
      "Members of the US Senate in Washington",
      "Car companies in Detroit, Michigan",
    ],
    0,
    "About 200 workers walked out. Since then, many states and cities raised wages to $15 or more.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "When was the US federal minimum wage last raised?",
    ["2009", "1938", "1990", "2024"],
    0,
    "It has been $7.25 since 2009, so prices rose while it stayed the same.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What is a “living wage”?",
    [
      "Pay high enough to cover rent, food, and basics where you live",
      "The lowest pay that a company is allowed to give by law",
      "Pay that is given only to workers who live at their job",
      "The pay a worker gets after they have retired from a job",
    ],
    0,
    "In most US cities, a living wage is far above $7.25.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "A “Fair Trade” label on coffee or chocolate means…",
    [
      "The farmers were paid a fair minimum price",
      "The product was made in the United States",
      "The product was sold at a lower price",
      "The product was made only by machines",
    ],
    0,
    "It also bans child labor and funds things like schools in farming towns.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...generated.b.addsub.map(([f, a, b], i) =>
    equationQ(`b-p${i + 1}`, f as Form, Number(a), Number(b)),
  ),
  ...generated.b.muldiv.map(([f, a, b], i) =>
    equationQ(`b-t${i + 1}`, f as Form, Number(a), Number(b)),
  ),
  ...generated.b.word.map(([p, c], i) => wordQ(`b-w${i + 1}`, p, c)),
  choiceQ(
    "b-g1",
    "geography",
    "Many of the world's clothes are sewn in which country?",
    ["Bangladesh", "Iceland", "Switzerland", "New Zealand"],
    0,
    "Garment work is about 80% of Bangladesh's exports; many workers earn about $100 a month.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "About how many children worldwide work instead of going to school?",
    ["About 140 million", "About 1 million", "About 10,000", "None"],
    0,
    "Most work on farms, often for their families. The number is falling, but slowly.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What happened after the Rana Plaza collapse in 2013?",
    [
      "Over 200 brands signed a deal to pay for factory safety checks",
      "All clothing factories in Asia were closed down for good",
      "Clothes became illegal to import into Europe and America",
      "Workers in Bangladesh were banned from joining a union",
    ],
    0,
    "The Bangladesh Accord: inspections, repairs, and the right to refuse unsafe work.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "What is the US federal minimum wage per hour?",
    ["$7.25", "$15.00", "$2.50", "$20.00"],
    0,
    "Unchanged since 2009. Many states and cities set higher ones.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What is a labor union?",
    [
      "Workers who join together to bargain with their employer",
      "A company that owns many shops in different cities",
      "A government office that collects taxes from workers",
      "A bank that lends money to workers who need it",
    ],
    0,
    "Together, workers can ask for better pay and safety than one person alone.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Why does a minimum wage that stays the same for years lose value?",
    [
      "Prices go up over time, so the same pay buys less",
      "Money is printed in a new color every few years",
      "Workers have to pay a bigger fee to their bank",
      "Stores stop taking bills that are more than 5 years old",
    ],
    0,
    "That's inflation. $7.25 buys much less today than it did in 2009.",
    HELP,
  ),
];

export const day20261110: Day = {
  date: DATE,
  title: "Day 45 — One-step equations: undo it",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Equations", "Inverse operations", "Fair wages"],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
