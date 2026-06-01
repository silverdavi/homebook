"use client";

import { useEffect, useState } from "react";
import type { Question, RawAnswer } from "@/lib/daily/types";

/**
 * Parse a free-typed string into a signed integer, never throwing away the
 * digits the student typed. We keep an optional leading minus and every
 * digit, dropping any other character. This avoids the data-loss class of
 * bug where an interior stray character (e.g. "1-44" or "14e") made
 * `Number(...)` return NaN, which then got stored as a blank answer.
 */
function parseSignedInt(s: string): number | null {
  const negative = s.trimStart().startsWith("-");
  const digits = s.replace(/[^0-9]/g, "");
  if (digits === "") return null;
  const n = Number((negative ? "-" : "") + digits);
  return Number.isFinite(n) ? n : null;
}

/**
 * Like parseSignedInt but keeps a single decimal point, so answers such as
 * "0.3" (Homo sapiens, 0.3 mya) survive. We keep an optional leading minus,
 * all digits, and the first "." we see; everything else is dropped.
 */
function parseSignedDecimal(s: string): number | null {
  const negative = s.trimStart().startsWith("-");
  let seenDot = false;
  let body = "";
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      body += ch;
    } else if (ch === "." && !seenDot) {
      seenDot = true;
      body += ".";
    }
  }
  if (body === "" || body === ".") return null;
  const n = Number((negative ? "-" : "") + body);
  return Number.isFinite(n) ? n : null;
}

/** Numeric answers (GCF, LCM, periodic, war, evolution) get one input. */
function IntegerInput({
  value,
  onChange,
  placeholder,
  allowDecimal = false,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder?: string;
  allowDecimal?: boolean;
}) {
  if (!allowDecimal) {
    return (
      <input
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        autoComplete="off"
        value={value === null ? "" : `${value}`}
        placeholder={placeholder}
        onChange={(e) => onChange(parseSignedInt(e.target.value))}
        className="w-32 rounded-md border border-slate-300 px-3 py-2 text-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      />
    );
  }
  return <DecimalInput value={value} onChange={onChange} placeholder={placeholder} />;
}

/**
 * Decimal-capable numeric input. We keep the raw typed string in local state
 * so an in-progress value like "0." or "0.3" is not clobbered by the
 * controlled number value (Number("0.") === 0 would erase the dot mid-typing).
 */
function DecimalInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value === null ? "" : `${value}`);

  // Re-sync from the outside only when the external value no longer matches
  // what the local text parses to (e.g. a reset between questions).
  useEffect(() => {
    if (parseSignedDecimal(text) !== value) {
      setText(value === null ? "" : `${value}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="-?[0-9]*\.?[0-9]*"
      autoComplete="off"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        // Strip everything except digits, a leading minus, and one dot, but
        // keep the cleaned string in state so the dot survives as you type.
        const raw = e.target.value;
        const negative = raw.trimStart().startsWith("-");
        let seenDot = false;
        let body = "";
        for (const ch of raw) {
          if (ch >= "0" && ch <= "9") body += ch;
          else if (ch === "." && !seenDot) {
            seenDot = true;
            body += ".";
          }
        }
        const cleaned = (negative ? "-" : "") + body;
        setText(cleaned);
        onChange(parseSignedDecimal(cleaned));
      }}
      className="w-32 rounded-md border border-slate-300 px-3 py-2 text-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
    />
  );
}

/** Fraction answers (add/sub/mul/div/inverse) get two stacked inputs. */
function FractionInput({
  num,
  den,
  onChange,
}: {
  num: number | null;
  den: number | null;
  onChange: (next: { num: number | null; den: number | null }) => void;
}) {
  const parse = (s: string): number | null => parseSignedInt(s);
  return (
    <div className="inline-flex flex-col items-center">
      <input
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        autoComplete="off"
        value={num === null ? "" : `${num}`}
        placeholder="num"
        aria-label="Numerator"
        onChange={(e) => onChange({ num: parse(e.target.value), den })}
        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      />
      <div className="my-1 h-[2px] w-20 bg-slate-400" />
      <input
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        autoComplete="off"
        value={den === null ? "" : `${den}`}
        placeholder="den"
        aria-label="Denominator"
        onChange={(e) => onChange({ num, den: parse(e.target.value) })}
        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      />
    </div>
  );
}

interface Props {
  question: Question;
  answer: RawAnswer;
  onChange: (next: RawAnswer) => void;
}

export function AnswerInput({ question, answer, onChange }: Props) {
  switch (question.kind) {
    case "gcf":
    case "lcm":
    case "mult":
    case "periodic":
    case "war":
    case "peace":
    case "evolution": {
      const v = answer.kind === "integer" ? answer.value : null;
      const placeholder =
        question.kind === "war" || question.kind === "peace"
          ? "year"
          : question.kind === "evolution"
            ? "mya"
            : "answer";
      return (
        <IntegerInput
          value={v}
          placeholder={placeholder}
          allowDecimal={question.kind === "evolution"}
          onChange={(value) => onChange({ kind: "integer", value })}
        />
      );
    }
    case "fracAdd":
    case "fracSub":
    case "fracMul":
    case "fracDiv":
    case "fracInverse": {
      const num = answer.kind === "fraction" ? answer.num : null;
      const den = answer.kind === "fraction" ? answer.den : null;
      return (
        <FractionInput
          num={num}
          den={den}
          onChange={(next) =>
            onChange({ kind: "fraction", num: next.num, den: next.den })
          }
        />
      );
    }
  }
}
