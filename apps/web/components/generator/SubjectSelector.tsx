"use client";

import { Calculator, BookOpen, FlaskConical, Dna, Zap, Globe } from "lucide-react";
import clsx from "clsx";
import { SUBJECTS } from "@/lib/subjects";
import type { Subject } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  Calculator,
  BookOpen,
  Flask: FlaskConical,
  FlaskConical,
  Dna,
  Zap,
  Globe,
};

const SUBJECT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  math: { border: "border-subject-math", bg: "bg-subject-math-light", text: "text-subject-math" },
  chemistry: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
  biology: { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-600" },
  physics: { border: "border-cyan-500", bg: "bg-cyan-50", text: "text-cyan-600" },
  "earth-science": { border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-600" },
  reading: { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600" },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.values(SUBJECTS).map((subject) => {
          const Icon = ICONS[subject.icon];
          const isSelected = value === subject.id;
          const isEnabled = subject.enabled;
          const colors = SUBJECT_COLORS[subject.id] || SUBJECT_COLORS.math;

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
                  ? `${colors.border} ${colors.bg} shadow-paper-md`
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
                    isSelected ? colors.text : "text-slate-400"
                  )}
                />
              )}
              <span
                className={clsx(
                  "text-xs font-medium",
                  isSelected ? colors.text : "text-slate-600"
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
