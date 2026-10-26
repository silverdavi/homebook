import data from "./extras.json";

export interface ExtraQuiz {
  q: string;
  /** Correct option first; display order is rotated per question. */
  options: string[];
  why: string;
}

export interface Extra {
  date: string;
  title: string;
  hook: string;
  groups: {
    heading: string;
    items: { name: string; note: string; image?: string }[];
  }[];
  credit?: string;
  facts: string[];
  doIt: string;
  quiz: ExtraQuiz[];
}

export const EXTRAS: Extra[] = data;

export function getExtra(
  date: string,
): { extra: Extra; number: number } | null {
  const index = EXTRAS.findIndex((extra) => extra.date === date);
  return index === -1 ? null : { extra: EXTRAS[index], number: index + 1 };
}

/** Position of the correct option once displayed, so it is not always first. */
export function correctPosition(
  extraNumber: number,
  questionIndex: number,
  optionCount: number,
) {
  return (extraNumber + questionIndex * 2) % optionCount;
}

export function displayOptions(options: string[], position: number) {
  const [correct, ...wrong] = options;
  return [...wrong.slice(0, position), correct, ...wrong.slice(position)];
}
