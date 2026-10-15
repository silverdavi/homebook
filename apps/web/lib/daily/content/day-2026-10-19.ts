import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";

const DATE = "2026-10-19";
const HELP = `/daily/${DATE}`;

function rateQ(
  id: string,
  prompt: string,
  total: number,
  count: number,
  unit: string,
): Question {
  const answer = total / count;
  return numericQ(
    id,
    prompt,
    answer,
    `${total} ÷ ${count} = ${answer} ${unit}.`,
    HELP,
    { unit },
  );
}

const versionA: Question[] = [
  rateQ("a-r1", "180 miles in 3 hours. How many miles per hour?", 180, 3, "mph"),
  rateQ("a-r2", "4 notebooks cost $12. What is the cost per notebook?", 12, 4, "dollars"),
  rateQ("a-r3", "6 cans cost $9. What is the cost per can?", 9, 6, "dollars"),
  rateQ("a-r4", "240 words in 4 minutes. How many words per minute?", 240, 4, "words/min"),
  rateQ("a-r5", "72 pages in 6 days. How many pages per day?", 72, 6, "pages/day"),
  rateQ("a-r6", "350 miles on 10 gallons. How many miles per gallon?", 350, 10, "mpg"),
  rateQ("a-r7", "8 apples cost $6. What is the cost per apple?", 6, 8, "dollars"),
  rateQ("a-r8", "45 points in 5 games. How many points per game?", 45, 5, "points/game"),
  rateQ("a-r9", "126 miles in 2 hours. How many miles per hour?", 126, 2, "mph"),
  rateQ("a-r10", "15 ounces fill 3 cups. How many ounces per cup?", 15, 3, "oz/cup"),
  rateQ("a-r11", "7 tickets cost $49. What is the cost per ticket?", 49, 7, "dollars"),
  rateQ("a-r12", "96 problems in 8 sets. How many per set?", 96, 8, "problems/set"),
  rateQ("a-r13", "A printer makes 84 pages in 7 minutes. Pages per minute?", 84, 7, "pages/min"),
  rateQ("a-r14", "5 pounds cost $17.50. Cost per pound?", 17.5, 5, "dollars"),
  rateQ("a-r15", "144 miles in 6 hours. Miles per hour?", 144, 6, "mph"),
  rateQ("a-r16", "9 bottles hold 13.5 liters. Liters per bottle?", 13.5, 9, "L/bottle"),
  rateQ("a-r17", "A runner covers 12 miles in 2 hours. Miles per hour?", 12, 2, "mph"),
  rateQ("a-r18", "20 pencils cost $5. Cost per pencil?", 5, 20, "dollars"),
];

const versionB: Question[] = [
  rateQ("b-r1", "210 miles in 3 hours. How many miles per hour?", 210, 3, "mph"),
  rateQ("b-r2", "5 notebooks cost $15. What is the cost per notebook?", 15, 5, "dollars"),
  rateQ("b-r3", "8 cans cost $12. What is the cost per can?", 12, 8, "dollars"),
  rateQ("b-r4", "300 words in 5 minutes. How many words per minute?", 300, 5, "words/min"),
  rateQ("b-r5", "84 pages in 7 days. How many pages per day?", 84, 7, "pages/day"),
  rateQ("b-r6", "420 miles on 12 gallons. How many miles per gallon?", 420, 12, "mpg"),
  rateQ("b-r7", "10 apples cost $7.50. What is the cost per apple?", 7.5, 10, "dollars"),
  rateQ("b-r8", "56 points in 7 games. How many points per game?", 56, 7, "points/game"),
  rateQ("b-r9", "156 miles in 2 hours. How many miles per hour?", 156, 2, "mph"),
  rateQ("b-r10", "24 ounces fill 4 cups. How many ounces per cup?", 24, 4, "oz/cup"),
  rateQ("b-r11", "8 tickets cost $60. What is the cost per ticket?", 60, 8, "dollars"),
  rateQ("b-r12", "108 problems in 9 sets. How many per set?", 108, 9, "problems/set"),
  rateQ("b-r13", "A printer makes 96 pages in 8 minutes. Pages per minute?", 96, 8, "pages/min"),
  rateQ("b-r14", "4 pounds cost $15. Cost per pound?", 15, 4, "dollars"),
  rateQ("b-r15", "175 miles in 5 hours. Miles per hour?", 175, 5, "mph"),
  rateQ("b-r16", "6 bottles hold 9 liters. Liters per bottle?", 9, 6, "L/bottle"),
  rateQ("b-r17", "A runner covers 15 miles in 3 hours. Miles per hour?", 15, 3, "mph"),
  rateQ("b-r18", "25 pencils cost $6.25. Cost per pencil?", 6.25, 25, "dollars"),
];

export const day20261019: Day = {
  date: DATE,
  title: "Day 32 — Make it per 1",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Unit rates", "Price comparisons", "Always write the unit"],
  versionA,
  versionB,
};
