"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/games/profile-context";
import type { ExamResult, GradedAnswer, Question } from "@/lib/daily/types";
import { PromptForQuestion } from "./PromptForQuestion";
import { Check, X, ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  date: string;
  /** Questions for both versions of this date, keyed by id, used to render prompts. */
  questionsById: Record<string, Question>;
}

interface BothResults {
  a: ExamResult | null;
  b: ExamResult | null;
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
  const searchParams = useSearchParams();
  const requested = searchParams.get("version");
  const initialVersion: "a" | "b" | null =
    requested === "a" || requested === "b" ? requested : null;

  const [both, setBoth] = useState<BothResults>({ a: null, b: null });
  const [error, setError] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(false);
  const [activeVersion, setActiveVersion] = useState<"a" | "b" | null>(
    initialVersion,
  );

  useEffect(() => {
    if (!isLoggedIn || !profile) return;
    let cancelled = false;
    fetch(`/daily/api/exam?profileId=${profile.id}&date=${date}&all=1`)
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setError("Could not load results.");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        const a = (data as Record<string, unknown>).a as ExamResult | null;
        const b = (data as Record<string, unknown>).b as ExamResult | null;
        setBoth({ a: a ?? null, b: b ?? null });
        if (!a && !b) {
          setError("No submission found for this date yet.");
        }
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

  // Decide which version to render: requested → that one (if it exists),
  // else whichever is present, preferring the more recent submission.
  const result: ExamResult | null = (() => {
    if (activeVersion === "a" && both.a) return both.a;
    if (activeVersion === "b" && both.b) return both.b;
    if (both.a && both.b) {
      return both.a.submittedAt >= both.b.submittedAt ? both.a : both.b;
    }
    return both.a ?? both.b;
  })();
  const bothPresent = both.a !== null && both.b !== null;

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

  const otherVersion: "a" | "b" = result.version === "a" ? "b" : "a";
  const otherDone = otherVersion === "a" ? both.a !== null : both.b !== null;

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
          Submitted{" "}
          {new Date(result.submittedAt + "Z").toLocaleString("en-US", {
            timeZone: "America/New_York",
            month: "short",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </div>
      </div>

      {bothPresent && (
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-paper">
          {(["a", "b"] as const).map((v) => {
            const isActive = result.version === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setActiveVersion(v)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Version {v.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {!otherDone && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-900 flex items-center justify-between gap-3">
          <p className="text-sm">
            You can also try{" "}
            <span className="font-semibold uppercase">
              version {otherVersion}
            </span>{" "}
            today. Optional — your parents will get a second summary if you
            do.
          </p>
          <Link
            href={`/daily/${date}/exam/${otherVersion}`}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-paper hover:bg-indigo-500 active:scale-[0.98] transition-all flex-shrink-0"
          >
            Take version {otherVersion.toUpperCase()} →
          </Link>
        </div>
      )}

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
