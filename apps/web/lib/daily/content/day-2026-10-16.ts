import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";

const DATE = "2026-10-16";
const HELP = "/fractions";

function percentQ(id: string, percent: number, whole: number): Question {
  const answer = (percent / 100) * whole;
  return numericQ(
    id,
    `What is ${percent}% of ${whole}?`,
    answer,
    `${percent}% of ${whole} = ${percent / 100} × ${whole} = ${answer}.`,
    HELP,
  );
}

function discountQ(id: string, price: number, percent: number): Question {
  const discount = (percent / 100) * price;
  const answer = price - discount;
  return numericQ(
    id,
    `A $${price} item is ${percent}% off. What is the new price?`,
    answer,
    `The discount is ${percent}% of $${price} = $${discount}. $${price} − $${discount} = $${answer}.`,
    HELP,
    { unit: "dollars" },
  );
}

function moneyPartQ(id: string, label: string, percent: number, amount: number): Question {
  const answer = (percent / 100) * amount;
  return numericQ(
    id,
    `${label}: what is ${percent}% of $${amount}?`,
    answer,
    `${percent}% of $${amount} = $${answer}.`,
    HELP,
    { unit: "dollars" },
  );
}

const versionA: Question[] = [
  percentQ("a-p1", 10, 80),
  percentQ("a-p2", 25, 80),
  percentQ("a-p3", 50, 46),
  percentQ("a-p4", 20, 45),
  percentQ("a-p5", 5, 200),
  percentQ("a-p6", 75, 40),
  percentQ("a-p7", 15, 60),
  percentQ("a-p8", 30, 90),
  percentQ("a-p9", 40, 70),
  percentQ("a-p10", 12.5, 80),
  percentQ("a-p11", 1, 300),
  percentQ("a-p12", 60, 50),
  discountQ("a-d1", 40, 25),
  discountQ("a-d2", 75, 20),
  discountQ("a-d3", 120, 10),
  discountQ("a-d4", 36, 50),
  moneyPartQ("a-w1", "Discount amount", 15, 80),
  moneyPartQ("a-w2", "Tip amount", 20, 35),
];

const versionB: Question[] = [
  percentQ("b-p1", 10, 130),
  percentQ("b-p2", 25, 60),
  percentQ("b-p3", 50, 74),
  percentQ("b-p4", 20, 85),
  percentQ("b-p5", 5, 140),
  percentQ("b-p6", 75, 20),
  percentQ("b-p7", 15, 80),
  percentQ("b-p8", 30, 70),
  percentQ("b-p9", 40, 90),
  percentQ("b-p10", 12.5, 40),
  percentQ("b-p11", 1, 500),
  percentQ("b-p12", 60, 30),
  discountQ("b-d1", 60, 25),
  discountQ("b-d2", 90, 20),
  discountQ("b-d3", 150, 10),
  discountQ("b-d4", 52, 50),
  moneyPartQ("b-w1", "Discount amount", 15, 60),
  moneyPartQ("b-w2", "Tip amount", 20, 45),
];

export const day20261016: Day = {
  date: DATE,
  title: "Day 31 — Percent means out of 100",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Percent anchors", "Discounts", "Tips"],
  versionA,
  versionB,
};
