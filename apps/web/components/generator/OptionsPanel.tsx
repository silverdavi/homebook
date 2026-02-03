"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { WorksheetOptions } from "@/lib/types";

interface OptionsPanelProps {
  options: WorksheetOptions;
  onOptionChange: (key: keyof WorksheetOptions, value: boolean) => void;
}

const OPTION_LABELS: { key: keyof WorksheetOptions; label: string }[] = [
  { key: "includeAnswerKey", label: "Include answer key" },
  { key: "showHints", label: "Show hints" },
  { key: "includeVisualModels", label: "Include visual models (fraction bars)" },
  { key: "showWorkedExamples", label: "Show worked examples" },
  { key: "numberProblems", label: "Number problems" },
  { key: "showLcdGcfReference", label: "Show LCD/GCF reference" },
];

export function OptionsPanel({ options, onOptionChange }: OptionsPanelProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Options
      </label>
      <div className="space-y-2.5">
        {OPTION_LABELS.map(({ key, label }) => (
          <Checkbox
            key={key}
            id={`option-${key}`}
            label={label}
            checked={options[key]}
            onChange={(checked) => onOptionChange(key, checked)}
          />
        ))}
      </div>
    </div>
  );
}
