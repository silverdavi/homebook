import { NextRequest, NextResponse } from "next/server";
import { syncFromLocalStorage } from "@/lib/db";
import type { SyncData } from "@/lib/db";

/**
 * POST /api/profiles/[id]/sync
 * One-time migration from localStorage data.
 * Body: SyncData object
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: SyncData = await request.json();

    syncFromLocalStorage(id, data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to sync data:", error);
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
}
