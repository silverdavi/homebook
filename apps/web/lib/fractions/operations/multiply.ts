/**
 * Fraction multiplication.
 *
 * Pedagogy: numerators × numerators, denominators × denominators, then
 * simplify. Visual: shrinking pies (a fraction OF a fraction).
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { gcd, rnd, simplify } from "../shared";

interface Cfg {
  dRange: [number, number];
  /** Require the result to need simplification. */
  requireSimplify?: boolean;
}

const LEVELS = [
  { id: 1, label: "Easy (denoms ≤ 6)",       cfg: { dRange: [2, 6] }                       satisfies Cfg },
  { id: 2, label: "Needs simplifying",       cfg: { dRange: [3, 9],  requireSimplify: true } satisfies Cfg },
  { id: 3, label: "Larger (denoms ≤ 12)",    cfg: { dRange: [4, 12], requireSimplify: true } satisfies Cfg },
];

function genProblem(level: number): FractionProblem {
  const cfg = LEVELS[level - 1]?.cfg as Cfg | undefined;
  const c = cfg ?? (LEVELS[0].cfg as Cfg);
  let a = 1;
  let b = 2;
  let cN = 1;
  let d = 2;
  for (let tries = 0; tries < 400; tries++) {
    b = rnd(c.dRange[0], c.dRange[1]);
    d = rnd(c.dRange[0], c.dRange[1]);
    a = rnd(1, b - 1);
    cN = rnd(1, d - 1);
    const rawN = a * cN;
    const rawD = b * d;
    if (c.requireSimplify && gcd(rawN, rawD) === 1) continue;
    if (!c.requireSimplify && gcd(rawN, rawD) !== 1) continue;
    break;
  }

  const rawN = a * cN;
  const rawD = b * d;
  const finalSimplified = simplify({ n: rawN, d: rawD });
  const g = gcd(rawN, rawD);

  return {
    op: "multiply",
    why: "Multiplying fractions is just multiplying tops and bottoms — no common denominator needed. The hidden step is simplifying afterwards.",
    equation: [
      { kind: "fraction", id: "x", n: a, d: b, tone: "violet" },
      { kind: "operator", id: "times", text: "×" },
      { kind: "fraction", id: "y", n: cN, d, tone: "amber" },
      { kind: "operator", id: "eq", text: "=" },
      { kind: "fraction", id: "ans", nField: "n", dField: "d", tone: "emerald" },
    ],
    fields: [
      { id: "n", label: "n", expected: finalSimplified.n, size: "md" },
      { id: "d", label: "d", expected: finalSimplified.d, size: "md" },
    ],
    steps: [
      {
        fieldId: "n",
        title: "Multiply, then simplify",
        lines: [
          `Multiply the numerators: **${a} × ${cN} = ${rawN}**.`,
          `Multiply the denominators: **${b} × ${d} = ${rawD}**.`,
          g > 1
            ? `${rawN}/${rawD} simplifies by ${g} → **${finalSimplified.n}/${finalSimplified.d}**.`
            : `${rawN}/${rawD} is already in lowest terms.`,
        ],
        hint: `Final simplified numerator is **${finalSimplified.n}**.`,
      },
      {
        fieldId: "d",
        title: "Denominator",
        lines: [
          g > 1
            ? `After simplifying by ${g}, the denominator is **${finalSimplified.d}**.`
            : `The denominator stays as **${finalSimplified.d}**.`,
        ],
        hint: `Final simplified denominator is **${finalSimplified.d}**.`,
      },
    ],
    visual: {
      kind: "pies",
      items: [
        { label: `${a}/${b}`, fraction: { n: a, d: b }, tone: "violet" },
        { label: `${cN}/${d}`, fraction: { n: cN, d }, tone: "amber" },
        {
          label: `${finalSimplified.n}/${finalSimplified.d}`,
          fraction: finalSimplified,
          tone: "emerald",
          revealAfterField: "d",
        },
      ],
    },
  };
}

const op: FractionOpModule = {
  id: "multiply",
  label: "Multiply",
  symbol: "×",
  blurb: "Multiply two fractions",
  levels: LEVELS,
  genProblem,
};

export default op;
