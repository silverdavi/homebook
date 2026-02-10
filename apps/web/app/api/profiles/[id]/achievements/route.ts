import { NextRequest, NextResponse } from "next/server";
import { saveAchievement } from "@/lib/db";

/**
 * POST /api/profiles/[id]/achievements
 * Save an achievement for a profile.
 * Body: { medalId: string, tier: 'bronze' | 'silver' | 'gold' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { medalId, tier } = body;

    if (typeof medalId !== "string" || medalId.trim().length === 0) {
      return NextResponse.json(
        { error: "medalId is required" },
        { status: 400 }
      );
    }

    if (!["bronze", "silver", "gold"].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be 'bronze', 'silver', or 'gold'" },
        { status: 400 }
      );
    }

    saveAchievement(id, medalId.trim(), tier);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save achievement:", error);
    return NextResponse.json(
      { error: "Failed to save achievement" },
      { status: 500 }
    );
  }
}
