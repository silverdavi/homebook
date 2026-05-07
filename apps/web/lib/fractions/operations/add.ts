/**
 * Fraction addition.
 *
 * Levels start with same-denominator problems, then introduce unlike
 * denominators where the student must combine and simplify.
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { gcd, lcm, rnd, simplify } from "../shared";

interface Cfg {
  /** Range for both denominators. */
  dRange: [number, number];
  /** True ⇒ denominators must be equal. */
  sameD?: boolean;
  /** True ⇒ allow improper sums (numerator may exceed denominator). */
  allowImproper?: boolean;
  /** When true, denominators must be coprime to maximise LCM size. */
  coprime?: boolean;
}

const LEVELS = [
  { id: 1, label: "Same denominator (≤ 8)",     cfg: { dRange: [3, 8],  sameD: true }                        satisfies Cfg },
  { id: 2, label: "Same denominator (≤ 12)",    cfg: { dRange: [4, 12], sameD: true }                        satisfies Cfg },
  { id: 3, label: "One denom is a multiple",    cfg: { dRange: [2, 12] }                                     satisfies Cfg },
  { id: 4, label: "Coprime denoms",             cfg: { dRange: [2, 9],  coprime: true }                       satisfies Cfg },
  { id: 5, label: "Improper sums",              cfg: { dRange: [3, 9],  allowImproper: true, coprime: true }  satisfies Cfg },
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
    d = c.sameD ? b : rnd(c.dRange[0], c.dRange[1]);
    if (c.sameD && b !== d) continue;
    if (!c.sameD && b === d) continue;
    if (c.coprime && gcd(b, d) !== 1) continue;
    a = rnd(1, b - 1);
    cN = rnd(1, d - 1);
    const sumN = a * (lcm(b, d) / b) + cN * (lcm(b, d) / d);
    const sumD = lcm(b, d);
    if (!c.allowImproper && sumN >= sumD) continue;
    if (c.allowImproper && sumN < sumD) continue;
    break;
  }

  const D = lcm(b, d);
  const k1 = D / b;
  const k2 = D / d;
  const sumN = a * k1 + cN * k2;
  const finalRaw = { n: sumN, d: D };
  const finalSimplified = simplify(finalRaw);
  const g = gcd(sumN, D);

  const lines: string[] = [];
  if (b === d) {
    lines.push(
      `Same denominator! Add the numerators: **${a} + ${cN} = ${sumN}**, keep **${d}** on the bottom.`,
    );
  } else {
    lines.push(
      `Find a common denominator. **LCM(${b}, ${d}) = ${D}**.`,
      `Convert: **${a}/${b} = ${a * k1}/${D}** and **${cN}/${d} = ${cN * k2}/${D}**.`,
      `Add the numerators: **${a * k1} + ${cN * k2} = ${sumN}**, keep **${D}** below.`,
    );
  }
  if (g > 1) {
    lines.push(
      `Simplify ${sumN}/${D} by dividing top and bottom by **${g}** → **${finalSimplified.n}/${finalSimplified.d}**.`,
    );
  } else {
    lines.push(`${sumN}/${D} is already in lowest terms.`);
  }

  return {
    op: "add",
    why: "Adding fractions with unlike denominators is a top-3 source of mistakes — practising the LCM → convert → add → simplify rhythm fixes it.",
    equation: [
      { kind: "fraction", id: "x", n: a, d: b, tone: "violet" },
      { kind: "operator", id: "plus", text: "+" },
      { kind: "fraction", id: "y", n: cN, d, tone: "amber" },
      { kind: "operator", id: "eq", text: "=" },
      {
        kind: "fraction",
        id: "ans",
        nField: "n",
        dField: "d",
        tone: "emerald",
      },
    ],
    fields: [
      { id: "n", label: "n", expected: finalSimplified.n, size: "md" },
      { id: "d", label: "d", expected: finalSimplified.d, size: "md" },
    ],
    steps: [
      {
        fieldId: "n",
        title: "Combine the fractions",
        lines,
        hint: `Final simplified numerator is **${finalSimplified.n}**.`,
      },
      {
        fieldId: "d",
        title: "And the denominator",
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
  id: "add",
  label: "Add",
  symbol: "+",
  blurb: "Combine two fractions",
  levels: LEVELS,
  genProblem,
};

export default op;
