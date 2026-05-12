import Link from "next/link";
import { Markdown } from "./Markdown";
import { ExamStartButtons } from "./ExamStartButtons";
import type { Day } from "@/lib/daily/types";

interface Props {
  day: Day;
}

export function MorningBrief({ day }: Props) {
  return (
    <div>
      <div className="mb-4">
        <Link
          href="/daily"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← The week
        </Link>
      </div>

      <Markdown content={day.brief} />

      <div className="mt-10 mb-2 border-t border-slate-200 pt-8">
        <ExamStartButtons date={day.date} />
      </div>
    </div>
  );
}
