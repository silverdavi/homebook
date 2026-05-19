import type { FractionOp, FractionOpModule } from "./types";
import gcf from "./operations/gcf";
import lcm from "./operations/lcm";
import simplifyOp from "./operations/simplify";
import add from "./operations/add";
import subtract from "./operations/subtract";
import multiply from "./operations/multiply";
import divide from "./operations/divide";
import mixed from "./operations/mixed";

export const FRACTION_OPS: Record<FractionOp, FractionOpModule> = {
  gcf,
  lcm,
  simplify: simplifyOp,
  add,
  subtract,
  multiply,
  divide,
  mixed,
};

export const FRACTION_OP_ORDER: FractionOp[] = [
  "gcf",
  "lcm",
  "simplify",
  "mixed",
  "add",
  "subtract",
  "multiply",
  "divide",
];
