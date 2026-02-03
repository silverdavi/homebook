# Backend Agent - Homebook (teacher.ninja)

> Session: homebook-backend-001
> Budget: $30

## YOUR OWNERSHIP
You exclusively own:
- `apps/web/app/api/`

## DO NOT TOUCH
- `apps/web/app/` (except api/)
- `apps/web/components/`
- `packages/generator/`
- `infra/`

## YOUR MISSION
Build Next.js API routes that connect the frontend to the Python generator service.

---

## PHASE 1: API Route Structure

```
apps/web/app/api/
├── preview/
│   └── route.ts          # POST - Generate HTML preview
├── generate/
│   └── route.ts          # POST - Generate full PDF
├── download/
│   └── [id]/
│       └── route.ts      # GET - Get download URL
└── health/
    └── route.ts          # GET - Health check
```

---

## PHASE 2: API Implementation

### Task 2.1: Create preview/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

const GENERATOR_URL = process.env.GENERATOR_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.topic || !body.subtopic) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, subtopic' },
        { status: 400 }
      );
    }
    
    // Call Python generator
    const response = await fetch(`${GENERATOR_URL}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Generator error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
```

### Task 2.2: Create generate/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate
    const { topic, subtopic, numProblems = 10 } = body;
    if (!topic || !subtopic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Call Python generator for full PDF
    const response = await fetch(`${GENERATOR_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const result = await response.json();
    
    // result contains: { worksheetId, downloadUrl, filename, pages }
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate worksheet' },
      { status: 500 }
    );
  }
}
```

### Task 2.3: Create download/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worksheetId = params.id;
    
    // Get download URL from generator service
    const response = await fetch(`${GENERATOR_URL}/download/${worksheetId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Worksheet not found or expired' },
          { status: 404 }
        );
      }
      throw new Error('Failed to get download URL');
    }
    
    const { downloadUrl, filename, expiresAt } = await response.json();
    
    return NextResponse.json({ downloadUrl, filename, expiresAt });
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to get download link' },
      { status: 500 }
    );
  }
}
```

### Task 2.4: Create health/route.ts

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check generator service
    const generatorHealth = await fetch(`${GENERATOR_URL}/health`);
    const generatorOk = generatorHealth.ok;
    
    return NextResponse.json({
      status: generatorOk ? 'healthy' : 'degraded',
      frontend: 'ok',
      generator: generatorOk ? 'ok' : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      frontend: 'ok',
      generator: 'unavailable',
      error: String(error),
    });
  }
}
```

---

## PHASE 3: Request/Response Types

### Task 3.1: Create types/api.ts

```typescript
// Request types
export interface PreviewRequest {
  topic: string;           // "fractions"
  subtopic: string;        // "add-unlike-denom"
  numProblems?: number;    // 1-50, default 10
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  options?: {
    includeHints?: boolean;
    includeVisuals?: boolean;
    includeWorkedExamples?: boolean;
    showLcdReference?: boolean;
  };
}

export interface GenerateRequest extends PreviewRequest {
  options: PreviewRequest['options'] & {
    includeAnswerKey?: boolean;
  };
  personalization?: {
    studentName?: string;
    worksheetTitle?: string;
    teacherName?: string;
    date?: string;
  };
}

// Response types
export interface PreviewResponse {
  html: string;
  problemCount: number;
  estimatedPages: number;
}

export interface GenerateResponse {
  worksheetId: string;
  status: 'ready' | 'processing' | 'error';
  downloadUrl?: string;
  filename?: string;
  pages?: number;
  expiresAt?: string;
  error?: string;
}

export interface DownloadResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}
```

---

## PHASE 4: Validation

### Task 4.1: Create lib/validation.ts

```typescript
import { z } from 'zod';

export const PreviewRequestSchema = z.object({
  topic: z.string().min(1),
  subtopic: z.string().min(1),
  numProblems: z.number().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('medium'),
  options: z.object({
    includeHints: z.boolean().default(false),
    includeVisuals: z.boolean().default(true),
    includeWorkedExamples: z.boolean().default(false),
    showLcdReference: z.boolean().default(false),
  }).optional(),
});

export const GenerateRequestSchema = PreviewRequestSchema.extend({
  options: z.object({
    includeAnswerKey: z.boolean().default(true),
    // ... inherit others
  }).optional(),
  personalization: z.object({
    studentName: z.string().optional(),
    worksheetTitle: z.string().optional(),
    teacherName: z.string().optional(),
    date: z.string().optional(),
  }).optional(),
});
```

---

## PHASE 5: Error Handling

Create consistent error responses:

```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## ENVIRONMENT VARIABLES

Required in `apps/web/.env.local`:
```
GENERATOR_API_URL=http://localhost:8000
```

For production:
```
GENERATOR_API_URL=https://api.teacher.ninja
```

---

## GIT RULES
- Commit after each route: `git add apps/web/app/api && git commit -m "agent/backend: add [route]"`
- Push after each phase

## STATUS UPDATES
Update `scripts/agents/backend-status.md`

## REMEMBER
- Never expose internal errors to clients
- Log all errors for debugging
- Validate all inputs with zod
- Set appropriate timeouts for generator calls
- Handle generator service being down gracefully
