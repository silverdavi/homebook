import data from "./extras.json";

export interface ExtraQuiz {
  q: string;
  /** Correct option first; the quiz and the printed sheet shuffle them. */
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
