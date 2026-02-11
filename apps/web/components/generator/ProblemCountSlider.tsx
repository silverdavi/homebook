"use client";

interface ProblemCountSliderProps {
  value: number;
  onChange: (count: number) => void;
}

export function ProblemCountSlider({
  value,
  onChange,
}: ProblemCountSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Problems</label>
        <span className="text-sm font-semibold text-blue-600 tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={5}
        max={30}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}
