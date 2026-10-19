import {
  CheckCircle2,
  Clock3,
  Coffee,
  Laptop,
  ListChecks,
  Printer,
  Sparkles,
} from "lucide-react";
import type { DayPlan as DayPlanData } from "@/lib/daily/types";

interface Props {
  plan: DayPlanData;
}

export function DayPlan({ plan }: Props) {
  const workMinutes = plan.blocks.reduce((total, block) => {
    if (block.kind !== "work") return total;
    return total + block.steps.reduce((sum, step) => sum + step.minutes, 0);
  }, 0);
  const exam = plan.blocks.find((block) => block.kind === "exam");

  return (
    <section
      aria-labelledby="today-plan"
      className="mb-8 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-indigo-50/40"
    >
      <div className="border-b border-indigo-200 bg-white px-5 py-5 sm:px-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
          This page is the schedule
        </p>
        <h2
          id="today-plan"
          className="font-display text-2xl font-bold text-slate-900"
        >
          Today, start to finish
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Start {plan.startTime}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Scheduled end {plan.scheduledEndTime}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            {workMinutes} min planned work
          </span>
          {exam?.kind === "exam" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
              Exam usually {exam.expectedMinutes} min
            </span>
          )}
        </div>
      </div>

      {plan.introduction && (
        <div className="border-b border-indigo-200 bg-amber-50 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                New today — you are not expected to know this yet
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {plan.introduction.newToday}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>You already know:</strong> {plan.introduction.buildsOn}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>Why it matters:</strong>{" "}
                {plan.introduction.whyItMatters}
              </p>
              <p className="mt-2 text-xs font-medium text-amber-800">
                The first work block teaches it before asking you to use it.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 border-b border-indigo-200 px-5 py-4 sm:grid-cols-2 sm:px-6">
        <div className="flex gap-3 rounded-xl bg-white p-4">
          <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Devices</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {plan.deviceRule} Phone stays away until{" "}
              <strong>{plan.phoneUntil}</strong>.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-white p-4">
          <Printer className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-900">On the desk</h3>
            <ul className="mt-1 space-y-1 text-sm leading-5 text-slate-600">
              {plan.materials.map((material) => (
                <li key={material}>• {material}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-6">
        {plan.blocks.map((block, index) => {
          if (block.kind === "break") {
            return (
              <div
                key={`${block.time}-${index}`}
                className="flex items-center gap-3 px-2 py-1 text-sm text-slate-500"
              >
                <Coffee className="h-4 w-4" />
                <span className="font-mono">{block.time}</span>
                <span>{block.title}</span>
              </div>
            );
          }

          if (block.kind === "exam") {
            return (
              <div
                key={`${block.time}-${index}`}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-emerald-700" />
                    <h3 className="font-semibold text-slate-900">
                      {block.title}
                    </h3>
                  </div>
                  <span className="font-mono text-sm text-slate-600">
                    {block.time}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  Usually {block.expectedMinutes} minutes; maximum{" "}
                  {block.maxMinutes}. {block.instruction}
                </p>
              </div>
            );
          }

          return (
            <div
              key={`${block.time}-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">
                    {block.title}
                  </h3>
                </div>
                <span className="font-mono text-sm text-slate-600">
                  {block.time}
                </span>
              </div>
              <ol className="space-y-3">
                {block.steps.map((step, stepIndex) => (
                  <li
                    key={`${step.task}-${stepIndex}`}
                    className="grid gap-1 sm:grid-cols-[64px_1fr]"
                  >
                    <span className="font-mono text-sm font-semibold text-indigo-700">
                      {step.minutes} min
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-5 text-slate-800">
                        {step.task}
                      </p>
                      <p className="mt-0.5 flex gap-1.5 text-xs leading-5 text-slate-500">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Done when: {step.doneWhen}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
