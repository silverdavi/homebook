import type { NumericQuestion } from "../../types";

export function numericQ(
  id: string,
  prompt: string,
  answer: number,
  explanation: string,
  helpHref: string,
  options: { tolerance?: number; unit?: string } = {},
): NumericQuestion {
  if (!Number.isFinite(answer)) {
    throw new Error(`numericQ: answer must be finite (got ${answer})`);
  }
  const tolerance = options.tolerance ?? 0;
  if (tolerance < 0 || !Number.isFinite(tolerance)) {
    throw new Error(`numericQ: invalid tolerance ${tolerance}`);
  }
  return {
    id,
    kind: "numeric",
    prompt,
    answer,
    explanation,
    helpHref,
    tolerance,
    unit: options.unit,
  };
}
