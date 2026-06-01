/**
 * Regression test for the "I typed my answer but it scored as blank" class
 * of bug (yerachmiel, Day 9 q2 "I did 144 ... I never did a 0").
 *
 * The original inputs were type=number, whose spinners/arrows/scroll could
 * mutate the value and whose invalid intermediate states reported an empty
 * string — which we stored as `null` (blank). After switching to type=text
 * we still passed the raw string through `Number(...)`, so an interior stray
 * character (e.g. a misplaced "-") produced NaN -> null and silently ate the
 * answer. The hardened parser keeps every digit the student types.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup, within } from "@testing-library/react";

afterEach(() => cleanup());
import { AnswerInput } from "@/components/daily/AnswerInput";
import { multQ } from "@/lib/daily/content/banks/mult";
import { fracAddQ } from "@/lib/daily/content/banks/frac-add";
import { evolutionQ } from "@/lib/daily/content/banks/evolution";
import type { RawAnswer } from "@/lib/daily/types";

describe("AnswerInput integer parsing", () => {
  const q = multQ("t", 6, 9);

  function typeInto(value: string): RawAnswer {
    let captured: RawAnswer = { kind: "integer", value: null };
    const onChange = vi.fn((next: RawAnswer) => {
      captured = next;
    });
    const { container } = render(
      <AnswerInput
        question={q}
        answer={{ kind: "integer", value: null }}
        onChange={onChange}
      />,
    );
    fireEvent.change(within(container).getByPlaceholderText("answer"), {
      target: { value },
    });
    cleanup();
    return captured;
  }

  it("keeps every digit typed", () => {
    expect(typeInto("144")).toEqual({ kind: "integer", value: 144 });
  });

  it("does not collapse to blank when a stray '-' lands mid-number", () => {
    // "1-44" used to become NaN -> null (a blank, scored wrong).
    expect(typeInto("1-44")).toEqual({ kind: "integer", value: 144 });
  });

  it("ignores non-digit characters instead of dropping the answer", () => {
    expect(typeInto("14e")).toEqual({ kind: "integer", value: 14 });
  });

  it("treats a leading minus as a negative sign", () => {
    expect(typeInto("-3")).toEqual({ kind: "integer", value: -3 });
  });

  it("reports blank only when no digits were entered", () => {
    expect(typeInto("")).toEqual({ kind: "integer", value: null });
    expect(typeInto("-")).toEqual({ kind: "integer", value: null });
  });
});

describe("AnswerInput decimal parsing (evolution mya)", () => {
  // Homo sapiens = 0.3 mya. Adam reported "impossible to answer ... 0.3"
  // because the integer-only filter stripped the dot. Evolution inputs now
  // allow one decimal point.
  const q = evolutionQ("t", "homoSapiens");

  function typeInto(value: string): RawAnswer {
    let captured: RawAnswer = { kind: "integer", value: null };
    const onChange = vi.fn((next: RawAnswer) => {
      captured = next;
    });
    const { container } = render(
      <AnswerInput
        question={q}
        answer={{ kind: "integer", value: null }}
        onChange={onChange}
      />,
    );
    fireEvent.change(within(container).getByPlaceholderText("mya"), {
      target: { value },
    });
    cleanup();
    return captured;
  }

  it("accepts a decimal answer like 0.3", () => {
    expect(typeInto("0.3")).toEqual({ kind: "integer", value: 0.3 });
  });

  it("keeps only the first decimal point", () => {
    expect(typeInto("0.3.5")).toEqual({ kind: "integer", value: 0.35 });
  });

  it("still accepts whole numbers", () => {
    expect(typeInto("66")).toEqual({ kind: "integer", value: 66 });
  });
});

describe("AnswerInput fraction parsing", () => {
  const q = fracAddQ("t", [1, 2], [1, 4]);

  it("keeps digits in both numerator and denominator", () => {
    let captured: RawAnswer = { kind: "fraction", num: null, den: null };
    const onChange = vi.fn((next: RawAnswer) => {
      captured = next;
    });
    const { getByLabelText } = render(
      <AnswerInput
        question={q}
        answer={{ kind: "fraction", num: null, den: null }}
        onChange={onChange}
      />,
    );
    fireEvent.change(getByLabelText("Numerator"), { target: { value: "4" } });
    expect(captured).toEqual({ kind: "fraction", num: 4, den: null });
  });
});
