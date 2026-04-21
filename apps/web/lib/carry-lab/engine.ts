/**
 * Long Multiplication ("Carry Lab") — pure engine
 *
 * Generates long-multiplication problems, builds a cell-based tableau, and
 * provides helpers for carry computation and natural navigation order. All
 * functions are pure — no DOM, no React — so the same engine powers both the
 * standalone /carry page and the future dark-theme game-arena integration.
 */

export type CellKind =
  | "operand"
  | "partial"
  | "final"
  | "carry"
  | "ghost"
  | "filler";

export type RowKind =
  | "operand"
  | "separator"
  | "partial"
  | "carry-mult"
  | "carry-add"
  | "final";

export interface Cell {
  id: string;
  row: string;
  col: number;
  value: number | null;
  correct: number;
  editable: boolean;
  hidden: boolean;
  kind: CellKind;
  bIndex?: number;
  ghostShift?: number;
}

export interface Row {
  id: string;
  kind: RowKind;
  digits?: number[];
  prefix?: string;
  bIndex?: number;
}

export interface TableauState {
  operandA: number[];
  operandB: number[];
  aLen: number;
  bLen: number;
  cols: number;
  rows: Row[];
  cells: Record<string, Cell>;
}

export interface Level {
  id: number;
  aLen: number;
  bLen: number;
  noCarry: boolean;
  label: string;
}

export const LEVELS: Level[] = [
  { id: 1, aLen: 2, bLen: 1, noCarry: true, label: "2d × 1d · no carry" },
  { id: 2, aLen: 2, bLen: 1, noCarry: false, label: "2d × 1d · with carry" },
  { id: 3, aLen: 3, bLen: 1, noCarry: false, label: "3d × 1d" },
  { id: 4, aLen: 2, bLen: 2, noCarry: true, label: "2d × 2d · no carry" },
  { id: 5, aLen: 2, bLen: 2, noCarry: false, label: "2d × 2d · with carry" },
  { id: 6, aLen: 3, bLen: 2, noCarry: false, label: "3d × 2d" },
];

export const PLACE_NAMES = [
  { name: "Ones", power: "×1", short: "O" },
  { name: "Tens", power: "×10", short: "T" },
  { name: "Hundreds", power: "×100", short: "H" },
  { name: "Thousands", power: "×1 000", short: "Th" },
  { name: "Ten-thousands", power: "×10 000", short: "TTh" },
  { name: "Hundred-thousands", power: "×100 000", short: "HTh" },
  { name: "Millions", power: "×1 000 000", short: "M" },
];

/** Split a number into MSB-first digits. */
export function digitsOf(n: number): number[] {
  return String(n)
    .split("")
    .map(Number);
}

export function fromDigits(digits: number[]): number {
  return Number(digits.join("")) || 0;
}

/** Read the digit at column `col` (0 = ones) from an MSB-first array. */
export function digitAt(digits: number[], col: number): number {
  const len = digits.length;
  const idx = len - 1 - col;
  return idx < 0 || idx >= len ? 0 : digits[idx];
}

export function placeName(col: number) {
  return (
    PLACE_NAMES[col] ?? {
      name: `10^${col}`,
      power: `×10^${col}`,
      short: `P${col}`,
    }
  );
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genProblem(level: number): { a: number; b: number } {
  const cfg = LEVELS[level - 1];
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

      // Ensure partial-product column sums also don't carry.
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

      // Make sure at least one partial has a non-trivial carry.
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

/** Carry that should appear above column `c` while computing partial bi. */
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

/** Carry coming INTO column `c` of the final sum of partials. */
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

/** Build the full tableau state (rows + cells) for a multiplication problem. */
export function buildTableau(a: number, b: number): TableauState {
  const operandA = digitsOf(a);
  const operandB = digitsOf(b);
  const aLen = operandA.length;
  const bLen = operandB.length;
  const product = a * b;
  const productDigits = digitsOf(product);
  const prodLen = productDigits.length;
  // The product is always at least as wide as any partial product, so
  // `prodLen` columns exactly cover the tableau — no orphan columns.
  // Guard against degenerate `a*b === 0` just in case.
  const cols = Math.max(prodLen, aLen, bLen);

  const rows: Row[] = [];
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

    // Carry row: only columns that feed into a *next* multiplication step.
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

  return { operandA, operandB, aLen, bLen, cols, rows, cells };
}

/**
 * Walk the tableau in the same order a student would on paper:
 * each partial digit, with any carry that should be written before
 * it, then the final-addition carries and digits.
 */
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
