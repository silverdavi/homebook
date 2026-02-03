import { NextRequest, NextResponse } from 'next/server';
import { GenerateRequestSchema } from '@/lib/validation';
import { handleAPIError } from '@/lib/errors';

const GENERATOR_URL = process.env.GENERATOR_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = GenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const response = await fetch(`${GENERATOR_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Generator error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate worksheet' },
        { status: 502 },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return handleAPIError(error);
  }
}
