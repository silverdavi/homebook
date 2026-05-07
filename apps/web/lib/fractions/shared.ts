/**
 * Math helpers shared by every fractions operation.
 */

import type { Fraction } from "./types";

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export function simplify({ n, d }: Fraction): Fraction {
  if (d === 0) return { n, d };
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function isLowestTerms(f: Fraction): boolean {
  return gcd(f.n, f.d) === 1;
}

export function factorsOf(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) out.push(i);
  }
  return out;
}

export function multiplesOf(n: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= count; i++) out.push(n * i);
  return out;
}

export function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random integer from a list (uniform). */
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Mixed number representation. */
export interface MixedNumber {
  whole: number;
  n: number;
  d: number;
}

export function toMixed({ n, d }: Fraction): MixedNumber {
  if (d === 0) return { whole: 0, n, d };
  const whole = Math.trunc(n / d);
  return { whole, n: n - whole * d, d };
}

export function formatFraction({ n, d }: Fraction): string {
  if (d === 1) return String(n);
  return `${n}/${d}`;
}

/** Two random distinct integers in [min, max]. */
export function rndPair(min: number, max: number): [number, number] {
  const a = rnd(min, max);
  let b = rnd(min, max);
  for (let tries = 0; tries < 50 && a === b; tries++) b = rnd(min, max);
  return [a, b];
}
