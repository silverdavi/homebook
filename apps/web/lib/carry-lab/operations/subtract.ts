/**
 * Subtraction operation — column-by-column with a borrow row above.
 *
 * Layout:
 *   [borrow row]   <- small "1" appears above each column that received +10
 *   [operand A]
 * − [operand B]
 *   ─────────
 *   [final answer]
 *
 * The "lend" decrement on the column we borrowed from is implicit and
 * narrated by the coach (we don't render strikethroughs on operand A).
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
  { id: 1, label: "2d − 2d · no borrow", cfg: { aLen: 2, bLen: 2, noBorrow: true } },
  { id: 2, label: "2d − 2d · with borrow", cfg: { aLen: 2, bLen: 2, noBorrow: false } },
  { id: 3, label: "3d − 2d · with borrow", cfg: { aLen: 3, bLen: 2, noBorrow: false } },
  { id: 4, label: "3d − 3d · with borrow", cfg: { aLen: 3, bLen: 3, noBorrow: false } },
  { id: 5, label: "4d − 3d · with borrow", cfg: { aLen: 4, bLen: 3, noBorrow: false } },
  { id: 6, label: "4d − 4d · cascading", cfg: { aLen: 4, bLen: 4, noBorrow: false, cascade: true } },
];

export function genProblem(level: number): Problem {
  const cfg = LEVELS[level - 1]?.cfg as
    | { aLen: number; bLen: number; noBorrow: boolean; cascade?: boolean }
    | undefined;
  if (!cfg) return { a: 56, b: 12 };
  let a = 0;
  let b = 0;
  for (let tries = 0; tries < 400; tries++) {
    const aMin = Math.pow(10, cfg.aLen - 1);
    const aMax = Math.pow(10, cfg.aLen) - 1;
    const bMin = Math.pow(10, cfg.bLen - 1);
    const bMax = Math.pow(10, cfg.bLen) - 1;
    a = rnd(aMin, aMax);
    b = rnd(bMin, bMax);
    if (a < b) [a, b] = [b, a];
    if (a === b) continue;

    const { borrows } = computeSubtract(digitsOf(a), digitsOf(b), Math.max(cfg.aLen, cfg.bLen));
    const hasBorrow = borrows.some((x) => x === 1);
    if (cfg.noBorrow && hasBorrow) continue;
    if (!cfg.noBorrow && !hasBorrow) continue;

    if (cfg.cascade) {
      // Require at least one cascading borrow (a column that lent AND received,
      // i.e., consecutive 1s in the borrows array).
      let cascade = false;
      for (let i = 0; i < borrows.length - 1; i++) {
        if (borrows[i] === 1 && borrows[i + 1] === 1) {
          cascade = true;
          break;
        }
      }
      if (!cascade) continue;
    }
    break;
  }
  return { a, b };
}

interface SubtractTrace {
  result: number[]; // index 0 = ones
  borrows: number[]; // index 0 = ones; 1 means this column received +10 (and lent from the next col left)
}

export function computeSubtract(
  aDigits: number[],
  bDigits: number[],
  cols: number,
): SubtractTrace {
  const result: number[] = [];
  const borrows: number[] = [];
  let borrowFromLeft = 0;
  for (let c = 0; c < cols; c++) {
    let aDig = digitAt(aDigits, c) - borrowFromLeft;
    const bDig = digitAt(bDigits, c);
    if (aDig < bDig) {
      borrows[c] = 1;
      aDig += 10;
      borrowFromLeft = 1;
    } else {
      borrows[c] = 0;
      borrowFromLeft = 0;
    }
    result[c] = aDig - bDig;
  }
  return { result, borrows };
}

export function buildTableau({ a, b }: Problem): TableauState {
  const operandA = digitsOf(a);
  const operandB = digitsOf(b);
  const aLen = operandA.length;
  const bLen = operandB.length;
  const diff = a - b;
  const diffDigits = digitsOf(diff);
  const cols = Math.max(aLen, bLen);
  const { result, borrows } = computeSubtract(operandA, operandB, cols);

  const rows: TableauState["rows"] = [];
  const cells: Record<string, Cell> = {};

  // Borrow row (above operand A): each cell shows "1" if this column received +10.
  rows.push({ id: "borrow", kind: "borrow" });
  for (let c = 0; c < cols; c++) {
    const expected = borrows[c] ?? 0;
    const needed = expected > 0;
    cells[`borrow-${c}`] = {
      id: `borrow-${c}`,
      row: "borrow",
      col: c,
      value: null,
      correct: 1,
      editable: needed,
      hidden: !needed,
      kind: "borrow",
    };
  }

  // Operand A
  rows.push({ id: "opA", kind: "operand", digits: operandA });
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

  // Operand B with − prefix
  rows.push({ id: "opB", kind: "operand", digits: operandB, prefix: "−" });
  for (let c = 0; c < cols; c++) {
    const d = digitAt(operandB, c);
    cells[`opB-${c}`] = {
      id: `opB-${c}`,
      row: "opB",
      col: c,
      value: d,
      correct: d,
      editable: false,
      kind: "operand",
      hidden: c >= bLen,
    };
  }

  rows.push({ id: "sep", kind: "separator" });

  // Final answer: cells equal to result (which has `cols` entries, but
  // leading zeros are not editable so the student doesn't have to write them).
  const meaningfulLen = diffDigits.length;
  rows.push({ id: "final", kind: "final" });
  for (let c = 0; c < cols; c++) {
    const d = result[c] ?? 0;
    const inResult = c < meaningfulLen;
    cells[`final-${c}`] = {
      id: `final-${c}`,
      row: "final",
      col: c,
      value: null,
      correct: d,
      editable: inResult,
      hidden: !inResult,
      kind: "final",
    };
  }

  return {
    operation: "subtract",
    operandA,
    operandB,
    aLen,
    bLen,
    cols,
    rows,
    cells,
    answer: diff,
  };
}

export function naturalOrderIds(state: TableauState): string[] {
  const order: string[] = [];
  const finalCells = Object.values(state.cells)
    .filter((c) => c.row === "final" && c.editable && !c.hidden)
    .sort((a, b) => a.col - b.col);
  for (const f of finalCells) {
    // Borrow indicator above this column comes BEFORE the column's final digit.
    const borrowId = `borrow-${f.col}`;
    if (state.cells[borrowId]?.editable) order.push(borrowId);
    order.push(f.id);
  }
  return order;
}

export function firstEditableId(state: TableauState): string | null {
  // If column 0 needs a borrow indicator, start there; otherwise start at final-0.
  const b0 = state.cells["borrow-0"];
  if (b0?.editable) return b0.id;
  const f0 = state.cells["final-0"];
  if (f0?.editable) return f0.id;
  return Object.values(state.cells).find((c) => c.editable && !c.hidden)?.id ?? null;
}

export function coachFor(state: TableauState, activeId: string): CoachMessage | null {
  const cell = state.cells[activeId];
  if (!cell) return null;

  if (cell.kind === "borrow") {
    return {
      title: `Borrow · ${placeName(cell.col).name}`,
      lines: [
        `The **${placeName(cell.col).name}** of ${fromDigits(state.operandA)} is too small to subtract — you need to borrow from the **${placeName(cell.col + 1).name}** column.`,
        `Write a small **1** here to remember you added 10 to this column.`,
      ],
    };
  }

  if (cell.kind === "final") {
    const aDig = digitAt(state.operandA, cell.col);
    const bDig = digitAt(state.operandB, cell.col);
    const cols = Math.max(state.aLen, state.bLen);
    const { borrows } = computeSubtract(state.operandA, state.operandB, cols);
    const lentToRight = borrows[cell.col - 1] ?? 0;
    const receivedHere = borrows[cell.col] ?? 0;

    let effectiveA = aDig - lentToRight + 10 * receivedHere;
    let lines: string[];

    if (lentToRight && receivedHere) {
      lines = [
        `This column lent **1** to the right (so ${aDig} − 1 = ${aDig - 1}) **and** also borrowed 10 from the left.`,
        `Effective value: **${aDig} − 1 + 10 = ${aDig - 1 + 10}**.`,
        `Now: **${effectiveA} − ${bDig} = ${effectiveA - bDig}**.`,
      ];
    } else if (lentToRight) {
      lines = [
        `You lent **1** to the column on the right, so this column's value drops to **${aDig} − 1 = ${aDig - 1}**.`,
        `Now: **${effectiveA} − ${bDig} = ${effectiveA - bDig}**.`,
      ];
    } else if (receivedHere) {
      lines = [
        `You added **10** to this column when borrowing.`,
        `Now: **${aDig} + 10 − ${bDig} = ${effectiveA - bDig}**.`,
      ];
    } else {
      lines = [
        `Subtract: **${aDig} − ${bDig} = ${effectiveA - bDig}**.`,
      ];
    }
    return { title: `Subtract · ${placeName(cell.col).name}`, lines };
  }

  return null;
}

export function hintFor(state: TableauState, cell: Cell): string {
  if (cell.kind === "borrow") {
    return `Just write **1** here — it represents the 10 you borrowed from the next column.`;
  }
  if (cell.kind === "final") {
    const aDig = digitAt(state.operandA, cell.col);
    const bDig = digitAt(state.operandB, cell.col);
    const cols = Math.max(state.aLen, state.bLen);
    const { borrows, result } = computeSubtract(state.operandA, state.operandB, cols);
    const lentToRight = borrows[cell.col - 1] ?? 0;
    const receivedHere = borrows[cell.col] ?? 0;
    const effectiveA = aDig - lentToRight + 10 * receivedHere;
    return `Try again: ${effectiveA} − ${bDig} = **${result[cell.col]}**${
      lentToRight ? ` _(remember you lent 1 to the right)_` : ""
    }${receivedHere ? ` _(you added 10 by borrowing)_` : ""}.`;
  }
  return "";
}
