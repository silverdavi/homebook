/**
 * Greatest Common Factor (a.k.a. GCD).
 *
 * Pedagogy: students see two numbers and the lists of every divisor of
 * each. The biggest one that appears in *both* lists is the answer.
 * GCF is the foundation for simplifying fractions to lowest terms.
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { factorsOf, gcd, rnd } from "../shared";

interface Cfg {
  range: [number, number];
  requireGtOne?: boolean;
}

const LEVELS = [
  { id: 1, label: "Small numbers (≤ 20)",  cfg: { range: [4, 20] }  satisfies Cfg },
  { id: 2, label: "Medium (≤ 50)",         cfg: { range: [10, 50], requireGtOne: true } satisfies Cfg },
  { id: 3, label: "Larger (≤ 100)",        cfg: { range: [20, 100], requireGtOne: true } satisfies Cfg },
];

function genPair(cfg: Cfg): [number, number] {
  const [min, max] = cfg.range;
  for (let tries = 0; tries < 400; tries++) {
    const a = rnd(min, max);
    const b = rnd(min, max);
    if (a === b) continue;
    if (cfg.requireGtOne && gcd(a, b) === 1) continue;
    return [Math.min(a, b), Math.max(a, b)];
  }
  return [12, 18];
}

function genProblem(level: number): FractionProblem {
  const cfg = LEVELS[level - 1]?.cfg as Cfg | undefined;
  const [a, b] = genPair(cfg ?? { range: [4, 20] });
  const answer = gcd(a, b);
  return {
    op: "gcf",
    why: "GCF lets you simplify fractions to lowest terms in one step — instead of dividing top and bottom over and over.",
    equation: [
      { kind: "operator", id: "label", text: "GCF(" },
      { kind: "integer", id: "a", value: a, tone: "violet" },
      { kind: "operator", id: "comma", text: "," },
      { kind: "integer", id: "b", value: b, tone: "amber" },
      { kind: "operator", id: "rparen", text: ")" },
      { kind: "operator", id: "eq", text: "=" },
      { kind: "integer", id: "ans", field: "answer", tone: "emerald" },
    ],
    fields: [{ id: "answer", label: "GCF", expected: answer, size: "lg" }],
    steps: [
      {
        fieldId: "answer",
        title: `Greatest common factor of ${a} and ${b}`,
        lines: [
          `List all factors of **${a}**: ${factorsOf(a).join(", ")}.`,
          `List all factors of **${b}**: ${factorsOf(b).join(", ")}.`,
          `The **biggest** number that appears in both lists is **${answer}**.`,
        ],
        hint: `Look at the factor lists below — find the largest number on both. Answer: **${answer}**.`,
      },
    ],
    visual: {
      kind: "factors",
      a,
      b,
      highlight: answer,
      revealAfterField: "answer",
    },
  };
}

const op: FractionOpModule = {
  id: "gcf",
  label: "GCF",
  symbol: "⌒",
  blurb: "Greatest Common Factor",
  levels: LEVELS,
  genProblem,
};

export default op;
