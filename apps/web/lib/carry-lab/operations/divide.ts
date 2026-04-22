/**
 * Division operation — quotient-by-quotient long division.
 *
 * Layout:
 *   [quotient row]              <- editable, one cell per dividend column
 *   ──────────────
 *   ÷ divisor [dividend row]    <- divisor as prefix, dividend read-only
 *   ──────────────
 *   [remainder row]             <- editable, single cell on the right (if non-zero)
 *
 * The intermediate "subtract this product, bring down the next digit"
 * computation is narrated by the coach for each focused quotient cell.
 * Only the quotient digits and final remainder need to be typed.
 */

import type {
  Cell,
  CoachMessage,
  Level,
  Problem,
  TableauState,
} from "../types";
import { digitAt, digitsOf, fromDigits, placeName, rnd } from "../shared";

export const LEVELS: Level[] = [
  { id: 1, label: "2d ÷ 1d · no remainder", cfg: { aLen: 2, divisor: [2, 9], hasRem: false } },
  { id: 2, label: "2d ÷ 1d · with remainder", cfg: { aLen: 2, divisor: [2, 9], hasRem: true } },
  { id: 3, label: "3d ÷ 1d · no remainder", cfg: { aLen: 3, divisor: [2, 9], hasRem: false } },
  { id: 4, label: "3d ÷ 1d · with remainder", cfg: { aLen: 3, divisor: [2, 9], hasRem: true } },
  { id: 5, label: "4d ÷ 1d · with remainder", cfg: { aLen: 4, divisor: [2, 9], hasRem: true } },
  { id: 6, label: "3d ÷ 2d · no remainder", cfg: { aLen: 3, divisor: [11, 49], hasRem: false } },
];

export function genProblem(level: number): Problem {
  const cfg = LEVELS[level - 1]?.cfg as
    | { aLen: number; divisor: [number, number]; hasRem: boolean }
    | undefined;
  if (!cfg) return { a: 24, b: 4 };
  let a = 0;
  let b = 0;
  for (let tries = 0; tries < 400; tries++) {
    const aMin = Math.pow(10, cfg.aLen - 1);
    const aMax = Math.pow(10, cfg.aLen) - 1;
    b = rnd(cfg.divisor[0], cfg.divisor[1]);
    if (cfg.hasRem) {
      // Want a remainder > 0
      a = rnd(aMin, aMax);
      if (a % b === 0) continue;
    } else {
      // Pick a quotient first so a is divisible
      const qMin = Math.ceil(aMin / b);
      const qMax = Math.floor(aMax / b);
      if (qMax < qMin) continue;
      const q = rnd(qMin, qMax);
      a = q * b;
    }
    if (a < aMin || a > aMax) continue;
    if (b > a) continue; // ensure quotient is at least 1
    // Make sure dividend has cfg.aLen digits
    if (digitsOf(a).length !== cfg.aLen) continue;
    break;
  }
  return { a, b };
}

/**
 * Step-by-step long division trace.
 * Each step processes the next dividend digit from the LEFT.
 * `quotient[c]` is the digit written above dividend column `c`.
 */
interface DivStep {
  /** Column index in the dividend that this step's bring-down comes from */
  col: number;
  /** Working value going into this step (prevRemainder * 10 + bringDown) */
  workingIn: number;
  /** Quotient digit chosen for this step */
  q: number;
  /** Product q × divisor */
  product: number;
  /** Remainder after this step */
  remainder: number;
}

export function computeDivision(
  dividendDigits: number[],
  divisor: number,
): { steps: DivStep[]; quotient: number[]; finalRemainder: number } {
  const steps: DivStep[] = [];
  const quotient: number[] = [];
  let working = 0;
  for (let i = 0; i < dividendDigits.length; i++) {
    const digit = dividendDigits[i]; // MSB-first
    const col = dividendDigits.length - 1 - i; // 0 = ones
    working = working * 10 + digit;
    const q = Math.floor(working / divisor);
    const product = q * divisor;
    const remainder = working - product;
    quotient[col] = q;
    steps.push({ col, workingIn: working, q, product, remainder });
    working = remainder;
  }
  return { steps, quotient, finalRemainder: working };
}

export function buildTableau({ a, b }: Problem): TableauState {
  const operandA = digitsOf(a); // dividend
  const operandB = digitsOf(b); // divisor
  const aLen = operandA.length;
  const bLen = operandB.length;
  const cols = aLen;

  const { quotient, finalRemainder } = computeDivision(operandA, b);

  const rows: TableauState["rows"] = [];
  const cells: Record<string, Cell> = {};

  // Quotient row (top, editable)
  rows.push({ id: "quot", kind: "quotient" });
  for (let c = 0; c < cols; c++) {
    const expected = quotient[c] ?? 0;
    cells[`quot-${c}`] = {
      id: `quot-${c}`,
      row: "quot",
      col: c,
      value: null,
      correct: expected,
      editable: true,
      hidden: false,
      kind: "quotient",
    };
  }

  rows.push({ id: "sep1", kind: "separator" });

  // Dividend row (read-only, with ÷divisor as prefix)
  rows.push({
    id: "opA",
    kind: "operand",
    digits: operandA,
    prefix: `÷ ${b}`,
  });
  for (let c = 0; c < cols; c++) {
    const d = digitAt(operandA, c);
    cells[`opA-${c}`] = {
      id: `opA-${c}`,
      row: "opA",
      col: c,
      value: d,
      correct: d,
      editable: false,
      kind: "operand",
      hidden: c >= aLen,
    };
  }

  // Only render the remainder row (and its separator) when there's actually
  // something to write — otherwise we'd leave an awkward empty band below
  // the dividend.
  if (finalRemainder > 0) {
    rows.push({ id: "sep2", kind: "separator" });
    rows.push({ id: "rem", kind: "final" });
    for (let c = 0; c < cols; c++) {
      const visible = c === 0;
      cells[`rem-${c}`] = {
        id: `rem-${c}`,
        row: "rem",
        col: c,
        value: null,
        correct: c === 0 ? finalRemainder : 0,
        editable: visible,
        hidden: !visible,
        kind: "final",
      };
    }
  }

  return {
    operation: "divide",
    operandA,
    operandB,
    aLen,
    bLen,
    cols,
    rows,
    cells,
    answer: { quotient: fromDigits(quotient.slice().reverse().filter((d, i, a) => i > 0 || d > 0 || a.length === 1)), remainder: finalRemainder },
  };
}

export function naturalOrderIds(state: TableauState): string[] {
  // Quotient cells from leftmost (highest col) to rightmost (lowest col),
  // because long division proceeds left-to-right.
  const order: string[] = [];
  const quotCells = Object.values(state.cells)
    .filter((c) => c.row === "quot" && c.editable && !c.hidden)
    .sort((a, b) => b.col - a.col); // descending: col 2, 1, 0
  for (const q of quotCells) order.push(q.id);
  // Then remainder cell, if any
  const rem = state.cells["rem-0"];
  if (rem?.editable) order.push(rem.id);
  return order;
}

export function firstEditableId(state: TableauState): string | null {
  // Start at the LEFTMOST quotient cell.
  const cells = Object.values(state.cells)
    .filter((c) => c.row === "quot" && c.editable && !c.hidden)
    .sort((a, b) => b.col - a.col);
  if (cells[0]) return cells[0].id;
  return Object.values(state.cells).find((c) => c.editable && !c.hidden)?.id ?? null;
}

export function coachFor(state: TableauState, activeId: string): CoachMessage | null {
  const cell = state.cells[activeId];
  if (!cell) return null;

  const divisor = fromDigits(state.operandB);
  const { steps, finalRemainder } = computeDivision(state.operandA, divisor);

  if (cell.kind === "quotient") {
    // Find which step corresponds to this column.
    const step = steps.find((s) => s.col === cell.col);
    if (!step) return null;
    const stepIdx = steps.indexOf(step);
    const isFirst = stepIdx === 0;
    const prevRemainder = isFirst ? 0 : steps[stepIdx - 1].remainder;
    const broughtDown = digitAt(state.operandA, cell.col);

    const lines: string[] = [];
    if (isFirst) {
      lines.push(
        `Look at the **leftmost** dividend digit: **${broughtDown}**.`,
      );
    } else {
      lines.push(
        prevRemainder === 0
          ? `Bring down the next dividend digit: **${broughtDown}**.`
          : `Bring down **${broughtDown}** next to the previous remainder **${prevRemainder}** to make **${step.workingIn}**.`,
      );
    }
    lines.push(
      `How many whole times does **${divisor}** go into **${step.workingIn}**? **${step.q}** time${step.q === 1 ? "" : "s"} (because ${divisor} × ${step.q} = ${step.product}).`,
    );
    if (step.remainder > 0) {
      lines.push(
        `That leaves a remainder of **${step.workingIn} − ${step.product} = ${step.remainder}**, which carries to the next step.`,
      );
    } else {
      lines.push(`That divides exactly — no remainder this step.`);
    }
    return {
      title: `Step ${stepIdx + 1} · quotient at ${placeName(cell.col).name}`,
      lines,
    };
  }

  if (cell.kind === "final" && cell.row === "rem") {
    return {
      title: "Final remainder",
      lines: [
        `After all the dividend digits are used up, what's left over is the **remainder**.`,
        `Here it's **${finalRemainder}** — write it in this cell.`,
      ],
    };
  }

  return null;
}

export function hintFor(state: TableauState, cell: Cell): string {
  const divisor = fromDigits(state.operandB);
  const { steps, finalRemainder } = computeDivision(state.operandA, divisor);

  if (cell.kind === "quotient") {
    const step = steps.find((s) => s.col === cell.col);
    if (!step) return "";
    return `Try again: **${divisor}** × ? ≤ **${step.workingIn}**. The biggest whole number is **${step.q}** (since ${divisor} × ${step.q} = ${step.product}).`;
  }
  if (cell.kind === "final") {
    return `The remainder after all the steps is **${finalRemainder}**.`;
  }
  return "";
}
