/**
 * Multiplication operation — column-aligned long multiplication
 * with per-partial carry rows and an addition-step for multi-digit
 * multipliers.
 */

import type {
  Cell,
  CoachMessage,
  Level,
  Problem,
  RowKind,
  TableauState,
} from "../types";
import { digitAt, digitsOf, fromDigits, placeName, rnd } from "../shared";

export const LEVELS: Level[] = [
  { id: 1, label: "2d × 1d · no carry", cfg: { aLen: 2, bLen: 1, noCarry: true } },
  { id: 2, label: "2d × 1d · with carry", cfg: { aLen: 2, bLen: 1, noCarry: false } },
  { id: 3, label: "3d × 1d", cfg: { aLen: 3, bLen: 1, noCarry: false } },
  { id: 4, label: "2d × 2d · no carry", cfg: { aLen: 2, bLen: 2, noCarry: true } },
  { id: 5, label: "2d × 2d · with carry", cfg: { aLen: 2, bLen: 2, noCarry: false } },
  { id: 6, label: "3d × 2d", cfg: { aLen: 3, bLen: 2, noCarry: false } },
];

export function genProblem(level: number): Problem {
  const cfg = LEVELS[level - 1]?.cfg as
    | { aLen: number; bLen: number; noCarry: boolean }
    | undefined;
  if (!cfg) return { a: 12, b: 3 };
  let a = 0;
  let b = 0;
  for (let tries = 0; tries < 200; tries++) {
    if (cfg.noCarry) {
      const bDigits: number[] = [];
      for (let i = 0; i < cfg.bLen; i++) bDigits.push(rnd(1, 3));
      const aDigits: number[] = [];
      for (let i = 0; i < cfg.aLen; i++) {
        const maxBDig = Math.max(...bDigits);
        const maxAllowed = Math.max(1, Math.min(9, Math.floor(9 / maxBDig)));
        aDigits.push(rnd(1, maxAllowed));
      }
      a = fromDigits(aDigits);
      b = fromDigits(bDigits);
      const partials = bDigits.map((bd, idx) => {
        const bIndex = cfg.bLen - 1 - idx;
        return a * bd * Math.pow(10, bIndex);
      });
      const product = partials.reduce((s, x) => s + x, 0);
      const prodDigits = digitsOf(product);
      let hasCarry = false;
      for (let c = 0; c < prodDigits.length; c++) {
        let colSum = 0;
        for (const p of partials) colSum += digitAt(digitsOf(p), c);
        if (colSum >= 10) {
          hasCarry = true;
          break;
        }
      }
      if (hasCarry) continue;
      if (aDigits[0] === 0 || bDigits[0] === 0) continue;
      break;
    } else {
      const aMin = Math.pow(10, cfg.aLen - 1);
      const aMax = Math.pow(10, cfg.aLen) - 1;
      const bMin = Math.pow(10, cfg.bLen - 1);
      const bMax = Math.pow(10, cfg.bLen) - 1;
      a = rnd(aMin, aMax);
      b = rnd(bMin, bMax);
      let hasCarry = false;
      const bDigits = digitsOf(b);
      for (const bd of bDigits) {
        const aDigits = digitsOf(a);
        for (const ad of aDigits) {
          if (ad * bd >= 10) {
            hasCarry = true;
            break;
          }
        }
        if (hasCarry) break;
      }
      if (hasCarry) break;
    }
  }
  return { a, b };
}

export function carryForPartialAtCol(
  operandA: number[],
  operandB: number[],
  bi: number,
  c: number,
): number {
  const bDig = digitAt(operandB, bi);
  if (c <= bi) return 0;
  let carry = 0;
  for (let cc = bi; cc < c; cc++) {
    const aDig = digitAt(operandA, cc - bi);
    const total = aDig * bDig + carry;
    carry = Math.floor(total / 10);
  }
  return carry;
}

export function carryForAddAtCol(
  operandA: number[],
  operandB: number[],
  c: number,
): number {
  let carry = 0;
  for (let cc = 0; cc < c; cc++) {
    let colSum = carry;
    for (let bi = 0; bi < operandB.length; bi++) {
      const bDig = digitAt(operandB, bi);
      if (cc < bi) continue;
      const partialVal = fromDigits(operandA) * bDig;
      colSum += digitAt(digitsOf(partialVal), cc - bi);
    }
    carry = Math.floor(colSum / 10);
  }
  return carry;
}

export function buildTableau({ a, b }: Problem): TableauState {
  const operandA = digitsOf(a);
  const operandB = digitsOf(b);
  const aLen = operandA.length;
  const bLen = operandB.length;
  const product = a * b;
  const productDigits = digitsOf(product);
  const prodLen = productDigits.length;
  const cols = Math.max(prodLen, aLen, bLen);

  const rows: TableauState["rows"] = [];
  const cells: Record<string, Cell> = {};

  function addCarryRow(
    rowId: string,
    kind: RowKind,
    expectedFn: (c: number) => number,
    minCol: number,
    maxCol: number,
  ) {
    rows.push({ id: rowId, kind });
    for (let c = 0; c < cols; c++) {
      const inRange = c >= minCol && c <= maxCol;
      const expected = inRange ? expectedFn(c) : 0;
      const needed = inRange && expected > 0;
      cells[`${rowId}-${c}`] = {
        id: `${rowId}-${c}`,
        row: rowId,
        col: c,
        value: null,
        correct: expected,
        editable: needed,
        hidden: !needed,
        kind: "carry",
      };
    }
  }

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

  rows.push({ id: "opB", kind: "operand", digits: operandB, prefix: "×" });
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

  rows.push({ id: "sep1", kind: "separator" });

  for (let bi = 0; bi < bLen; bi++) {
    const rowId = `pp${bi}`;
    const carryId = `cmul${bi}`;
    const bDig = digitAt(operandB, bi);
    const partialVal = a * bDig;
    const partialDigitsMsb = digitsOf(partialVal);

    addCarryRow(
      carryId,
      "carry-mult",
      (c) => carryForPartialAtCol(operandA, operandB, bi, c),
      bi + 1,
      bi + aLen - 1,
    );

    rows.push({ id: rowId, kind: "partial", bIndex: bi });
    for (let c = 0; c < cols; c++) {
      if (c < bi) {
        cells[`${rowId}-${c}`] = {
          id: `${rowId}-${c}`,
          row: rowId,
          col: c,
          value: 0,
          correct: 0,
          editable: false,
          kind: "ghost",
          ghostShift: bi,
          hidden: false,
        };
      } else {
        const posFromRight = c - bi;
        const expected = digitAt(partialDigitsMsb, posFromRight);
        const isInSpan = posFromRight < partialDigitsMsb.length;
        if (!isInSpan) {
          cells[`${rowId}-${c}`] = {
            id: `${rowId}-${c}`,
            row: rowId,
            col: c,
            value: null,
            correct: 0,
            editable: false,
            hidden: true,
            kind: "filler",
          };
        } else {
          cells[`${rowId}-${c}`] = {
            id: `${rowId}-${c}`,
            row: rowId,
            col: c,
            value: null,
            correct: expected,
            editable: true,
            hidden: false,
            kind: "partial",
            bIndex: bi,
          };
        }
      }
    }
  }

  if (bLen > 1) {
    rows.push({ id: "sep2", kind: "separator" });
    addCarryRow(
      "cadd",
      "carry-add",
      (c) => carryForAddAtCol(operandA, operandB, c),
      1,
      prodLen - 1,
    );

    rows.push({ id: "final", kind: "final" });
    for (let c = 0; c < cols; c++) {
      const d = digitAt(productDigits, c);
      const inProduct = c < prodLen;
      cells[`final-${c}`] = {
        id: `final-${c}`,
        row: "final",
        col: c,
        value: null,
        correct: d,
        editable: inProduct,
        kind: "final",
        hidden: !inProduct,
      };
    }
  }

  return {
    operation: "multiply",
    operandA,
    operandB,
    aLen,
    bLen,
    cols,
    rows,
    cells,
    answer: product,
  };
}

export function naturalOrderIds(state: TableauState): string[] {
  const order: string[] = [];
  for (let bi = 0; bi < state.bLen; bi++) {
    const ppCells = Object.values(state.cells)
      .filter((c) => c.row === `pp${bi}` && c.editable && !c.hidden)
      .sort((a, b) => a.col - b.col);
    for (const p of ppCells) {
      const carryId = `cmul${bi}-${p.col}`;
      if (state.cells[carryId]?.editable) order.push(carryId);
      order.push(p.id);
    }
  }
  if (state.bLen > 1) {
    const finalCells = Object.values(state.cells)
      .filter((c) => c.row === "final" && c.editable && !c.hidden)
      .sort((a, b) => a.col - b.col);
    for (const f of finalCells) {
      const caddId = `cadd-${f.col}`;
      if (state.cells[caddId]?.editable) order.push(caddId);
      order.push(f.id);
    }
  }
  return order;
}

export function firstEditableId(state: TableauState): string | null {
  const pp0 = Object.values(state.cells)
    .filter((c) => c.row === "pp0" && c.editable && !c.hidden)
    .sort((a, b) => a.col - b.col)[0];
  if (pp0) return pp0.id;
  const any = Object.values(state.cells).find((c) => c.editable && !c.hidden);
  return any?.id ?? null;
}

export function coachFor(state: TableauState, activeId: string): CoachMessage | null {
  const cell = state.cells[activeId];
  if (!cell) return null;

  if (cell.kind === "carry") {
    const row = state.rows.find((r) => r.id === cell.row);
    if (row?.kind === "carry-mult") {
      return {
        title: "Carry cell",
        lines: [
          `You're in the **${placeName(cell.col).name}** column.`,
          `Write here the carry from the previous multiplication.`,
          `_Tip: if the previous multiplication was > 9, write its tens digit here._`,
        ],
      };
    }
    return {
      title: "Addition carry",
      lines: [
        `When you summed the partial products below, the ${placeName(cell.col - 1).name} column went past 9.`,
        `Write that carry here before adding the **${placeName(cell.col).name}** column.`,
      ],
    };
  }

  if (cell.kind === "partial") {
    const bi = cell.bIndex ?? 0;
    const bDig = digitAt(state.operandB, bi);
    const aPos = cell.col - bi;
    const aDig = digitAt(state.operandA, aPos);
    const carryIn = carryForPartialAtCol(state.operandA, state.operandB, bi, cell.col);
    if (aPos < state.aLen) {
      const product = aDig * bDig;
      const total = product + carryIn;
      const carryOut = Math.floor(total / 10);
      return {
        title: `Partial row ${bi + 1} · ${placeName(cell.col).name}`,
        lines: [
          `Multiply **${bDig} × ${aDig} = ${product}**` +
            (carryIn ? ` + carry **${carryIn}** = **${total}**` : ""),
          carryOut > 0
            ? `Write the ones digit of **${total}** (which is **${total % 10}**), and carry **${carryOut}** to the ${placeName(cell.col + 1).name} column.`
            : `Write **${total % 10}** here.`,
        ],
      };
    }
    return {
      title: `Partial row ${bi + 1} · ${placeName(cell.col).name}`,
      lines: [
        `No more digits to multiply — just write the leftover carry, which is **${carryIn}**.`,
      ],
    };
  }

  if (cell.kind === "final") {
    const carryIn = carryForAddAtCol(state.operandA, state.operandB, cell.col);
    const parts: number[] = [];
    let colSum = carryIn;
    for (let bi = 0; bi < state.bLen; bi++) {
      if (cell.col < bi) continue;
      const pv = fromDigits(state.operandA) * digitAt(state.operandB, bi);
      const d = digitAt(digitsOf(pv), cell.col - bi);
      parts.push(d);
      colSum += d;
    }
    return {
      title: `Sum · ${placeName(cell.col).name}`,
      lines: [
        parts.length > 0
          ? `Add the partial products in this column: **${parts.join(" + ")}${carryIn ? " + " + carryIn : ""} = ${colSum}**.`
          : `Column sum so far: **${colSum}**.`,
        colSum >= 10
          ? `Write **${colSum % 10}** here, and carry **${Math.floor(colSum / 10)}** to the ${placeName(cell.col + 1).name} column.`
          : `Write **${colSum}** here.`,
      ],
    };
  }

  return null;
}

export function hintFor(state: TableauState, cell: Cell): string {
  if (cell.kind === "partial") {
    const bi = cell.bIndex ?? 0;
    const bDig = digitAt(state.operandB, bi);
    const aPos = cell.col - bi;
    const aDig = digitAt(state.operandA, aPos);
    const carryIn = carryForPartialAtCol(state.operandA, state.operandB, bi, cell.col);
    if (aPos < state.aLen) {
      const total = aDig * bDig + carryIn;
      return `Try again: ${bDig} × ${aDig}${carryIn ? ` + ${carryIn}` : ""} = **${total}**. The ones digit of ${total} is **${total % 10}**.`;
    }
    return `Nothing left to multiply — just copy the pending carry here.`;
  }
  if (cell.kind === "final") {
    const carryIn = carryForAddAtCol(state.operandA, state.operandB, cell.col);
    let colSum = carryIn;
    const parts: number[] = [];
    for (let bi = 0; bi < state.bLen; bi++) {
      if (cell.col < bi) continue;
      const pv = fromDigits(state.operandA) * digitAt(state.operandB, bi);
      const d = digitAt(digitsOf(pv), cell.col - bi);
      parts.push(d);
      colSum += d;
    }
    return `Column total: ${parts.join(" + ")}${carryIn ? ` + ${carryIn}` : ""} = **${colSum}**. Ones digit: **${colSum % 10}**.`;
  }
  if (cell.kind === "carry") {
    return `This cell needs the tens-digit carry from the previous column's multiplication.`;
  }
  return "";
}
