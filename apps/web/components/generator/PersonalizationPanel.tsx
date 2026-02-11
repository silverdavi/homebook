"use client";

import { Input } from "@/components/ui/input";
import type { PersonalizationConfig } from "@/lib/types";

interface PersonalizationPanelProps {
  config: PersonalizationConfig;
  onChange: (key: keyof PersonalizationConfig, value: string) => void;
}

export function PersonalizationPanel({
  config,
  onChange,
}: PersonalizationPanelProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <Input
          id="student-name"
          label="Student Name"
          placeholder="Optional"
          value={config.studentName}
          onChange={(e) => onChange("studentName", e.target.value)}
        />
        <Input
          id="worksheet-title"
          label="Worksheet Title"
          placeholder="Auto-generated if blank"
          value={config.worksheetTitle}
          onChange={(e) => onChange("worksheetTitle", e.target.value)}
        />
        <Input
          id="teacher-name"
          label="Teacher Name"
          placeholder="Optional"
          value={config.teacherName}
          onChange={(e) => onChange("teacherName", e.target.value)}
        />
        <Input
          id="date"
          label="Date"
          value={config.date}
          onChange={(e) => onChange("date", e.target.value)}
        />
      </div>
    </div>
  );
}
