import { describe, expect, it } from "vitest";
import { gcd, lcm, reduce, fracAdd, fracSub, fracMul, fracDiv } from "@/lib/daily/math";
import { gradeOne } from "@/lib/daily/grading";
import { gcfQ } from "@/lib/daily/content/banks/gcf";
import { lcmQ } from "@/lib/daily/content/banks/lcm";
import { fracAddQ } from "@/lib/daily/content/banks/frac-add";
import { fracSubQ } from "@/lib/daily/content/banks/frac-sub";
import { fracMulQ } from "@/lib/daily/content/banks/frac-mul";
import { fracDivQ } from "@/lib/daily/content/banks/frac-div";
import { inverseFracQ, inverseIntQ } from "@/lib/daily/content/banks/frac-inverse";
import { periodicQ } from "@/lib/daily/content/banks/periodic";
import { warQ } from "@/lib/daily/content/banks/wars";
import { evolutionQ } from "@/lib/daily/content/banks/evolution";

describe("math", () => {
  it("gcd", () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(7, 9)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(48, 18)).toBe(6);
  });

  it("lcm", () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(5, 7)).toBe(35);
    expect(lcm(8, 12)).toBe(24);
  });

  it("reduce keeps sign on numerator", () => {
    expect(reduce(2, 4)).toEqual([1, 2]);
    expect(reduce(-2, 4)).toEqual([-1, 2]);
    expect(reduce(2, -4)).toEqual([-1, 2]);
    expect(reduce(0, 7)).toEqual([0, 1]);
  });

  it("fraction ops", () => {
    expect(fracAdd([1, 2], [1, 4])).toEqual([3, 4]);
    expect(fracSub([1, 4], [1, 2])).toEqual([-1, 4]);
    expect(fracMul([2, 3], [3, 4])).toEqual([1, 2]);
    expect(fracDiv([2, 3], [4, 5])).toEqual([5, 6]);
  });
});

describe("grading", () => {
  it("grades GCF", () => {
    const q = gcfQ("t1", 12, 18);
    expect(gradeOne(q, { kind: "integer", value: 6 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "integer", value: 3 }).correct).toBe(false);
    expect(gradeOne(q, { kind: "integer", value: null }).correct).toBe(false);
  });

  it("grades LCM", () => {
    const q = lcmQ("t1", 4, 6);
    expect(gradeOne(q, { kind: "integer", value: 12 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "integer", value: 24 }).correct).toBe(false);
  });

  it("grades fraction add (and accepts non-reduced equivalent answers)", () => {
    const q = fracAddQ("t1", [1, 2], [1, 4]);
    // Canonical: 3/4
    expect(gradeOne(q, { kind: "fraction", num: 3, den: 4 }).correct).toBe(true);
    // 6/8 should also count.
    expect(gradeOne(q, { kind: "fraction", num: 6, den: 8 }).correct).toBe(true);
    // Wrong answer
    expect(gradeOne(q, { kind: "fraction", num: 1, den: 2 }).correct).toBe(false);
  });

  it("shows the student's actual entry, not just the reduced form", () => {
    // Yerachmiel's report: typed 4/6 for an answer of 2/3, results page
    // showed "2/3" and he thought it changed his answer. It didn't — 4/6
    // reduces to 2/3 — but the display should make that obvious.
    const q = fracSubQ("t1", [5, 6], [1, 6]); // 4/6 = 2/3
    const r = gradeOne(q, { kind: "fraction", num: 4, den: 6 });
    expect(r.correct).toBe(true);
    expect(r.userDisplay).toBe("4/6 (= 2/3)");

    // When the entry is already in lowest terms, show it plainly.
    const r2 = gradeOne(q, { kind: "fraction", num: 2, den: 3 });
    expect(r2.userDisplay).toBe("2/3");
  });

  it("grades fraction subtract with negative result", () => {
    const q = fracSubQ("t1", [1, 4], [1, 2]);
    expect(gradeOne(q, { kind: "fraction", num: -1, den: 4 }).correct).toBe(true);
    // 1/-4 normalizes to -1/4 too
    expect(gradeOne(q, { kind: "fraction", num: 1, den: -4 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "fraction", num: 1, den: 4 }).correct).toBe(false);
  });

  it("grades fraction multiply / divide", () => {
    const m = fracMulQ("t1", [2, 3], [3, 4]);
    expect(gradeOne(m, { kind: "fraction", num: 1, den: 2 }).correct).toBe(true);
    const d = fracDivQ("t2", [2, 3], [4, 5]);
    expect(gradeOne(d, { kind: "fraction", num: 5, den: 6 }).correct).toBe(true);
  });

  it("grades inverse", () => {
    expect(
      gradeOne(inverseIntQ("t1", 7), { kind: "fraction", num: 1, den: 7 }).correct,
    ).toBe(true);
    expect(
      gradeOne(inverseFracQ("t2", [3, 8]), { kind: "fraction", num: 8, den: 3 }).correct,
    ).toBe(true);
    expect(
      gradeOne(inverseIntQ("t3", 5), { kind: "fraction", num: 5, den: 1 }).correct,
    ).toBe(false);
  });

  it("grades periodic", () => {
    const q = periodicQ("t1", "C", "P");
    expect(gradeOne(q, { kind: "integer", value: 6 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "integer", value: 7 }).correct).toBe(false);
    const q2 = periodicQ("t2", "Ar", "N");
    expect(gradeOne(q2, { kind: "integer", value: 22 }).correct).toBe(true);
  });

  it("grades wars with ±1 tolerance", () => {
    const q = warQ("t1", "wwii"); // 1939
    expect(gradeOne(q, { kind: "integer", value: 1939 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "integer", value: 1938 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "integer", value: 1940 }).correct).toBe(true);
    expect(gradeOne(q, { kind: "integer", value: 1937 }).correct).toBe(false);
  });

  it("grades evolution with ±10% tolerance (min 1 mya)", () => {
    const cambrian = evolutionQ("t1", "cambrian"); // 540 mya, ±54
    expect(gradeOne(cambrian, { kind: "integer", value: 540 }).correct).toBe(true);
    expect(gradeOne(cambrian, { kind: "integer", value: 500 }).correct).toBe(true);
    expect(gradeOne(cambrian, { kind: "integer", value: 480 }).correct).toBe(false);

    // Recent events get the min-1 tolerance instead of 10%.
    const sapiens = evolutionQ("t2", "homoSapiens"); // 0.3 mya, but tol = 1
    expect(gradeOne(sapiens, { kind: "integer", value: 0 }).correct).toBe(true);
    expect(gradeOne(sapiens, { kind: "integer", value: 1 }).correct).toBe(true);
    expect(gradeOne(sapiens, { kind: "integer", value: 2 }).correct).toBe(false);
  });

  it("treats blank answers as incorrect", () => {
    const q = gcfQ("t1", 12, 18);
    expect(gradeOne(q, { kind: "blank" }).correct).toBe(false);
    expect(gradeOne(q, { kind: "integer", value: null }).correct).toBe(false);
    const f = fracAddQ("t2", [1, 2], [1, 4]);
    expect(gradeOne(f, { kind: "fraction", num: null, den: null }).correct).toBe(false);
    expect(gradeOne(f, { kind: "fraction", num: 3, den: null }).correct).toBe(false);
  });

  it("rejects denominator of 0", () => {
    const f = fracAddQ("t1", [1, 2], [1, 4]);
    expect(gradeOne(f, { kind: "fraction", num: 3, den: 0 }).correct).toBe(false);
  });
});
