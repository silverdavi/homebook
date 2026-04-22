/**
 * Addition operation — column-by-column with a carry row above.
 *
 * Layout:
 *   [carry row]
 *   [operand A]
 * + [operand B]
 *   ─────────
 *   [final answer]
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
  { id: 1, label: "2d + 2d · no carry", cfg: { aLen: 2, bLen: 2, noCarry: true } },
  { id: 2, label: "2d + 2d · with carry", cfg: { aLen: 2, bLen: 2, noCarry: false } },
  { id: 3, label: "3d + 3d · no carry", cfg: { aLen: 3, bLen: 3, noCarry: true } },
  { id: 4, label: "3d + 3d · with carry", cfg: { aLen: 3, bLen: 3, noCarry: false } },
  { id: 5, label: "4d + 4d · with carry", cfg: { aLen: 4, bLen: 4, noCarry: false } },
  { id: 6, label: "4d + 3d · with carry", cfg: { aLen: 4, bLen: 3, noCarry: false } },
];

export function genProblem(level: number): Problem {
  const cfg = LEVELS[level - 1]?.cfg as
    | { aLen: number; bLen: number; noCarry: boolean }
    | undefined;
  if (!cfg) return { a: 12, b: 34 };
  let a = 0;
  let b = 0;
  for (let tries = 0; tries < 200; tries++) {
    const aMin = Math.pow(10, cfg.aLen - 1);
    const aMax = Math.pow(10, cfg.aLen) - 1;
    const bMin = Math.pow(10, cfg.bLen - 1);
    const bMax = Math.pow(10, cfg.bLen) - 1;
    a = rnd(aMin, aMax);
    b = rnd(bMin, bMax);
    const aDigits = digitsOf(a);
    const bDigits = digitsOf(b);

    let hasCarry = false;
    let carry = 0;
    const cols = Math.max(cfg.aLen, cfg.bLen);
    for (let c = 0; c < cols; c++) {
      const sum = digitAt(aDigits, c) + digitAt(bDigits, c) + carry;
      if (sum >= 10) hasCarry = true;
      carry = Math.floor(sum / 10);
    }

    if (cfg.noCarry && hasCarry) continue;
    if (!cfg.noCarry && !hasCarry) continue;
    break;
  }
  return { a, b };
}

/** Carry that flows INTO column c (i.e. carry-out of column c-1). */
export function carryAtCol(operandA: number[], operandB: number[], c: number): number {
  let carry = 0;
  for (let cc = 0; cc < c; cc++) {
    const sum = digitAt(operandA, cc) + digitAt(operandB, cc) + carry;
    carry = Math.floor(sum / 10);
  }
  return carry;
}

export function buildTableau({ a, b }: Problem): TableauState {
  const operandA = digitsOf(a);
  const operandB = digitsOf(b);
  const aLen = operandA.length;
  const bLen = operandB.length;
  const sum = a + b;
  const sumDigits = digitsOf(sum);
  const sumLen = sumDigits.length;
  const cols = Math.max(sumLen, aLen, bLen);

  const rows: TableauState["rows"] = [];
  const cells: Record<string, Cell> = {};

  // Carry row (above operand A)
  rows.push({ id: "carry", kind: "carry-add" });
  for (let c = 0; c < cols; c++) {
    const expected = carryAtCol(operandA, operandB, c);
    const needed = c >= 1 && expected > 0;
    cells[`carry-${c}`] = {
      id: `carry-${c}`,
      row: "carry",
      col: c,
      value: null,
      correct: expected,
      editable: needed,
      hidden: !needed,
      kind: "carry",
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

  // Operand B (with + prefix)
  rows.push({ id: "opB", kind: "operand", digits: operandB, prefix: "+" });
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

  // Final answer
  rows.push({ id: "final", kind: "final" });
  for (let c = 0; c < cols; c++) {
    const d = digitAt(sumDigits, c);
    const inSum = c < sumLen;
    cells[`final-${c}`] = {
      id: `final-${c}`,
      row: "final",
      col: c,
      value: null,
      correct: d,
      editable: inSum,
      hidden: !inSum,
      kind: "final",
    };
  }

  return {
    operation: "add",
    operandA,
    operandB,
    aLen,
    bLen,
    cols,
    rows,
    cells,
    answer: sum,
  };
}

export function naturalOrderIds(state: TableauState): string[] {
  const order: string[] = [];
  const finalCells = Object.values(state.cells)
    .filter((c) => c.row === "final" && c.editable && !c.hidden)
    .sort((a, b) => a.col - b.col);
  for (const f of finalCells) {
    // Carry above the next column (c+1) gets filled before that column's final digit.
    order.push(f.id);
    const nextCarryId = `carry-${f.col + 1}`;
    if (state.cells[nextCarryId]?.editable) order.push(nextCarryId);
  }
  return order;
}

export function firstEditableId(state: TableauState): string | null {
  const f0 = state.cells["final-0"];
  if (f0?.editable) return f0.id;
  const any = Object.values(state.cells).find((c) => c.editable && !c.hidden);
  return any?.id ?? null;
}

export function coachFor(state: TableauState, activeId: string): CoachMessage | null {
  const cell = state.cells[activeId];
  if (!cell) return null;

  if (cell.kind === "carry") {
    return {
      title: "Carry · " + placeName(cell.col).name,
      lines: [
        `When you added the ${placeName(cell.col - 1).name} column it went past 9.`,
        `Write the carried **1** here so it joins the **${placeName(cell.col).name}** column.`,
      ],
    };
  }

  if (cell.kind === "final") {
    const aDig = digitAt(state.operandA, cell.col);
    const bDig = digitAt(state.operandB, cell.col);
    const carryIn = carryAtCol(state.operandA, state.operandB, cell.col);
    const sum = aDig + bDig + carryIn;
    const carryOut = Math.floor(sum / 10);
    const eqParts = [aDig, bDig].filter((_, i) => true);
    const eqStr = eqParts.join(" + ") + (carryIn ? " + " + carryIn : "");
    return {
      title: `Sum · ${placeName(cell.col).name}`,
      lines: [
        `Add the **${placeName(cell.col).name}** column: **${eqStr} = ${sum}**.`,
        carryOut > 0
          ? `Write **${sum % 10}** here, and carry **${carryOut}** to the ${placeName(cell.col + 1).name} column.`
          : `Write **${sum}** here.`,
      ],
    };
  }

  return null;
}

export function hintFor(state: TableauState, cell: Cell): string {
  if (cell.kind === "final") {
    const aDig = digitAt(state.operandA, cell.col);
    const bDig = digitAt(state.operandB, cell.col);
    const carryIn = carryAtCol(state.operandA, state.operandB, cell.col);
    const sum = aDig + bDig + carryIn;
    return `Try again: ${aDig} + ${bDig}${carryIn ? ` + ${carryIn}` : ""} = **${sum}**. Ones digit: **${sum % 10}**.`;
  }
  if (cell.kind === "carry") {
    return `When the column to the right (${placeName(cell.col - 1).name}) summed past 9, you carry **1** here.`;
  }
  return "";
}
