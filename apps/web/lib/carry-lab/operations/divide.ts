/**
 * Division operation — full long division.
 *
 * Layout (3-digit dividend, 1-digit divisor):
 *
 *           [q2] [q1] [q0]    <- quotient (above each dividend column)
 *           ─────────────
 *   ÷ b  )   D2   D1   D0     <- divisor as prefix; dividend digits read-only
 *           [p1]               <- step 0 subtract product (1-2 cells)
 *           [r0]  ↓D1          <- step 0 remainder + ghost bring-down of D1
 *                [p1] …        <- step 1 subtract product
 *                [r1]  ↓D0     <- step 1 remainder + ghost bring-down
 *                     [p2]…    <- step 2 subtract product
 *                     [r2]     <- final remainder (only shown if non-zero)
 *
 * For each step the student fills:
 *   1. the quotient digit at the top
 *   2. the subtraction product (q × divisor)
 *   3. the resulting remainder
 * The brought-down dividend digit between steps is rendered as a faded
 * (ghost) read-only cell so the cascade is visible.
 */

import type {
  Cell,
  CoachMessage,
  Level,
  Problem,
  TableauState,
} from "../types";
import { digitAt, digitsOf, fromDigits, placeName, rnd } from "../shared";

interface DivCfg {
  aLen: number;
  /** Divisor range [min, max] inclusive */
  divisor: [number, number];
  /** Require the dividend % divisor !== 0 */
  requireRem?: boolean;
  /** Require the dividend % divisor === 0 */
  noRem?: boolean;
}

export const LEVELS: Level[] = [
  { id: 1, label: "2d ÷ 1d · no remainder",  cfg: { aLen: 2, divisor: [2, 9], noRem: true }       satisfies DivCfg },
  { id: 2, label: "2d ÷ 1d · with remainder", cfg: { aLen: 2, divisor: [2, 9], requireRem: true } satisfies DivCfg },
  { id: 3, label: "3d ÷ 1d · no remainder",  cfg: { aLen: 3, divisor: [2, 9], noRem: true }       satisfies DivCfg },
  { id: 4, label: "3d ÷ 1d · with remainder", cfg: { aLen: 3, divisor: [2, 9], requireRem: true } satisfies DivCfg },
  { id: 5, label: "4d ÷ 1d · no remainder",  cfg: { aLen: 4, divisor: [2, 9], noRem: true }       satisfies DivCfg },
  { id: 6, label: "4d ÷ 1d · with remainder", cfg: { aLen: 4, divisor: [2, 9], requireRem: true } satisfies DivCfg },
  { id: 7, label: "3d ÷ 2d · no remainder",  cfg: { aLen: 3, divisor: [11, 99], noRem: true }       satisfies DivCfg },
  { id: 8, label: "3d ÷ 2d · with remainder", cfg: { aLen: 3, divisor: [11, 99], requireRem: true } satisfies DivCfg },
  { id: 9, label: "4d ÷ 2d · with remainder", cfg: { aLen: 4, divisor: [11, 99], requireRem: true } satisfies DivCfg },
  { id: 10, label: "4d ÷ 3d · with remainder", cfg: { aLen: 4, divisor: [101, 999], requireRem: true } satisfies DivCfg },
];

export function genProblem(level: number): Problem {
  const cfg = LEVELS[level - 1]?.cfg as DivCfg | undefined;
  if (!cfg) return { a: 24, b: 4 };
  let a = 0;
  let b = 0;
  for (let tries = 0; tries < 800; tries++) {
    const aMin = Math.pow(10, cfg.aLen - 1);
    const aMax = Math.pow(10, cfg.aLen) - 1;
    b = rnd(cfg.divisor[0], cfg.divisor[1]);

    if (cfg.requireRem) {
      a = rnd(aMin, aMax);
      if (a % b === 0) continue;
    } else if (cfg.noRem) {
      const qMin = Math.ceil(aMin / b);
      const qMax = Math.floor(aMax / b);
      if (qMax < qMin) continue;
      const q = rnd(qMin, qMax);
      a = q * b;
      if (a % b !== 0) continue;
    } else {
      a = rnd(aMin, aMax);
    }

    if (a < aMin || a > aMax) continue;
    if (digitsOf(a).length !== cfg.aLen) continue;

    break;
  }
  return { a, b };
}

export interface DivStep {
  /** col index in the dividend that triggered this step (0 = ones, ascending = MSB) */
  bringDownCol: number;
  /** Working value at this step = prev remainder × 10 + this dividend digit */
  workingValue: number;
  q: number;
  product: number;
  /** Number of digits in `product`. >= 1. */
  productLen: number;
  remainder: number;
  /** Number of digits in `remainder`. 1 (always single-digit for 1-digit divisor). */
  remainderLen: number;
}

export function computeLongDivision(
  dividendDigits: number[],
  divisor: number,
): { steps: DivStep[]; finalRemainder: number } {
  const N = dividendDigits.length;
  const steps: DivStep[] = [];
  let working = 0;
  for (let i = 0; i < N; i++) {
    const bringDownCol = N - 1 - i;
    const dividendDigit = dividendDigits[i];
    working = working * 10 + dividendDigit;
    const q = Math.floor(working / divisor);
    const product = q * divisor;
    const remainder = working - product;
    steps.push({
      bringDownCol,
      workingValue: working,
      q,
      product,
      productLen: Math.max(1, String(product).length),
      remainder,
      remainderLen: Math.max(1, String(remainder).length),
    });
    working = remainder;
  }
  return { steps, finalRemainder: working };
}

export function buildTableau({ a, b }: Problem): TableauState {
  const operandA = digitsOf(a);
  const operandB = digitsOf(b);
  const aLen = operandA.length;
  const bLen = operandB.length;
  const cols = aLen;
  const { steps, finalRemainder } = computeLongDivision(operandA, b);

  const rows: TableauState["rows"] = [];
  const   cells: Record<string, Cell> = {};
  void finalRemainder;

  // Quotient row (editable, one cell per dividend column).
  rows.push({ id: "quot", kind: "quotient" });
  for (let c = 0; c < cols; c++) {
    const step = steps.find((s) => s.bringDownCol === c);
    const expected = step?.q ?? 0;
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

  // Dividend with `÷ b )` prefix.
  rows.push({
    id: "opA",
    kind: "operand",
    digits: operandA,
    prefix: `÷ ${b} )`,
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

  // Per-step rows (subtract product, then remainder).
  // Every dividend digit gets its own step row, including q=0 steps where the
  // product is just "0" and the remainder equals the working value (the
  // school-book convention: "4 doesn't go into 2 — write 0, subtract 0,
  // bring 2 down").
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLast = i === steps.length - 1;
    const nextStep = steps[i + 1];

    /* ── Subtract row (product) ────────────────────────── */

    const subRowId = `sub${i}`;
    const productDigits = digitsOf(step.product); // MSB-first
    const productRightCol = step.bringDownCol;
    const productLeftCol = step.bringDownCol + step.productLen - 1;
    // Push the "−" prefix right so it sits just before the leftmost product cell.
    rows.push({
      id: subRowId,
      kind: "div-subtract",
      stepIndex: i,
      prefix: "−",
      prefixOffsetCols: cols - 1 - productLeftCol,
    });

    for (let c = 0; c < cols; c++) {
      const inProduct = c >= productRightCol && c <= productLeftCol;
      if (!inProduct) {
        cells[`${subRowId}-${c}`] = {
          id: `${subRowId}-${c}`,
          row: subRowId,
          col: c,
          value: null,
          correct: 0,
          editable: false,
          hidden: true,
          kind: "subtract",
        };
      } else {
        const posFromRight = c - step.bringDownCol;
        const expected = digitAt(productDigits, posFromRight);
        cells[`${subRowId}-${c}`] = {
          id: `${subRowId}-${c}`,
          row: subRowId,
          col: c,
          value: null,
          correct: expected,
          editable: true,
          hidden: false,
          kind: "subtract",
          stepIndex: i,
        };
      }
    }

    /* ── Remainder row ─────────────────────────────────── */

    const remRowId = `rem${i}`;
    rows.push({ id: remRowId, kind: "div-remainder", stepIndex: i });

    const remRightCol = step.bringDownCol;
    const remLeftCol = step.bringDownCol + step.remainderLen - 1;

    for (let c = 0; c < cols; c++) {
      // Ghost copy of the next bring-down dividend digit (only for non-final steps).
      if (!isLast && nextStep && c === nextStep.bringDownCol) {
        const broughtDownDigit = digitAt(operandA, c);
        cells[`${remRowId}-${c}`] = {
          id: `${remRowId}-${c}`,
          row: remRowId,
          col: c,
          value: broughtDownDigit,
          correct: broughtDownDigit,
          editable: false,
          hidden: false,
          kind: "ghost",
          stepIndex: i,
        };
        continue;
      }

      const inRem = c >= remRightCol && c <= remLeftCol;

      if (!inRem) {
        cells[`${remRowId}-${c}`] = {
          id: `${remRowId}-${c}`,
          row: remRowId,
          col: c,
          value: null,
          correct: 0,
          editable: false,
          hidden: true,
          kind: "remainder",
        };
        continue;
      }

      // For the LAST step, only require the user to write the remainder when
      // it's non-zero. (Otherwise we'd ask them to write a redundant "0" at
      // the bottom of an exact division.)
      if (isLast && step.remainder === 0) {
        cells[`${remRowId}-${c}`] = {
          id: `${remRowId}-${c}`,
          row: remRowId,
          col: c,
          value: null,
          correct: 0,
          editable: false,
          hidden: true,
          kind: "remainder",
        };
        continue;
      }

      const posFromRight = c - step.bringDownCol;
      const expected = digitAt(digitsOf(step.remainder), posFromRight);
      cells[`${remRowId}-${c}`] = {
        id: `${remRowId}-${c}`,
        row: remRowId,
        col: c,
        value: null,
        correct: expected,
        editable: true,
        hidden: false,
        kind: "remainder",
        stepIndex: i,
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
    answer: { quotient: Math.floor(a / b), remainder: a % b },
  };
}

export function naturalOrderIds(state: TableauState): string[] {
  const order: string[] = [];
  const cols = state.cols;
  // One step per dividend column, processed MSB → LSB.
  // For each step:  quotient digit → product digits → remainder digit(s).
  // (When q=0 the product/remainder rows are hidden; the quotient is still filled.)
  for (let i = 0; i < cols; i++) {
    const bringDownCol = cols - 1 - i;

    const qId = `quot-${bringDownCol}`;
    const qCell = state.cells[qId];
    if (qCell && qCell.editable && !qCell.hidden) order.push(qId);

    const subCells = Object.values(state.cells)
      .filter((c) => c.row === `sub${i}` && c.editable && !c.hidden)
      .sort((a, b) => b.col - a.col); // MSB first
    for (const p of subCells) order.push(p.id);

    const remCells = Object.values(state.cells)
      .filter((c) => c.row === `rem${i}` && c.editable && !c.hidden)
      .sort((a, b) => b.col - a.col);
    for (const r of remCells) order.push(r.id);
  }
  return order;
}

export function firstEditableId(state: TableauState): string | null {
  // Start at the leftmost (highest-col) editable quotient cell.
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
  const { steps, finalRemainder } = computeLongDivision(state.operandA, divisor);

  if (cell.kind === "quotient") {
    const step = steps.find((s) => s.bringDownCol === cell.col);
    if (!step) return null;
    const stepIdx = steps.indexOf(step);
    const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;
    const broughtDown = digitAt(state.operandA, cell.col);

    const lines: string[] = [];
    if (!prevStep) {
      lines.push(`Look at the **leftmost** dividend digit: **${broughtDown}**.`);
    } else if (prevStep.remainder === 0) {
      lines.push(`Bring down the next dividend digit: **${broughtDown}**.`);
    } else {
      lines.push(
        `Bring down **${broughtDown}** next to the previous remainder **${prevStep.remainder}** to make **${step.workingValue}**.`,
      );
    }
    if (step.q === 0) {
      lines.push(
        `**${divisor}** doesn't fit into **${step.workingValue}**, so it goes in **0** times — write **0** above. We'll subtract **0** below and the **${step.workingValue}** comes straight down.`,
      );
    } else {
      lines.push(
        `How many whole times does **${divisor}** go into **${step.workingValue}**? **${step.q}** time${step.q === 1 ? "" : "s"} (because ${divisor} × ${step.q} = ${step.product}).`,
      );
    }
    return {
      title: `Step ${stepIdx + 1} · quotient at ${placeName(cell.col).name}`,
      lines,
    };
  }

  if (cell.kind === "subtract") {
    const stepIdx = cell.stepIndex ?? 0;
    const step = steps[stepIdx];
    if (!step) return null;
    const posFromRight = cell.col - step.bringDownCol;
    const productDigits = digitsOf(step.product);
    const expectedDigit = digitAt(productDigits, posFromRight);
    if (step.q === 0) {
      return {
        title: `Step ${stepIdx + 1} · subtract`,
        lines: [
          `Quotient is **0**, so we subtract **0 × ${divisor} = 0**.`,
          `Write **0** here. Subtracting 0 leaves the **${step.workingValue}** unchanged below.`,
        ],
      };
    }
    return {
      title: `Step ${stepIdx + 1} · subtract`,
      lines: [
        `Multiply **${step.q} × ${divisor} = ${step.product}**.`,
        `Write that under **${step.workingValue}** so you can subtract it.`,
        step.productLen > 1
          ? `This cell holds the **${placeName(cell.col).name}** digit of ${step.product}, which is **${expectedDigit}**.`
          : `Write **${expectedDigit}** here.`,
      ],
    };
  }

  if (cell.kind === "remainder") {
    const stepIdx = cell.stepIndex ?? 0;
    const step = steps[stepIdx];
    if (!step) return null;
    const isLastStep = stepIdx === steps.length - 1;
    return {
      title: isLastStep ? `Final remainder` : `Step ${stepIdx + 1} · remainder`,
      lines: [
        `Subtract: **${step.workingValue} − ${step.product} = ${step.remainder}**.`,
        isLastStep
          ? finalRemainder > 0
            ? `That's the **final remainder** — the part of ${fromDigits(state.operandA)} that ${divisor} cannot evenly divide.`
            : `Zero — the division is exact!`
          : `Then bring down the next dividend digit.`,
      ],
    };
  }

  return null;
}

export function hintFor(state: TableauState, cell: Cell): string {
  const divisor = fromDigits(state.operandB);
  const { steps } = computeLongDivision(state.operandA, divisor);

  if (cell.kind === "quotient") {
    const step = steps.find((s) => s.bringDownCol === cell.col);
    if (!step) return "";
    return `Try again: **${divisor}** × ? ≤ **${step.workingValue}**. The biggest whole number is **${step.q}** (since ${divisor} × ${step.q} = ${step.product}).`;
  }
  if (cell.kind === "subtract") {
    const step = steps[cell.stepIndex ?? 0];
    if (!step) return "";
    return `Try again: ${step.q} × ${divisor} = **${step.product}**.`;
  }
  if (cell.kind === "remainder") {
    const step = steps[cell.stepIndex ?? 0];
    if (!step) return "";
    return `Try again: ${step.workingValue} − ${step.product} = **${step.remainder}**.`;
  }
  return "";
}
