"use client";

import clsx from "clsx";

interface SliderProps {
  label?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  className,
}: SliderProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <span className="text-sm font-semibold text-subject-math tabular-nums">
            {value}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
