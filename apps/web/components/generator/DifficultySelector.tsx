"use client";

import clsx from "clsx";
import { DIFFICULTY_LEVELS } from "@/lib/subjects";
import type { Difficulty } from "@/lib/types";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Difficulty
      </label>
      <div className="grid grid-cols-2 gap-2">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value as Difficulty)}
            className={clsx(
              "rounded-lg border px-3 py-2 text-left transition-all duration-150",
              value === level.value
                ? "border-blue-400/40 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div
              className={clsx(
                "text-sm font-medium",
                value === level.value ? "text-blue-700" : "text-slate-700"
              )}
            >
              {level.label}
            </div>
            <div className="text-xs text-slate-400">{level.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
