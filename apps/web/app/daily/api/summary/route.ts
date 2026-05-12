import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDay } from "@/lib/daily/week";
import {
  buildDigest,
  generateNarrative,
  PARENT_EMAILS,
  renderEmailHtml,
  sendDailySummary,
} from "@/lib/daily/summary";
import type { AnswersBlob, ExamResult } from "@/lib/daily/types";
import { getDailyExam, getProfileById } from "@/lib/db";

const TriggerSchema = z.object({
  profileId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** "preview" returns the rendered HTML without sending. Default: send. */
  mode: z.enum(["send", "preview"]).default("send"),
  /** Override recipients (preview/test only). */
  to: z.array(z.string().email()).max(10).optional(),
});

function rebuildResultFromRow(args: {
  date: string;
  version: "a" | "b";
  submittedAt: string;
  score: number;
  total: number;
  answersJson: string;
}): ExamResult {
  let blob: AnswersBlob;
  try {
    const parsed = JSON.parse(args.answersJson);
    blob = Array.isArray(parsed)
      ? { startedAt: 0, submittedAtMs: 0, durationSec: 0, graded: parsed }
      : (parsed as AnswersBlob);
  } catch {
    blob = { startedAt: 0, submittedAtMs: 0, durationSec: 0, graded: [] };
  }
  return {
    date: args.date,
    version: args.version,
    submittedAt: args.submittedAt,
    score: args.score,
    total: args.total,
    startedAt: blob.startedAt,
    durationSec: blob.durationSec,
    answers: blob.graded,
  };
}

/**
 * POST /daily/api/summary
 *
 * Re-runs the summary pipeline for an existing submission. Useful for
 * resending after fixing a bug, or for previewing without sending.
 *
 * Body: { profileId, date, mode?: 'send' | 'preview', to?: string[] }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = TriggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { profileId, date, mode, to } = parsed.data;

  const fullProfile = getProfileById(profileId);
  if (!fullProfile) {
    return NextResponse.json({ error: "profile not found" }, { status: 404 });
  }
  const day = getDay(date);
  if (!day) {
    return NextResponse.json({ error: "no day configured" }, { status: 404 });
  }
  const row = getDailyExam(profileId, date);
  if (!row) {
    return NextResponse.json(
      { error: "no submission for that profile/date" },
      { status: 404 },
    );
  }

  const result = rebuildResultFromRow({
    date: row.date,
    version: row.version,
    submittedAt: row.submittedAt,
    score: row.score,
    total: row.total,
    answersJson: row.answersJson,
  });

  if (mode === "preview") {
    const digest = buildDigest({
      profile: fullProfile.profile,
      day,
      result,
    });
    const narrative = await generateNarrative(digest);
    const html = renderEmailHtml(digest, narrative);
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const out = await sendDailySummary({
    profile: fullProfile.profile,
    day,
    version: row.version,
    result,
    to: to ?? PARENT_EMAILS,
  });

  return NextResponse.json(out, { status: out.ok ? 200 : 500 });
}
