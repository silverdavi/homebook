"use client";

import { Pencil } from "lucide-react";

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function NoteField({ value, onChange }: Props) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        <Pencil className="w-3.5 h-3.5" />
        Note (optional) — say anything about this question
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="e.g. I had no idea where to start, or I think the answer is 7 but I'm not sure."
        className="w-full rounded-md border border-slate-200 bg-slate-50/40 p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white focus:border-indigo-300 resize-y"
      />
    </label>
  );
}
