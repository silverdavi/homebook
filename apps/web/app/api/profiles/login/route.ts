import { NextRequest, NextResponse } from "next/server";
import { loginWithCode } from "@/lib/db";

/**
 * POST /api/profiles/login
 * Log in with an access code.
 * Body: { accessCode: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessCode } = body;

    if (typeof accessCode !== "string" || accessCode.trim().length === 0) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    const normalized = accessCode.trim().toUpperCase();
    const fullProfile = loginWithCode(normalized);

    if (!fullProfile) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 404 }
      );
    }

    return NextResponse.json(fullProfile);
  } catch (error) {
    console.error("Failed to login:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
