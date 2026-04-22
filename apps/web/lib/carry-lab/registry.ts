/**
 * Operation registry — maps each operation to its engine functions
 * (level list, problem generator, tableau builder, navigation helpers,
 * coach narration, and hint text).
 *
 * The CarryLab UI only needs to know about this single object; adding a
 * new operation means adding a new module and an entry here.
 */

import type {
  Cell,
  CoachMessage,
  Level,
  Operation,
  Problem,
  TableauState,
} from "./types";

import * as add from "./operations/add";
import * as subtract from "./operations/subtract";
import * as multiply from "./operations/multiply";
import * as divide from "./operations/divide";

export interface OperationModule {
  id: Operation;
  /** Display label for the tab */
  label: string;
  /** Operator symbol (×, +, −, ÷) for the tab icon */
  symbol: string;
  /** Available difficulty levels */
  levels: Level[];
  /** Generate a fresh problem at the given level (1-indexed) */
  genProblem: (level: number) => Problem;
  /** Build the tableau (cells + rows) for a problem */
  buildTableau: (problem: Problem) => TableauState;
  /** Linear walk through editable cells in natural writing order */
  naturalOrderIds: (state: TableauState) => string[];
  /** Pick the first cell to focus when a problem starts */
  firstEditableId: (state: TableauState) => string | null;
  /** Coach narration shown when a cell has focus */
  coachFor: (state: TableauState, activeId: string) => CoachMessage | null;
  /** Hint shown when the user types a wrong digit */
  hintFor: (state: TableauState, cell: Cell) => string;
}

export const OPERATIONS: Record<Operation, OperationModule> = {
  add: {
    id: "add",
    label: "Add",
    symbol: "+",
    levels: add.LEVELS,
    genProblem: add.genProblem,
    buildTableau: add.buildTableau,
    naturalOrderIds: add.naturalOrderIds,
    firstEditableId: add.firstEditableId,
    coachFor: add.coachFor,
    hintFor: add.hintFor,
  },
  subtract: {
    id: "subtract",
    label: "Subtract",
    symbol: "−",
    levels: subtract.LEVELS,
    genProblem: subtract.genProblem,
    buildTableau: subtract.buildTableau,
    naturalOrderIds: subtract.naturalOrderIds,
    firstEditableId: subtract.firstEditableId,
    coachFor: subtract.coachFor,
    hintFor: subtract.hintFor,
  },
  multiply: {
    id: "multiply",
    label: "Multiply",
    symbol: "×",
    levels: multiply.LEVELS,
    genProblem: multiply.genProblem,
    buildTableau: multiply.buildTableau,
    naturalOrderIds: multiply.naturalOrderIds,
    firstEditableId: multiply.firstEditableId,
    coachFor: multiply.coachFor,
    hintFor: multiply.hintFor,
  },
  divide: {
    id: "divide",
    label: "Divide",
    symbol: "÷",
    levels: divide.LEVELS,
    genProblem: divide.genProblem,
    buildTableau: divide.buildTableau,
    naturalOrderIds: divide.naturalOrderIds,
    firstEditableId: divide.firstEditableId,
    coachFor: divide.coachFor,
    hintFor: divide.hintFor,
  },
};

/** Order in which operations appear in the tab bar. */
export const OPERATION_ORDER: Operation[] = [
  "add",
  "subtract",
  "multiply",
  "divide",
];
