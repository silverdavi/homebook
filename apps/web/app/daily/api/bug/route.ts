import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendBugReport } from "@/lib/daily/bug-report";

const BugReportSchema = z.object({
  message: z.string().min(1).max(4000),
  category: z.string().max(40).optional(),
  pageUrl: z.string().max(500).optional(),
  profileName: z.string().max(80).optional(),
  profileId: z.string().max(80).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  version: z.union([z.literal("a"), z.literal("b")]).optional(),
});

/**
 * POST /daily/api/bug
 *
 * Body: { message, category?, pageUrl?, profileName?, profileId?, date?, version? }
 * Anyone can call this — it's a self-service feedback channel for the kid.
 * Rate-limited only by Resend's account quotas; the message length is capped
 * server-side at 4000 chars.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = BugReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const result = await sendBugReport({
    ...parsed.data,
    userAgent,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
