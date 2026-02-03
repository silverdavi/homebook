import { NextResponse } from 'next/server';

const GENERATOR_URL = process.env.GENERATOR_API_URL || 'http://localhost:8000';

export async function GET() {
  let generatorOk = false;

  try {
    const response = await fetch(`${GENERATOR_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    generatorOk = response.ok;
  } catch {
    // Generator is unreachable
  }

  return NextResponse.json({
    status: generatorOk ? 'healthy' : 'degraded',
    frontend: 'ok',
    generator: generatorOk ? 'ok' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
}
