import { NextRequest, NextResponse } from 'next/server';
import { PreviewRequestSchema } from '@/lib/validation';
import { handleAPIError } from '@/lib/errors';

const GENERATOR_URL = process.env.GENERATOR_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = PreviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const response = await fetch(`${GENERATOR_URL}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Generator preview error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate preview' },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleAPIError(error);
  }
}
