/**
 * Fraction subtraction. Mirrors `add` with sign flipped.
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { gcd, lcm, rnd, simplify } from "../shared";

interface Cfg {
  dRange: [number, number];
  sameD?: boolean;
  coprime?: boolean;
}

const LEVELS = [
  { id: 1, label: "Same denominator (≤ 8)",  cfg: { dRange: [3, 8],  sameD: true }    satisfies Cfg },
  { id: 2, label: "Same denominator (≤ 12)", cfg: { dRange: [4, 12], sameD: true }    satisfies Cfg },
  { id: 3, label: "One denom is a multiple", cfg: { dRange: [2, 12] }                  satisfies Cfg },
  { id: 4, label: "Coprime denoms",          cfg: { dRange: [2, 9], coprime: true }    satisfies Cfg },
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
    const D = lcm(b, d);
    const left = a * (D / b);
    const right = cN * (D / d);
    if (left <= right) continue;
    break;
  }

  const D = lcm(b, d);
  const left = a * (D / b);
  const right = cN * (D / d);
  const diffN = left - right;
  const finalSimplified = simplify({ n: diffN, d: D });
  const g = gcd(diffN, D);

  const lines: string[] = [];
  if (b === d) {
    lines.push(
      `Same denominator. Subtract the numerators: **${a} − ${cN} = ${diffN}**, keep **${d}** below.`,
    );
  } else {
    lines.push(
      `Common denominator: **LCM(${b}, ${d}) = ${D}**.`,
      `Convert: **${a}/${b} = ${left}/${D}** and **${cN}/${d} = ${right}/${D}**.`,
      `Subtract: **${left} − ${right} = ${diffN}**, keep **${D}** below.`,
    );
  }
  if (g > 1) {
    lines.push(
      `Simplify ${diffN}/${D} by dividing top and bottom by **${g}** → **${finalSimplified.n}/${finalSimplified.d}**.`,
    );
  } else {
    lines.push(`${diffN}/${D} is already in lowest terms.`);
  }

  return {
    op: "subtract",
    why: "Subtraction shares the LCM step with addition. Mastering one cements both.",
    equation: [
      { kind: "fraction", id: "x", n: a, d: b, tone: "violet" },
      { kind: "operator", id: "minus", text: "−" },
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
  id: "subtract",
  label: "Subtract",
  symbol: "−",
  blurb: "Take one fraction from another",
  levels: LEVELS,
  genProblem,
};

export default op;
