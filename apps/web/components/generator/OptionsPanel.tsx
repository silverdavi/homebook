"use client";

import { useEffect, useRef } from "react";
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

const OPTION_LABELS: { key: keyof WorksheetOptions; label: string; hint?: string }[] = [
  { key: "includeAnswerKey", label: "Include answer key" },
  { key: "showHints", label: "Show hints" },
  { key: "includeVisualModels", label: "Include visual models", hint: "Fraction bar diagrams for addition & subtraction" },
  { key: "showWorkedExamples", label: "Show worked examples" },
  { key: "numberProblems", label: "Number problems" },
  { key: "showLcdGcfReference", label: "Show LCD/GCF reference", hint: "For unlike denominators & simplification" },
  { key: "includeIntroPage", label: "Include intro page (AI-generated)" },
  { key: "includeWordProblems", label: "Include word problems", hint: "Convert some problems into real-world stories" },
];

const WORD_PROBLEM_CONTEXTS: { value: WordProblemContext; label: string; description: string }[] = [
  { value: "mixed", label: "Mixed (Varied scenarios)", description: "A mix of different real-world contexts" },
  { value: "cooking", label: "Cooking & Recipes", description: "Measuring ingredients and recipe scaling" },
  { value: "sports", label: "Sports & Games", description: "Scores, statistics, and game scenarios" },
  { value: "shopping", label: "Shopping & Money", description: "Prices, discounts, and purchases" },
  { value: "school", label: "School & Classroom", description: "Supplies, students, and classroom activities" },
];

export function OptionsPanel({
  options,
  onOptionChange,
  subject,
  topicId,
  subtopicIds = [],
}: OptionsPanelProps) {
  // Get applicable options for the current subject + topic + subtopic combination
  const applicableOptions = subject && topicId 
    ? getOptionsForSelection(subject, topicId, subtopicIds) 
    : null;

  // Auto-reset boolean options that are checked but no longer applicable
  const RESETTABLE_BOOLEANS: (keyof WorksheetOptions)[] = [
    "includeVisualModels",
    "showLcdGcfReference",
    "includeWordProblems",
  ];
  const prevApplicableRef = useRef<(keyof WorksheetOptions)[] | null>(null);

  useEffect(() => {
    if (!applicableOptions) return;
    const prev = prevApplicableRef.current;
    prevApplicableRef.current = applicableOptions;
    if (!prev) return;

    // If an option was visible before but isn't now, and it's checked → uncheck it
    for (const key of RESETTABLE_BOOLEANS) {
      if (prev.includes(key) && !applicableOptions.includes(key) && options[key]) {
        onOptionChange(key, false);
      }
    }
  }, [applicableOptions, options, onOptionChange]);

  // Filter options but exclude word problem sub-options (ratio and context) from main list
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

  // Check if word problems are applicable to this subject
  const showWordProblemOptions = applicableOptions?.includes("includeWordProblems");

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Options
      </label>
      <div className="space-y-2.5">
        {filteredOptions.map(({ key, label, hint }) => (
          <div key={key}>
            <div>
              <Checkbox
                id={`option-${key}`}
                label={label}
                checked={options[key] as boolean}
                onChange={(checked) => onOptionChange(key, checked)}
              />
              {hint && (
                <p className="text-[11px] text-slate-400 ml-7 -mt-0.5">{hint}</p>
              )}
            </div>

            {/* Word Problem Settings - only show when includeWordProblems is checked */}
            {key === "includeWordProblems" && showWordProblemOptions && options.includeWordProblems && (
              <div className="pl-4 border-l-2 border-blue-200 space-y-4 mt-3 ml-6">
                {/* Context Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Word Problem Context
                  </label>
                  <select
                    value={options.wordProblemContext}
                    onChange={(e) => onOptionChange('wordProblemContext', e.target.value as WordProblemContext)}
                    className="w-full rounded-md border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {WORD_PROBLEM_CONTEXTS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    {WORD_PROBLEM_CONTEXTS.find(c => c.value === options.wordProblemContext)?.description}
                  </p>
                </div>

                {/* Ratio Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Word Problem Ratio: {Math.round(options.wordProblemRatio * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={options.wordProblemRatio}
                    onChange={(e) => onOptionChange('wordProblemRatio', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-xs text-slate-500">
                    {Math.round(options.wordProblemRatio * 100)}% word problems, {Math.round((1 - options.wordProblemRatio) * 100)}% computational
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
