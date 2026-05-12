import type { IntegerOpQuestion } from "../../types";
import { gcd } from "../../math";

const HELP = "/daily/lessons/gcf";

export function gcfQ(id: string, a: number, b: number): IntegerOpQuestion {
  if (a < 1 || b < 1 || a > 99 || b > 99) {
    throw new Error(`gcfQ: out of range a=${a} b=${b}`);
  }
  return {
    id,
    kind: "gcf",
    helpHref: HELP,
    a,
    b,
    answer: gcd(a, b),
  };
}
