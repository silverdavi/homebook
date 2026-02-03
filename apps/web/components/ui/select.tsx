"use client";

import { forwardRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, value, onChange, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={clsx(
              "w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 pr-8 text-sm text-slate-800",
              "focus:outline-none focus:ring-2 focus:ring-subject-math/30 focus:border-subject-math",
              "bg-white transition-colors duration-150",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
