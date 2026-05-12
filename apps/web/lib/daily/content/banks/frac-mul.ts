import type { FractionOpQuestion } from "../../types";
import { fracMul, type Frac } from "../../math";

const HELP = "/daily/lessons/fraction-mul";

function check(n: number, d: number, label: string) {
  if (d === 0) throw new Error(`${label}: zero denominator`);
  if (Math.abs(n) >= 10 || Math.abs(d) >= 10) {
    throw new Error(`${label}: must have |n|<10 and |d|<10 (got ${n}/${d})`);
  }
}

export function fracMulQ(
  id: string,
  x: Frac,
  y: Frac,
): FractionOpQuestion {
  check(x[0], x[1], "frac-mul x");
  check(y[0], y[1], "frac-mul y");
  return {
    id,
    kind: "fracMul",
    helpHref: HELP,
    x,
    y,
    answer: fracMul(x, y),
  };
}
