"use client";

import type { ClientAnswer, Question, RawAnswer } from "@/lib/daily/types";
import { PromptForQuestion } from "./PromptForQuestion";
import { AnswerInput } from "./AnswerInput";
import { NoteField } from "./NoteField";
import { HelpLink } from "./HelpLink";

interface Props {
  index: number;
  total: number;
  question: Question;
  state: ClientAnswer;
  /**
   * Apply a partial update to this question's answer.
   *
   * IMPORTANT: this is a *patch*, not a replacement. Each setter (raw,
   * note, usedHelp) sends only its field, and the parent merges it
   * into the latest committed state inside a functional setState. This
   * is what fixes the bug where typing in the Note field after typing
   * an answer would stomp the answer with stale `state` (because both
   * callbacks closed over the same render's `state` prop).
   */
  onChange: (patch: Partial<ClientAnswer>) => void;
}

export function QuestionCard({ index, total, question, state, onChange }: Props) {
  const setRaw = (raw: RawAnswer) => onChange({ raw });
  const setNote = (note: string) => onChange({ note });
  const markUsedHelp = () => onChange({ usedHelp: true });

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-paper">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          Question {index + 1} of {total}
        </div>
        <HelpLink href={question.helpHref} onUsed={markUsedHelp} />
      </div>

      <div className="text-lg text-slate-900 mb-5 leading-relaxed">
        <PromptForQuestion question={question} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <AnswerInput question={question} answer={state.raw} onChange={setRaw} />
      </div>

      <NoteField value={state.note} onChange={setNote} />

      {state.usedHelp && (
        <div className="mt-2 text-[11px] text-slate-400 italic">
          You opened the lesson while working on this question. That&apos;s
          fine — we just track it for the records.
        </div>
      )}
    </div>
  );
}
