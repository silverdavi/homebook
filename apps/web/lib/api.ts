import type { WorksheetConfig, WorksheetResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generatePreview(config: WorksheetConfig): Promise<string> {
  const res = await fetch(`${API_URL}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
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
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    throw new Error(`Worksheet generation failed: ${res.statusText}`);
  }

  return res.json();
}
