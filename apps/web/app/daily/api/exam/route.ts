import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getQuestions, getDay } from "@/lib/daily/week";
import { gradeExam } from "@/lib/daily/grading";
import type {
  AnswersBlob,
  ClientAnswer,
  ExamResult,
} from "@/lib/daily/types";
import {
  getDailyExam,
  saveDailyExam,
  getProfileById,
  type Profile,
} from "@/lib/db";
import { sendDailySummary } from "@/lib/daily/summary";

const RawAnswerSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("integer"),
    value: z.number().nullable(),
  }),
  z.object({
    kind: z.literal("fraction"),
    num: z.number().nullable(),
    den: z.number().nullable(),
  }),
  z.object({ kind: z.literal("blank") }),
]);

const ClientAnswerSchema = z.object({
  questionId: z.string().min(1),
  raw: RawAnswerSchema,
  note: z.string().max(2000),
  usedHelp: z.boolean(),
  firstInputAt: z.number().nullable(),
  lastInputAt: z.number().nullable(),
});

const SubmissionSchema = z.object({
  profileId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  version: z.union([z.literal("a"), z.literal("b")]),
  startedAt: z.number().int(),
  answers: z.array(ClientAnswerSchema).min(1).max(64),
});

/** Decode the answers_json wrapper, falling back if an old row stored a bare array. */
function parseAnswersBlob(json: string): AnswersBlob {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      // Legacy shape: bare GradedAnswer[]
      return {
        startedAt: 0,
        submittedAtMs: 0,
        durationSec: 0,
        graded: parsed,
      };
    }
    return parsed as AnswersBlob;
  } catch {
    return { startedAt: 0, submittedAtMs: 0, durationSec: 0, graded: [] };
  }
}

/**
 * POST /daily/api/exam
 *
 * Body: { profileId, date, version, answers }
 * - Server re-grades using the same banks the page rendered.
 * - Inserts a daily_exams row. UNIQUE(profile_id, date) enforces single
 *   attempt; we return 409 if a row already exists.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid submission", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { profileId, date, version, startedAt, answers } = parsed.data;

  // Profile must exist.
  const fullProfile = getProfileById(profileId);
  if (!fullProfile) {
    return NextResponse.json(
      { error: "profile not found" },
      { status: 404 },
    );
  }
  const profile: Profile = fullProfile.profile;

  // Day must exist.
  const day = getDay(date);
  const questions = getQuestions(date, version);
  if (!day || !questions) {
    return NextResponse.json(
      { error: "no exam configured for that date/version" },
      { status: 404 },
    );
  }

  // Single-attempt rule.
  const existing = getDailyExam(profileId, date);
  if (existing) {
    return NextResponse.json(
      {
        error: "already submitted",
        date,
        version: existing.version,
        score: existing.score,
        total: existing.total,
        submittedAt: existing.submittedAt,
      },
      { status: 409 },
    );
  }

  const { score, total, graded } = gradeExam(
    questions,
    answers as ClientAnswer[],
  );

  const submittedAtMs = Date.now();
  const durationSec = Math.max(
    0,
    Math.round((submittedAtMs - startedAt) / 1000),
  );

  const blob: AnswersBlob = {
    startedAt,
    submittedAtMs,
    durationSec,
    graded,
  };

  const inserted = saveDailyExam({
    profileId,
    date,
    version,
    score,
    total,
    answersJson: JSON.stringify(blob),
  });

  if (!inserted) {
    // Race: another request slipped in. Surface as 409.
    const row = getDailyExam(profileId, date);
    return NextResponse.json(
      {
        error: "already submitted",
        date,
        version: row?.version,
        score: row?.score,
        total: row?.total,
        submittedAt: row?.submittedAt,
      },
      { status: 409 },
    );
  }

  const result: ExamResult = {
    date,
    version,
    submittedAt: inserted.submittedAt,
    score,
    total,
    startedAt,
    durationSec,
    answers: graded,
  };

  // Fire-and-forget: send the parents a summary email. We do not await
  // (the user is waiting for the response). Errors are logged and never
  // surfaced to the client. The header escape hatch keeps the smoke test
  // deterministic — the smoke triggers the email explicitly via the
  // /daily/api/summary endpoint instead.
  const skipEmail =
    request.headers.get("x-skip-summary-email") === "1";
  if (!skipEmail) {
    void sendDailySummary({
      profile,
      day,
      version,
      result,
    }).catch((err) => {
      console.error("[daily] sendDailySummary failed:", err);
    });
  }

  return NextResponse.json(result);
}

/**
 * GET /daily/api/exam?profileId=...&date=YYYY-MM-DD
 *
 * Returns the prior submission for that profile/date, or 404. Used by the
 * results page (and a future parent-review surface).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");
  const date = searchParams.get("date");
  if (!profileId || !date) {
    return NextResponse.json(
      { error: "profileId and date are required" },
      { status: 400 },
    );
  }
  const row = getDailyExam(profileId, date);
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const blob = parseAnswersBlob(row.answersJson);
  const result: ExamResult = {
    date: row.date,
    version: row.version,
    submittedAt: row.submittedAt,
    score: row.score,
    total: row.total,
    startedAt: blob.startedAt,
    durationSec: blob.durationSec,
    answers: blob.graded,
  };
  return NextResponse.json(result);
}
