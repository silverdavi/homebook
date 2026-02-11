"use client";

import clsx from "clsx";
import { SUBJECTS } from "@/lib/subjects";
import { Badge } from "@/components/ui/badge";
import type { Subject } from "@/lib/types";

interface TopicSelectorProps {
  subject: Subject;
  topicId: string;
  subtopicIds: string[];
  onTopicChange: (topicId: string) => void;
  onSubtopicToggle: (subtopicId: string) => void;
}

const SUBJECT_ACCENT: Record<string, { bg: string; text: string; border: string; light: string }> = {
  math: { bg: "bg-blue-600", text: "text-blue-700", border: "border-blue-300/40", light: "bg-blue-50" },
  chemistry: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-300/40", light: "bg-emerald-50" },
  biology: { bg: "bg-purple-600", text: "text-purple-700", border: "border-purple-300/40", light: "bg-purple-50" },
  physics: { bg: "bg-cyan-600", text: "text-cyan-700", border: "border-cyan-300/40", light: "bg-cyan-50" },
  "earth-science": { bg: "bg-teal-600", text: "text-teal-700", border: "border-teal-300/40", light: "bg-teal-50" },
};

export function TopicSelector({
  subject,
  topicId,
  subtopicIds,
  onTopicChange,
  onSubtopicToggle,
}: TopicSelectorProps) {
  const subjectConfig = SUBJECTS[subject];
  const topics = Object.values(subjectConfig?.topics || {});
  const selectedTopic = subjectConfig?.topics[topicId];
  const accent = SUBJECT_ACCENT[subject] || SUBJECT_ACCENT.math;

  if (topics.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic">
        No topics available for this subject yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Topic selector */}
      {topics.length > 1 && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Topic
          </label>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onTopicChange(topic.id)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  topicId === topic.id
                    ? `${accent.bg} text-white shadow-paper`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtopics */}
      {selectedTopic && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {topics.length === 1 ? selectedTopic.name : "Subtopics"}
          </label>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            {selectedTopic.subtopics.map((sub) => {
              const isSelected = subtopicIds.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => onSubtopicToggle(sub.id)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150",
                    isSelected
                      ? `${accent.border} ${accent.light} ${accent.text}`
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}
                >
                  <span>{sub.label}</span>
                  <Badge variant={isSelected ? "math" : "default"}>
                    Gr {sub.grade}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
