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
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        Difficulty
      </label>
      <div className="flex gap-1.5">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value as Difficulty)}
            className={clsx(
              "flex-1 rounded-lg border px-2 py-1.5 text-center transition-all duration-150",
              value === level.value
                ? "border-blue-400/40 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            )}
          >
            <div className="text-xs font-medium">
              {level.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
