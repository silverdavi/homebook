import type { WorksheetConfig, WorksheetResult } from "./types";

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
    include_word_problems: config.options.includeWordProblems,
    word_problem_ratio: config.options.wordProblemRatio,
    word_problem_context: config.options.wordProblemContext,
    student_name: config.personalization.studentName || null,
    worksheet_title: config.personalization.worksheetTitle || null,
    teacher_name: config.personalization.teacherName || null,
    date: config.personalization.date || null,
    grade_level: parseInt(config.grade, 10) || 5,
  };
}

export async function generatePreview(config: WorksheetConfig): Promise<string> {
  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiConfig(config)),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Preview generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.html_preview;
}

/**
 * Generate a descriptive filename from the worksheet config
 */
function generateFilename(config: WorksheetConfig): string {
  const subject = config.subject.toLowerCase();
  const topic = config.topicId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${subject}-${topic}-worksheet.pdf`;
}

export async function generateWorksheet(
  config: WorksheetConfig
): Promise<WorksheetResult> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiConfig(config)),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Worksheet generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    worksheetId: data.worksheet_id,
    downloadUrl: data.pdf_url,
    filename: generateFilename(config),
  };
}
