import { NextRequest, NextResponse } from "next/server";
import { listBugReports } from "@/lib/db";

/**
 * GET /daily/api/bugs
 *
 * Admin-only read of submitted bug reports. Guarded by DAILY_ADMIN_TOKEN
 * via either:
 *   - `Authorization: Bearer <token>` header (preferred), or
 *   - `?token=<token>` query string (handy from a browser).
 *
 * Query params:
 *   - `since`  optional ISO timestamp (or `YYYY-MM-DD`); only reports at
 *              or after this time are returned.
 *   - `limit`  max rows, 1..500, default 100.
 *
 * Always returns newest-first.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const expected = process.env.DAILY_ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "admin token not configured on server" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const headerToken = auth.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : "";
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token") ?? "";
  const provided = headerToken || queryToken;

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const since = url.searchParams.get("since") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  try {
    const rows = listBugReports({
      since,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ count: rows.length, rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
