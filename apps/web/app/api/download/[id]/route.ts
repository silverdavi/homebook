import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError } from '@/lib/errors';

const GENERATOR_URL = process.env.GENERATOR_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: worksheetId } = await params;

    if (!worksheetId) {
      return NextResponse.json(
        { error: 'Missing worksheet ID' },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${GENERATOR_URL}/download/${encodeURIComponent(worksheetId)}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Worksheet not found or expired' },
          { status: 404 },
        );
      }
      console.error('Download error:', response.status);
      return NextResponse.json(
        { error: 'Failed to get download link' },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleAPIError(error);
  }
}
