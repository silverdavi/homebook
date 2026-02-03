"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  className,
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex items-center gap-2.5 cursor-pointer select-none group",
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={clsx(
            "w-5 h-5 rounded border-2 transition-all duration-150 flex items-center justify-center",
            checked
              ? "bg-subject-math border-subject-math"
              : "border-slate-300 group-hover:border-slate-400"
          )}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}
