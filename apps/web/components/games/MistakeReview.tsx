"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import type { Mistake } from "@/lib/games/mistakes";

interface MistakeReviewProps {
  mistakes: Mistake[];
}

export function MistakeReview({ mistakes }: MistakeReviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (mistakes.length === 0) return null;

  return (
    <div className="w-full max-w-sm mx-auto mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-colors text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Review {mistakes.length} Mistake{mistakes.length !== 1 ? "s" : ""}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
          {mistakes.map((m, i) => (
            <div
              key={i}
              className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-left"
            >
              <div className="text-xs text-slate-400 mb-1">{m.question}</div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-red-400 line-through">{m.yourAnswer}</span>
                <span className="text-slate-600">→</span>
                <span className="text-emerald-400 font-medium">{m.correctAnswer}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
