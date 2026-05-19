/**
 * Mixed numbers — converting between mixed and improper form.
 *
 * Pedagogy: a mixed number like 2 1/3 means "two whole pies plus
 * one-third of a pie". The improper form 7/3 says the same thing
 * counted in thirds. The conversion is just division-with-remainder
 * one direction, and multiply-and-add the other.
 *
 * Levels alternate between the two directions so the student practices
 * recognising both shapes.
 */

import type { FractionOpModule, FractionProblem } from "../types";
import { rnd } from "../shared";

type Direction = "mixedToImproper" | "improperToMixed";

interface Cfg {
  dir: Direction;
  /** Range for the denominator. */
  dRange: [number, number];
  /** Range for the whole part (must be ≥ 1 — otherwise it isn't mixed). */
  wRange: [number, number];
}

const LEVELS = [
  {
    id: 1,
    label: "Mixed → Improper · easy",
    cfg: { dir: "mixedToImproper", dRange: [2, 5], wRange: [1, 4] } satisfies Cfg,
  },
  {
    id: 2,
    label: "Improper → Mixed · easy",
    cfg: { dir: "improperToMixed", dRange: [2, 5], wRange: [1, 4] } satisfies Cfg,
  },
  {
    id: 3,
    label: "Mixed → Improper · medium",
    cfg: { dir: "mixedToImproper", dRange: [3, 9], wRange: [1, 8] } satisfies Cfg,
  },
  {
    id: 4,
    label: "Improper → Mixed · medium",
    cfg: { dir: "improperToMixed", dRange: [3, 9], wRange: [2, 8] } satisfies Cfg,
  },
  {
    id: 5,
    label: "Improper → Mixed · larger",
    cfg: { dir: "improperToMixed", dRange: [4, 12], wRange: [3, 12] } satisfies Cfg,
  },
];

function genCanonical(cfg: Cfg) {
  // Always generate a canonical mixed number (whole ≥ 1, 1 ≤ n < d) and
  // its improper equivalent. The direction only changes which side the
  // student fills.
  const d = rnd(cfg.dRange[0], cfg.dRange[1]);
  const w = rnd(cfg.wRange[0], cfg.wRange[1]);
  const n = rnd(1, d - 1);
  const improperN = w * d + n;
  return { w, n, d, improperN };
}

function genProblem(level: number): FractionProblem {
  const cfg = LEVELS[level - 1]?.cfg as Cfg | undefined;
  const c = cfg ?? (LEVELS[0].cfg as Cfg);
  const { w, n, d, improperN } = genCanonical(c);

  if (c.dir === "mixedToImproper") {
    return {
      op: "mixed",
      why:
        "Improper fractions and mixed numbers are two ways to say the "
        + "same amount. You'll need both — improper to multiply/divide, "
        + "mixed to read as 'about how much'.",
      equation: [
        { kind: "mixed", id: "src", whole: w, n, d, tone: "violet" },
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
        { id: "n", label: "n", expected: improperN, size: "md" },
        { id: "d", label: "d", expected: d, size: "md" },
      ],
      steps: [
        {
          fieldId: "n",
          title: "Top of the improper fraction",
          lines: [
            `**${w} ${n}/${d}** = **${w} wholes + ${n}/${d}**.`,
            `Each whole has ${d} pieces, so ${w} wholes = **${w} × ${d} = ${w * d}** pieces.`,
            `Add the ${n} extra: **${w * d} + ${n} = ${improperN}** pieces total.`,
          ],
          hint: `**Multiply the whole by the denominator, then add the numerator** → ${improperN}.`,
        },
        {
          fieldId: "d",
          title: "Bottom stays the same",
          lines: [
            `We're still counting in ${d}ths — the denominator doesn't change.`,
            `Bottom = **${d}**.`,
          ],
          hint: `Same denominator: **${d}**.`,
        },
      ],
      visual: {
        kind: "pies",
        items: [
          {
            label: `${w} ${n}/${d}`,
            fraction: { n: improperN, d },
            tone: "violet",
            expand: true,
          },
          {
            label: `${improperN}/${d}`,
            fraction: { n: improperN, d },
            tone: "emerald",
            expand: true,
            revealAfterField: "d",
          },
        ],
      },
    };
  }

  // improperToMixed
  return {
    op: "mixed",
    why:
      "Improper fractions and mixed numbers are two ways to say the "
      + "same amount. Mixed form is easier to picture — it tells you "
      + "the answer is 'between 2 and 3' at a glance.",
    equation: [
      { kind: "fraction", id: "src", n: improperN, d, tone: "violet" },
      { kind: "operator", id: "eq", text: "=" },
      {
        kind: "mixed",
        id: "ans",
        wholeField: "w",
        nField: "n",
        dField: "d",
        tone: "emerald",
      },
    ],
    fields: [
      { id: "w", label: "w", expected: w, size: "md" },
      { id: "n", label: "n", expected: n, size: "md" },
      { id: "d", label: "d", expected: d, size: "md" },
    ],
    steps: [
      {
        fieldId: "w",
        title: "How many whole pies fit?",
        lines: [
          `Divide **${improperN} ÷ ${d}**.`,
          `${d} goes into ${improperN} a total of **${w}** times (because ${d} × ${w} = ${w * d}).`,
          `So the whole-number part is **${w}**.`,
        ],
        hint: `**${improperN} ÷ ${d} = ${w} remainder ${n}** → whole is **${w}**.`,
      },
      {
        fieldId: "n",
        title: "The leftover slice",
        lines: [
          `After **${w} × ${d} = ${w * d}** pieces are used by the wholes, **${improperN} − ${w * d} = ${n}** pieces are left.`,
          `That's the new numerator: **${n}**.`,
        ],
        hint: `Remainder = ${improperN} − ${w * d} = **${n}**.`,
      },
      {
        fieldId: "d",
        title: "Bottom stays the same",
        lines: [
          `Still counting in ${d}ths.`,
          `Bottom = **${d}**.`,
        ],
        hint: `Same denominator: **${d}**.`,
      },
    ],
    visual: {
      kind: "pies",
      items: [
        {
          label: `${improperN}/${d}`,
          fraction: { n: improperN, d },
          tone: "violet",
          expand: true,
        },
        {
          label: `${w} ${n}/${d}`,
          fraction: { n: improperN, d },
          tone: "emerald",
          expand: true,
          revealAfterField: "d",
        },
      ],
    },
  };
}

const op: FractionOpModule = {
  id: "mixed",
  label: "Mixed",
  symbol: "↔",
  blurb: "Mixed numbers ↔ improper fractions",
  levels: LEVELS,
  genProblem,
};

export default op;
