/**
 * Shared types for the Carry Lab — used by every operation module.
 */

export type Operation = "add" | "subtract" | "multiply" | "divide";

export type CellKind =
  | "operand"
  | "partial"
  | "final"
  | "carry"
  | "borrow"
  | "ghost"
  | "filler"
  | "quotient"
  | "subtract"
  | "remainder"
  | "bringdown";

export type RowKind =
  | "operand"
  | "separator"
  | "partial"
  | "carry-mult"
  | "carry-add"
  | "borrow"
  | "final"
  | "quotient"
  | "div-subtract"
  | "div-remainder";

export interface Cell {
  id: string;
  row: string;
  col: number;
  value: number | null;
  correct: number;
  editable: boolean;
  hidden: boolean;
  kind: CellKind;
  /** For partial-product cells: which digit of operand B */
  bIndex?: number;
  /** For ghost cells: which place-shift this represents */
  ghostShift?: number;
  /** For division step cells: which step (0-indexed) this belongs to */
  stepIndex?: number;
}

export interface Row {
  id: string;
  kind: RowKind;
  digits?: number[];
  /** Symbol shown to the left of the row (×, +, −, ÷, etc.) */
  prefix?: string;
  bIndex?: number;
  /** For division step rows: which step they belong to */
  stepIndex?: number;
}

export interface TableauState {
  operation: Operation;
  /** Operands in MSB-first digit form */
  operandA: number[];
  operandB: number[];
  aLen: number;
  bLen: number;
  /** Total grid columns to allocate */
  cols: number;
  rows: Row[];
  cells: Record<string, Cell>;
  /** Optional: pre-computed final answer for display in coach */
  answer?: number | { quotient: number; remainder: number };
}

export interface Level {
  id: number;
  /** Display label */
  label: string;
  /** Internal config consumed by the operation's genProblem */
  cfg?: Record<string, unknown>;
}

export interface Problem {
  a: number;
  b: number;
}

export interface CoachMessage {
  /** Short title (place-value or step name) */
  title: string;
  /** Body lines, in Markdown-lite syntax (**bold**, _italic_) */
  lines: string[];
}
