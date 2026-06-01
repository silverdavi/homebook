/**
 * Daily — pure grading
 *
 * Grade a ClientAnswer against a Question. No I/O, no DB, no React.
 * Used both by the client (for the results page after submit) and the
 * API route (so the score the user sees matches what is stored).
 */

import type {
  ClientAnswer,
  GradedAnswer,
  Question,
  RawAnswer,
} from "./types";
import { fmtFrac, reduce } from "./math";

function fmtIntAnswer(value: number | null): string {
  return value === null ? "(blank)" : `${value}`;
}

function gradeOne(question: Question, raw: RawAnswer): {
  correct: boolean;
  expected: string;
  userDisplay: string;
} {
  switch (question.kind) {
    case "gcf":
    case "lcm":
    case "mult": {
      const expected = `${question.answer}`;
      if (raw.kind !== "integer" || raw.value === null) {
        return { correct: false, expected, userDisplay: "(blank)" };
      }
      return {
        correct: raw.value === question.answer,
        expected,
        userDisplay: fmtIntAnswer(raw.value),
      };
    }

    case "fracAdd":
    case "fracSub":
    case "fracMul":
    case "fracDiv":
    case "fracInverse": {
      const expected = fmtFrac(question.answer);
      if (raw.kind !== "fraction" || raw.num === null || raw.den === null) {
        return { correct: false, expected, userDisplay: "(blank)" };
      }
      if (raw.den === 0) {
        return {
          correct: false,
          expected,
          userDisplay: "(undefined — den 0)",
        };
      }
      const userReduced = reduce(raw.num, raw.den);
      const [en, ed] = question.answer;
      // Show what the student actually typed. If we accepted a non-reduced
      // equivalent (e.g. they wrote 4/6 for an answer of 2/3), append the
      // reduced form so the results page doesn't look like it silently
      // changed their answer.
      const typed = `${raw.num}/${raw.den}`;
      const reducedStr = fmtFrac(userReduced);
      return {
        correct: userReduced[0] === en && userReduced[1] === ed,
        expected,
        userDisplay: typed === reducedStr ? reducedStr : `${typed} (= ${reducedStr})`,
      };
    }

    case "periodic": {
      const expected = `${question.answer}`;
      if (raw.kind !== "integer" || raw.value === null) {
        return { correct: false, expected, userDisplay: "(blank)" };
      }
      return {
        correct: raw.value === question.answer,
        expected,
        userDisplay: fmtIntAnswer(raw.value),
      };
    }

    case "war":
    case "peace": {
      const expected = `${question.answer}`;
      if (raw.kind !== "integer" || raw.value === null) {
        return { correct: false, expected, userDisplay: "(blank)" };
      }
      const diff = Math.abs(raw.value - question.answer);
      return {
        correct: diff <= question.tolerance,
        expected,
        userDisplay: fmtIntAnswer(raw.value),
      };
    }

    case "evolution": {
      const expected = `${question.answerMya}`;
      if (raw.kind !== "integer" || raw.value === null) {
        return { correct: false, expected, userDisplay: "(blank)" };
      }
      const diff = Math.abs(raw.value - question.answerMya);
      return {
        correct: diff <= question.tolerance,
        expected,
        userDisplay: fmtIntAnswer(raw.value),
      };
    }
  }
}

/**
 * Grade a full set of answers against the day's question list. Order is
 * preserved: graded[i] corresponds to questions[i] (matched by id).
 *
 * Missing answers are graded as incorrect; extra answers are dropped.
 */
export function gradeExam(
  questions: Question[],
  answers: ClientAnswer[],
): { score: number; total: number; graded: GradedAnswer[] } {
  const byId = new Map<string, ClientAnswer>();
  for (const a of answers) byId.set(a.questionId, a);

  let score = 0;
  const graded: GradedAnswer[] = [];

  for (const q of questions) {
    const a = byId.get(q.id) ?? {
      questionId: q.id,
      raw: { kind: "blank" } as const,
      note: "",
      usedHelp: false,
      firstInputAt: null,
      lastInputAt: null,
    };
    const r = gradeOne(q, a.raw);
    if (r.correct) score += 1;
    const secondsSpent =
      a.firstInputAt && a.lastInputAt && a.lastInputAt >= a.firstInputAt
        ? Math.round((a.lastInputAt - a.firstInputAt) / 1000)
        : 0;
    graded.push({
      questionId: q.id,
      raw: a.raw,
      note: a.note,
      usedHelp: a.usedHelp,
      firstInputAt: a.firstInputAt,
      lastInputAt: a.lastInputAt,
      correct: r.correct,
      expected: r.expected,
      userDisplay: r.userDisplay,
      secondsSpent,
    });
  }

  return { score, total: questions.length, graded };
}

/** Public per-question grader, useful in tests. */
export { gradeOne };

/** Pretty-print the canonical answer for display. */
export function formatExpected(question: Question): string {
  switch (question.kind) {
    case "gcf":
    case "lcm":
    case "mult":
    case "periodic":
      return `${question.answer}`;
    case "fracAdd":
    case "fracSub":
    case "fracMul":
    case "fracDiv":
    case "fracInverse":
      return fmtFrac(question.answer);
    case "war":
    case "peace":
      return `${question.answer}`;
    case "evolution":
      return `${question.answerMya}`;
  }
}
