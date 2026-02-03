"use client";

import { Select } from "@/components/ui/select";
import { GRADE_LEVELS } from "@/lib/subjects";
import type { GradeLevel } from "@/lib/types";

interface GradeLevelSelectorProps {
  value: GradeLevel;
  onChange: (grade: GradeLevel) => void;
}

export function GradeLevelSelector({
  value,
  onChange,
}: GradeLevelSelectorProps) {
  return (
    <Select
      id="grade-level"
      label="Grade Level"
      value={value}
      onChange={(v) => onChange(v as GradeLevel)}
      options={GRADE_LEVELS.map((g) => ({ value: g.value, label: g.label }))}
    />
  );
}
