/**
 * Simplify a fraction to lowest terms.
 *
 * Pedagogy: divide both numerator and denominator by their GCF.
 * Visualisation shows two pies — same shaded area, different slice count.
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { gcd, rnd, simplify } from "../shared";

interface Cfg {
  /** Numerator of the simplified target. */
  nRange: [number, number];
  /** Denominator of the simplified target. */
  dRange: [number, number];
  /** Multiplier to scale the simplified fraction up by. */
  kRange: [number, number];
}

const LEVELS = [
  { id: 1, label: "Easy (denom ≤ 12)",   cfg: { nRange: [1, 5],  dRange: [2, 12], kRange: [2, 4] } satisfies Cfg },
  { id: 2, label: "Medium (denom ≤ 24)", cfg: { nRange: [1, 7],  dRange: [3, 12], kRange: [2, 6] } satisfies Cfg },
  { id: 3, label: "Hard (denom ≤ 60)",   cfg: { nRange: [2, 9],  dRange: [3, 12], kRange: [3, 8] } satisfies Cfg },
];

function genProblem(level: number): FractionProblem {
  const cfg = LEVELS[level - 1]?.cfg as Cfg | undefined;
  const c = cfg ?? (LEVELS[0].cfg as Cfg);
  let n0 = 0;
  let d0 = 0;
  let k = 0;
  for (let tries = 0; tries < 300; tries++) {
    n0 = rnd(c.nRange[0], c.nRange[1]);
    d0 = rnd(c.dRange[0], c.dRange[1]);
    if (n0 >= d0) continue;
    if (gcd(n0, d0) !== 1) continue;
    k = rnd(c.kRange[0], c.kRange[1]);
    break;
  }
  const n = n0 * k;
  const d = d0 * k;
  const answerN = n0;
  const answerD = d0;
  const g = gcd(n, d);

  return {
    op: "simplify",
    why: "Simplifying makes fractions easier to compare and read. Always finish a problem with the answer in lowest terms.",
    equation: [
      { kind: "fraction", id: "src", n, d, tone: "violet" },
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
      { id: "n", label: "n", expected: answerN, size: "md" },
      { id: "d", label: "d", expected: answerD, size: "md" },
    ],
    steps: [
      {
        fieldId: "n",
        title: "Simplify the numerator",
        lines: [
          `The GCF of **${n}** and **${d}** is **${g}**.`,
          `Divide the numerator by ${g}: **${n} ÷ ${g} = ${answerN}**.`,
        ],
        hint: `Divide ${n} by GCF(${n}, ${d}) = ${g} → **${answerN}**.`,
      },
      {
        fieldId: "d",
        title: "Simplify the denominator",
        lines: [
          `Divide the denominator by the same GCF: **${d} ÷ ${g} = ${answerD}**.`,
          `That's the simplified fraction in lowest terms.`,
        ],
        hint: `Divide ${d} by ${g} → **${answerD}**.`,
      },
    ],
    visual: {
      kind: "pies",
      items: [
        { label: `${n}/${d}`, fraction: { n, d }, tone: "violet" },
        {
          label: `${answerN}/${answerD}`,
          fraction: simplify({ n, d }),
          tone: "emerald",
          revealAfterField: "d",
        },
      ],
    },
  };
}

const op: FractionOpModule = {
  id: "simplify",
  label: "Simplify",
  symbol: "↘",
  blurb: "Reduce to lowest terms",
  levels: LEVELS,
  genProblem,
};

export default op;
