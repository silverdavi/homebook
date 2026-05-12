"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/games/profile-context";
import type { ExamResult, GradedAnswer, Question } from "@/lib/daily/types";
import { PromptForQuestion } from "./PromptForQuestion";
import { Check, X, ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  date: string;
  /** Questions for both versions of this date, keyed by id, used to render prompts. */
  questionsById: Record<string, Question>;
}

function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function ResultsView({ date, questionsById }: Props) {
  const { profile, isLoggedIn, isLoading } = useProfile();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !profile) return;
    let cancelled = false;
    fetch(`/daily/api/exam?profileId=${profile.id}&date=${date}`)
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 404) {
            if (!cancelled) setError("No submission found for this date yet.");
          } else {
            if (!cancelled) setError("Could not load results.");
          }
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setResult(data as ExamResult);
      })
      .catch(() => {
        if (!cancelled) setError("Network error loading results.");
      })
      .finally(() => {
        if (!cancelled) setFetchDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, isLoggedIn, date]);

  // Show a loading state while the profile is hydrating, or while a
  // logged-in user's GET request is still in flight.
  const loading = isLoading || (isLoggedIn && !fetchDone);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p>You need to be signed in to see results.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
        <p>{error ?? "No submission for this date."}</p>
        <Link
          href={`/daily/${date}`}
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to today&apos;s brief
        </Link>
      </div>
    );
  }

  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/daily/${date}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to today&apos;s brief
        </Link>
        <div className="text-xs text-slate-500">
          Submitted {new Date(result.submittedAt + "Z").toLocaleString()}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-paper">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Score</div>
            <div className="font-mono text-3xl font-bold text-slate-900">
              {result.score} / {result.total}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Percent</div>
            <div className="font-mono text-3xl font-bold text-slate-900">{pct}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Version</div>
            <div className="font-mono text-3xl font-bold text-slate-900 uppercase">
              {result.version}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Duration</div>
            <div className="font-mono text-3xl font-bold text-slate-900">
              {fmtDuration(result.durationSec)}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          The trial is about ownership, not score. Read your notes back. The
          questions you got wrong are tomorrow&apos;s lesson. A summary has
          been emailed to your parents.
        </p>
      </div>

      <div className="space-y-3">
        {result.answers.map((a, i) => (
          <ResultRow
            key={a.questionId}
            answer={a}
            index={i}
            question={questionsById[a.questionId]}
            fmtDuration={fmtDuration}
          />
        ))}
      </div>
    </div>
  );
}

function ResultRow({
  answer,
  index,
  question,
  fmtDuration,
}: {
  answer: GradedAnswer;
  index: number;
  question: Question | undefined;
  fmtDuration: (sec: number) => string;
}) {
  const tone = answer.correct
    ? "border-emerald-200 bg-emerald-50/40"
    : "border-rose-200 bg-rose-50/40";
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {answer.correct ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <X className="w-5 h-5 text-rose-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
            Question {index + 1}
          </div>
          <div className="text-base text-slate-900 mb-2">
            {question ? <PromptForQuestion question={question} /> : answer.questionId}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div>
              <span className="text-slate-500">Your answer: </span>
              <span className={`font-mono font-semibold ${answer.correct ? "text-emerald-700" : "text-rose-700"}`}>
                {answer.userDisplay}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Correct: </span>
              <span className="font-mono font-semibold text-slate-900">
                {answer.expected}
              </span>
            </div>
            {answer.secondsSpent > 0 && (
              <div>
                <span className="text-slate-500">Time: </span>
                <span className="font-mono text-slate-700">
                  {fmtDuration(answer.secondsSpent)}
                </span>
              </div>
            )}
          </div>
          {answer.note && (
            <div className="mt-3 rounded-md bg-white border border-slate-200 p-3 text-sm text-slate-700">
              <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                Your note
              </div>
              {answer.note}
            </div>
          )}
          {answer.usedHelp && (
            <div className="mt-2 text-[11px] text-slate-400 italic">
              You opened the lesson while working on this one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
