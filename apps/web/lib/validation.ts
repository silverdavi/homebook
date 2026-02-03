import { z } from 'zod';

export const PreviewRequestSchema = z.object({
  topic: z.string().min(1),
  subtopic: z.string().min(1),
  numProblems: z.number().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('medium'),
  options: z
    .object({
      includeHints: z.boolean().default(false),
      includeVisuals: z.boolean().default(true),
      includeWorkedExamples: z.boolean().default(false),
      showLcdReference: z.boolean().default(false),
    })
    .optional(),
});

export const GenerateRequestSchema = PreviewRequestSchema.extend({
  options: z
    .object({
      includeHints: z.boolean().default(false),
      includeVisuals: z.boolean().default(true),
      includeWorkedExamples: z.boolean().default(false),
      showLcdReference: z.boolean().default(false),
      includeAnswerKey: z.boolean().default(true),
    })
    .optional(),
  personalization: z
    .object({
      studentName: z.string().optional(),
      worksheetTitle: z.string().optional(),
      teacherName: z.string().optional(),
      date: z.string().optional(),
    })
    .optional(),
});
