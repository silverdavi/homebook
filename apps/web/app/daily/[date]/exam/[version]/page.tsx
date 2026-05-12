import { notFound } from "next/navigation";
import { getDay, getQuestions } from "@/lib/daily/week";
import { ExamRunner } from "@/components/daily/ExamRunner";
import type { ExamVersion } from "@/lib/daily/types";

interface PageProps {
  params: Promise<{ date: string; version: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const { date, version } = await params;
  if (version !== "a" && version !== "b") notFound();
  const day = getDay(date);
  if (!day) notFound();
  const questions = getQuestions(date, version as ExamVersion);
  if (!questions) notFound();

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold mb-1">
          {date} — Version {version.toUpperCase()}
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
          {day.title}
        </h1>
      </header>
      <ExamRunner
        date={date}
        version={version as ExamVersion}
        questions={questions}
      />
    </div>
  );
}
