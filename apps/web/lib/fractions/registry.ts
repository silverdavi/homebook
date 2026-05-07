import type { FractionOp, FractionOpModule } from "./types";
import gcf from "./operations/gcf";
import lcm from "./operations/lcm";
import simplifyOp from "./operations/simplify";
import add from "./operations/add";
import subtract from "./operations/subtract";
import multiply from "./operations/multiply";
import divide from "./operations/divide";

export const FRACTION_OPS: Record<FractionOp, FractionOpModule> = {
  gcf,
  lcm,
  simplify: simplifyOp,
  add,
  subtract,
  multiply,
  divide,
};

export const FRACTION_OP_ORDER: FractionOp[] = [
  "gcf",
  "lcm",
  "simplify",
  "add",
  "subtract",
  "multiply",
  "divide",
];
