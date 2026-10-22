"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

export function appear(delay: number): CSSProperties {
  return { opacity: 0, animation: `fadeIn 0.35s ease ${delay}s forwards` };
}

export interface LessonTab {
  label: string;
  /** Tailwind classes for the selected tab. */
  active: string;
  scene: () => ReactNode;
  side: () => ReactNode;
  /** Interactive tabs have no Replay button. */
  interactive?: boolean;
}

interface Props {
  minutes: number;
  title: string;
  subtitle: string;
  tabs: LessonTab[];
}

export function LessonShell({ minutes, title, subtitle, tabs }: Props) {
  const [index, setIndex] = useState(0);
  const [replay, setReplay] = useState(0);
  const tab = tabs[index];
  const sceneKey = `${index}-${replay}`;

  return (
    <section
      id="lesson"
      className="my-8 overflow-hidden rounded-2xl bg-slate-950 text-slate-100 shadow-paper-lg ring-1 ring-slate-800"
    >
      <div className="px-5 pt-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Start here · about {minutes} minutes
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="mt-4 flex gap-2 px-5 sm:px-6" role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => {
              setIndex(i);
              setReplay((n) => n + 1);
            }}
            className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition sm:px-3 ${
              i === index
                ? t.active
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_250px] sm:p-6">
        <div className="rounded-xl bg-slate-900 p-3">
          <div key={sceneKey}>{tab.scene()}</div>
          {!tab.interactive && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReplay((n) => n + 1)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="h-3 w-3" />
                Replay
              </button>
            </div>
          )}
        </div>
        <div key={sceneKey} className="space-y-3 text-sm leading-6">
          {tab.side()}
        </div>
      </div>
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}: <span className="font-semibold text-white">{format(value)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
    </label>
  );
}

export const signed = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));
