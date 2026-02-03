"use client";

import { Calculator, BookOpen, FlaskConical } from "lucide-react";
import clsx from "clsx";
import { SUBJECTS } from "@/lib/subjects";
import type { Subject } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  Calculator,
  BookOpen,
  Flask: FlaskConical,
};

interface SubjectSelectorProps {
  value: Subject;
  onChange: (subject: Subject) => void;
}

export function SubjectSelector({ value, onChange }: SubjectSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Subject
      </label>
      <div className="grid grid-cols-3 gap-3">
        {Object.values(SUBJECTS).map((subject) => {
          const Icon = ICONS[subject.icon];
          const isSelected = value === subject.id;
          const isEnabled = subject.enabled;

          return (
            <button
              key={subject.id}
              onClick={() => isEnabled && onChange(subject.id)}
              disabled={!isEnabled}
              className={clsx(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                isEnabled
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50",
                isSelected && isEnabled
                  ? "border-subject-math bg-subject-math-light shadow-paper-md"
                  : isEnabled
                    ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-paper"
                    : "border-slate-100 bg-slate-50"
              )}
            >
              {!isEnabled && (
                <span className="absolute top-1.5 right-1.5 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              )}
              {Icon && (
                <Icon
                  className={clsx(
                    "w-6 h-6",
                    isSelected ? "text-subject-math" : "text-slate-400"
                  )}
                />
              )}
              <span
                className={clsx(
                  "text-xs font-medium",
                  isSelected ? "text-subject-math" : "text-slate-600"
                )}
              >
                {subject.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
