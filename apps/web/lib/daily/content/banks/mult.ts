import type { MultQuestion } from "../../types";

const HELP = "/daily/lessons/multiplication-table";

/**
 * Multiplication question. Used for two flavors:
 *   - Pure memorization: `multQ("x", 7, 8)` → 56
 *   - Two-digit break-it-down: `multQ("x", 17, 25)` → 425
 *
 * The grading is identical (integer equality). The brief teaches the
 * "(a + b)(c + d) = ac + ad + bc + bd" expansion as the mental tool.
 */
export function multQ(id: string, a: number, b: number): MultQuestion {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error(`multQ: non-integer (${a}, ${b})`);
  }
  return {
    id,
    kind: "mult",
    helpHref: HELP,
    a,
    b,
    answer: a * b,
  };
}
