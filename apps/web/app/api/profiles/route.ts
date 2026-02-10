import { NextRequest, NextResponse } from "next/server";
import { createProfile } from "@/lib/db";

/**
 * POST /api/profiles
 * Create a new profile.
 * Body: { name: string, avatarColor?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatarColor } = body;

    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 32) {
      return NextResponse.json(
        { error: "Name must be between 1 and 32 characters" },
        { status: 400 }
      );
    }

    const profile = createProfile(name.trim(), avatarColor);

    // Return as a full profile shape (new profile has no progress/achievements)
    return NextResponse.json({
      profile,
      progress: [],
      achievements: [],
      dailyChallenges: [],
      preferences: [],
    });
  } catch (error) {
    console.error("Failed to create profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
