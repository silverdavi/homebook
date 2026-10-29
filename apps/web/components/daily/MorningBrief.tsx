import Link from "next/link";
import { Markdown } from "./Markdown";
import { ExamStartButtons } from "./ExamStartButtons";
import { DayPlan } from "./DayPlan";
import { GeometryLesson } from "./GeometryLesson";
import { UnitsLesson } from "./UnitsLesson";
import { NumberLineLesson } from "./NumberLineLesson";
import { MapScaleLesson } from "./MapScaleLesson";
import { AverageLesson } from "./AverageLesson";
import { CoordinateLesson } from "./CoordinateLesson";
import { ExtraTwenty } from "./ExtraTwenty";
import { ReadingThemeToggle } from "./ReadingThemeToggle";
import { getDayPlan } from "@/lib/daily/plans";
import { getExtra } from "@/lib/daily/extras";
import type { Day } from "@/lib/daily/types";

interface Props {
  day: Day;
}

export function MorningBrief({ day }: Props) {
  const plan = getDayPlan(day.date);
  const extra = getExtra(day.date);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/daily"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← The week
        </Link>
        <ReadingThemeToggle />
      </div>

      {plan && <DayPlan plan={plan} extraTitle={extra?.extra.title} />}

      {day.date === "2026-10-21" && <GeometryLesson />}
      {day.date === "2026-10-26" && <UnitsLesson />}
      {day.date === "2026-10-28" && <NumberLineLesson />}
      {day.date === "2026-10-29" && <MapScaleLesson />}
      {day.date === "2026-10-30" && <AverageLesson />}
      {day.date === "2026-11-02" && <CoordinateLesson />}

      <Markdown content={day.brief} />

      <div className="mt-10 mb-2 border-t border-slate-200 pt-8">
        <ExamStartButtons date={day.date} />
      </div>

      {extra && <ExtraTwenty extra={extra.extra} number={extra.number} />}
    </div>
  );
}
