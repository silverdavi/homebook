import type { FractionOpQuestion } from "../../types";
import { fracSub, type Frac } from "../../math";

const HELP = "/daily/lessons/fraction-sub";

function check(n: number, d: number, label: string) {
  if (d === 0) throw new Error(`${label}: zero denominator`);
  if (Math.abs(n) >= 20 || Math.abs(d) >= 20) {
    throw new Error(`${label}: must have |n|<20 and |d|<20 (got ${n}/${d})`);
  }
}

export function fracSubQ(
  id: string,
  x: Frac,
  y: Frac,
): FractionOpQuestion {
  check(x[0], x[1], "frac-sub x");
  check(y[0], y[1], "frac-sub y");
  return {
    id,
    kind: "fracSub",
    helpHref: HELP,
    x,
    y,
    answer: fracSub(x, y),
  };
}
