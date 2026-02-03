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
                  ? "bg-subject-math text-white shadow-paper"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subtopics */}
      {selectedTopic && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Subtopics
          </label>
          <div className="space-y-1.5">
            {selectedTopic.subtopics.map((sub) => {
              const isSelected = subtopicIds.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => onSubtopicToggle(sub.id)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150",
                    isSelected
                      ? "border-subject-math/30 bg-subject-math-light text-subject-math"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}
                >
                  <span>{sub.label}</span>
                  <Badge variant={isSelected ? "math" : "default"}>
                    Grade {sub.grade}
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
