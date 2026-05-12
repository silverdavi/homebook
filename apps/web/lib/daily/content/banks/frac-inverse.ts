import type { InverseQuestion } from "../../types";
import { reduce, type Frac } from "../../math";

const HELP = "/daily/lessons/fraction-inverse";

/** Inverse of an integer n. The answer is 1/n, in lowest terms. */
export function inverseIntQ(id: string, n: number): InverseQuestion {
  if (n === 0) throw new Error("inverseIntQ: 0 has no inverse");
  return {
    id,
    kind: "fracInverse",
    helpHref: HELP,
    value: n,
    answer: reduce(1, n),
  };
}

/** Inverse of a fraction x = num/den. The answer is den/num, in lowest terms. */
export function inverseFracQ(id: string, x: Frac): InverseQuestion {
  if (x[0] === 0) throw new Error("inverseFracQ: numerator is zero");
  return {
    id,
    kind: "fracInverse",
    helpHref: HELP,
    value: x,
    answer: reduce(x[1], x[0]),
  };
}
