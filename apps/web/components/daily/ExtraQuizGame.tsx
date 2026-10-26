"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { RotateCcw, Trophy } from "lucide-react";
import type { Extra } from "@/lib/daily/extras";

interface Round {
  prompt: string;
  image?: string;
  options: string[];
  answer: number;
  why: string;
  review: string;
}

const ITEM_QUESTIONS = 8;

const noSubscription = () => () => {};

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRounds(extra: Extra): Round[] {
  const items = extra.groups.flatMap((group) => group.items);
  const names = items.map((item) => item.name);
  const fromItems = shuffle(items)
    .slice(0, ITEM_QUESTIONS)
    .map((item) => {
      const options = shuffle([
        item.name,
        ...shuffle(names.filter((name) => name !== item.name)).slice(0, 3),
      ]);
      return {
        prompt: item.image ? "What is this?" : `Which one? “${item.note}”`,
        image: item.image,
        options,
        answer: options.indexOf(item.name),
        why: item.image ? `${item.name}: ${item.note}` : item.name,
        review: `${item.name} — ${item.note}`,
      };
    });
  const fromQuiz = extra.quiz.map((question) => {
    const options = shuffle(question.options);
    return {
      prompt: question.q,
      options,
      answer: options.indexOf(question.options[0]),
      why: question.why,
      review: `${question.q} → ${question.options[0]}`,
    };
  });
  return shuffle([...fromItems, ...fromQuiz]);
}

export function ExtraQuizGame({ extra }: { extra: Extra }) {
  const storageKey = `extra-best-${extra.date}`;
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Round[]>([]);
  const saved = useSyncExternalStore(
    noSubscription,
    () => window.localStorage.getItem(storageKey),
    () => null,
  );
  const [newBest, setBest] = useState<number | null>(null);
  const best = newBest ?? (saved === null ? null : Number(saved));

  function start() {
    setRounds(buildRounds(extra));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
  }

  function choose(option: number) {
    if (!rounds || picked !== null) return;
    setPicked(option);
    if (option === rounds[index].answer) setScore((s) => s + 1);
    else setMissed((m) => [...m, rounds[index]]);
  }

  function next() {
    if (!rounds) return;
    const finished = index + 1 >= rounds.length;
    if (finished) {
      const percent = Math.round((score / rounds.length) * 100);
      if (best === null || percent > best) {
        setBest(percent);
        window.localStorage.setItem(storageKey, String(percent));
      }
    }
    setIndex(index + 1);
    setPicked(null);
  }

  if (!rounds) {
    return (
      <div className="rounded-2xl border-2 border-rose-300 bg-white p-6 text-center">
        <p className="font-display text-xl font-bold text-slate-900">
          Quiz time
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {Math.min(
            ITEM_QUESTIONS,
            extra.groups.flatMap((g) => g.items).length,
          ) + extra.quiz.length}{" "}
          questions, different every time you play.
          {best !== null && ` Your best: ${best}%.`}
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-4 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white hover:bg-rose-700"
        >
          Start the quiz
        </button>
      </div>
    );
  }

  if (index >= rounds.length) {
    const percent = Math.round((score / rounds.length) * 100);
    const message =
      percent === 100
        ? "Perfect. You know this."
        : percent >= 75
          ? "Strong. Play again to get them all."
          : "Good start. Look back at the cards above, then try again.";
    return (
      <div className="rounded-2xl border-2 border-rose-300 bg-white p-6">
        <div className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">
            {score} / {rounds.length}
          </p>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
          {best !== null && (
            <p className="mt-1 text-xs text-slate-500">Best: {best}%</p>
          )}
        </div>
        {missed.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-900">
              To look at again
            </p>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {missed.map((round) => (
                <li key={round.review}>• {round.review}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white hover:bg-rose-700"
          >
            <RotateCcw className="h-4 w-4" />
            Play again — new mix
          </button>
        </div>
      </div>
    );
  }

  const round = rounds[index];
  return (
    <div className="rounded-2xl border-2 border-rose-300 bg-white p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          Question {index + 1} of {rounds.length}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-rose-100">
        <div
          className="h-full rounded-full bg-rose-500 transition-all"
          style={{ width: `${(index / rounds.length) * 100}%` }}
        />
      </div>
      {round.image && (
        <Image
          src={round.image}
          alt="Which one is this?"
          loading="eager"
          width={400}
          height={400}
          className="mx-auto mb-4 aspect-square w-full max-w-64 rounded-xl object-cover"
        />
      )}
      <p className="text-center text-base font-semibold text-slate-900">
        {round.prompt}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {round.options.map((option, i) => {
          const tone =
            picked === null
              ? "border-slate-200 hover:border-rose-400 hover:bg-rose-50"
              : i === round.answer
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : i === picked
                  ? "border-rose-500 bg-rose-50 text-rose-900"
                  : "border-slate-200 text-slate-400";
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(i)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            <strong
              className={
                picked === round.answer ? "text-emerald-700" : "text-rose-700"
              }
            >
              {picked === round.answer ? "Right! " : "Not quite. "}
            </strong>
            {round.why}
          </p>
          <button
            type="button"
            onClick={next}
            className="shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {index + 1 >= rounds.length ? "See my score" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
