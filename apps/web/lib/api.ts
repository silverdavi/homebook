import type { WorksheetConfig, WorksheetResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Convert frontend config (camelCase) to API format (snake_case)
 */
function toApiConfig(config: WorksheetConfig) {
  return {
    topic: config.topicId,
    subtopic: config.subtopicIds[0] || "add-same-denom",
    num_problems: config.problemCount,
    difficulty: config.difficulty,
    include_hints: config.options.showHints,
    include_worked_examples: config.options.showWorkedExamples,
    include_visuals: config.options.includeVisualModels,
    include_answer_key: config.options.includeAnswerKey,
    show_lcd_reference: config.options.showLcdGcfReference,
    include_intro_page: config.options.includeIntroPage,
    student_name: config.personalization.studentName || null,
    worksheet_title: config.personalization.worksheetTitle || null,
    teacher_name: config.personalization.teacherName || null,
    date: config.personalization.date || null,
    grade_level: parseInt(config.grade, 10) || 5,
  };
}

export async function generatePreview(config: WorksheetConfig): Promise<string> {
  const res = await fetch(`${API_URL}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiConfig(config)),
  });

  if (!res.ok) {
    throw new Error(`Preview generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.html_preview;
}

export async function generateWorksheet(
  config: WorksheetConfig
): Promise<WorksheetResult> {
  const res = await fetch(`${API_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiConfig(config)),
  });

  if (!res.ok) {
    throw new Error(`Worksheet generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  // Map API response (snake_case) to frontend types (camelCase)
  return {
    worksheetId: data.worksheet_id,
    downloadUrl: data.pdf_url,
    filename: `worksheet-${data.worksheet_id}.pdf`,
  };
}
