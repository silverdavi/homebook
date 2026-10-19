import type { ChoiceQuestion } from "../../types";

export function choiceQ(
  id: string,
  kind: ChoiceQuestion["kind"],
  prompt: string,
  options: string[],
  answerIndex: number,
  explanation: string,
  helpHref: string,
): ChoiceQuestion {
  if (options.length < 2) {
    throw new Error("choiceQ: at least 2 options required");
  }
  if (answerIndex < 0 || answerIndex >= options.length) {
    throw new Error(`choiceQ: answer index ${answerIndex} is out of range`);
  }
  if (new Set(options).size !== options.length) {
    throw new Error("choiceQ: options must be unique");
  }
  return {
    id,
    kind,
    prompt,
    options,
    answerIndex,
    explanation,
    helpHref,
  };
}
