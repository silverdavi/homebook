/**
 * Shared utilities used by every operation module.
 */

export const PLACE_NAMES = [
  { name: "Ones", power: "×1", short: "O" },
  { name: "Tens", power: "×10", short: "T" },
  { name: "Hundreds", power: "×100", short: "H" },
  { name: "Thousands", power: "×1 000", short: "Th" },
  { name: "Ten-thousands", power: "×10 000", short: "TTh" },
  { name: "Hundred-thousands", power: "×100 000", short: "HTh" },
  { name: "Millions", power: "×1 000 000", short: "M" },
  { name: "Ten-millions", power: "×10 000 000", short: "TM" },
];

export function digitsOf(n: number): number[] {
  return String(Math.max(0, Math.floor(n))).split("").map(Number);
}

export function fromDigits(digits: number[]): number {
  return Number(digits.join("")) || 0;
}

/** Read the digit at `col` (0 = ones) from an MSB-first array. */
export function digitAt(digits: number[], col: number): number {
  const len = digits.length;
  const idx = len - 1 - col;
  return idx < 0 || idx >= len ? 0 : digits[idx];
}

export function placeName(col: number) {
  return (
    PLACE_NAMES[col] ?? {
      name: `10^${col}`,
      power: `×10^${col}`,
      short: `P${col}`,
    }
  );
}

export function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
