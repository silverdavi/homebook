// Request types
export interface PreviewRequest {
  topic: string;
  subtopic: string;
  numProblems?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  options?: {
    includeHints?: boolean;
    includeVisuals?: boolean;
    includeWorkedExamples?: boolean;
    showLcdReference?: boolean;
    includeWordProblems?: boolean;
    wordProblemRatio?: number;
    wordProblemContext?: 'cooking' | 'sports' | 'shopping' | 'school' | 'mixed';
  };
}

export interface GenerateRequest extends PreviewRequest {
  options?: PreviewRequest['options'] & {
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

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  frontend: string;
  generator: string;
  timestamp: string;
  error?: string;
}

export interface APIErrorResponse {
  error: string;
  code?: string;
}
