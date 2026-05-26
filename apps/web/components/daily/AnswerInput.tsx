"use client";

import type { Question, RawAnswer } from "@/lib/daily/types";

/** Numeric answers (GCF, LCM, periodic, war, evolution) get one input. */
function IntegerInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value === null ? "" : `${value}`}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "" || raw === "-") {
          onChange(null);
          return;
        }
        const n = Number(raw);
        onChange(Number.isFinite(n) ? n : null);
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
  const parse = (s: string): number | null => {
    if (s === "" || s === "-") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  return (
    <div className="inline-flex flex-col items-center">
      <input
        type="number"
        inputMode="numeric"
        value={num === null ? "" : `${num}`}
        placeholder="num"
        aria-label="Numerator"
        onChange={(e) => onChange({ num: parse(e.target.value), den })}
        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      />
      <div className="my-1 h-[2px] w-20 bg-slate-400" />
      <input
        type="number"
        inputMode="numeric"
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
