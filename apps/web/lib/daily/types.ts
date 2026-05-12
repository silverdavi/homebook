/**
 * Daily — types
 *
 * Shapes for questions, exams, submissions, and per-answer notes used
 * across the /daily route group, the API, and the SQLite layer.
 */

export type QuestionKind =
  | "gcf"
  | "lcm"
  | "fracAdd"
  | "fracSub"
  | "fracMul"
  | "fracDiv"
  | "fracInverse"
  | "periodic"
  | "war"
  | "evolution";

export type FracKind = "fracAdd" | "fracSub" | "fracMul" | "fracDiv";

export interface BaseQuestion {
  id: string;
  kind: QuestionKind;
  helpHref: string;
}

/** GCF or LCM of two integers; answer is a single integer. */
export interface IntegerOpQuestion extends BaseQuestion {
  kind: "gcf" | "lcm";
  a: number;
  b: number;
  answer: number;
}

/** Fraction add/sub/mul/div. Operands and answer are [num, den] tuples. */
export interface FractionOpQuestion extends BaseQuestion {
  kind: FracKind;
  x: [number, number];
  y: [number, number];
  /** Canonical answer in lowest terms, [num, den]. Negative sign always on num. */
  answer: [number, number];
}

/**
 * Inverse of a number. The displayed value can be either an integer (n)
 * or a fraction (num/den). The answer is always given as a [num, den]
 * tuple in lowest terms.
 */
export interface InverseQuestion extends BaseQuestion {
  kind: "fracInverse";
  /** Either an integer (e.g. 5) or a fraction tuple (e.g. [3, 8]). */
  value: number | [number, number];
  answer: [number, number];
}

/** Periodic table: ask P, N, or e for a given element symbol. */
export interface PeriodicQuestion extends BaseQuestion {
  kind: "periodic";
  symbol: string;
  elementName: string;
  ask: "P" | "N" | "e";
  answer: number;
}

/** History: year a war started. Tolerance is ±tolerance years. */
export interface WarQuestion extends BaseQuestion {
  kind: "war";
  name: string;
  answer: number;
  tolerance: number;
}

/**
 * Evolution: how many million years ago an event happened. Tolerance is
 * absolute (in mya) and computed at authoring time as max(0.10*answer, 1).
 */
export interface EvolutionQuestion extends BaseQuestion {
  kind: "evolution";
  event: string;
  answerMya: number;
  tolerance: number;
}

export type Question =
  | IntegerOpQuestion
  | FractionOpQuestion
  | InverseQuestion
  | PeriodicQuestion
  | WarQuestion
  | EvolutionQuestion;

/** A single day's worth of content. */
export interface Day {
  date: string; // 'YYYY-MM-DD'
  title: string;
  /** Markdown source for the morning brief. Rendered server-side. */
  brief: string;
  /** Subject summary, e.g. ['GCF', 'Periodic table H/He', 'Wars 1-4', 'Early evolution']. */
  topics: string[];
  versionA: Question[];
  versionB: Question[];
}

// ── Submission shapes (client → server → db) ───────────────────────────

export type ExamVersion = "a" | "b";

/** Raw answer the user typed for a question. Schema depends on kind. */
export type RawAnswer =
  | { kind: "integer"; value: number | null }
  | { kind: "fraction"; num: number | null; den: number | null }
  | { kind: "blank" };

export interface ClientAnswer {
  questionId: string;
  raw: RawAnswer;
  note: string;
  /** Did the user click a help link for this question (advisory only). */
  usedHelp: boolean;
  /** ms epoch — first time the user touched/typed/focused this question. */
  firstInputAt: number | null;
  /** ms epoch — most recent change. */
  lastInputAt: number | null;
}

/** What the API sends back, after server-side grading. */
export interface GradedAnswer {
  questionId: string;
  raw: RawAnswer;
  note: string;
  usedHelp: boolean;
  firstInputAt: number | null;
  lastInputAt: number | null;
  correct: boolean;
  /** Canonical correct answer for display on the results page. */
  expected: string;
  /** Pretty-printed user answer, for the results page. */
  userDisplay: string;
  /** Convenience: lastInputAt - firstInputAt, in seconds, or 0 if untouched. */
  secondsSpent: number;
}

export interface ExamSubmission {
  profileId: string;
  date: string;
  version: ExamVersion;
  /** ms epoch when ExamRunner mounted (i.e. when Adam started the exam). */
  startedAt: number;
  answers: ClientAnswer[];
}

/** Wrapper persisted in daily_exams.answers_json (alongside the row). */
export interface AnswersBlob {
  startedAt: number;
  /** ms epoch when the API received the submission. */
  submittedAtMs: number;
  /** Total exam duration in seconds. */
  durationSec: number;
  graded: GradedAnswer[];
}

export interface ExamResult {
  date: string;
  version: ExamVersion;
  submittedAt: string;
  score: number;
  total: number;
  startedAt: number;
  durationSec: number;
  answers: GradedAnswer[];
}
