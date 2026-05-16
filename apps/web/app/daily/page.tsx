import Link from "next/link";
import { WEEKS, todayIso } from "@/lib/daily/week";
import { WeekIndex } from "@/components/daily/WeekIndex";
import { Markdown } from "@/components/daily/Markdown";
import { loadMarkdown } from "@/lib/daily/content/loader";

export default function DailyIndexPage() {
  const today = todayIso();
  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold mb-2">
          Independent homeschool trial
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Daily
        </h1>
        <p className="text-slate-600 max-w-2xl">
          Two weeks of math, science, history, and biology. You read the
          brief, decide how to study, and take the exam. One attempt per
          version (A and B are independent). That&apos;s the whole thing.
        </p>
        <div className="mt-3 text-sm">
          <Link
            href="/daily/principles"
            className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
          >
            How the trial works (read this first)
          </Link>
        </div>
      </header>

      {WEEKS.map((week) => (
        <section key={week.id} className="space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {week.label}
          </h2>
          <WeekIndex
            week={week.days}
            todayIso={today}
            startDayNumber={week.startDayNumber}
          />
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-paper">
            <Markdown content={loadMarkdown(week.introFile)} />
          </div>
        </section>
      ))}
    </div>
  );
}
