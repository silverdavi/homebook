import Link from "next/link";
import { Calendar, BookOpen } from "lucide-react";
import type { Day } from "@/lib/daily/types";

function formatDate(iso: string): string {
  // YYYY-MM-DD → "Tue, May 12"
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  week: Day[];
  todayIso: string;
}

export function WeekIndex({ week, todayIso }: Props) {
  return (
    <div className="space-y-3">
      {week.map((day, i) => {
        const isToday = day.date === todayIso;
        const isFuture = day.date > todayIso;
        return (
          <Link
            key={day.date}
            href={`/daily/${day.date}`}
            className={`block rounded-xl border p-5 transition-all hover:shadow-paper-md ${
              isToday
                ? "border-indigo-300 bg-indigo-50/40"
                : isFuture
                  ? "border-slate-200 bg-slate-50/30 opacity-70"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800">
                  Day {i + 1} — {formatDate(day.date)}
                </span>
                {isToday && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                {isFuture && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Upcoming
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400">{day.date}</span>
            </div>
            <div className="font-display text-base font-semibold text-slate-900 mb-1">
              {day.title}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {day.topics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full"
                >
                  <BookOpen className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
