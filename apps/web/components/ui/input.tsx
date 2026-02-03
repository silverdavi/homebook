"use client";

import { forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          className={clsx(
            "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-subject-math/30 focus:border-subject-math",
            "transition-colors duration-150",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
