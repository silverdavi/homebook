/**
 * Daily — pure math helpers
 *
 * Used by question banks (to compute canonical answers) and the grader
 * (to compare a user's answer against the expected value).
 *
 * Convention: a fraction is a [num, den] tuple in lowest terms with the
 * sign on the numerator. den is always strictly positive.
 */

export type Frac = [number, number];

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/** Reduce [num, den] to lowest terms with sign on numerator and positive den. */
export function reduce(num: number, den: number): Frac {
  if (den === 0) throw new Error("denominator zero");
  let n = Math.trunc(num);
  let d = Math.trunc(den);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  return [n / g, d / g];
}

export function fracEq(a: Frac, b: Frac): boolean {
  const [an, ad] = reduce(a[0], a[1]);
  const [bn, bd] = reduce(b[0], b[1]);
  return an === bn && ad === bd;
}

export function fracAdd(x: Frac, y: Frac): Frac {
  const num = x[0] * y[1] + y[0] * x[1];
  const den = x[1] * y[1];
  return reduce(num, den);
}

export function fracSub(x: Frac, y: Frac): Frac {
  const num = x[0] * y[1] - y[0] * x[1];
  const den = x[1] * y[1];
  return reduce(num, den);
}

export function fracMul(x: Frac, y: Frac): Frac {
  return reduce(x[0] * y[0], x[1] * y[1]);
}

export function fracDiv(x: Frac, y: Frac): Frac {
  if (y[0] === 0) throw new Error("divide by zero");
  return reduce(x[0] * y[1], x[1] * y[0]);
}

/** Format a fraction tuple for display ("3/4", "-1/2", "5", "0"). */
export function fmtFrac(f: Frac): string {
  const [n, d] = reduce(f[0], f[1]);
  if (n === 0) return "0";
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}
