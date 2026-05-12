import { notFound } from "next/navigation";
import { getDay } from "@/lib/daily/week";
import { ResultsView } from "@/components/daily/ResultsView";
import type { Question } from "@/lib/daily/types";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function ResultsPage({ params }: PageProps) {
  const { date } = await params;
  const day = getDay(date);
  if (!day) notFound();

  // Both versions are passed so the results view can render the prompt for
  // whichever version the user actually took.
  const byId: Record<string, Question> = {};
  for (const q of [...day.versionA, ...day.versionB]) byId[q.id] = q;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold mb-1">
          {date} — Results
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
          {day.title}
        </h1>
      </header>
      <ResultsView date={date} questionsById={byId} />
    </div>
  );
}
