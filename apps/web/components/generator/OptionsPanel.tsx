"use client";

import { useEffect, useMemo, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { getOptionsForSelection } from "@/lib/subjects";
import type { Subject, WorksheetOptions, WordProblemContext } from "@/lib/types";

interface OptionsPanelProps {
  options: WorksheetOptions;
  onOptionChange: (key: keyof WorksheetOptions, value: WorksheetOptions[keyof WorksheetOptions]) => void;
  subject?: Subject | null;
  topicId?: string | null;
  subtopicIds?: string[];
}

const OPTION_LABELS: { key: keyof WorksheetOptions; label: string }[] = [
  { key: "includeAnswerKey", label: "Include answer key" },
  { key: "showHints", label: "Show hints" },
  { key: "showWorkedExamples", label: "Show worked examples" },
  { key: "numberProblems", label: "Number problems" },
  { key: "includeVisualModels", label: "Include fraction bar visuals" },
  { key: "showLcdGcfReference", label: "Show LCD/GCF reference table" },
  { key: "includeIntroPage", label: "Include intro page (AI)" },
  { key: "includeWordProblems", label: "Include word problems (AI)" },
];

const WORD_PROBLEM_CONTEXTS: { value: WordProblemContext; label: string }[] = [
  { value: "mixed", label: "Mixed (varied)" },
  { value: "cooking", label: "Cooking & Recipes" },
  { value: "sports", label: "Sports & Games" },
  { value: "shopping", label: "Shopping & Money" },
  { value: "school", label: "School & Classroom" },
];

export function OptionsPanel({
  options,
  onOptionChange,
  subject,
  topicId,
  subtopicIds = [],
}: OptionsPanelProps) {
  // Memoize applicable options so the array reference is stable
  const applicableKey = `${subject}|${topicId}|${subtopicIds.join(",")}`;
  const applicableOptions = useMemo(() => {
    if (!subject || !topicId) return null;
    return getOptionsForSelection(subject, topicId, subtopicIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicableKey]);

  // Auto-reset boolean options that are checked but no longer applicable
  const prevApplicableRef = useRef<string>("");

  useEffect(() => {
    if (!applicableOptions) return;
    const key = applicableOptions.join(",");
    const prev = prevApplicableRef.current;
    prevApplicableRef.current = key;
    if (!prev || prev === key) return;

    const prevSet = new Set(prev.split(","));
    const currSet = new Set(applicableOptions);

    const resettable: (keyof WorksheetOptions)[] = [
      "includeVisualModels",
      "showLcdGcfReference",
      "includeWordProblems",
    ];

    for (const opt of resettable) {
      if (prevSet.has(opt) && !currSet.has(opt) && options[opt]) {
        onOptionChange(opt, false);
      }
    }
  }, [applicableOptions, options, onOptionChange]);

  // Filter to only show applicable options (excluding word problem sub-options)
  const filteredOptions = applicableOptions
    ? OPTION_LABELS.filter(({ key }) =>
        applicableOptions.includes(key) &&
        key !== "wordProblemRatio" &&
        key !== "wordProblemContext"
      )
    : OPTION_LABELS.filter(({ key }) =>
        key !== "wordProblemRatio" &&
        key !== "wordProblemContext"
      );

  const wordProblemsAvailable = applicableOptions?.includes("includeWordProblems") ?? false;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Options
      </label>
      <div className="space-y-2">
        {filteredOptions.map(({ key, label }) => (
          <div key={key}>
            <Checkbox
              id={`option-${key}`}
              label={label}
              checked={options[key] as boolean}
              onChange={(checked) => onOptionChange(key, checked)}
            />

            {/* Word Problem sub-settings — expand when toggled ON */}
            {key === "includeWordProblems" && wordProblemsAvailable && options.includeWordProblems && (
              <div className="pl-4 border-l-2 border-blue-200 space-y-3 mt-2 ml-6">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Context
                  </label>
                  <select
                    value={options.wordProblemContext}
                    onChange={(e) => onOptionChange("wordProblemContext", e.target.value as WordProblemContext)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {WORD_PROBLEM_CONTEXTS.map(({ value, label: ctxLabel }) => (
                      <option key={value} value={value}>
                        {ctxLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Ratio: {Math.round(options.wordProblemRatio * 100)}% word problems
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={options.wordProblemRatio}
                    onChange={(e) => onOptionChange("wordProblemRatio", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
