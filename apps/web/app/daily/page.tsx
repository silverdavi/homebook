import Link from "next/link";
import { WEEK, todayIso } from "@/lib/daily/week";
import { WeekIndex } from "@/components/daily/WeekIndex";
import { Markdown } from "@/components/daily/Markdown";
import { loadMarkdown } from "@/lib/daily/content/loader";

export default function DailyIndexPage() {
  const today = todayIso();
  const weekIntro = loadMarkdown("WEEK-2026-05-12.md");
  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold mb-2">
          Independent homeschool trial
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Daily
        </h1>
        <p className="text-slate-600 max-w-2xl">
          Four days of math, science, history, and biology. You read the
          brief, decide how to study, and take the exam. One attempt per day.
          That&apos;s the whole thing.
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

      <section>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
          The week
        </h2>
        <WeekIndex week={WEEK} todayIso={today} />
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-paper">
        <Markdown content={weekIntro} />
      </section>
    </div>
  );
}
