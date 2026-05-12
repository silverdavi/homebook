import type { IntegerOpQuestion } from "../../types";
import { lcm } from "../../math";

const HELP = "/daily/lessons/lcm";

export function lcmQ(id: string, a: number, b: number): IntegerOpQuestion {
  if (a < 1 || b < 1 || a > 99 || b > 99) {
    throw new Error(`lcmQ: out of range a=${a} b=${b}`);
  }
  return {
    id,
    kind: "lcm",
    helpHref: HELP,
    a,
    b,
    answer: lcm(a, b),
  };
}
