import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDay } from "@/lib/daily/week";
import { MorningBrief } from "@/components/daily/MorningBrief";

interface PageProps {
  params: Promise<{ date: string }>;
}

function displayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function DayPage({ params }: PageProps) {
  const { date } = await params;
  const day = getDay(date);
  if (!day) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-paper sm:p-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Schedule missing
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
              No plan is posted for {displayDate(date)}.
            </h1>
            <p className="mt-3 max-w-xl text-slate-700">
              Do not guess, repeat an old day, or sit with an empty timer. Tell
              Dad once: “Today&apos;s page is missing.”
            </p>
            <p className="mt-2 text-sm text-slate-600">
              This is a schedule problem, not a student assignment.
            </p>
            <Link
              href="/daily"
              className="mt-5 inline-block font-semibold text-indigo-700 underline underline-offset-2"
            >
              See all posted days
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-paper">
      <MorningBrief day={day} />
    </div>
  );
}
