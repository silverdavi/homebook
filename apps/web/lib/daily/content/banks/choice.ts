import type { ChoiceQuestion, Question } from "../../types";

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// Stored answers are option indices, so only apply this to exams nobody has submitted yet.
// `balanced` rotates the correct answer through every position; it changes
// option order too, so never switch it on for a day that has submissions.
export function shuffleChoices(
  questions: Question[],
  seed: string,
  { balanced = false }: { balanced?: boolean } = {},
): Question[] {
  const offset = Math.floor(seededRandom(seed)() * 4);
  let choiceIndex = 0;
  return questions.map((q) => {
    if (!("options" in q)) return q;
    const rand = seededRandom(`${seed}:${q.id}`);
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (balanced) {
      const target = (offset + choiceIndex) % order.length;
      const current = order.indexOf(q.answerIndex);
      [order[current], order[target]] = [order[target], order[current]];
    }
    choiceIndex++;
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      answerIndex: order.indexOf(q.answerIndex),
    };
  });
}

/** Reorder options with a permutation produced by content/daily/generate/random_days.py. */
export function applyOrder(
  questions: Question[],
  order: Record<string, number[]>,
): Question[] {
  return questions.map((q) => {
    if (!("options" in q)) return q;
    const perm = order[q.id];
    if (!perm || perm.length !== q.options.length) {
      throw new Error(`applyOrder: no permutation for ${q.id}`);
    }
    return {
      ...q,
      options: perm.map((i) => q.options[i]),
      answerIndex: perm.indexOf(q.answerIndex),
    };
  });
}

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
