"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/games/profile-context";
import { Play, CheckCircle2, Lock } from "lucide-react";

interface Props {
  date: string;
}

interface Existing {
  score: number;
  total: number;
  version: "a" | "b";
  submittedAt: string;
}

export function ExamStartButtons({ date }: Props) {
  const { profile, isLoggedIn, isLoading } = useProfile();
  const [existing, setExisting] = useState<Existing | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !profile) return;
    let cancelled = false;
    fetch(`/daily/api/exam?profileId=${profile.id}&date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.score === "number") {
          setExisting({
            score: data.score,
            total: data.total,
            version: data.version,
            submittedAt: data.submittedAt,
          });
        }
        setFetchDone(true);
      })
      .catch(() => {
        if (!cancelled) setFetchDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, isLoggedIn, date]);

  // While the profile is hydrating, or while the fetch is in flight for a
  // logged-in user, show a quiet placeholder. For unauthenticated users we
  // skip the fetch entirely, so we don't gate on fetchDone there.
  if (isLoading) {
    return (
      <div className="text-sm text-slate-500">Checking your status…</div>
    );
  }
  if (isLoggedIn && !fetchDone) {
    return (
      <div className="text-sm text-slate-500">Checking your status…</div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-semibold mb-1">Sign in first.</p>
        <p className="text-sm">
          You need a profile so we can save your exam. Go to{" "}
          <Link href="/games/progress" className="underline">
            your profile
          </Link>{" "}
          and sign in (or create one), then come back here.
        </p>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="font-semibold">Today&apos;s exam is done.</p>
            <p className="text-sm">
              You took <span className="font-bold uppercase">version {existing.version}</span>{" "}
              and scored{" "}
              <span className="font-mono font-bold">
                {existing.score} / {existing.total}
              </span>
              .
            </p>
            <Link
              href={`/daily/${date}/results`}
              className="inline-block text-sm font-semibold underline"
            >
              Open your results →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="font-display text-xl font-bold text-slate-900">
        Begin the exam
      </div>
      <p className="text-sm text-slate-600">
        Pick one. Take one. After you submit, today is locked.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/daily/${date}/exam/a`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-paper hover:bg-indigo-500 hover:shadow-paper-md transition-all duration-200 active:scale-[0.98]"
        >
          <Play className="w-4 h-4" />
          Begin Exam (A)
        </Link>
        <Link
          href={`/daily/${date}/exam/b`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-6 py-3 text-base font-medium text-white shadow-paper hover:bg-slate-700 hover:shadow-paper-md transition-all duration-200 active:scale-[0.98]"
        >
          <Play className="w-4 h-4" />
          Begin Exam (B)
        </Link>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Lock className="w-3 h-3" />
        Single attempt. Choose wisely.
      </div>
    </div>
  );
}
