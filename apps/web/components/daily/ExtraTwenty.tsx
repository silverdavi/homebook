"use client";

import { useState } from "react";
import { Lightbulb, Printer, Timer } from "lucide-react";
import {
  correctPosition,
  displayOptions,
  type Extra,
  type ExtraQuiz,
} from "@/lib/daily/extras";

interface Props {
  extra: Extra;
  number: number;
}

export function ExtraTwenty({ extra, number }: Props) {
  return (
    <section
      id="extra"
      aria-labelledby="extra-title"
      className="mt-10 overflow-hidden rounded-2xl border-2 border-rose-200 bg-rose-50/40"
    >
      <div className="border-b border-rose-200 bg-white px-5 py-5 sm:px-6">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
          <Timer className="h-4 w-4" />
          Extra 20 minutes · {number} of 30 · optional, not graded
        </p>
        <h2
          id="extra-title"
          className="font-display text-2xl font-bold text-slate-900"
        >
          {extra.title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
          {extra.hook}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Printer className="h-4 w-4" />
          The matching sheet is in the printer tray.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {extra.groups.map((group) => (
          <div key={group.heading}>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-rose-700">
              {group.heading}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => (
                <li
                  key={item.name}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-sm leading-5 text-slate-600">
                    {item.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-xl bg-white p-4">
          <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-slate-900">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Worth remembering
          </h3>
          <ul className="space-y-1.5 text-sm leading-5 text-slate-700">
            {extra.facts.map((fact) => (
              <li key={fact}>• {fact}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Do it</h3>
          <p className="mt-1 text-sm leading-5 text-slate-700">{extra.doIt}</p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-slate-900">
            Check yourself — tap an answer
          </h3>
          <div className="space-y-3">
            {extra.quiz.map((question, index) => (
              <QuizItem
                key={question.q}
                question={question}
                position={correctPosition(
                  number,
                  index,
                  question.options.length,
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuizItem({
  question,
  position,
}: {
  question: ExtraQuiz;
  position: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = displayOptions(question.options, position);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">{question.q}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {options.map((option, index) => {
          const isPicked = picked === index;
          const tone =
            picked === null
              ? "border-slate-200 hover:border-rose-300"
              : index === position
                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                : isPicked
                  ? "border-rose-400 bg-rose-50 text-rose-900"
                  : "border-slate-200 text-slate-400";
          return (
            <button
              key={option}
              type="button"
              onClick={() => setPicked(index)}
              className={`rounded-lg border px-3 py-1.5 text-left text-sm ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="mt-2 text-sm text-slate-600">
          <strong
            className={
              picked === position ? "text-emerald-700" : "text-rose-700"
            }
          >
            {picked === position ? "Right. " : "Not quite. "}
          </strong>
          {question.why}
        </p>
      )}
    </div>
  );
}
