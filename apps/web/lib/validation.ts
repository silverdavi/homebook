import { z } from 'zod';

/**
 * Validation schemas for the generator API proxy routes.
 *
 * IMPORTANT: These schemas match the snake_case format sent by toApiConfig()
 * in lib/api.ts, which is also what the Python backend (Pydantic) expects.
 */

export const PreviewRequestSchema = z.object({
  topic: z.string().min(1),
  subtopic: z.string().min(1),
  num_problems: z.number().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('medium'),

  // Options — all top-level, snake_case to match Python API
  include_hints: z.boolean().default(false),
  include_worked_examples: z.boolean().default(false),
  include_visuals: z.boolean().default(false),
  include_answer_key: z.boolean().default(true),
  show_lcd_reference: z.boolean().default(false),
  include_intro_page: z.boolean().default(false),

  // Word problem settings
  include_word_problems: z.boolean().default(false),
  word_problem_ratio: z.number().min(0).max(1).default(0.3),
  word_problem_context: z.enum(['cooking', 'sports', 'shopping', 'school', 'mixed']).default('mixed'),

  // Constraints
  max_denominator: z.number().min(2).max(20).default(12),
  allow_improper: z.boolean().default(false),
  require_simplification: z.boolean().default(true),

  // Personalization
  student_name: z.string().nullable().optional(),
  worksheet_title: z.string().nullable().optional(),
  teacher_name: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  grade_level: z.number().min(0).max(12).default(5),
});

export const GenerateRequestSchema = PreviewRequestSchema;
