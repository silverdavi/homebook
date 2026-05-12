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

interface BothStatus {
  a: Existing | null;
  b: Existing | null;
}

function pickStatus(json: unknown): Existing | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (typeof o.score !== "number") return null;
  return {
    score: o.score as number,
    total: o.total as number,
    version: o.version as "a" | "b",
    submittedAt: o.submittedAt as string,
  };
}

export function ExamStartButtons({ date }: Props) {
  const { profile, isLoggedIn, isLoading } = useProfile();
  const [status, setStatus] = useState<BothStatus>({ a: null, b: null });
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !profile) return;
    let cancelled = false;
    fetch(`/daily/api/exam?profileId=${profile.id}&date=${date}&all=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data === "object") {
          setStatus({
            a: pickStatus((data as Record<string, unknown>).a),
            b: pickStatus((data as Record<string, unknown>).b),
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

  const aDone = status.a !== null;
  const bDone = status.b !== null;
  const bothDone = aDone && bDone;

  return (
    <div className="space-y-4">
      <div className="font-display text-xl font-bold text-slate-900">
        {bothDone
          ? "Both exams are done."
          : aDone || bDone
            ? "Try the other version?"
            : "Begin the exam"}
      </div>

      {!aDone && !bDone && (
        <p className="text-sm text-slate-600">
          Take one. After you finish, you can take the other version too if
          you want — each version is single-attempt, but doing both is
          allowed.
        </p>
      )}
      {(aDone || bDone) && !bothDone && (
        <p className="text-sm text-slate-600">
          Optional, not required. The summary your parents got was for the
          version you already finished. Doing the other version sends a
          second summary.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <VersionCard
          date={date}
          version="a"
          existing={status.a}
          accent="indigo"
        />
        <VersionCard
          date={date}
          version="b"
          existing={status.b}
          accent="slate"
        />
      </div>

      {!aDone && !bDone && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3 h-3" />
          Each version is single-attempt — once you submit one, you cannot
          retake the same version.
        </div>
      )}
    </div>
  );
}

function VersionCard({
  date,
  version,
  existing,
  accent,
}: {
  date: string;
  version: "a" | "b";
  existing: Existing | null;
  accent: "indigo" | "slate";
}) {
  const label = version.toUpperCase();
  if (existing) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-semibold">
              Version {label} — done
            </div>
            <div className="text-sm">
              Score:{" "}
              <span className="font-mono font-bold">
                {existing.score} / {existing.total}
              </span>
            </div>
            <Link
              href={`/daily/${date}/results?version=${version}`}
              className="inline-block text-sm font-semibold underline"
            >
              Open results →
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const btnColor =
    accent === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-500"
      : "bg-slate-800 hover:bg-slate-700";
  return (
    <Link
      href={`/daily/${date}/exam/${version}`}
      className={`rounded-xl ${btnColor} p-4 text-white shadow-paper hover:shadow-paper-md transition-all duration-200 active:scale-[0.98] flex flex-col items-start gap-1`}
    >
      <div className="text-xs uppercase tracking-wide opacity-80">
        Take it
      </div>
      <div className="font-display text-lg font-bold flex items-center gap-2">
        <Play className="w-4 h-4" />
        Begin Exam ({label})
      </div>
    </Link>
  );
}
