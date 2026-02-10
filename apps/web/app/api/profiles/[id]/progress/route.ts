import { NextRequest, NextResponse } from "next/server";
import { saveGameProgress } from "@/lib/db";

/**
 * POST /api/profiles/[id]/progress
 * Save game progress for a profile.
 * Body: { gameId: string, score: number, bestStreak?: number, adaptiveLevel?: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { gameId, score, bestStreak, adaptiveLevel } = body;

    if (typeof gameId !== "string" || gameId.trim().length === 0) {
      return NextResponse.json(
        { error: "gameId is required" },
        { status: 400 }
      );
    }

    if (typeof score !== "number") {
      return NextResponse.json(
        { error: "score must be a number" },
        { status: 400 }
      );
    }

    const stats: { bestStreak?: number; adaptiveLevel?: number } = {};
    if (typeof bestStreak === "number") stats.bestStreak = bestStreak;
    if (typeof adaptiveLevel === "number") stats.adaptiveLevel = adaptiveLevel;

    const progressRow = saveGameProgress(id, gameId.trim(), score, stats);

    return NextResponse.json(progressRow);
  } catch (error) {
    console.error("Failed to save game progress:", error);
    return NextResponse.json(
      { error: "Failed to save game progress" },
      { status: 500 }
    );
  }
}
