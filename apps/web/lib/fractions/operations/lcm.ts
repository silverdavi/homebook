/**
 * Least Common Multiple.
 *
 * Pedagogy: list multiples of each number until one appears in both —
 * that's the LCM. LCM is the smallest common denominator when adding
 * or subtracting unlike fractions.
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { lcm, multiplesOf, rnd } from "../shared";

interface Cfg {
  range: [number, number];
}

const LEVELS = [
  { id: 1, label: "Small (≤ 8)",        cfg: { range: [2, 8] }   satisfies Cfg },
  { id: 2, label: "Medium (≤ 12)",      cfg: { range: [3, 12] }  satisfies Cfg },
  { id: 3, label: "Larger (≤ 20)",      cfg: { range: [4, 20] }  satisfies Cfg },
];

function genProblem(level: number): FractionProblem {
  const cfg = LEVELS[level - 1]?.cfg as Cfg | undefined;
  const [min, max] = cfg?.range ?? [2, 8];
  let a = 0;
  let b = 0;
  for (let tries = 0; tries < 200; tries++) {
    a = rnd(min, max);
    b = rnd(min, max);
    if (a === b) continue;
    break;
  }
  if (a > b) [a, b] = [b, a];
  const answer = lcm(a, b);
  // Show enough multiples that the LCM is visible in both lists.
  const count = Math.max(4, Math.ceil(answer / Math.min(a, b)));

  return {
    op: "lcm",
    why: "LCM is the smallest common denominator — it lets you rewrite two fractions so they share a denominator and can be added or subtracted.",
    equation: [
      { kind: "operator", id: "label", text: "LCM(" },
      { kind: "integer", id: "a", value: a, tone: "violet" },
      { kind: "operator", id: "comma", text: "," },
      { kind: "integer", id: "b", value: b, tone: "amber" },
      { kind: "operator", id: "rparen", text: ")" },
      { kind: "operator", id: "eq", text: "=" },
      { kind: "integer", id: "ans", field: "answer", tone: "emerald" },
    ],
    fields: [{ id: "answer", label: "LCM", expected: answer, size: "lg" }],
    steps: [
      {
        fieldId: "answer",
        title: `Least common multiple of ${a} and ${b}`,
        lines: [
          `Multiples of **${a}**: ${multiplesOf(a, count).join(", ")}…`,
          `Multiples of **${b}**: ${multiplesOf(b, count).join(", ")}…`,
          `The **smallest** number that appears in both is **${answer}**.`,
        ],
        hint: `Scan the two rows below for the first match. Answer: **${answer}**.`,
      },
    ],
    visual: {
      kind: "multiples",
      a,
      b,
      highlight: answer,
      count,
      revealAfterField: "answer",
    },
  };
}

const op: FractionOpModule = {
  id: "lcm",
  label: "LCM",
  symbol: "⌣",
  blurb: "Least Common Multiple",
  levels: LEVELS,
  genProblem,
};

export default op;
