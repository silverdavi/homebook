import type { FractionOpQuestion } from "../../types";
import { fracDiv, type Frac } from "../../math";

const HELP = "/daily/lessons/fraction-div";

function check(n: number, d: number, label: string) {
  if (d === 0) throw new Error(`${label}: zero denominator`);
  if (Math.abs(n) >= 10 || Math.abs(d) >= 10) {
    throw new Error(`${label}: must have |n|<10 and |d|<10 (got ${n}/${d})`);
  }
}

export function fracDivQ(
  id: string,
  x: Frac,
  y: Frac,
): FractionOpQuestion {
  check(x[0], x[1], "frac-div x");
  check(y[0], y[1], "frac-div y");
  if (y[0] === 0) {
    throw new Error("frac-div: divisor numerator is zero");
  }
  return {
    id,
    kind: "fracDiv",
    helpHref: HELP,
    x,
    y,
    answer: fracDiv(x, y),
  };
}
