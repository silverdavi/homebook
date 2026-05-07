/**
 * Shared types for the Fractions Lab — used by every operation module.
 *
 * Each operation produces a single self-describing `FractionProblem` whose
 * `fields` are the cells the student must fill, in order. The lab
 * component is operation-agnostic: it reads everything from the problem.
 */

export type FractionOp =
  | "gcf"
  | "lcm"
  | "simplify"
  | "add"
  | "subtract"
  | "multiply"
  | "divide";

export interface Fraction {
  n: number;
  d: number;
}

/** A single cell the student fills. */
export interface Field {
  id: string;
  /** Short label rendered inside the cell row (e.g. "GCF", "n", "d"). */
  label?: string;
  /** Correct value. */
  expected: number;
  /** Visual size hint. */
  size?: "sm" | "md" | "lg";
}

/** A fraction shown in the equation, possibly with editable n / d. */
export interface FractionPart {
  kind: "fraction";
  /** Stable id for layout keying. */
  id: string;
  /** If present, render numerator/denominator as a static digit. */
  n?: number;
  d?: number;
  /** If present, the numerator is editable; reference is the field id. */
  nField?: string;
  /** If present, the denominator is editable. */
  dField?: string;
  /** Tone for visual hue (defaults to a per-position colour). */
  tone?: "violet" | "amber" | "emerald" | "stone";
}

/** A bare integer slot in the equation (operand or answer for GCF/LCM). */
export interface IntegerPart {
  kind: "integer";
  id: string;
  value?: number;
  field?: string;
  tone?: "violet" | "amber" | "emerald" | "stone";
}

/** Plain-text operator (×, ÷, +, −, =, ?, etc.). */
export interface OperatorPart {
  kind: "operator";
  id: string;
  text: string;
}

export type EquationPart = FractionPart | IntegerPart | OperatorPart;

export interface Step {
  /** Field this step explains. */
  fieldId: string;
  title: string;
  lines: string[];
  hint: string;
}

export type VisualKind = "pies" | "bars" | "factors" | "multiples";

export interface PieVisual {
  kind: "pies";
  /** Pies to show in order. */
  items: {
    label?: string;
    fraction: Fraction;
    tone?: "violet" | "amber" | "emerald" | "stone";
    /** When true, the pie reveals only after the student finishes. */
    revealAfterField?: string;
  }[];
}

export interface FactorVisual {
  kind: "factors";
  a: number;
  b: number;
  /** Result displayed under the lists once revealed. */
  highlight: number;
  /** Reveal the highlight only after this field is filled. */
  revealAfterField?: string;
}

export interface MultiplesVisual {
  kind: "multiples";
  a: number;
  b: number;
  highlight: number;
  /** How many multiples to display per number. */
  count: number;
  revealAfterField?: string;
}

export type Visual = PieVisual | FactorVisual | MultiplesVisual;

export interface FractionProblem {
  op: FractionOp;
  /** "Why this matters" — one or two sentences shown in the side panel. */
  why: string;
  /** The equation rendered at the centre, in left-to-right reading order. */
  equation: EquationPart[];
  /** Ordered cells to fill. */
  fields: Field[];
  /** Coach narration per field. */
  steps: Step[];
  /** Optional visual aid (pies, factor lists, etc.). */
  visual?: Visual;
}

export interface FractionLevel {
  id: number;
  label: string;
  cfg?: Record<string, unknown>;
}

export interface FractionOpModule {
  id: FractionOp;
  label: string;
  symbol: string;
  /** One-line description used as the "why" panel default. */
  blurb: string;
  levels: FractionLevel[];
  genProblem: (level: number) => FractionProblem;
}
