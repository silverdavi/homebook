"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/games/profile-context";
import type {
  ClientAnswer,
  ExamVersion,
  Question,
} from "@/lib/daily/types";
import { QuestionCard } from "./QuestionCard";
import { ArrowLeft, AlertTriangle, Send, Loader2 } from "lucide-react";

interface Props {
  date: string;
  version: ExamVersion;
  questions: Question[];
}

const STORAGE_KEY = (date: string, version: ExamVersion) =>
  `daily-exam-draft:${date}:${version}`;

function blankAnswer(q: Question): ClientAnswer {
  const raw: ClientAnswer["raw"] =
    q.kind === "fracAdd" ||
    q.kind === "fracSub" ||
    q.kind === "fracMul" ||
    q.kind === "fracDiv" ||
    q.kind === "fracInverse"
      ? { kind: "fraction", num: null, den: null }
      : { kind: "integer", value: null };
  return {
    questionId: q.id,
    raw,
    note: "",
    usedHelp: false,
    firstInputAt: null,
    lastInputAt: null,
  };
}

/** Stamp firstInputAt (once) and lastInputAt on every answer change. */
function stampTime(prev: ClientAnswer, next: ClientAnswer): ClientAnswer {
  const now = Date.now();
  return {
    ...next,
    firstInputAt: prev.firstInputAt ?? now,
    lastInputAt: now,
  };
}

export function ExamRunner({ date, version, questions }: Props) {
  const router = useRouter();
  const { profile, isLoggedIn, isLoading } = useProfile();

  const initial = useMemo<ClientAnswer[]>(
    () => questions.map(blankAnswer),
    [questions],
  );

  // ms epoch — set once on mount; never updated.
  const startedAtRef = useRef<number>(Date.now());

  const [answers, setAnswers] = useState<ClientAnswer[]>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{
    score: number;
    total: number;
  } | null>(null);

  // Restore draft from localStorage if present.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(date, version));
      if (!raw) return;
      const parsed = JSON.parse(raw) as ClientAnswer[];
      if (
        Array.isArray(parsed) &&
        parsed.length === questions.length &&
        parsed.every((a, i) => a.questionId === questions[i].id)
      ) {
        setAnswers(parsed);
      }
    } catch {
      // ignore
    }
  }, [date, version, questions]);

  // Persist draft on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(date, version), JSON.stringify(answers));
    } catch {
      // ignore
    }
  }, [date, version, answers]);

  const updateAt = (i: number, next: ClientAnswer) => {
    setAnswers((prev) => {
      const out = [...prev];
      out[i] = stampTime(prev[i], next);
      return out;
    });
  };

  const filledCount = answers.filter(
    (a) =>
      (a.raw.kind === "integer" && a.raw.value !== null) ||
      (a.raw.kind === "fraction" && a.raw.num !== null && a.raw.den !== null),
  ).length;

  const handleSubmit = async () => {
    if (!profile) return;
    if (submitting) return;
    setError(null);
    setConflict(null);
    setSubmitting(true);
    try {
      const res = await fetch("/daily/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          date,
          version,
          startedAt: startedAtRef.current,
          answers,
        }),
      });
      if (res.status === 409) {
        const body = await res.json().catch(() => null);
        setConflict(
          body && typeof body.score === "number"
            ? { score: body.score, total: body.total }
            : null,
        );
        setError(
          "You've already submitted today's exam. Each day is one attempt.",
        );
        return;
      }
      if (!res.ok) {
        setError("Submit failed. Please try again.");
        return;
      }
      // The response body (an ExamResult) is dropped — the results page
      // re-fetches via GET, which is the single source of truth.
      await res.json().catch(() => null);
      try {
        localStorage.removeItem(STORAGE_KEY(date, version));
      } catch {
        // ignore
      }
      router.push(`/daily/${date}/results?version=${version}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-slate-500">Loading your profile…</div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-semibold mb-2">You need to be signed in to take the exam.</p>
        <p className="text-sm">
          Go to{" "}
          <Link href="/games/progress" className="underline">
            your profile
          </Link>{" "}
          and sign in or create one. Then come back here and click &ldquo;Begin
          Exam&rdquo; again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/daily/${date}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to today&apos;s brief
        </Link>
        <div className="text-xs text-slate-500">
          Version{" "}
          <span className="font-bold uppercase text-slate-700">{version}</span>
          {" · "}
          <span className="font-mono">
            {filledCount} / {questions.length}
          </span>{" "}
          answered
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            One attempt only. You may go back to the brief, but once you
            submit you can&apos;t retake today. Use the <em>Note</em> field
            on any question that&apos;s confusing.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            total={questions.length}
            question={q}
            state={answers[i]}
            onChange={(next) => updateAt(i, next)}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          {conflict && (
            <div className="mt-1 text-red-700">
              Existing score:{" "}
              <span className="font-mono">
                {conflict.score} / {conflict.total}
              </span>
              .{" "}
              <Link
                href={`/daily/${date}/results?version=${version}`}
                className="underline"
              >
                See your results
              </Link>
              .
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-5">
        <div className="text-sm text-slate-500">
          Answered{" "}
          <span className="font-mono font-semibold">
            {filledCount} / {questions.length}
          </span>
          . Empty answers count as wrong.
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-paper hover:bg-indigo-500 hover:shadow-paper-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit exam
            </>
          )}
        </button>
      </div>
    </div>
  );
}
