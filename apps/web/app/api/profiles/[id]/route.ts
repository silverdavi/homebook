import { NextRequest, NextResponse } from "next/server";
import { getProfileById, updateProfile } from "@/lib/db";

/**
 * GET /api/profiles/[id]
 * Fetch a full profile by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fullProfile = getProfileById(id);

    if (!fullProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(fullProfile);
  } catch (error) {
    console.error("Failed to get profile:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profiles/[id]
 * Update a profile's name and/or avatar color.
 * Body: { name?: string, avatarColor?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, avatarColor } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 32)) {
      return NextResponse.json(
        { error: "Name must be between 1 and 32 characters" },
        { status: 400 }
      );
    }

    const updates: { name?: string; avatarColor?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (avatarColor !== undefined) updates.avatarColor = avatarColor;

    const profile = updateProfile(id, updates);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
